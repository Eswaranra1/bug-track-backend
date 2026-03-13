# BugTrack Backend — Architecture

## Structure (clean layers)

```
├── config/           # DB, multer, constants
├── constants/        # HTTP status, API messages
├── controllers/      # Request handlers (auth, bug, team, comment, attachment, notification)
├── helpers/          # Cross-cutting: bugActivity, notification, emailAlert, resend
├── middleware/       # auth, rateLimit, validate, validateParamId, teamMember
├── models/           # Mongoose schemas (User, Bug, Team, Comment, Attachment, BugActivity, Notification)
├── routes/           # Express routers (order matters: specific before generic)
├── utils/            # asyncHandler, AppError, mongooseUtils
└── server.js         # App mount, CORS, 404, global error handler
```

## Routing rules

1. **Order**: More specific paths before parameterized ones.
   - Bugs: `GET /:id/activity`, `GET /:id/comments`, … before `GET /:id`.
   - Teams: `GET /:id/members`, `POST /:id/members`, `DELETE /:id/members/:userId` before `GET /:id`.
   - Notifications: `PUT /read-all` before `PUT /:id/read`.

2. **Param validation**: `validateObjectId("id")` (or `"userId"`) runs for routes with `:id` / `:userId` so invalid ObjectIds return 400 instead of 500.

3. **API 404**: Any request under `/api` that does not match a mounted router gets `404 { message: "Not found" }`.

## Errors

- **Global handler** (server.js): Multer/file errors → 400. `err.status`/`err.statusCode` for status. In production, 500 responses use a generic message.
- **Constants**: `constants/httpStatus.js` holds `HttpStatus` and `ApiMessage` for consistent codes and messages.
- **AppError** (utils/AppError): Throw in controllers with status; handler sends the response.

## DB

- **Indexes**: Bug (createdBy, assignedTo, teamId, status, createdAt). Team (members.user, createdBy). BugActivity (bugId, createdAt). Comment, Attachment, Notification: indexes on foreign keys and common filters.
- **Reads**: Use `.lean()` for read-only responses to return plain objects.

## Security

- **Auth**: JWT in `Authorization: Bearer <token>`. Rate limit on `/api/auth`.
- **CORS**: Allowlist of origins (CLIENT_URL + known hosts).
- **Validation**: Joi on body/query where applicable; ObjectId on params.
