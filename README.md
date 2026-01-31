# AI Content Repurposing Tool

SaaS инструмент для автоматической переработки контента в форматы для разных платформ с помощью AI.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Prisma ORM)
- **Authentication:** NextAuth.js
- **AI:** OpenAI API (GPT-4 Turbo, GPT-3.5 Turbo)
- **Hosting:** Railway
- **Package Manager:** pnpm

## Features

- 🔄 Repurpose one piece of content into multiple formats
- 📱 Support for LinkedIn, Twitter/X, Email
- ✏️ Rich text editor for manual refinement
- 🎨 Brand voice preservation
- 📊 Project history and management

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
DATABASE_URL="your_postgresql_database_url"
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="your_openai_api_key"
```

## Project Structure

```
content-repurposing-tool/
├── app/              # Next.js App Router
├── components/       # React components
├── docs/             # Documentation
├── lib/              # Utilities and configurations
├── prisma/           # Database schema
├── types/            # TypeScript types
├── public/           # Static assets
├── __tests__/        # Test files
└── middleware.ts     # Next.js middleware
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Deployment

See [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) for detailed instructions on deploying to production.

## Contributing

This project is part of a structured development plan with multiple stages. See the STAGES directory for the roadmap.

## License

[To be determined]

---

*Project Status: Stage 5 - Polish & Launch*
