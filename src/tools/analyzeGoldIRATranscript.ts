import { MCPTool, MCPInput } from "mcp-framework";
import { AnalyzeGoldIRATranscriptSchema, type AnalysisContext } from "../types/goldira.js";
import { PromptProvider } from "../utils/promptProvider.js";
import { ValidationMiddleware } from "../middleware/validation.js";
import { SessionManager, SecurityLogger } from "../middleware/security.js";

/**
 * Gold IRA Sales Transcript Analysis Tool
 * 
 * Compatible with Claude Code, Gemini CLI, and other MCP clients
 * Hosted on smithery.ai for broad accessibility
 * 
 * Provides structured prompts and context for AI assistants to analyze
 * B2C Gold IRA sales call transcripts through 6 specialized prompts:
 * 
 * Execution Order: Prompt.2 → Prompt.3 → Prompt.4 → Prompt.5 → Prompt.6 → Prompt.1
 * 1. Conversation Analysis (Prompt.2) - First execution
 * 2. Psychology Profile (Prompt.3) - Second execution
 * 3. Objection Analysis (Prompt.4) - Third execution  
 * 4. Deal Risk Assessment (Prompt.5) - Fourth execution
 * 5. Action Planning (Prompt.6) - Fifth execution
 * 6. Strategic Qualification (Prompt.1) - FINAL comprehensive assessment
 */
export class AnalyzeGoldIRATranscriptTool extends MCPTool {
  name = "analyze_goldira_transcript";
  description = "Provides structured prompts and context for AI assistants (Claude Code, Gemini CLI, etc.) to analyze B2C Gold IRA sales transcripts through 6 specialized prompts in order: 2→3→4→5→6→1. Returns analysis instructions, prompts, and context for the AI to execute.";
  schema = AnalyzeGoldIRATranscriptSchema;

  private promptProvider: PromptProvider;

  constructor() {
    super();
    this.promptProvider = new PromptProvider();
  }

  async execute(input: MCPInput<this>) {
    const startTime = Date.now();
    const sessionId = SessionManager.createSession();
    
    // Enhanced security and validation
    try {
      // Validate and sanitize input
      const validatedInput = ValidationMiddleware.validateTranscriptRequest({
        transcript: input.transcript,
        metadata: input.metadata,
        sessionId
      });
      
      // Business rule validation
      ValidationMiddleware.validateBusinessRules(validatedInput);
      
      // Check session limits
      if (!SessionManager.incrementAnalysisCount(sessionId)) {
        throw new Error('Session analysis limit exceeded');
      }
      
      // Log analysis attempt
      SecurityLogger.logSecurityEvent({
        type: 'analysis_attempt',
        sessionId,
        details: {
          prospectName: validatedInput.metadata?.agentName,
          transcriptLength: validatedInput.transcript.length
        }
      });
      
      const { transcript, metadata } = validatedInput;
      
      console.log(`Starting Gold IRA transcript analysis (Session: ${sessionId})`);
      console.log(`Agent: ${metadata?.agentName} | Duration: ${metadata?.duration}min`);
      console.log(`Account types: ${metadata?.accountTypes?.join(', ')} | Experience: ${metadata?.investmentExperience}`);
      
      // Legacy validation for backward compatibility
      this.validateGoldIRAInput(transcript, metadata || {});
      
      // Create analysis context
      const context: AnalysisContext = {
        transcript,
        metadata: metadata || {}
      };
      
      // Get structured analysis instructions for AI execution
      const analysisInstructions = this.promptProvider.getAllPromptsWithContext(context);
      
      // Prepare result for AI assistant execution
      const result = {
        sessionId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        
        // Instructions for the AI assistant (Claude Code, Gemini CLI, etc.)
        analysisInstructions: analysisInstructions.systemInstructions,
        
        // The transcript to analyze
        transcript: analysisInstructions.transcript,
        
        // B2C Gold IRA context and metadata
        metadata: analysisInstructions.metadata,
        
        // Structured prompts with execution order
        prompts: analysisInstructions.prompts,
        
        // Execution guidance
        executionGuidance: {
          order: "Execute prompts in this exact order: Prompt.2 → Prompt.3 → Prompt.4 → Prompt.5 → Prompt.6 → Prompt.1",
          contextFlow: "Each prompt builds on previous analyses. Pass context forward to subsequent prompts.",
          finalPrompt: "Prompt.1 is the FINAL comprehensive assessment incorporating all previous analyses.",
          focus: "B2C Gold IRA sales - focus on retirement planning, family dynamics, and individual investment decisions"
        },
        
        // Expected output structure
        outputFormat: {
          instruction: "Return structured JSON with results from each prompt",
          structure: {
            conversation: "Results from Prompt.2 - Conversation dynamics",
            psychology: "Results from Prompt.3 - Psychology profile", 
            objections: "Results from Prompt.4 - Objection analysis",
            dealRisk: "Results from Prompt.5 - Risk assessment",
            actionPlan: "Results from Prompt.6 - Action planning",
            qualification: "Results from Prompt.1 - FINAL qualification (incorporates all previous)"
          }
        },
        
        // Security and validation metadata
        security: {
          validated: true,
          sanitized: true,
          sessionValid: SessionManager.validateSession(sessionId)
        }
      };
      
      // Log completion summary
      console.log(`Analysis instructions prepared (Session: ${sessionId}):`);
      console.log(`- Prompts provided: ${analysisInstructions.prompts.length}`);
      console.log(`- Execution order: 2→3→4→5→6→1`);
      console.log(`- Processing Time: ${Date.now() - startTime}ms`);
      
      // Return analysis instructions for AI execution
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
      
    } catch (error) {
      console.error('Gold IRA analysis failed:', error);
      
      // Log security event
      SecurityLogger.logSecurityEvent({
        type: 'analysis_attempt',
        sessionId,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        }
      });
      
      return {
        content: [
          {
            type: "text", 
            text: JSON.stringify({
              error: "Analysis failed",
              message: error instanceof Error ? error.message : "Unknown error occurred",
              sessionId,
              timestamp: new Date().toISOString(),
              processingTime: Date.now() - startTime
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
  
  /**
   * Validate input requirements for Gold IRA analysis
   */
  private validateGoldIRAInput(transcript: string, metadata: any): void {
    const errors: string[] = [];
    
    // Transcript validation
    if (!transcript || transcript.length < 100) {
      errors.push("Transcript must be at least 100 characters long");
    }
    
    // Metadata validation  
    if (!metadata.prospectName || metadata.prospectName.trim().length === 0) {
      errors.push("Prospect name is required");
    }
    
    if (!metadata.salesRep || metadata.salesRep.trim().length === 0) {
      errors.push("Sales representative name is required");
    }
    
    if (!metadata.duration || metadata.duration <= 0) {
      errors.push("Call duration must be greater than 0 minutes");
    }
    
    if (!metadata.accountTypes || metadata.accountTypes.length === 0) {
      errors.push("At least one account type must be specified");
    }
    
    // Gold IRA specific validations
    if (metadata.goldIRAInterest === 'ready-to-act' && !metadata.accountValues) {
      errors.push("Account values must be provided for ready-to-act prospects");
    }
    
    if (metadata.retirementStatus === 'pre-retirement' && !metadata.prospectAge) {
      errors.push("Age is recommended for pre-retirement prospects");
    }
    
    if (errors.length > 0) {
      throw new Error(`Input validation failed: ${errors.join(', ')}`);
    }
  }
}

export default AnalyzeGoldIRATranscriptTool;