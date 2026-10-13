# Smart Campus Resource Network

## Backend API

The Express backend serves the existing dashboard data contract without changing the frontend:

```bash
npm run server
```

- API base URL: `http://localhost:4000/api`
- Swagger documentation: `http://localhost:4000/api/docs`
- Health check: `GET /api/health`
- Seed login: `priya.sharma@ritrjpm.ac.in` / `password123`

`POST /api/auth/register` submits an account for approval and does not return a JWT. Approved users sign in through `POST /api/auth/login`, which returns a JWT. Send it on protected requests as `Authorization: Bearer <token>`. The `/api/dashboard` response contains `resources`, `bookings`, `notifications`, and `summary` fields matching the current dashboard state. Runtime data is stored in MongoDB.

New registrations remain pending until an administrator approves them from the **Users** view. Pending and rejected accounts cannot log in or use protected API routes. Registration requests appear in the administrator's in-app notifications and are emailed directly to `ADMIN_EMAIL` from `SMTP_FROM`. Those emails include a link to the specific account request; pending users who try to sign in also trigger an approval reminder. Booking requests are emailed to admin-role accounts and include a link to the specific booking. The links open the app, where an administrator must sign in and explicitly approve or reject the request. Successful sign-ins and booking creation, updates, cancellations, and deletions are emailed to accounts with the `admin` role from `SMTP_FROM`. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, and `ADMIN_EMAIL` in `.env` to enable email. For Gmail, `SMTP_USER` and `SMTP_PASS` must be valid SMTP credentials (typically a Google App Password), and the account must be authorized to send as `SMTP_FROM`. `ADMIN_APP_URL` sets the link target (defaults to `http://localhost:5173`). Without valid SMTP settings, approval and booking operations still work, but email delivery is unavailable.

## MongoDB setup

Install and start MongoDB, then copy `.env.example` to `.env` and set your connection string:

```env
MONGO_URI=mongodb://127.0.0.1:27017/smart-campus
JWT_SECRET=replace-with-a-long-random-secret
PORT=4000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=smart-campus@example.com
ADMIN_EMAIL=admin@ritrjpm.ac.in
ADMIN_APP_URL=http://localhost:5173
```

Install dependencies and start the API:

```bash
npm install
npm run server
```

The server creates the `smart-campus` database and its collections automatically on first startup, then seeds the default account and initial campus data. Use Swagger at `http://localhost:4000/api/docs` to explore and call the API.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
