import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { AnalysisContext } from '../types/goldira.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Prompt Provider for Gold IRA Analysis
 * 
 * Provides Claude Code with the actual prompt content and context
 * so Claude Code can perform the analysis using its LLM capabilities
 */
export class PromptProvider {
  private promptsPath: string;
  private promptCache: Map<string, string> = new Map();
  
  constructor(promptsPath?: string) {
    this.promptsPath = promptsPath || join(__dirname, '../../../Prompts1-6');
  }
  
  /**
   * Get the full analysis structure for Claude Code to execute
   */
  getAnalysisInstructions(context: AnalysisContext): {
    instructions: string;
    executionOrder: Array<{
      order: number;
      promptId: string;
      fileName: string;
      prompt: string;
      context: string;
    }>;
    transcript: string;
    metadata: any;
  } {
    const executionOrder = [
      { order: 1, promptId: 'conversation', fileName: 'Prompt.2' },
      { order: 2, promptId: 'psychology', fileName: 'Prompt.3' },
      { order: 3, promptId: 'objections', fileName: 'Prompt.4' },
      { order: 4, promptId: 'dealRisk', fileName: 'Prompt.5' },
      { order: 5, promptId: 'actionPlan', fileName: 'Prompt.6' },
      { order: 6, promptId: 'qualification', fileName: 'Prompt.1' }
    ];
    
    const instructions = `
# Gold IRA Sales Transcript Analysis

You are analyzing a B2C Gold IRA sales call transcript through 6 specialized prompts that must be executed in this specific order: 2→3→4→5→6→1

**CRITICAL EXECUTION ORDER**: Prompt.2 → Prompt.3 → Prompt.4 → Prompt.5 → Prompt.6 → Prompt.1 (final assessment)

Each prompt builds on the previous analysis, with Prompt.1 serving as the comprehensive final qualification assessment that incorporates insights from all previous prompts.

**B2C Gold IRA Context:**
- Focus: Individual/family retirement planning with precious metals
- Target: Pre-retirement and retired individuals 
- Key Factors: Retirement accounts (IRA, 401k, etc.), family decision-making, investment experience
- Goal: Qualification for Gold IRA rollover or purchase

**Analysis Requirements:**
1. Execute each prompt in the specified order
2. Use context from previous analyses to inform subsequent prompts
3. Focus on B2C Gold IRA sales dynamics (not B2B company sales)
4. Return structured JSON output matching the expected format
5. Provide actionable insights for sales follow-up

**Important Notes:**
- Prompt.1 is the FINAL prompt that synthesizes all previous analyses
- Each prompt should build contextual understanding for the next
- Focus on retirement planning, family dynamics, and Gold IRA suitability
`;
    
    const detailedOrder = executionOrder.map(step => ({
      ...step,
      prompt: this.loadPrompt(step.fileName),
      context: this.buildPromptContext(step.promptId, context)
    }));
    
    return {
      instructions,
      executionOrder: detailedOrder,
      transcript: context.transcript,
      metadata: context.metadata
    };
  }
  
  /**
   * Load a specific prompt file
   */
  loadPrompt(fileName: string): string {
    if (this.promptCache.has(fileName)) {
      return this.promptCache.get(fileName)!;
    }
    
    try {
      const promptPath = join(this.promptsPath, fileName);
      const promptContent = readFileSync(promptPath, 'utf-8');
      this.promptCache.set(fileName, promptContent);
      return promptContent;
    } catch (error) {
      throw new Error(`Failed to load prompt ${fileName}: ${error}`);
    }
  }
  
  /**
   * Build context-specific information for each prompt
   */
  private buildPromptContext(promptId: string, context: AnalysisContext): string {
    const { metadata } = context;
    
    const baseContext = `
**Call Context:**
- Customer: ${metadata.agentName || 'Not specified'} 
- Duration: ${metadata.duration || 'Not specified'} minutes
- Retirement Status: ${metadata.retirementStatus || 'Not specified'}
- Account Types: ${metadata.accountTypes?.join(', ') || 'Not specified'}
- Investment Experience: ${metadata.investmentExperience || 'Not specified'}
- Family Members: ${metadata.familyMembers || 'Not specified'}
`;
    
    const contextSpecific = {
      conversation: `
**Analysis Focus for Conversation Dynamics (Prompt.2):**
- Evaluate conversation flow and rapport building
- Identify key engagement moments and missed opportunities
- Assess discovery questions and information gathering
- Rate overall conversation quality and effectiveness

${baseContext}`,

      psychology: `
**Analysis Focus for Psychology Profile (Prompt.3):**
- Build on conversation insights to understand personality
- Identify decision-making style and motivations
- Assess risk tolerance and investment psychology
- Consider family dynamics in decision-making

**Previous Context Available:**
- Conversation quality assessment completed
- Key engagement moments identified

${baseContext}`,

      objections: `
**Analysis Focus for Objection Analysis (Prompt.4):**
- Identify all objections raised during the call
- Assess how well objections were handled
- Predict likely future objections based on psychology profile
- Recommend objection handling improvements

**Previous Context Available:**
- Conversation dynamics assessed
- Psychology profile established
- Decision-making style identified

${baseContext}`,

      dealRisk: `
**Analysis Focus for Deal Risk Assessment (Prompt.5):**
- Evaluate deal progression likelihood
- Assess risk factors based on conversation, psychology, and objections
- Identify critical success factors and potential roadblocks
- Rate overall deal health and timeline

**Previous Context Available:**
- Conversation quality and flow assessed
- Psychology profile and decision-making style established  
- Objection inventory and handling evaluation completed

${baseContext}`,

      actionPlan: `
**Analysis Focus for Action Planning (Prompt.6):**
- Create specific follow-up action items
- Prioritize actions based on psychology profile and risk assessment
- Define success metrics and timelines
- Tailor approach to individual's decision-making style

**Previous Context Available:**
- Complete conversation analysis
- Detailed psychology profile
- Objection handling assessment
- Risk evaluation and deal health scoring

${baseContext}`,

      qualification: `
**Analysis Focus for Strategic Qualification (Prompt.1 - FINAL COMPREHENSIVE ASSESSMENT):**
- Synthesize ALL previous analyses into final qualification
- Provide comprehensive opportunity assessment
- Make specific recommendations based on complete analysis
- Assign final qualification score incorporating all factors

**All Previous Context Available:**
- Conversation dynamics and quality assessment
- Complete psychology profile and decision-making analysis
- Comprehensive objection inventory and handling evaluation
- Risk assessment and deal health scoring
- Detailed action plan with prioritized next steps

**This is the FINAL, most comprehensive analysis that should incorporate insights from all 5 previous prompts.**

${baseContext}`
    };
    
    return contextSpecific[promptId as keyof typeof contextSpecific] || baseContext;
  }
  
  /**
   * Get all prompts with their execution order and context
   */
  getAllPromptsWithContext(context: AnalysisContext) {
    const analysis = this.getAnalysisInstructions(context);
    
    return {
      systemInstructions: analysis.instructions,
      prompts: analysis.executionOrder.map(step => ({
        order: step.order,
        id: step.promptId, 
        fileName: step.fileName,
        title: this.getPromptTitle(step.promptId),
        prompt: step.prompt,
        context: step.context,
        isFirstPrompt: step.order === 1,
        isFinalPrompt: step.promptId === 'qualification'
      })),
      transcript: analysis.transcript,
      metadata: analysis.metadata
    };
  }
  
  /**
   * Get human-readable title for each prompt
   */
  private getPromptTitle(promptId: string): string {
    const titles = {
      conversation: 'Conversation Dynamics Analysis',
      psychology: 'Psychology & Decision-Making Profile', 
      objections: 'Objection Analysis & Handling',
      dealRisk: 'Deal Risk Assessment',
      actionPlan: 'Action Plan & Follow-up Strategy',
      qualification: 'Strategic Qualification Assessment (Final)'
    };
    
    return titles[promptId as keyof typeof titles] || promptId;
  }
  
  /**
   * Get a specific prompt by ID with full context
   */
  getPromptById(promptId: string, context: AnalysisContext) {
    const allPrompts = this.getAllPromptsWithContext(context);
    const prompt = allPrompts.prompts.find(p => p.id === promptId);
    
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }
    
    return {
      ...prompt,
      systemInstructions: allPrompts.systemInstructions,
      transcript: allPrompts.transcript,
      metadata: allPrompts.metadata
    };
  }
}