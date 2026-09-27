# Responsive Image Tool

Internal responsive-image preparation tool for The Tech Makers.

## Purpose

Upload images, generate responsive variants, convert formats, compress output, and generate production-ready `<img>` / `<picture>` markup.

## Stack

- React
- Vite
- Tailwind CSS
- Node.js 20
- Native Node `http`
- Sharp
- Busboy

## Development

```bash
npm install
npm run dev
```

The Vite development server provides the frontend and proxies `/api` requests to the Node server.

For a production build:

```bash
npm run build
npm start
```

## Project Documentation

The project source of truth is in `docs/`:

- `docs/Overview.md`
- `docs/Rules.md`
- `docs/Design.md`
- `docs/Tasks.md`
- `docs/Tests.md`
- `docs/Completed.md`

## Deployment

The application is designed for Node.js 20 hosting, including supported cPanel Node.js environments.

The production startup entry is `app.js`. Run `npm run build` before starting production so the native Node server can serve the Vite output from `dist/`.

ZIP downloads currently use the host system's `zip` command. Verify that the cPanel server provides `zip` before enabling the Download ZIP feature in production.

## Scope

V1 is intentionally internal and does not include authentication, a database, project presets, AI features, or cloud storage.
