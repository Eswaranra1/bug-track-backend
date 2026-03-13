# BugTrack — Project status

## Alignment: DB · Backend · Frontend

| Layer | Status |
|-------|--------|
| **DB** | MongoDB models: User, Bug, Team (with roles), Comment, Attachment, BugActivity, Notification. Indexes on Team (members.user, createdBy). |
| **Backend** | Express 5, JWT (Bearer), rate limit (auth), Joi validation, multer uploads, Resend email. Routes: auth, bugs, teams, teams/:id/members, notifications, comments. Role-based team access (admin, manager, developer, qa, member). |
| **Frontend** | React 19, Vite 8, React Router 7. Pages: Login, Register, Dashboard, BugDetails, Teams, TeamDetail, ResetPassword. Components: BugCard, BugForm, TeamSelector, NotificationBell, Timeline, CommentSection, AttachmentUploader. API base: dev → localhost:5000/api, prod → VITE_API_URL or Render. |

All API contracts (request/response shapes) and env vars are consistent across backend and frontend.

---

## Pending / optional (non-blocking)

- **Kanban board** (drag & drop) — not implemented
- **Sprint planning** — not implemented
- **Socket.io real-time updates** — not implemented
- **Bug analytics dashboard** — not implemented
- **Dashboard URL sync** — `?teamId=` from URL could set team filter on load (optional UX)
- **Persistent file storage** — uploads are on server disk; for production consider S3/Cloudinary (Render disk is ephemeral)

---

## Unnecessary files

- **Backend:** No redundant source files. If you have a standalone **`test-email.js`** in the project root (e.g. a one-off script), you can remove it; use **`GET /api/auth/test-email`** instead.
- **Frontend:** No unused components or pages; all are referenced from `App.jsx` or other components.
- **Docs:** `README.md` and `GETTING_STARTED.md` are both useful (overview vs step-by-step). Keep both unless you want a single doc.

---

## Env and deploy

- **Backend:** `.env` (not in repo) + `.env.example` for reference. `.gitignore` includes `.env` and `uploads/`.
- **Frontend:** Set `VITE_API_URL` in Vercel (or use default Render URL in build).
