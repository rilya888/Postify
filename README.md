# HelixCast 🧬

> From one source, infinite reach

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)

HelixCast is an AI-powered content repurposing tool that transforms your source content into platform-perfect posts for LinkedIn, Twitter, and Email.

## 🧬 The HelixCast Philosophy

Just like DNA contains the blueprint for life, your content contains the blueprint for engagement. HelixCast decodes your content's DNA and casts it across platforms, preserving its essence while adapting to each platform's unique requirements.

## ✨ Features

- 🤖 **AI-Powered Generation** - Advanced GPT-4 transforms your content intelligently
- ⚡ **Lightning Fast** - Generate content for 3 platforms in seconds
- 🎨 **Built-in Editor** - Refine and customize every piece of content
- 📊 **Project Management** - Organize and track all your content projects
- 🔐 **Secure** - Enterprise-grade security with NextAuth.js
- 📱 **Responsive** - Works perfectly on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/helixcast.git
cd helixcast
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
```

4. Run database migrations:

```bash
npx prisma migrate deploy
```

5. Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Prisma ORM)
- **Authentication:** NextAuth.js
- **AI:** OpenAI API (GPT-4 Turbo)
- **Editor:** TipTap
- **Hosting:** Railway / Vercel

## 📖 Documentation

- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [API Documentation](./docs/API.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🗺️ Roadmap

- [x] **Stage 1:** Setup & Infrastructure
- [x] **Stage 2:** Dashboard & Projects
- [x] **Stage 3:** AI Integration
- [x] **Stage 4:** Editor & Preview
- [x] **Stage 5:** Polish & Launch
- [ ] **Stage 6:** Templates & Scheduling
- [ ] **Stage 7:** Analytics Dashboard
- [ ] **Stage 8:** Team Collaboration

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for the amazing GPT-4 API
- Vercel for Next.js
- All our contributors and users

---

**Built with ❤️ by the HelixCast Team**

[Website](https://helixcast.io) • [Twitter](https://twitter.com/helixcast) • [Documentation](https://docs.helixcast.io)

## Social / OG Images

For Open Graph and Twitter cards, export `public/og-image.svg` and `public/twitter-image.svg` to PNG (1200×630 and 1200×675) and save as `public/og-image.png` and `public/twitter-image.png`. Add `public/apple-touch-icon.png` (180×180) for iOS home screen.
