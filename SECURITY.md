# Security Documentation

## Overview

HeritageWhisper implements comprehensive security measures to protect user data, prevent common web vulnerabilities, and ensure privacy for sensitive family stories and memories.

## Security Measures Implemented

### 1. Security Headers (Critical)

All HTTP responses include security headers to protect against common attacks:

- **Content-Security-Policy (CSP)**: Prevents XSS attacks by restricting resource loading
- **X-Frame-Options: DENY**: Prevents clickjacking attacks
- **X-Content-Type-Options: nosniff**: Prevents MIME type sniffing
- **Strict-Transport-Security (HSTS)**: Forces HTTPS connections for 1 year
- **X-XSS-Protection**: Legacy XSS protection for older browsers
- **Referrer-Policy**: Controls referrer information leakage
- **Permissions-Policy**: Restricts browser features (camera, geolocation, etc.)

**Configuration**: `next.config.ts` - `headers()` function

### 2. CORS Protection

Cross-Origin Resource Sharing (CORS) is configured to only allow requests from the official HeritageWhisper domain, preventing unauthorized API access from malicious sites.

**Configuration**: `next.config.ts` - API route headers

### 3. Rate Limiting

Multiple layers of rate limiting prevent abuse and DDoS attacks:

- **Authentication endpoints**: 5 attempts per 10 seconds per IP
- **Upload endpoints**: 10 uploads per minute per user
- **API endpoints**: 30 requests per minute per user
- **Tier 3 AI analysis**: 1 request per 5 minutes per user
- **IP-based limits**: 10 requests per hour per IP for AI endpoints
- **Global limits**: 1000 requests per hour system-wide for AI endpoints

**Implementation**: `lib/ratelimit.ts` using Upstash Redis

### 4. Input Sanitization

All user inputs are sanitized before processing:

- **Prompt injection protection**: Detects and neutralizes AI prompt injection attempts
- **Length limits**: Prevents token exhaustion attacks
- **Control character removal**: Strips dangerous characters
- **XML delimiters**: Wraps user content in clear delimiters to prevent context bleeding

**Implementation**: `lib/promptSanitizer.ts`

### 5. Image Processing & Privacy

Uploaded images are processed to protect user privacy:

- **EXIF stripping**: Automatically removes all metadata including GPS location
- **Format conversion**: Standardizes to JPEG/PNG/WebP
- **Size limits**: Enforces reasonable dimensions (max 2400x2400)
- **Validation**: Verifies files are actually images, not malicious files

**Implementation**: `lib/imageProcessor.ts` using Sharp

### 6. Authentication & Authorization

- **JWT tokens**: Secure session management via Supabase Auth
- **Row Level Security (RLS)**: Database-level access control
- **Service role key isolation**: Admin credentials only used server-side
- **Session timeouts**: Automatic logout on inactivity (with "Remember Me" option)

**Implementation**: Supabase Auth + custom hooks in `lib/auth.tsx`

### 7. Privacy-First Logging

- **No PII in logs**: Email addresses, names, and personal data are never logged
- **Hashed identifiers**: Sensitive data is hashed before logging
- **Security event tracking**: Structured logging for audit trails
- **Development-only verbose logging**: Production logs are minimal

**Implementation**: `lib/logger.ts` and `lib/securityLogger.ts`

### 8. File Upload Security

- **MIME type validation**: Ensures files are the correct type
- **Size limits**: 25MB max for audio, reasonable limits for images
- **Virus scanning ready**: Architecture supports ClamAV integration
- **Filename sanitization**: Prevents directory traversal attacks

**Implementation**: API routes in `app/api/upload/`

## Security Best Practices for Developers

### Environment Variables

1. **Never commit secrets**: Use `env.example` as a template
2. **Service role key**: NEVER expose `SUPABASE_SERVICE_ROLE_KEY` on the client
3. **HTTPS in production**: Always use `https://` in `NEXT_PUBLIC_APP_URL`
4. **Rate limiting required**: Production MUST have Upstash Redis configured

### API Development

1. **Always verify authentication**: Check JWT tokens on all protected endpoints
2. **Validate inputs**: Use Zod schemas or manual validation
3. **Use service role sparingly**: Only when you need to bypass RLS
4. **Log security events**: Use `securityLogger` for suspicious activity
5. **Return generic errors**: Don't leak system details in error messages

### Database Access

1. **Enable RLS**: All tables should have Row Level Security enabled
2. **Test policies**: Verify users can only access their own data
3. **Use prepared statements**: Supabase client prevents SQL injection
4. **Audit sensitive operations**: Log data exports, deletions, etc.

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Email**: security@heritagewhisper.com
2. **Response time**: We respond within 48 hours
3. **Do not exploit**: Report vulnerabilities privately before disclosure
4. **Coordinated disclosure**: We'll work with you on timing

**Security.txt**: Available at `/.well-known/security.txt`

## Security Compliance

### Data Protection

- **Encryption in transit**: All data uses HTTPS (TLS 1.3)
- **Encryption at rest**: Supabase provides database encryption
- **Backup encryption**: Automatic encrypted backups
- **Data deletion**: Users can delete all their data anytime

### Privacy

- **No data selling**: We never sell or share user data
- **Minimal data collection**: Only collect what's necessary
- **Location data removed**: GPS coordinates stripped from all uploads
- **User control**: Users control who sees their stories

### Infrastructure

- **Hosted on Vercel**: Enterprise-grade hosting with DDoS protection
- **Supabase backend**: ISO 27001, SOC 2 Type II certified
- **Upstash Redis**: SOC 2 Type II certified
- **OpenAI API**: SOC 2 Type II certified

## Security Testing

### Recommended Tools

1. **OWASP ZAP**: Dynamic security testing
2. **Snyk**: Dependency vulnerability scanning
3. **npm audit**: Built-in vulnerability checking
4. **SecurityHeaders.com**: Validate HTTP headers
5. **Lighthouse**: Security audit in Chrome DevTools

### Testing Commands

```bash
# Check for vulnerable dependencies
npm audit --audit-level=moderate

# Run security-focused tests
npm run test:security

# Check environment configuration
npm run verify:env
```

## Security Roadmap

### Completed ✅

- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Rate limiting on all critical endpoints
- Input sanitization for AI prompts
- EXIF stripping for image uploads
- PII removal from logs
- Security logging infrastructure
- CORS configuration
- Environment variable documentation

### In Progress 🚧

- Middleware for route protection
- Zod validation on all API endpoints
- Session fingerprinting
- Account lockout after failed attempts

### Planned 📋

- Virus scanning for file uploads (ClamAV integration)
- Advanced threat detection
- Automated security testing in CI/CD
- Penetration testing (annual)
- Bug bounty program

## Security Contacts

- **Security Issues**: security@heritagewhisper.com
- **Privacy Questions**: privacy@heritagewhisper.com
- **General Support**: support@heritagewhisper.com

## Last Updated

October 17, 2025

## Version

Security Documentation v1.0

