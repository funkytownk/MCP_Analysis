# Security Documentation

## Overview

The Gold IRA MCP Analysis Server implements comprehensive security measures to protect sensitive sales call transcripts and analysis data. This document outlines security features, best practices, and implementation details.

## Security Architecture

### Multi-Layer Security Approach

1. **Input Validation & Sanitization**
   - Zod schema validation for all inputs
   - Text sanitization to prevent injection attacks
   - Business rule validation for data consistency
   - File type and size restrictions

2. **Rate Limiting & DoS Protection**
   - General API rate limiting: 100 requests/15 minutes per IP
   - Analysis rate limiting: 5 requests/minute per IP
   - Session-based analysis limits: 10 analyses per session
   - Automatic IP blocking for abuse

3. **Session Management**
   - Secure session ID generation using crypto.randomBytes
   - 30-minute session timeout
   - Session state tracking and cleanup
   - Analysis count limits per session

4. **HTTP Security Headers**
   - Helmet.js integration for security headers
   - Content Security Policy (CSP)
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Strict-Transport-Security (HSTS)

5. **Security Logging & Monitoring**
   - All security events logged with timestamps
   - Rate limit violations tracking
   - Invalid input attempt logging
   - Session violation monitoring

## Security Features

### Input Sanitization

```typescript
// Automatic HTML/script tag removal
const cleanText = text
  .replace(/<script[^>]*>.*?<\/script>/gi, '')
  .replace(/<[^>]*>/g, '')
  .replace(/javascript:/gi, '')
  .replace(/on\w+\s*=/gi, '');
```

### Rate Limiting Configuration

```typescript
// General rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests from this IP'
});

// Analysis-specific limiting
const analysisRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // analyses per minute
  message: 'Analysis rate limit exceeded'
});
```

### Session Security

```typescript
class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_ANALYSES_PER_SESSION = 10;
  
  static createSession(): string {
    return randomBytes(32).toString('hex'); // 256-bit secure ID
  }
}
```

## Threat Model

### Identified Threats

1. **Injection Attacks**
   - **Mitigation**: Input sanitization, Zod validation
   - **Risk Level**: Low (comprehensive input cleaning)

2. **Denial of Service (DoS)**
   - **Mitigation**: Rate limiting, session limits, timeout controls
   - **Risk Level**: Low (multiple protection layers)

3. **Data Extraction**
   - **Mitigation**: Session management, secure logging
   - **Risk Level**: Medium (sensitive transcript data)

4. **Cross-Site Scripting (XSS)**
   - **Mitigation**: CSP headers, input sanitization
   - **Risk Level**: Low (server-side processing only)

5. **Man-in-the-Middle**
   - **Mitigation**: HSTS headers, secure transport
   - **Risk Level**: Medium (depends on deployment)

### Risk Assessment Matrix

| Threat | Impact | Probability | Risk Level | Mitigation Status |
|--------|---------|-------------|------------|------------------|
| SQL Injection | High | Very Low | Low | ✅ No database queries |
| XSS | Medium | Very Low | Low | ✅ CSP + Sanitization |
| DoS | High | Low | Medium | ✅ Rate limiting |
| Data Breach | Very High | Low | High | ✅ Session management |
| CSRF | Medium | Very Low | Low | ✅ No state-changing GET |

## Security Configuration

### Environment Variables

```bash
# Security Settings
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_MINUTE=100
ANALYSIS_REQUESTS_PER_MINUTE=5
SESSION_TIMEOUT_MINUTES=30
MAX_ANALYSES_PER_SESSION=10

# Validation Limits
MAX_TRANSCRIPT_LENGTH=100000
MAX_FILENAME_LENGTH=255
ALLOWED_FILE_EXTENSIONS=.txt,.pdf,.docx

# Security Headers
ENABLE_HELMET=true
ENABLE_CSP=true
HSTS_MAX_AGE=31536000
```

### Production Deployment Security

1. **HTTPS Only**
   ```bash
   # Require HTTPS in production
   NODE_ENV=production
   FORCE_HTTPS=true
   ```

2. **Enhanced Headers**
   ```javascript
   helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'none'"],
         objectSrc: ["'none'"]
       }
     },
     hsts: {
       maxAge: 31536000,
       includeSubDomains: true,
       preload: true
     }
   })
   ```

3. **Monitoring Integration**
   ```bash
   # Enable comprehensive monitoring
   ENABLE_MONITORING=true
   LOG_PERFORMANCE_METRICS=true
   ENABLE_SECURITY_LOGGING=true
   ```

## Security Best Practices

### For Developers

1. **Input Validation**
   - Always validate input with Zod schemas
   - Sanitize text content before processing
   - Implement business rule validation
   - Check file types and sizes

2. **Error Handling**
   - Never expose internal errors to clients
   - Log security events for monitoring
   - Implement graceful degradation
   - Return consistent error formats

3. **Session Management**
   - Generate cryptographically secure session IDs
   - Implement session timeouts
   - Clean up expired sessions
   - Track session activity

### For Operators

1. **Deployment Security**
   - Use HTTPS in production
   - Configure reverse proxy with security headers
   - Implement network-level rate limiting
   - Monitor security logs regularly

2. **Monitoring & Alerting**
   - Set up alerts for rate limit violations
   - Monitor unusual analysis patterns
   - Track session abuse attempts
   - Log security events centrally

3. **Incident Response**
   - Have procedures for security incidents
   - Implement IP blocking for abuse
   - Monitor for data exfiltration attempts
   - Maintain security event logs

## Compliance Considerations

### Data Protection

- **PII Handling**: Sales transcripts may contain personal information
- **Data Retention**: Implement data retention policies
- **Access Controls**: Limit access to authorized personnel
- **Audit Trails**: Maintain comprehensive access logs

### Industry Standards

- **SOC 2**: Consider SOC 2 compliance for enterprise customers
- **GDPR**: Implement data subject rights if handling EU data
- **CCPA**: California privacy compliance if applicable
- **PCI DSS**: If handling financial information

## Security Testing

### Automated Testing

```bash
# Run security tests
npm run test:security

# Vulnerability scanning
npm audit
npm audit fix
```

### Manual Testing

1. **Input Validation Testing**
   - Test XSS payloads in transcript text
   - Verify file upload restrictions
   - Test SQL injection attempts
   - Check for path traversal vulnerabilities

2. **Rate Limiting Testing**
   - Verify rate limits trigger correctly
   - Test different IP addresses
   - Check session limit enforcement
   - Validate timeout behavior

3. **Session Security Testing**
   - Test session ID predictability
   - Verify timeout enforcement
   - Check session cleanup
   - Test concurrent session limits

## Security Updates

### Regular Maintenance

- Update dependencies monthly
- Monitor security advisories
- Apply security patches promptly
- Review and update threat model quarterly

### Version Control

- All security changes require review
- Document security decisions
- Maintain changelog for security updates
- Tag security-related commits

## Contact

For security concerns or reporting vulnerabilities:
- **Internal**: Security team via internal channels
- **External**: security@company.com
- **Emergency**: Follow incident response procedures

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Reviewed By**: Security Team