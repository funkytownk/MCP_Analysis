import { createHash, randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const analysisRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit analysis requests to 5 per minute per IP
  message: 'Analysis rate limit exceeded. Please wait before submitting another transcript.',
  standardHeaders: true,
  legacyHeaders: false,
});

export class InputSanitizer {
  private static readonly MAX_TEXT_LENGTH = 100000; // 100KB max transcript
  private static readonly MAX_FILENAME_LENGTH = 255;
  private static readonly ALLOWED_FILE_EXTENSIONS = ['.txt', '.pdf', '.docx'];
  
  static sanitizeTranscriptText(text: string): string {
    if (typeof text !== 'string') {
      throw new Error('Transcript text must be a string');
    }
    
    if (text.length > this.MAX_TEXT_LENGTH) {
      throw new Error(`Transcript too long. Maximum ${this.MAX_TEXT_LENGTH} characters allowed`);
    }
    
    // Remove potential script injections
    const cleaned = text
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '') // Strip HTML tags
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
    
    if (cleaned.length === 0) {
      throw new Error('Transcript cannot be empty after sanitization');
    }
    
    return cleaned;
  }
  
  static validateFilename(filename: string): boolean {
    if (typeof filename !== 'string' || filename.length === 0) {
      return false;
    }
    
    if (filename.length > this.MAX_FILENAME_LENGTH) {
      return false;
    }
    
    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return false;
    }
    
    // Check file extension
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return this.ALLOWED_FILE_EXTENSIONS.includes(ext);
  }
  
  static sanitizeMetadata(metadata: any): any {
    const schema = z.object({
      callDate: z.string().optional(),
      duration: z.number().min(0).max(7200).optional(), // Max 2 hours
      agentName: z.string().max(100).optional(),
      customerAge: z.number().min(18).max(120).optional(),
      retirementStatus: z.enum(['pre-retirement', 'recently-retired', 'retired']).optional(),
      accountTypes: z.array(z.enum(['ira', '401k', '403b', 'roth-ira', 'cash', 'brokerage'])).optional(),
      investmentExperience: z.enum(['novice', 'intermediate', 'experienced']).optional(),
      familyMembers: z.number().min(1).max(20).optional(),
    });
    
    try {
      return schema.parse(metadata);
    } catch (error) {
      throw new Error(`Invalid metadata: ${error.message}`);
    }
  }
}

export class SessionManager {
  private static sessions = new Map<string, {
    id: string;
    created: Date;
    lastAccess: Date;
    analysisCount: number;
  }>();
  
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_ANALYSES_PER_SESSION = 10;
  
  static createSession(): string {
    const sessionId = this.generateSecureId();
    this.sessions.set(sessionId, {
      id: sessionId,
      created: new Date(),
      lastAccess: new Date(),
      analysisCount: 0
    });
    
    // Clean up expired sessions
    this.cleanupExpiredSessions();
    
    return sessionId;
  }
  
  static validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    const now = new Date();
    const timeSinceLastAccess = now.getTime() - session.lastAccess.getTime();
    
    if (timeSinceLastAccess > this.SESSION_TIMEOUT) {
      this.sessions.delete(sessionId);
      return false;
    }
    
    session.lastAccess = now;
    return true;
  }
  
  static incrementAnalysisCount(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    if (session.analysisCount >= this.MAX_ANALYSES_PER_SESSION) {
      return false;
    }
    
    session.analysisCount++;
    return true;
  }
  
  private static generateSecureId(): string {
    return randomBytes(32).toString('hex');
  }
  
  private static cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      const timeSinceLastAccess = now.getTime() - session.lastAccess.getTime();
      if (timeSinceLastAccess > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

export class SecurityLogger {
  static logSecurityEvent(event: {
    type: 'rate_limit' | 'invalid_input' | 'session_violation' | 'analysis_attempt';
    ip?: string;
    sessionId?: string;
    details?: any;
  }): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      ...event,
      hash: this.generateEventHash(event)
    };
    
    // In production, send to proper logging service
    console.warn('[SECURITY]', JSON.stringify(logEntry));
  }
  
  private static generateEventHash(event: any): string {
    return createHash('sha256')
      .update(JSON.stringify(event) + Date.now())
      .digest('hex')
      .substring(0, 16);
  }
}