# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in HelixCast, please report it responsibly.

**Do not** open a public GitHub issue for security-sensitive findings.

**Preferred:** Email the maintainers with a description of the issue, steps to reproduce, and any impact assessment. You can find contact details in the project README or repository description.

**What to include:**

- Type of issue (e.g. authentication bypass, XSS, data exposure)
- Affected component or route
- Steps to reproduce
- Possible impact (e.g. data breach, privilege escalation)
- Suggested fix (if any)

**What to expect:**

- We will acknowledge your report and aim to respond within a reasonable time (e.g. within 7 days).
- We will work on a fix and keep you updated where appropriate.
- We may credit you in release notes or a security advisory after the issue is resolved (with your permission).

We appreciate the security research community’s efforts to keep our users safe.

## Security Practices in This Project

- **Authentication:** NextAuth.js with secure session handling; credentials hashed with bcrypt.
- **API:** Auth required for project/output/generate endpoints; rate limiting and input validation in place.
- **Database:** Prisma ORM to reduce SQL injection risk; parameterized queries.
- **Headers:** Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.) configured in Next.js.
- **Secrets:** No API keys or secrets in the repository; use environment variables and secure production secrets.

If you have suggestions to improve security, we welcome pull requests or discussions (for non-sensitive topics) via issues.
