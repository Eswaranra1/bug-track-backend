# Production Readiness – Backend & Frontend

**Short answer: Yes, you can deploy.** Routing is correct, env is wired for production, and there are no blocking bugs. Follow the checklist below and set **NODE_ENV=production** on the backend.

---

## Backend

### Routing
- **Auth:** `/api/auth` – me, register, login, forgot-password, reset-password (GET + POST), test-email.
- **Bugs:** `/api/bugs` – list/create, `/:id`, `/:id/activity`, `/:id/start`, `/:id/stop`, `/:id/comments`, `/:id/attachments`.
- **Teams:** `/api/teams` – list/create, `/:id`, `/:id/workspace`, `/:id/members`.
- **Notifications, comments, analytics, activity** mounted under `/api/*`.
- **API 404:** Unmatched `/api/*` returns `404` JSON.
- **Route order:** Specific paths (e.g. `/:id/workspace`, `/:id/activity`) are defined before generic `/:id`, so no routing conflicts.

### Environment (.env)
| Variable        | Required | Notes |
|----------------|----------|--------|
| `MONGO_URI`    | Yes      | Atlas connection string. |
| `JWT_SECRET`   | Yes      | Long, random; never commit. |
| `PORT`         | No       | Default 5000; Render sets this. |
| `NODE_ENV`     | **Set on Render** | Set to `production` so 500s are sanitized and logs are production-safe. |
| `API_URL`      | Yes (production) | Backend base URL **without** `/api` (e.g. `https://bug-track-backend-jz4l.onrender.com`). Used for reset-password link and CORS. |
| `CLIENT_URL`   | Yes (production) | Frontend URL (e.g. `https://bug-track-frontend.vercel.app`). CORS + redirect after reset. |
| `RESEND_API_KEY` | If using email | For forgot-password and test-email. |
| `RESEND_FROM`  | Optional | Defaults to BugTrack sender. |
| `JWT_EXPIRES_IN` | Optional | Default `7d`. |

**Security:** Do **not** commit `.env`. Backend `.gitignore` already includes `.env`. On Render, set all variables in the dashboard (or connect a secret store).

### Fixes applied
- **Reset-password POST:** 500 responses now return a generic "Server error" when `NODE_ENV=production` (no stack/details leaked).

### CORS
- Uses `CLIENT_URL` plus hardcoded Vercel and localhost origins. No trailing slash. Credentials allowed. Sufficient for production.

### Errors
- Global handler sanitizes 500 messages in production.
- Auth, bug, analytics controllers sanitize 500 where they catch errors.
- Multer/file errors return 400 with safe messages.

### Deployment (e.g. Render)
1. Set **NODE_ENV=production**.
2. Set **MONGO_URI**, **JWT_SECRET**, **API_URL**, **CLIENT_URL** (and **RESEND_*** if using email).
3. Build command: `npm install && npm run build` (if you add a build step) or just start; start: `node server.js` or `npm start`.
4. No trailing slash on **API_URL** or **CLIENT_URL**.

---

## Frontend

### Routing (React Router)
- `/` – Login  
- `/register`, `/reset-password/:token`  
- `/dashboard`, `/dashboard?view=my|created|team`  
- `/bugs/:id`  
- `/teams`, `/teams/:id`, `/teams/:id/workspace`  
- `/kanban`, `/analytics`, `/activity`  
- `*` – NotFound (404) with link to Dashboard  

All protected routes use `ProtectedRoute`; unauthenticated users are redirected to `/`. No conflicting or duplicate routes.

### API base URL
- **Development:** `http://localhost:5000/api` (when `import.meta.env.DEV` is true).
- **Production:** Uses `import.meta.env.VITE_API_URL` if set; otherwise fallback `https://bug-track-backend-jz4l.onrender.com/api`.

For Vercel, either:
- Set **VITE_API_URL** = `https://bug-track-backend-jz4l.onrender.com/api` in project env, or  
- Rely on the hardcoded fallback (same URL).

### SPA and 404
- **vercel.json** rewrites `/(.*)` to `/index.html`, so client-side routes work on refresh and direct links.

### Deployment (e.g. Vercel)
1. Build command: `npm run build` (from `bugtrack` folder if monorepo).
2. Output directory: `dist` (Vite default).
3. Optional: set **VITE_API_URL** = `https://bug-track-backend-jz4l.onrender.com/api` (or your backend URL).

---

## End-to-end checks

| Check | Backend | Frontend |
|-------|---------|----------|
| Routing / 404 | OK | OK |
| Env for production | OK (set NODE_ENV) | OK (VITE_API_URL optional) |
| CORS | OK (CLIENT_URL) | N/A |
| Reset-password link | OK (API_URL) | N/A |
| 500 error sanitization | OK | N/A |
| SPA redirects | N/A | OK (vercel.json) |

---

## Before you deploy

1. **Backend:** Set **NODE_ENV=production** on Render (or your host).
2. **Backend:** Confirm **API_URL** has no trailing slash and **CLIENT_URL** matches the real frontend URL.
3. **Frontend:** Confirm production build calls the correct backend (same as **API_URL** + `/api`).
4. **Secrets:** Never commit `.env`; use platform env vars for JWT_SECRET, RESEND_API_KEY, MONGO_URI.

You’re ready to deploy once the above is set.
