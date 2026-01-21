# Timora Frontend

Angular 19 frontend application with Angular Material and Tailwind CSS, Firebase authentication, and dark/light mode support.

## Requirements

- **Node.js**: >= 20.11.1
- **npm**: >= 10.0.0

## Installation & Setup

```bash
cd frontend
npm install
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server at localhost:4200 |
| `npm run build` | Build for production |
| `npm run build:azure` | Build for Azure deployment |
| `npm run watch` | Watch mode for development |
| `npm run test` | Run unit tests (Jasmine/Karma) |
| `npm run lint` | Run ESLint |
| `npm run e2e` | Open Cypress test runner |
| `npm run serve:ssr:frontend` | Serve with SSR |

## Project Structure

```
src/
├── app/
│   ├── pages/          # Dashboard, announcements, calendar, documents, etc.
│   ├── services/       # API, auth, logger, sidebar services
│   ├── guards/         # Auth route guards
│   ├── interceptors/   # HTTP auth interceptor
│   ├── models/         # TypeScript interfaces
│   ├── layout/         # Sidebar & topbar components
│   └── app.routes.ts   # Route configuration
├── assets/             # Images, fonts
├── environments/       # Dev & production config
└── styles.css         # Global styles with Tailwind
```

## Technologies

- **Angular 19** - Frontend framework
- **TypeScript 5.7** - Programming language
- **Tailwind CSS 4** - Utility-first styling
- **Angular Material** - UI components
- **Firebase 12** - Authentication & database
- **Cypress** - E2E testing
- **Postman** - API testing
- **Angular SSR** - Server-side rendering

## Features

- ✅ User authentication via FireBase (Login/Register) with working API calls
- ✅ Admin panel for managing vacations and users, accepting users to the companies
- ✅ Calendar for vacations requests
- ✅ Announcements page 
- ✅ Documents 

- ✅ Dark/Light mode
- ✅ Responsive design
- ✅ E2E & unit tests

## Development

```bash
npm start
# Dev server runs on http://localhost:4200
```

### Build for Production

```bash
npm run build
# Output: dist/frontend
```

### Testing

```bash

npx cypress open  # Cypress open
npm run e2e       # E2E tests
```

## Related

- **Backend**: [Timora BE](https://github.com/kollarm226/timora)
- **Main FrontEnd Repo**: [timoraFE](https://github.com/kollarm226/timoraFE)
