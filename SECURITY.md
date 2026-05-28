# Security Policy

## 🎬 About ReelMark

ReelMark is a privacy-first media tracking application built with **Next.js**, **TypeScript**, **Supabase**, and **React**. We help users organize their cinematic life with comprehensive episode tracking, social features, and playlists. Security and user privacy are core to our mission.

---

## Supported Versions

Security updates and patches are provided for the following versions:

| Version | Supported          | Notes                                 |
| ------- | ------------------ | ------------------------------------- |
| 1.x     | :white_check_mark: | Current version — actively maintained |
| 0.x     | :x:                | Pre-release — no longer supported     |

---

## Security Features

ReelMark implements several security measures to protect user data:

- **Supabase Row-Level Security (RLS)**: All database queries respect per-user privacy policies
- **Authentication**: Secure authentication via Supabase Auth with modern session handling
- **Privacy Controls**: Granular per-section visibility (public, friends-only, private)
- **HTTPS**: All communications encrypted in transit
- **Environment Secrets**: Sensitive credentials stored securely and never exposed to the client
- **SQL Migrations**: Versioned schema changes with integrity validation

---

## Reporting a Vulnerability

**If you discover a security vulnerability in ReelMark, please report it responsibly.**

### How to Report

1. **Do NOT create a public GitHub issue** for the vulnerability
2. **Email the maintainer** at your earliest convenience with:
   - A clear description of the vulnerability
   - Steps to reproduce (if applicable)
   - Potential impact
   - Your contact information

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix & Patch**: Timeframe depends on severity; critical issues prioritized
- **Disclosure**: Coordinated disclosure after patch release

### What to Expect

- **If accepted**: You'll be credited in the release notes and security advisory
- **If declined**: We'll explain our reasoning and may suggest alternatives
- **Updates**: Regular status updates on your reported issue

### Supported Channels

For now, please reach out through the GitHub repository or contact the maintainer directly. A formal security contact will be established soon.

---

## Dependency Management

ReelMark uses the following key dependencies (see `package.json` for complete list):

| Package      | Version | Purpose         |
| ------------ | ------- | --------------- |
| Next.js      | 16.2.6  | React framework |
| TypeScript   | 5.9     | Type safety     |
| Supabase     | Latest  | Auth & database |
| React        | 19      | UI library      |
| Tailwind CSS | 4       | Styling         |

**Dependency Scanning**: We use Dependabot to monitor and alert on security vulnerabilities in dependencies. All critical and high-severity alerts are addressed promptly.

---

## Security Best Practices for Developers

If you're contributing to ReelMark:

1. **Never commit secrets**: Use `.env.local` for local development
2. **Validate inputs**: Sanitize user input on both client and server
3. **Use HTTPS**: Always use encrypted connections
4. **Review RLS policies**: Ensure Supabase RLS policies are correctly applied
5. **Test privacy controls**: Verify that visibility settings work as expected
6. **Keep dependencies updated**: Run `pnpm update` regularly and review changes
7. **Use TypeScript**: Leverage type safety to catch bugs early

---

## Review Content Policy

Reviews are stored and rendered as **plain text only**. No HTML, Markdown, or rich-text rendering is performed. Content is sanitized server-side via `validateReviewContent` (`lib/validators.ts`) before persistence: control characters stripped, length capped, whitespace trimmed. React's default JSX escaping prevents XSS at the render layer. No HTML sanitization library (DOMPurify, sanitize-html) is required as long as this policy holds — any future HTML/Markdown rendering must add a sanitization step.

---

## Sensitive Data

ReelMark handles the following sensitive information:

- **User authentication credentials**: Managed exclusively by Supabase Auth
- **Watch history**: Subject to user privacy controls
- **Reviews & ratings**: Protected by user-defined visibility settings
- **Friend relationships**: Private and only visible to connected users

All sensitive data is stored in PostgreSQL with Row-Level Security enforced at the database layer.

---

## Compliance

- **Data Privacy**: Compliant with user privacy preferences and visibility controls
- **Third-party APIs**: TMDB and Watchmode APIs used for read-only media data
- **GDPR**: User data can be exported or deleted through account settings

---

## Security Incident Response

In case of a confirmed security incident:

1. We will immediately assess the scope and severity
2. Affected users will be notified promptly
3. A security patch will be released and documented
4. A post-incident report will be published

---

## Questions or Concerns?

If you have general security questions about ReelMark, feel free to:

- Open a discussion in the GitHub repository
- Review our source code for transparency
- Check the [project README](./README.md) for architecture details

---

**Last Updated**: 2026-05-26
**Maintainer**: [SAWKIT](https://github.com/TheSawkit)
