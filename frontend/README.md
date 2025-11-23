# Melody Frontend

Beautiful e-commerce frontend for Melody beauty products built with React, TypeScript, and Tailwind CSS.

## Features

- 🎨 Beautiful, modern UI designed for beauty products
- 🔐 Authentication with JWT tokens
- 👑 Admin dashboard (admin-only access)
- 🛍️ Product browsing and search
- 📱 Responsive design
- ⚡ Fast with Vite

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL:
```
VITE_API_URL=http://localhost:8000/api/v1
```

4. Start development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/     # Reusable components
├── contexts/       # React contexts (Auth, etc.)
├── lib/            # Utilities and API client
├── pages/          # Page components
│   └── admin/      # Admin pages
├── types/          # TypeScript types
└── App.tsx         # Main app component
```

## Admin Access

Only users with `role: "admin"` can access `/admin` routes. The `ProtectedRoute` component handles this automatically.
