# Angular Auth App

A modern, mobile-friendly web application built with Angular and Supabase featuring user authentication, internationalization, and clean architecture.

## Features

- **User Authentication**: Login and registration with Supabase
- **Multi-language Support**: German and English localization
- **Mobile-Friendly Design**: Responsive UI with Tailwind CSS
- **Modern Architecture**: Clean code structure with services and guards
- **Settings Management**: User profile and language switching
- **Secure Routes**: Protected pages with authentication guards

## Tech Stack

- **Frontend**: Angular 20+ with standalone components
- **Backend**: Supabase (Authentication & Database)
- **Styling**: Tailwind CSS
- **Internationalization**: Custom i18n service
- **TypeScript**: Full type safety

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/
│   │   └── settings/
│   ├── services/
│   │   ├── supabase.service.ts
│   │   └── i18n.service.ts
│   ├── guards/
│   │   └── auth.guard.ts
│   └── app.routes.ts
├── environments/
├── locale/
│   ├── messages.en.json
│   └── messages.de.json
└── styles.css
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Angular CLI

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   ng serve
   ```

4. Navigate to `http://localhost:4200/`

### Environment Setup

The Supabase configuration is already set up in the environment files:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

## Usage

### Authentication

- **Register**: Create a new account with username, email, and password
- **Login**: Sign in with email and password
- **Logout**: Sign out from the settings page

### Language Switching

Switch between German and English in the settings page. The selected language is persisted in localStorage.

### Navigation

- **Dashboard**: Main landing page after login
- **Settings**: User profile and preferences

## Development

### Running Tests

```bash
ng test
```

### Building for Production

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
