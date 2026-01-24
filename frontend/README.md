# Frontend - MemoOn Card

Frontend application built with Next.js 16, TypeScript, and Tailwind CSS.

## Setup

```bash
# Install dependencies
yarn install

# Run development server
yarn dev
```

The application will be available at http://localhost:3002 (standalone) or via Portfolio integration

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and API client
│   └── types/            # TypeScript type definitions
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Environment Variables

See root `.env` for required environment variables.

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:4002)

## Development

The frontend is set up with:
- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Axios** for API calls

## Next Steps

1. Create authentication pages (login/register)
2. Build deck management interface
3. Create card review interface
4. Add statistics dashboard
