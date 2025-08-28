import { z } from 'zod';
import { InputSanitizer, SecurityLogger } from './security.js';

// Enhanced Zod schemas with security validation
export const TranscriptAnalysisRequestSchema = z.object({
  transcript: z.string()
    .min(100, 'Transcript must be at least 100 characters')
    .max(100000, 'Transcript cannot exceed 100,000 characters')
    .transform(InputSanitizer.sanitizeTranscriptText),
  
  filename: z.string()
    .optional()
    .refine((filename) => !filename || InputSanitizer.validateFilename(filename), {
      message: 'Invalid filename format or extension'
    }),
  
  metadata: z.object({
    callDate: z.string().datetime().optional(),
    duration: z.number().min(60).max(7200).optional(), // 1 minute to 2 hours
    agentName: z.string().min(1).max(100).optional(),
    customerAge: z.number().min(18).max(120).optional(),
    retirementStatus: z.enum(['pre-retirement', 'recently-retired', 'retired']).optional(),
    accountTypes: z.array(z.enum(['ira', '401k', '403b', 'roth-ira', 'cash', 'brokerage']))
      .min(1, 'At least one account type required')
      .max(6, 'Too many account types selected')
      .optional(),
    investmentExperience: z.enum(['novice', 'intermediate', 'experienced']).optional(),
    familyMembers: z.number().min(1).max(20).optional(),
    urgencyLevel: z.enum(['low', 'medium', 'high']).optional(),
    previousContacts: z.number().min(0).max(50).optional(),
  }).optional(),
  
  sessionId: z.string().min(32).max(128).optional(),
  
  options: z.object({
    includeDetailedAnalysis: z.boolean().default(true),
    generateActionItems: z.boolean().default(true),
    includeRiskAssessment: z.boolean().default(true),
    confidenceThreshold: z.number().min(0.1).max(1.0).default(0.7),
  }).optional(),
});

export const AnalysisResultSchema = z.object({
  sessionId: z.string(),
  timestamp: z.string().datetime(),
  executionOrder: z.array(z.object({
    order: z.number(),
    promptId: z.string(),
    fileName: z.string(),
    status: z.enum(['pending', 'processing', 'completed', 'failed']),
    duration: z.number().optional(),
    confidence: z.number().min(0).max(1).optional(),
  })),
  
  results: z.object({
    conversation: z.object({
      transcript_quality: z.number().min(0).max(10),
      engagement_level: z.number().min(0).max(10),
      communication_clarity: z.number().min(0).max(10),
      key_topics: z.array(z.string()),
      conversation_flow: z.string(),
      critical_moments: z.array(z.object({
        timestamp: z.string().optional(),
        moment: z.string(),
        significance: z.string(),
      })),
    }),
    
    psychology: z.object({
      decision_making_style: z.string(),
      risk_tolerance: z.enum(['conservative', 'moderate', 'aggressive']),
      emotional_state: z.array(z.string()),
      motivations: z.array(z.string()),
      concerns: z.array(z.string()),
      influence_factors: z.array(z.string()),
    }),
    
    objections: z.object({
      primary_objections: z.array(z.object({
        objection: z.string(),
        category: z.string(),
        severity: z.enum(['low', 'medium', 'high']),
        handling_effectiveness: z.number().min(0).max(10),
      })),
      unresolved_concerns: z.array(z.string()),
      objection_patterns: z.array(z.string()),
    }),
    
    dealRisk: z.object({
      overall_risk_score: z.number().min(0).max(10),
      risk_factors: z.array(z.object({
        factor: z.string(),
        impact: z.enum(['low', 'medium', 'high']),
        mitigation: z.string(),
      })),
      deal_probability: z.number().min(0).max(1),
      timeline_assessment: z.string(),
    }),
    
    actionPlan: z.object({
      immediate_actions: z.array(z.object({
        action: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
        timeline: z.string(),
      })),
      follow_up_strategy: z.string(),
      key_messages: z.array(z.string()),
      success_metrics: z.array(z.string()),
    }),
    
    qualification: z.object({
      qualification_score: z.number().min(0).max(10),
      account_potential: z.object({
        retirement_assets: z.string(),
        account_types: z.array(z.string()),
        investment_timeline: z.string(),
        family_influence: z.string(),
      }),
      strategic_assessment: z.string(),
      next_best_action: z.string(),
      confidence_level: z.number().min(0).max(1),
    }),
  }),
  
  summary: z.object({
    overall_score: z.number().min(0).max(10),
    key_insights: z.array(z.string()),
    critical_actions: z.array(z.string()),
    risk_alerts: z.array(z.string()),
    success_indicators: z.array(z.string()),
  }),
  
  metadata: z.object({
    processing_time: z.number(),
    model_version: z.string(),
    confidence_metrics: z.object({
      overall: z.number().min(0).max(1),
      by_section: z.record(z.number().min(0).max(1)),
    }),
    quality_flags: z.array(z.string()),
  }),
});

export class ValidationMiddleware {
  static validateTranscriptRequest(data: unknown) {
    try {
      return TranscriptAnalysisRequestSchema.parse(data);
    } catch (error) {
      SecurityLogger.logSecurityEvent({
        type: 'invalid_input',
        details: { 
          error: error.message,
          inputType: 'transcript_request' 
        }
      });
      
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        throw new Error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
      }
      
      throw error;
    }
  }
  
  static validateAnalysisResult(data: unknown) {
    try {
      return AnalysisResultSchema.parse(data);
    } catch (error) {
      SecurityLogger.logSecurityEvent({
        type: 'invalid_input',
        details: { 
          error: error.message,
          inputType: 'analysis_result' 
        }
      });
      throw error;
    }
  }
  
  static validateBusinessRules(request: z.infer<typeof TranscriptAnalysisRequestSchema>) {
    const issues: string[] = [];
    
    // Business rule: Transcript quality checks
    const wordCount = request.transcript.split(/\s+/).length;
    if (wordCount < 50) {
      issues.push('Transcript appears too short for meaningful analysis');
    }
    
    if (wordCount > 10000) {
      issues.push('Transcript may be too long for optimal processing');
    }
    
    // Business rule: Metadata consistency
    if (request.metadata?.customerAge && request.metadata?.retirementStatus) {
      const age = request.metadata.customerAge;
      const status = request.metadata.retirementStatus;
      
      if (age < 50 && status === 'retired') {
        issues.push('Customer age and retirement status seem inconsistent');
      }
      
      if (age > 75 && status === 'pre-retirement') {
        issues.push('Customer age suggests closer to retirement than indicated');
      }
    }
    
    // Business rule: Account type validation
    if (request.metadata?.accountTypes) {
      const types = request.metadata.accountTypes;
      if (types.includes('401k') && types.includes('403b')) {
        issues.push('Customer unlikely to have both 401k and 403b accounts');
      }
    }
    
    // Business rule: Duration vs transcript length correlation
    if (request.metadata?.duration && request.transcript) {
      const estimatedDuration = Math.ceil(wordCount / 150) * 60; // ~150 words/minute
      const actualDuration = request.metadata.duration;
      
      if (Math.abs(estimatedDuration - actualDuration) > actualDuration * 0.5) {
        issues.push('Transcript length and call duration seem inconsistent');
      }
    }
    
    if (issues.length > 0) {
      SecurityLogger.logSecurityEvent({
        type: 'invalid_input',
        details: { 
          businessRuleViolations: issues,
          inputType: 'business_validation' 
        }
      });
      
      throw new Error(`Business rule validation failed: ${issues.join('; ')}`);
    }
    
    return true;
  }
}

// Export types for use in other modules
export type TranscriptAnalysisRequest = z.infer<typeof TranscriptAnalysisRequestSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;