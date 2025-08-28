import { z } from "zod";

// Gold IRA specific enums and types
export const RetirementStatusEnum = z.enum(['pre-retirement', 'recently-retired', 'retired']);
export const AccountTypeEnum = z.enum(['traditional-ira', '401k', 'roth-ira', 'cash-savings', 'other-investments']);
export const InvestmentExperienceEnum = z.enum(['none', 'basic', 'moderate', 'experienced']);
export const GoldIRAInterestEnum = z.enum(['researching', 'considering', 'ready-to-act', 'undecided']);
export const CallPurposeEnum = z.enum(['cold-call', 'follow-up', 'consultation', 'closing-call']);
export const InvestmentReadinessEnum = z.enum(['high', 'medium', 'low', 'not-ready']);
export const RiskLevelEnum = z.enum(['low', 'medium', 'high', 'critical']);

// Metadata schema for Gold IRA sales calls
export const GoldIRAMetadataSchema = z.object({
  prospectName: z.string().describe("Primary prospect name"),
  prospectAge: z.number().optional().describe("Prospect's age"),
  retirementStatus: RetirementStatusEnum.describe("Retirement status"),
  accountTypes: z.array(AccountTypeEnum).describe("Current account types"),
  accountValues: z.string().describe("Estimated total account values"),
  familyMembers: z.string().describe("Spouse/family members involved in decision"),
  investmentExperience: InvestmentExperienceEnum.describe("Investment experience level"),
  goldIRAInterest: GoldIRAInterestEnum.describe("Level of Gold IRA interest"),
  currentConcerns: z.string().describe("Primary financial concerns mentioned"),
  timeframe: z.string().describe("Expected decision timeframe"),
  duration: z.number().describe("Call duration in minutes"),
  salesRep: z.string().describe("Sales representative name"),
  callPurpose: CallPurposeEnum.describe("Purpose of the call"),
  previousContact: z.boolean().describe("Whether this is a repeat contact")
});

// Main tool input schema
export const AnalyzeGoldIRATranscriptSchema = z.object({
  transcript: z.string().min(100).describe("Gold IRA sales call transcript text"),
  metadata: GoldIRAMetadataSchema.describe("Gold IRA call context metadata")
});

// Analysis context that flows between prompts
export interface AnalysisContext {
  transcript: string;
  metadata: z.infer<typeof GoldIRAMetadataSchema>;
  conversationInsights?: any;
  psychologyProfile?: any;
  objectionAnalysis?: any;
  riskAssessment?: any;
  actionPlan?: any;
  finalQualification?: any;
}

// Prompt execution order configuration
export const PROMPT_EXECUTION_ORDER = [
  { order: 1, promptId: 'conversation', fileName: 'Prompt.2' },
  { order: 2, promptId: 'psychology', fileName: 'Prompt.3' },
  { order: 3, promptId: 'objections', fileName: 'Prompt.4' },
  { order: 4, promptId: 'dealRisk', fileName: 'Prompt.5' },
  { order: 5, promptId: 'actionPlan', fileName: 'Prompt.6' },
  { order: 6, promptId: 'qualification', fileName: 'Prompt.1' }
] as const;

// Type definitions for the analysis results
export type ConversationAnalysis = {
  conversationScorecard: {
    overallQuality: number;
    discovery: number;
    rapportBuilding: number;
    valuePresentation: number;
    objectionHandling: number;
    nextStepsClarity: number;
  };
  keyMoments: Array<{
    timestamp: string;
    moment: string;
    impact: 'positive' | 'negative' | 'neutral';
    improvementTactic: string;
    evidence: string;
  }>;
  // ... rest of Prompt 2 structure
};

export type PsychologyAnalysis = {
  profileSummary: string;
  personalityType: {
    primary: 'driver' | 'expressive' | 'amiable' | 'analytical';
    confidence: number;
    evidence: string[];
    decisionStyle: 'quick' | 'collaborative' | 'data-driven' | 'consensus-based';
  };
  // ... rest of Prompt 3 structure
};

// Main analysis result interface
export interface GoldIRAAnalysisResult {
  analysisId: string;
  timestamp: string;
  processingTime: number;
  executionOrder: string[];
  analyses: {
    conversation: ConversationAnalysis;
    psychology: PsychologyAnalysis;
    objections: any; // Define based on Prompt 4 structure
    dealRisk: any;   // Define based on Prompt 5 structure
    actionPlan: any; // Define based on Prompt 6 structure
    qualification: any; // Define based on Prompt 1 structure
  };
  summary: {
    overallQualificationScore: number;
    investmentReadiness: z.infer<typeof InvestmentReadinessEnum>;
    keyInsights: string[];
    criticalActions: string[];
    riskLevel: z.infer<typeof RiskLevelEnum>;
    recommendedNextSteps: string[];
  };
}

// Export types
export type GoldIRAMetadata = z.infer<typeof GoldIRAMetadataSchema>;
export type AnalyzeGoldIRATranscriptInput = z.infer<typeof AnalyzeGoldIRATranscriptSchema>;