# BugTrack — Codebase Analysis (Phase 1)

## Backend structure (current)

```
bug-track-backend/
├── server.js              # App entry, Helmet, CORS, routes mount, 404, error handler, exports app for tests
├── config/
│   ├── db.js              # MongoDB connect
│   ├── multer.js          # File upload (uploads/, 5MB, images+PDF)
│   └── constants.js       # DEFAULT_PORT, NODE_ENV
├── constants/
│   └── httpStatus.js      # HttpStatus, ApiMessage
├── controllers/
│   ├── authController.js
│   ├── bugController.js   # HTTP only; delegates to bugService
│   ├── teamController.js
│   ├── commentController.js
│   ├── attachmentController.js
│   ├── notificationController.js
│   └── analyticsController.js  # GET /api/analytics/bugs
├── helpers/
│   ├── bugActivityHelper.js
│   ├── notificationHelper.js
│   ├── emailAlertHelper.js
│   └── resendHelper.js
├── middleware/
│   ├── authMiddleware.js  # JWT Bearer
│   ├── rateLimitMiddleware.js
│   ├── validateMiddleware.js  # Joi
│   ├── teamMemberMiddleware.js
│   └── validateParamId.js
├── models/
│   ├── User.js
│   ├── Bug.js
│   ├── Team.js            # members: [{ user, role }], ROLES
│   ├── Comment.js
│   ├── Attachment.js
│   ├── BugActivity.js
│   └── Notification.js
├── routes/
│   ├── authRoutes.js
│   ├── bugRoutes.js
│   ├── teamRoutes.js
│   ├── notificationRoutes.js
│   ├── commentRoutes.js
│   └── analyticsRoutes.js
├── services/
│   └── bugService.js      # getVisibleBugs, getBugByIdIfAllowed, createBug, updateBug, deleteBugIfAllowed, getBugActivityIfAllowed
├── repositories/
│   ├── bugRepository.js
│   └── teamRepository.js
├── tests/
│   └── api.test.js        # Jest + supertest (GET /, GET /api/bugs 401, GET /api/analytics/bugs 401, 404)
└── utils/
    ├── asyncHandler.js
    ├── AppError.js
    └── mongooseUtils.js
```

---

## Frontend structure (current)

```
bug-track-frontend/bugtrack/src/
├── App.jsx                # Routes: /, /register, /reset-password/:token, /dashboard, /bugs/:id, /teams, /teams/:id, *
├── main.jsx
├── config/
│   └── api.js             # API_BASE_URL
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── ResetPassword.jsx
│   ├── Dashboard.jsx
│   ├── BugDetails.jsx
│   ├── TeamPage.jsx
│   ├── TeamDetail.jsx
│   ├── Kanban.jsx         # DnD status columns, PUT /bugs/:id on drop
│   ├── Analytics.jsx       # GET /api/analytics/bugs, byStatus, byPriority, resolutionTime, byTeam
│   └── NotFound.jsx
├── components/
│   ├── ErrorBoundary.jsx   # Wraps app; catches React errors
│   ├── AppLayout.jsx
│   ├── ProtectedRoute.jsx
│   ├── BugCard.jsx
│   ├── BugForm.jsx
│   ├── TeamSelector.jsx
│   ├── NotificationBell.jsx
│   ├── Timeline.jsx
│   ├── CommentSection.jsx
│   └── AttachmentUploader.jsx
├── services/
│   ├── api.js             # Axios instance, Bearer, 401 logout
│   ├── teamService.js
│   ├── commentService.js
│   └── notificationService.js
└── utils/
    ├── auth.js
    ├── theme.jsx
    └── uploadUrl.js
```

---

## Existing features

| Feature | Backend | Frontend |
|--------|---------|----------|
| Authentication (register/login) | ✅ JWT, register, login | ✅ Login, Register |
| JWT Bearer | ✅ authMiddleware | ✅ api.js Authorization header |
| Bug CRUD | ✅ create, getBugs, getBugById, update, delete | ✅ Dashboard, BugForm, BugCard, BugDetails |
| Password reset | ✅ forgot-password, reset-password (Resend) | ✅ ResetPassword page, Login forgot flow |
| Email service | ✅ Resend (auth + emailAlertHelper) | — |
| Dashboard UI | — | ✅ Stats, filters (team, priority, status), sort |
| Bug filters | ✅ teamId, assignedTo, priority, status, sort, order | ✅ TeamSelector, priority/status pills, sort |
| Protected routes | ✅ auth middleware | ✅ ProtectedRoute, Navigate to / |
| Teams | ✅ Model, CRUD, members with roles | ✅ TeamPage, TeamDetail, create, add member |
| Comments | ✅ add, get by bug, delete | ✅ CommentSection.jsx |
| Attachments | ✅ multer, upload, list by bug | ✅ AttachmentUploader.jsx |
| Timeline / activity | ✅ BugActivity model, getBugActivity | ✅ Timeline.jsx |
| Notifications | ✅ model, get, mark read, mark all read | ✅ NotificationBell.jsx |
| Time estimation | ✅ estimatedTime, actualTime, startDate, endDate on Bug | ✅ BugDetails edit |
| Role permissions | ✅ Team roles (admin, manager, developer, qa, member) | ✅ TeamDetail, add member by role |
| Global bug visibility | ✅ createdBy OR assignedTo OR teamId in user teams | ✅ GET /api/bugs returns all visible |
| Rate limiting | ✅ authLimiter, forgotPasswordLimiter | — |
| Input validation | ✅ Joi (register, login, bug, comment, team) | — |
| Error sanitization | ✅ Production 500 generic message | — |
| CORS | ✅ Allowlist | — |
| Helmet | ✅ Security headers | — |
| Kanban board | ✅ PUT /bugs/:id for status | ✅ Kanban.jsx, @dnd-kit |
| Pagination (bugs) | ✅ page, limit, totalPages | ✅ Dashboard pagination UI |
| Bug analytics API | ✅ GET /api/analytics/bugs | ✅ Analytics.jsx uses API |
| Error Boundary | — | ✅ ErrorBoundary wraps app |
| Clean architecture (bugs) | ✅ Controllers → bugService → repositories | — |
| Backend tests | ✅ Jest + supertest, tests/api.test.js | — |

---

## Existing models

| Model | Purpose |
|-------|---------|
| User | name, email, password, resetPasswordToken, resetPasswordExpires |
| Bug | title, description, priority, status, createdBy, teamId, assignedTo, estimatedTime, actualTime, startDate, endDate |
| Team | name, description, createdBy, members: [{ user, role }] |
| Comment | bugId, user, message |
| Attachment | bugId, uploadedBy, fileUrl, originalName |
| BugActivity | bugId, user, action, metadata |
| Notification | userId, message, type, read, bugId, link |

---

## Existing APIs

### Auth
- `GET  /api/auth/me` — current user (auth)
- `GET  /api/auth/test-email` — test email
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `GET  /api/auth/reset-password/:token` — HTML form
- `POST /api/auth/reset-password/:token`

### Bugs
- `POST /api/bugs` — create
- `GET  /api/bugs` — list (visible: createdBy | assignedTo | teamId in user teams). Query: teamId, assignedTo, priority, status, sort, order, page, limit. Response: `{ bugs, pagination: { total, page, limit, totalPages } }`
- `GET  /api/bugs/:id` — get one
- `PUT  /api/bugs/:id` — update
- `DELETE /api/bugs/:id` — delete
- `GET  /api/bugs/:id/activity`
- `POST /api/bugs/:id/comments`
- `GET  /api/bugs/:id/comments`
- `POST /api/bugs/:id/attachments`
- `GET  /api/bugs/:id/attachments`

### Teams
- `POST /api/teams`
- `GET  /api/teams`
- `GET  /api/teams/:id`
- `PUT  /api/teams/:id`
- `DELETE /api/teams/:id`
- `GET  /api/teams/:id/members`
- `POST /api/teams/:id/members`
- `DELETE /api/teams/:id/members/:userId`

### Notifications
- `GET  /api/notifications`
- `PUT  /api/notifications/read-all`
- `PUT  /api/notifications/:id/read`

### Comments
- `DELETE /api/comments/:id`

### Analytics
- `GET /api/analytics/bugs` — (auth) `{ total, byStatus, byPriority, resolutionTimeAvgHours, byTeam }`

---

## Missing or to extend

| Feature | Status | Action |
|---------|--------|--------|
| Kanban board | ✅ | Done: Kanban.jsx, PUT /bugs/:id on drop |
| Pagination (bugs) | ✅ | Done: GET /api/bugs page/limit, Dashboard UI |
| Bug analytics API | ✅ | Done: GET /api/analytics/bugs, Analytics.jsx |
| Helmet | ✅ | Done: server.js |
| Clean architecture (bugs) | ✅ | Done: controller → bugService → repositories |
| Backend tests | ✅ | Done: Jest + supertest, tests/api.test.js |
| Error Boundary | ✅ | Done: ErrorBoundary wraps app |
| Real-time (Socket.io) | ❌ | Optional: socket server, emit bug/comment events |
| Multi-org / billing | ❌ | Future |
| Zod | ❌ | Joi already used; optional migration |

---

## Backend layers (refactored)

- **repositories/** — DB only: `bugRepository`, `teamRepository`
- **services/** — Business logic: `bugService` (getVisibleBugs, getBugByIdIfAllowed, createBug, updateBug, deleteBugIfAllowed, getBugActivityIfAllowed)
- **controllers/** — HTTP only; bug controller delegates all bug operations to `bugService`. Analytics controller uses aggregation for visible bugs.

## Summary

- **Implemented:** Auth, JWT, Bug CRUD, password reset, email (Resend), dashboard, filters, teams with roles, comments, attachments, timeline, notifications, time estimation, global bug visibility, rate limiting, validation, CORS, error sanitization, **Helmet**, **pagination** (GET /api/bugs), **Kanban** page (drag-and-drop status), **analytics** (GET /api/analytics/bugs + Analytics page), **clean architecture** for bugs (controller → bugService → repositories), **Jest + supertest** API tests, **ErrorBoundary** on frontend.
- **Optional / future:** Socket.io, multi-org/billing, Zod migration.
