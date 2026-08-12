# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability within RoomX, please send an email to the project maintainers. All security vulnerabilities will be promptly addressed.

**Please do not report security vulnerabilities through public GitHub issues.**

### What to include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if available)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Deployment**: Depends on severity, typically within 2 weeks
- **Disclosure**: After the fix is deployed

## Security Measures

### Authentication

- JWT-based authentication with short-lived tokens
- Secure token refresh mechanism
- HTTP-only cookies for session management
- CSRF protection on all state-changing operations

### Data Protection

- All data encrypted in transit (TLS 1.3)
- Supabase Row Level Security (RLS) enabled on all tables
- No sensitive data stored in client-side storage
- Regular dependency audits

### API Security

- Rate limiting on all endpoints
- Input validation and sanitization
- CORS properly configured
- Request size limits enforced

### Real-time Security

- Socket.IO authentication required
- Room access validation on connection
- Message rate limiting
- Sanitization of real-time messages

### File Storage

- File type validation before upload
- File size limits enforced
- Signed URLs for temporary access
- Regular cleanup of orphaned files

## Best Practices for Contributors

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Both client and server side
3. **Use parameterized queries** - Prevent SQL injection
4. **Sanitize user output** - Prevent XSS attacks
5. **Follow principle of least privilege** - Minimal required permissions
6. **Keep dependencies updated** - Regular security patches
7. **Use HTTPS everywhere** - No mixed content

## Dependencies

We regularly audit dependencies using:
- `pnpm audit` for known vulnerabilities
- GitHub Dependabot for automated updates
- Manual review of critical dependencies

## Contact

For security-related inquiries, please contact the maintainers directly via email.
