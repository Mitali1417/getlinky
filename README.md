# URL Shortener

A Node.js web app that turns long links into short, shareable URLs. Users sign up, log in, generate short IDs, and track how many times each link is clicked. Short URLs redirect to the original destination and visit history is stored in MongoDB.

Live example: `https://url-shortner-cxtz.onrender.com`

---

## Features

- User signup, login, and logout
- JWT stored in an HTTP cookie (`uid`) for session auth
- Generate a unique short ID for any URL (`shortid`)
- Redirect from `/url/:shortId` to the original link
- Per-user URL list with click counts
- Next.js UI with Tailwind CSS and shadcn/ui

---



## Tech stack


| Layer     | Tools                             |
| --------- | --------------------------------- |
| Runtime   | Node.js                           |
| API       | Express                           |
| Frontend  | Next.js, Tailwind CSS, shadcn/ui  |
| Database  | MongoDB + Mongoose                |
| Auth      | JSON Web Tokens + `cookie-parser` |
| Short IDs | `shortid`                         |


---



## Project structure

```text
url-shortner/
├── controllers/       # Signup, login, logout, create/redirect URLs
├── middlewares/       # Protect routes; attach user from JWT cookie
├── models/            # Mongoose schemas for users and URLs
├── routes/            # JSON API for users and URLs
├── utils/auth.js      # Sign and verify JWT
├── web/               # Next.js + Tailwind + shadcn frontend
├── server.js          # Express API, MongoDB, listen on port 5005
├── .env               # Secrets (not committed)
└── package.json
```

---



## Prerequisites

1. **Node.js** (LTS recommended) and npm
2. **MongoDB**: local install, MongoDB Atlas, or any MongoDB URI
3. A terminal in the project folder

---



## Setup guide (step by step)



### 1. Clone or open the project

```bash
cd url-shortner
```



### 2. Install dependencies

```bash
npm install
```

This installs Express, Mongoose, `cookie-parser`, `dotenv`, `shortid`, and related packages. Then install the frontend:

```bash
cd web
npm install
cd ..
```

Auth tokens are signed with Node’s built-in `crypto` module.

### 3. Create a `.env` file

In the project root, create `.env` (this file is gitignored):

```env
MONGODB_URI=
JWT_SECRET_KEY=
LOCAL_FRONTEND_URL=http://localhost:3000
LOCAL_BASE_URL=http://localhost:5005
PRODUCTION_FRONTEND_URL=https://your-frontend.vercel.app
PRODUCTION_BASE_URL=https://your-api.vercel.app
```


| Variable                   | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| `MONGODB_URI`              | Connection string for MongoDB                |
| `JWT_SECRET_KEY`           | Secret used to sign and verify login tokens  |
| `LOCAL_FRONTEND_URL`       | Next.js origin while developing              |
| `LOCAL_BASE_URL`           | Express origin used in short links locally   |
| `PRODUCTION_FRONTEND_URL`  | Deployed Next.js origin                      |
| `PRODUCTION_BASE_URL`      | Deployed API / public short-link origin      |

`npm run dev` uses the `LOCAL_*` values. Production (`NODE_ENV=production` or Vercel) uses the `PRODUCTION_*` values. Cookies are `secure` + `SameSite=None` only when the frontend and API are on different HTTPS origins.


**Atlas example:**

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/url-shortener?retryWrites=true&w=majority
JWT_SECRET_KEY=replace-with-a-long-random-secret
```

Use a strong, private `JWT_SECRET_KEY`. Do not commit `.env`.

### 4. Start MongoDB

- **Local:** start the MongoDB service so it is listening on the URI you set.
- **Atlas:** no local process; the URI in `.env` is enough. Allow your IP in Atlas Network Access.



### 5. Start the server

Run the API and the Next.js app together:

```bash
npm run dev
```

You should see MongoDB connected on port **5005** and Next.js on port **3000**.

If MongoDB fails, the console logs `Error Occured` and the API will still start, but signup, login, and shortening will not work until the URI is valid.

### 6. Open the app

Visit [http://localhost:3000](http://localhost:3000). Unauthenticated users are sent to `/login`. Short links are served at `/url/:shortId` through the Next.js rewrite to Express.

---


## Environment and config checklist

- [ ] `npm install` completed
- [ ] `.env` exists with `MONGODB_URI` and `JWT_SECRET_KEY`
- [ ] MongoDB is reachable
- [ ] `npm run dev` prints **MongoDB Connected** and Next.js ready
- [ ] Browser opens `http://localhost:3000`
- [ ] Signup → login → generate → open `/url/<id>` → click count increases after you return to home

---



## Notes

- This is a practice project. Do not run it as a public production shortener without addressing the gaps below.
- `uuid` is listed in `package.json` from an older session-map approach; auth now uses JWT in `utils/auth.js`.
- To add a start script later, you can put `"start": "node server.js"` under `scripts` in `package.json`.

---

## Limitations (system design and production)

This app works as a **single-server learning project**. A production URL shortener (Bitly-style) would still need the following.

### Core product and routing

- **Public redirects.** `/url` is wrapped in `restrictToLoggedInUserOnly`, so opening a short link requires a login cookie. Production shorteners must resolve **anonymously** and fast.
- **Hardcoded host.** Generated links fall back to the current browser origin; set `BASE_URL` for the API response.
- **No custom aliases, expiry, or edit/delete.** No vanity slugs, TTL, disable/archive, or ownership transfer.
- **No public API.** Only HTML form posts; no versioned REST API for apps, QR, or bulk create.
- **No 301 vs 302 policy.** Permanent vs temporary redirects matter for SEO, caching, and updating a destination later.
- **Home list does not paginate or search.** It loads every URL for the user in one query.

### Scale and architecture

- **Every redirect hits MongoDB.** Hot keys should be cached (for example Redis) with the database as source of truth. Redirects are the latency-critical path.
- **No ID design.** `shortid` is random, not unique-indexed, and collisions are not retried. Production usually uses a **counter + Base62**, Snowflake/KSUID, or a dedicated ID service, plus uniqueness guarantees.
- **Unbounded `visitHistory` array.** Each click `$push`es into the URL document. High-traffic links can hit MongoDB’s **16MB** document limit and slow writes. Clicks belong in a **separate events store** (or time-series), with aggregates updated asynchronously.
- **Single process, fixed port 5005.** No `PORT` from env, no clustering, no horizontal scale.
- **MongoDB as the only store.** No replica-set / failover story, no read replicas for analytics, no queue for click ingestion.
- **No cache, CDN, or edge redirects.** Real shorteners often terminate redirects at the edge for low TTFB worldwide.
- **No rate limiting or backpressure.** Abuse (mass create, scrape, DDoS on `/url/:id`) is unmitigated.
- **No partition / shard key** for billions of mappings.

### Reliability and correctness

- **`shortId` is not unique in the schema.** Two documents can share the same id; redirects become wrong or flaky.
- **MongoDB connect has no retry, pool tuning, or fail-fast.** The app listens even if the database is down.
- **No health/readiness probes, graceful shutdown, or timeouts** on DB/HTTP.
- **Inconsistent errors.** Mix of JSON and HTML; create can return 500 JSON after a form post.
- **No idempotency** on create (double-submit → two ids for the same URL).
- **Redirect does not validate `redirectURL`.** `javascript:`, `data:`, or non-http schemes are open-redirect / XSS vectors.
- **No tests** (unit, integration, load) and no process manager (`npm start`, PM2, systemd, Kubernetes).

### Security

- **Passwords stored in plaintext**; login is `findOne({ email, password })`. Hash with bcrypt (or similar) before production.
- **JWT has no expiry**, no rotation, no revocation list (logout only clears the cookie on that browser).
- **Cookie `uid` is not `httpOnly` / `secure` / `sameSite`.** XSS can steal the session; HTTP can leak it.
- **No CSRF protection** on POST login, signup, logout, or create.
- **No security headers** (Helmet, HSTS, CSP).
- **No signup email verification, password reset, or lockout.**
- **Secrets:** `JWT_SECRET_KEY` can be `undefined` if `.env` is missing.
- **No malware / phishing URL checks** (for example Google Safe Browsing)—table stakes for a public shortener.
- **No audit log** of who created or changed links.

### Observability and operations

- **No structured logging, metrics, or tracing.** You cannot see p99 redirect latency, error rate, or DB saturation.
- **No alerting** on MongoDB down, 5xx spikes, or disk/index growth.
- **No backups / point-in-time recovery** documented or automated.
- **Click “analytics” are only an in-document array**—no geo, referrer, user-agent, unique vs total, or dashboards.
- **No config validation at boot** (missing URI/secret should refuse to start).

### Highest-impact gaps if shipping tomorrow

1. Public, unauthenticated redirects  
2. Hashed passwords and cookie flags (`httpOnly`, `secure`, `sameSite`)  
3. Unique short IDs and collision handling  
4. Allow only `http`/`https` destinations  
5. Cache on the redirect path (Redis or similar)  
6. Clicks as a separate append-only stream (not a growing array)  
7. Rate limits  
8. JWT expiry  
9. Health checks and a real `BASE_URL` / `PORT` from the environment

