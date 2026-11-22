# URL Shortener

Turns long links into short, shareable URLs. The home page is a public composer (Gemini-style). Anyone can paste a link; generating one requires an account. Signed-in users get a personal list with click counts. Short IDs redirect to the original destination. Visit history is stored in MongoDB.

---

## Features

- Public home page with a paste field and **Generate** button
- Signup, login, and logout (logout asks for confirmation)
- Password show/hide on login and signup
- Guests are sent to login only when they try to generate; after login the saved URL is shortened automatically
- JWT in an HTTP cookie (`uid`) for session auth
- Unique short IDs (`shortid`)
- Redirect from `/url/:shortId` to the original link
- Per-user table of short URLs, original URLs, and click counts
- Toasts for success and errors (including API-down)
- Next.js UI with Tailwind CSS, shadcn/ui, and Google Sans

---

## How it works

| Who | Home | Generate | Your links |
| --- | --- | --- | --- |
| Guest | Composer is visible | Redirects to `/login` | Hidden |
| Signed in | Same composer | Creates a short URL | Shown below |

Locally the UI runs on **port 3000**. Next.js rewrites `/user` and `/url` to the Express API on **port 5005**. Short links look like `http://localhost:5005/url/<id>` (or your `LOCAL_BASE_URL` / `PRODUCTION_BASE_URL`).

---

## Tech stack

| Layer | Tools |
| --- | --- |
| Runtime | Node.js |
| API | Express, JSON |
| Frontend | Next.js (App Router), Tailwind CSS, shadcn/ui |
| Database | MongoDB + Mongoose |
| Auth | HMAC JWT (`utils/auth.js`) + `cookie-parser` |
| Short IDs | `shortid` |

---

## Project structure

```text
url-shortner/
├── api/                 # Vercel serverless entry (Express)
├── controllers/         # Signup, login, logout, create/list/redirect URLs
├── middlewares/         # JWT cookie auth
├── models/              # Mongoose schemas for users and URLs
├── routes/              # JSON API: /user, /url
├── utils/
│   ├── auth.js          # Sign and verify JWT
│   └── config.js        # LOCAL_* vs PRODUCTION_* hosts and cookies
├── web/                 # Next.js app (pages, shadcn, toasts)
├── server.js            # Express API, MongoDB, port 5005
├── .env.example         # Env template (copy to .env)
└── package.json
```

### Frontend routes (`web/`)

| Path | Page |
| --- | --- |
| `/` | Home composer; link table if signed in |
| `/login` | Login |
| `/signup` | Signup |
| `/home` | Redirects to `/` |

### API routes (Express)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/user` | No | Signup |
| `POST` | `/user/login` | No | Login (sets `uid` cookie) |
| `POST` | `/user/logout` | No | Clear cookie |
| `GET` | `/user/me` | Yes | Current session |
| `GET` | `/url` | Yes | List this user’s URLs |
| `POST` | `/url` | Yes | Create a short URL |
| `GET` | `/url/:shortId` | Yes | Redirect and record a click |
| `GET` | `/api/health` | No | Health check |

---

## Prerequisites

1. **Node.js** (LTS recommended) and npm
2. **MongoDB** (local, Atlas, or any URI)
3. A terminal in the project folder

---

## Setup

### 1. Clone or open the project

```bash
cd url-shortner
```

### 2. Install dependencies

Root (API) and frontend:

```bash
npm install
cd web
npm install
cd ..
```

### 3. Create a `.env` file

Copy `.env.example` to `.env` in the **project root** (gitignored):

```env
MONGODB_URI=
JWT_SECRET_KEY=
LOCAL_FRONTEND_URL=http://localhost:3000
LOCAL_BASE_URL=http://localhost:5005
PRODUCTION_FRONTEND_URL=https://your-frontend.example.com
PRODUCTION_BASE_URL=https://your-api.example.com
```

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET_KEY` | Secret used to sign and verify login tokens |
| `LOCAL_FRONTEND_URL` | Next.js origin in development |
| `LOCAL_BASE_URL` | Express origin used in short links locally |
| `PRODUCTION_FRONTEND_URL` | Deployed Next.js origin |
| `PRODUCTION_BASE_URL` | Deployed API / public short-link origin |

`npm run dev` uses `LOCAL_*`. Production (`NODE_ENV=production` or Vercel) uses `PRODUCTION_*`. Cookies are `httpOnly`. They use `secure` and `SameSite=None` only when the UI and API are on different HTTPS origins; otherwise `SameSite=Lax`.

**Atlas example:**

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/url-shortener?retryWrites=true&w=majority
JWT_SECRET_KEY=replace-with-a-long-random-secret
```

Use a strong, private `JWT_SECRET_KEY`. Do not commit `.env`.

### 4. MongoDB

- **Local:** start MongoDB so it matches your URI.
- **Atlas:** no local process; allow your IP in Network Access.

### 5. Start both servers

```bash
npm run dev
```

This runs Express (`dev:api`) and Next.js (`dev:web`). You should see the API on **5005** and the UI on **3000**.

If MongoDB is down, the API can still listen, but signup, login, and shortening will fail until the URI works.

Separate commands:

```bash
npm run dev:api
npm run dev:web
```

### 6. Open the app

Visit [http://localhost:3000](http://localhost:3000).

1. Paste a URL and click **Generate** (you will be asked to log in if needed).
2. Sign up or log in, then generate again (or the saved URL is created after login).
3. Open `/url/<id>` (via the API host) and confirm the click count updates on home.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | API + Next.js together |
| `npm run dev:api` | Express with `--watch` on port 5005 |
| `npm run dev:web` | Next.js on port 3000 |
| `npm run build:web` | Production build of `web/` |
| `npm start` | Express only (`node server.js`) |

---

## Environment checklist

- [ ] `npm install` in the root and in `web/`
- [ ] `.env` has `MONGODB_URI`, `JWT_SECRET_KEY`, and the `LOCAL_*` / `PRODUCTION_*` URLs
- [ ] MongoDB is reachable
- [ ] `npm run dev` shows the API listening on 5005 and Next.js ready on 3000
- [ ] Browser opens `http://localhost:3000`
- [ ] Guest can see the composer; Generate sends them to login
- [ ] After login, a short link is created and listed
- [ ] Opening `/url/<id>` increments clicks

---

## Notes

- This is a practice project. Do not run it as a public production shortener without addressing the gaps below.
- `uuid` remains in `package.json` from an older session-map approach; auth uses JWT in `utils/auth.js`.
- Auth tokens are signed with Node’s built-in `crypto` module (HMAC-SHA256).

---

## Limitations (system design and production)

This app is a **learning project**. A production shortener (Bitly-style) would still need the following.

### Core product and routing

- **Authenticated redirects.** `/url` is wrapped in `restrictToLoggedInUserOnly`, so opening a short link still needs a login cookie. Production shorteners resolve **anonymously**.
- **No custom aliases, expiry, or edit/delete.**
- **No versioned public REST API** for third-party apps, QR, or bulk create (the UI uses JSON internally).
- **No 301 vs 302 policy.**
- **Home list does not paginate or search.**

### Scale and architecture

- **Every redirect hits MongoDB.** Hot keys should be cached (for example Redis).
- **No ID design.** `shortid` is random, not unique-indexed, and collisions are not retried.
- **Unbounded `visitHistory` array.** High-traffic links can hit MongoDB’s 16MB document limit. Clicks belong in a separate events store.
- **Two local processes.** Production needs a real `PORT`, process manager, and horizontal scale.
- **No cache, CDN, or edge redirects.**
- **No rate limiting.**

### Reliability and correctness

- **`shortId` is not unique in the schema.**
- **MongoDB connect has no retry or fail-fast.**
- **No health/readiness probes, graceful shutdown, or timeouts** on DB/HTTP (`GET /api/health` exists but is basic).
- **No idempotency** on create.
- **Redirect does not validate `redirectURL`.** `javascript:` / `data:` schemes are dangerous.
- **No automated tests.**

### Security

- **Passwords stored in plaintext**; login is `findOne({ email, password })`. Hash with bcrypt before production.
- **JWT has no expiry**, rotation, or revocation list (logout only clears the cookie on that browser).
- **No CSRF protection.**
- **No security headers** (Helmet, HSTS, CSP).
- **No email verification, password reset, or lockout.**
- **No malware / phishing URL checks.**

### Observability

- **No structured logging, metrics, or tracing.**
- **Click “analytics” are only an in-document array**—no geo, referrer, or unique vs total.

### Highest-impact gaps if shipping tomorrow

1. Public, unauthenticated redirects
2. Hashed passwords
3. Unique short IDs and collision handling
4. Allow only `http` / `https` destinations
5. Cache on the redirect path
6. Clicks as a separate append-only stream
7. Rate limits
8. JWT expiry
9. Health checks plus `PRODUCTION_BASE_URL` / `PORT` from the environment
