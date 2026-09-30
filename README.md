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

Authentication uses `POST /api/auth/login` or `POST /api/auth/register` and returns a JWT. Send it on protected requests as `Authorization: Bearer <token>`. The `/api/dashboard` response contains `resources`, `bookings`, `notifications`, and `summary` fields matching the current dashboard state. Runtime data is stored in MongoDB.

## MongoDB setup

Install and start MongoDB, then copy `.env.example` to `.env` and set your connection string:

```env
MONGO_URI=mongodb://127.0.0.1:27017/smart-campus
JWT_SECRET=replace-with-a-long-random-secret
PORT=4000
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
