# CertifyHub Project Directory Structure

This document explains the structure and purpose of each folder and file in the CertifyHub project.

## Root Directory
- `README.md` — Project overview and setup instructions.
- `client/` — Frontend React application (user interface).
- `server/` — Backend Node.js/Express API (business logic, database, authentication).

---

## client/
Frontend code for the web application.

- `index.html` — Main HTML file loaded by the browser.
- `package.json` — Frontend dependencies and scripts.
- `assets/` — Static assets (images, logos, etc.).
- `css/` — Global and shared CSS files.
- `js/` — (If present) Vanilla JS files (for non-React usage or legacy code).
- `pages/` — React page components (e.g., Home, Courses, Login, Register, Profile, etc.).
- `components/` — Reusable React components (e.g., Header, Footer, Layout).
- `styles.css` — Main global stylesheet for the React app.

---

## server/
Backend code for the API and business logic.

- `package.json` — Backend dependencies and scripts.
- `src/` — All backend source code.
  - `index.js` — Entry point for the Express server.
  - `config/` — Configuration files (e.g., database connection).
  - `controllers/` — Route handler logic for authentication, courses, payments, users, etc.
  - `middleware/` — Express middleware (e.g., authentication checks).
  - `models/` — Mongoose models for MongoDB collections (Course, User, Review).
  - `routes/` — Express route definitions for API endpoints.
  - `utils/` — Utility functions (e.g., PDF generation).

---

## How to Use
- Run the backend: `cd server && npm install && npm start`
- Run the frontend: `cd client && npm install && npm start`

---

## Notes
- The frontend and backend are decoupled and communicate via HTTP API calls.
- All sensitive data (like database credentials) should be stored in environment variables (see `.env` in `server/`).
- For more details, see the main `README.md`.
