# WellFed Chef Portal

A login-only web application for chefs to enter recipes which will be sent to the WellFed database. This portal allows chefs to create, edit, and manage recipes that will be used in the partner app.

## Features

- Firebase Authentication for secure login
- Recipe management (create, read, update, delete)
- Detailed recipe form with ingredients, steps, and additional information
- Protected routes that require authentication

## Tech Stack

- Next.js 15.3.3
- React 19
- Firebase (Authentication and Firestore)
- TypeScript
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project

### Setup

1. Clone the repository

```bash
git clone <repository-url>
cd wellfed-crm-chef
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Run the development server

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser

## Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Add your first chef user in the Firebase Authentication console
5. Copy your Firebase configuration to the `.env.local` file

## Project Structure

- `/app` - Next.js app directory
  - `/context` - React context providers
  - `/dashboard` - Dashboard page for authenticated users
  - `/firebase` - Firebase configuration
  - `/login` - Login page
  - `/recipes` - Recipe management pages
    - `/[id]` - Edit recipe page
    - `/new` - Create new recipe page
  - `layout.tsx` - Root layout with AuthProvider
  - `page.tsx` - Root page that redirects to login
- `/middleware.ts` - Next.js middleware for route protection

## License

This project is proprietary and confidential.
