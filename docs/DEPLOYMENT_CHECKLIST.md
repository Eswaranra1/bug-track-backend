# BugTrack — Production Deployment Checklist

Use this before going live. Both backend and frontend are configured for production; complete the steps below.

---

## Backend (Render)

### 1. Environment variables (Render Dashboard → Service → Environment)

Set these. **Do not commit `.env`;** use Render’s env UI.

| Variable        | Required | Example / note |
|-----------------|----------|-----------------|
| `NODE_ENV`      | Yes      | `production` (enables sanitized 500 errors) |
| `PORT`          | No       | Render sets automatically; omit or leave as-is |
| `MONGO_URI`     | Yes      | Your MongoDB Atlas connection string |
| `JWT_SECRET`    | Yes      | Long random string (e.g. 64+ chars) |
| `JWT_EXPIRES_IN`| No       | `7d` (default) |
| `API_URL`       | Yes      | Backend public URL, no trailing slash, e.g. `https://bug-track-backend-jz4l.onrender.com` |
| `CLIENT_URL`    | Yes      | Frontend URL, e.g. `https://bug-track-frontend.vercel.app` |
| `RESEND_API_KEY`| If using email | From Resend dashboard |
| `RESEND_FROM`   | If using email | e.g. `BugTrack <onboarding@resend.dev>` |

### 2. Build & start

- **Build command:** leave empty (Node service).
- **Start command:** `node server.js` (or `npm start`).

### 3. After deploy

- Open `https://<your-backend-url>/` → should see “BugTrack API Running”.
- Frontend will call `https://<your-backend-url>/api`; ensure CORS `CLIENT_URL` matches your real frontend URL.

---

## Frontend (Vercel)

### 1. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable         | Required | Example / note |
|------------------|----------|-----------------|
| `VITE_API_URL`   | Recommended | Backend API base, e.g. `https://bug-track-backend-jz4l.onrender.com/api` (must end with `/api`) |

If `VITE_API_URL` is not set, the app uses the hardcoded production URL in `src/config/api.js`. Setting it in Vercel is better so you can change the backend URL without a code change.

### 2. Build & output

- **Build command:** `npm run build` (or `vite build`).
- **Output directory:** `dist` (Vite default).
- **Install command:** `npm install`.

### 3. SPA routing

- `vercel.json` rewrites all routes to `/index.html` — already set. No extra config needed.

---

## Quick verification

1. **Backend:** `curl https://<API_URL>/` → “BugTrack API Running”.
2. **Frontend:** Open app URL → login/register works and API calls succeed (check Network tab; base URL should be your backend `/api`).
3. **Auth:** Login returns a token; protected routes (e.g. dashboard) load with that token.
4. **CORS:** If frontend is on a new domain, add it to backend `CLIENT_URL` (and optionally to the `allowedOrigins` array in `server.js` if you use a fixed list).

---

## Security reminders

- Rotate any secrets if they were ever committed or shared (MongoDB password, `JWT_SECRET`, Resend API key).
- Keep `.env` only locally and in Render; never commit it. Use `.env.example` with placeholders for docs.
