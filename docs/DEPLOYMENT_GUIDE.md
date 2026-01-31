# Deployment Guide

This guide explains how to deploy the AI Content Repurposing Tool to production.

## Prerequisites

- Access to a hosting platform (Railway, Vercel, AWS, etc.)
- PostgreSQL database instance
- OpenAI API key
- Domain name (optional)

## Environment Variables

Before deploying, ensure the following environment variables are set:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database_name

# Authentication
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=https://yourdomain.com

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Node environment
NODE_ENV=production

# Logging
LOG_LEVEL=info

# Sentry (optional)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_public_sentry_dsn
```

## Deployment Steps

### 1. Database Setup

First, run the database migrations:

```bash
npx prisma migrate deploy
```

### 2. Build the Application

```bash
npm run build
```

### 3. Deploy to Production

#### Railway Deployment

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Link your project: `railway link`
4. Deploy: `railway up`

#### Vercel Deployment

1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

#### Manual Deployment

1. Build the app: `npm run build`
2. Set environment variables
3. Start the server: `npm start`

## Post-Deployment Checklist

- [ ] Verify the application loads correctly
- [ ] Test user registration and login
- [ ] Test content generation functionality
- [ ] Verify database connections work
- [ ] Check that environment variables are properly set
- [ ] Verify SSL certificate is active
- [ ] Test error logging and monitoring
- [ ] Verify rate limiting works
- [ ] Check that emails (if implemented) are sent correctly

## Monitoring and Maintenance

### Logs

Application logs can be accessed through your hosting platform's dashboard.

### Error Tracking

Errors are logged to the console and sent to external services if configured.

### Performance Monitoring

Performance metrics are collected and can be viewed in the monitoring dashboard.

## Rollback Procedure

If issues arise after deployment:

1. Identify the problematic release
2. Use your hosting platform's rollback feature to revert to the previous version
3. Investigate the issue in a staging environment
4. Deploy the fix once resolved

## Scaling Guidelines

- Monitor database connection pool usage
- Watch application memory and CPU usage
- Consider horizontal scaling during high traffic periods
- Monitor API rate limits (especially OpenAI)

## Security Considerations

- Regularly rotate API keys
- Monitor for suspicious activities
- Keep dependencies updated
- Enable 2FA for admin access if available