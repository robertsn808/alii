# Security Policy

## Supported Versions

We actively support security updates for the following versions:

| Component | Version | Supported          |
| --------- | ------- | ------------------ |
| Frontend  | Latest  | :white_check_mark: |
| Backend   | Latest  | :white_check_mark: |
| Error Monitor | Latest | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please send an email to: **security@aliifishmarket.com**

Include the following information:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

## Security Measures

### Automated Security Scanning
- **Dependabot**: Automatically monitors dependencies for known vulnerabilities
- **CodeQL**: Static analysis for code vulnerabilities
- **TruffleHog**: Secret scanning to prevent credential leaks
- **npm audit**: Regular npm dependency vulnerability scans
- **OWASP Dependency Check**: Maven dependency vulnerability scanning

### Current Security Status
✅ All Dependabot alerts resolved (9/9 fixed)
✅ No open security vulnerabilities
✅ Regular security scans enabled
✅ Automated dependency updates configured

### Dependency Security
- All Next.js vulnerabilities patched (versions 13-15)
- Apache POI OOXML vulnerability fixed (CVE-2025-31672)
- Critical authorization bypass issues resolved (CVE-2025-29927)
- SSRF and cache poisoning vulnerabilities patched

### Security Best Practices
- Dependencies are regularly updated via Dependabot
- Security patches are applied immediately
- Code scanning runs on all pull requests
- Secret scanning prevents credential exposure
- Regular security audits performed

## Response Timeline

- **Critical vulnerabilities**: 24-48 hours
- **High severity**: 3-7 days  
- **Medium severity**: 1-2 weeks
- **Low severity**: 1 month

## Security Features

### Frontend Security
- Content Security Policy (CSP) headers
- XSS protection via React's built-in sanitization
- Secure authentication implementation
- HTTPS enforcement

### Backend Security
- Spring Security configuration
- Input validation and sanitization
- SQL injection prevention via JPA
- Rate limiting and CORS configuration
- Secure session management

### Infrastructure Security
- Docker security best practices
- Environment variable security
- Database connection encryption
- API authentication and authorization

## Contact

For security concerns, please contact:
- **Email**: security@aliifishmarket.com
- **Repository Owner**: @robertsn808

We appreciate your help in keeping the Alii Fish Market system secure!