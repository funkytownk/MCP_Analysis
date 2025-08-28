import type { 
  AnalysisContext, 
  GoldIRAAnalysisResult, 
  PROMPT_EXECUTION_ORDER 
} from '../types/goldira.js';
import { PromptProcessor } from './promptProcessor.js';
import { randomUUID } from 'crypto';

/**
 * Analysis orchestrator for Gold IRA sales transcript processing
 * Manages the sequential execution of prompts in order: 2→3→4→5→6→1
 */
export class AnalysisOrchestrator {
  private promptProcessor: PromptProcessor;
  private executionOrder = [
    { order: 1, promptId: 'conversation', fileName: 'Prompt.2' },
    { order: 2, promptId: 'psychology', fileName: 'Prompt.3' },
    { order: 3, promptId: 'objections', fileName: 'Prompt.4' },
    { order: 4, promptId: 'dealRisk', fileName: 'Prompt.5' },
    { order: 5, promptId: 'actionPlan', fileName: 'Prompt.6' },
    { order: 6, promptId: 'qualification', fileName: 'Prompt.1' }
  ];
  
  constructor(promptsPath?: string) {
    this.promptProcessor = new PromptProcessor(promptsPath);
  }
  
  /**
   * Execute the complete analysis pipeline
   * Returns comprehensive Gold IRA analysis results
   */
  async executeAnalysis(context: AnalysisContext): Promise<GoldIRAAnalysisResult> {
    const startTime = Date.now();
    const analysisId = randomUUID();
    
    console.log(`Starting Gold IRA analysis ${analysisId} with execution order: 2→3→4→5→6→1`);
    
    const analyses: any = {};
    
    try {
      // Execute prompts in specific order
      for (const step of this.executionOrder) {
        const stepStartTime = Date.now();
        console.log(`Executing step ${step.order}: ${step.promptId} (${step.fileName})`);
        
        const analysis = await this.executePromptStep(step, context);
        analyses[step.promptId] = analysis;
        
        // Update context with new analysis for next prompt
        this.updateContext(context, step.promptId, analysis);
        
        const stepDuration = Date.now() - stepStartTime;
        console.log(`Completed step ${step.order}: ${step.promptId} in ${stepDuration}ms`);
      }
      
      const totalProcessingTime = Date.now() - startTime;
      
      // Generate summary using all analyses
      const summary = this.generateSummary(analyses, context);
      
      const result: GoldIRAAnalysisResult = {
        analysisId,
        timestamp: new Date().toISOString(),
        processingTime: totalProcessingTime,
        executionOrder: this.executionOrder.map(step => step.promptId),
        analyses,
        summary
      };
      
      console.log(`Gold IRA analysis ${analysisId} completed in ${totalProcessingTime}ms`);
      return result;
      
    } catch (error) {
      console.error(`Analysis ${analysisId} failed:`, error);
      throw new Error(`Gold IRA analysis failed: ${error}`);
    }
  }
  
  /**
   * Execute a single prompt step
   */
  private async executePromptStep(
    step: typeof this.executionOrder[0], 
    context: AnalysisContext
  ): Promise<any> {
    let processedPrompt: string;
    
    try {
      // Process the prompt based on its type
      switch (step.promptId) {
        case 'conversation':
          processedPrompt = this.promptProcessor.processConversationPrompt(context);
          break;
        case 'psychology':
          processedPrompt = this.promptProcessor.processPsychologyPrompt(context);
          break;
        case 'objections':
          processedPrompt = this.promptProcessor.processObjectionPrompt(context);
          break;
        case 'dealRisk':
          processedPrompt = this.promptProcessor.processRiskAnalysisPrompt(context);
          break;
        case 'actionPlan':
          processedPrompt = this.promptProcessor.processActionPlanPrompt(context);
          break;
        case 'qualification':
          processedPrompt = this.promptProcessor.processQualificationPrompt(context);
          break;
        default:
          throw new Error(`Unknown prompt ID: ${step.promptId}`);
      }
      
      // In a real implementation, this would call an LLM API
      // For now, return a mock analysis structure
      return this.mockAnalysisResponse(step.promptId, processedPrompt, context);
      
    } catch (error) {
      console.error(`Failed to execute prompt ${step.promptId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update analysis context with new results
   */
  private updateContext(context: AnalysisContext, promptId: string, analysis: any): void {
    switch (promptId) {
      case 'conversation':
        context.conversationInsights = analysis;
        break;
      case 'psychology':
        context.psychologyProfile = analysis;
        break;
      case 'objections':
        context.objectionAnalysis = analysis;
        break;
      case 'dealRisk':
        context.riskAssessment = analysis;
        break;
      case 'actionPlan':
        context.actionPlan = analysis;
        break;
      case 'qualification':
        context.finalQualification = analysis;
        break;
    }
  }
  
  /**
   * Generate comprehensive summary from all analyses
   */
  private generateSummary(analyses: any, context: AnalysisContext) {
    // Extract key metrics from each analysis
    const conversationScore = analyses.conversation?.conversationScorecard?.overallQuality || 0;
    const psychologyConfidence = analyses.psychology?.personalityType?.confidence || 0;
    const riskScore = analyses.dealRisk?.dealHealth?.riskLevel === 'low' ? 80 : 
                     analyses.dealRisk?.dealHealth?.riskLevel === 'medium' ? 60 :
                     analyses.dealRisk?.dealHealth?.riskLevel === 'high' ? 40 : 20;
    
    // Calculate overall qualification score (enhanced by all previous analyses)
    const overallQualificationScore = Math.round(
      (conversationScore * 0.3 + psychologyConfidence * 0.3 + riskScore * 0.4)
    );
    
    // Determine investment readiness based on multiple factors
    let investmentReadiness: 'high' | 'medium' | 'low' | 'not-ready';
    if (overallQualificationScore >= 80 && context.metadata.goldIRAInterest === 'ready-to-act') {
      investmentReadiness = 'high';
    } else if (overallQualificationScore >= 60) {
      investmentReadiness = 'medium';
    } else if (overallQualificationScore >= 40) {
      investmentReadiness = 'low';
    } else {
      investmentReadiness = 'not-ready';
    }
    
    // Extract key insights from all analyses
    const keyInsights: string[] = [];
    if (analyses.conversation?.keyMoments) {
      keyInsights.push(...analyses.conversation.keyMoments.slice(0, 2).map((m: any) => m.moment));
    }
    if (analyses.psychology?.profileSummary) {
      keyInsights.push(analyses.psychology.profileSummary);
    }
    if (analyses.qualification?.qualificationSummary?.keyQualifiers) {
      keyInsights.push(...analyses.qualification.qualificationSummary.keyQualifiers.slice(0, 2));
    }
    
    return {
      overallQualificationScore,
      investmentReadiness,
      keyInsights: keyInsights.slice(0, 5), // Top 5 insights
      criticalActions: this.extractCriticalActions(analyses),
      riskLevel: this.determineOverallRisk(analyses),
      recommendedNextSteps: this.generateNextSteps(analyses, context)
    };
  }
  
  private extractCriticalActions(analyses: any): string[] {
    const actions: string[] = [];
    
    if (analyses.actionPlan?.immediateActions) {
      actions.push(...analyses.actionPlan.immediateActions
        .filter((action: any) => action.priority === 'critical')
        .map((action: any) => action.action));
    }
    
    if (analyses.conversation?.missedOpportunities) {
      actions.push(...analyses.conversation.missedOpportunities
        .slice(0, 2)
        .map((opp: any) => `Address: ${opp.betterApproach}`));
    }
    
    return actions.slice(0, 5);
  }
  
  private determineOverallRisk(analyses: any): 'low' | 'medium' | 'high' | 'critical' {
    const dealRiskLevel = analyses.dealRisk?.dealHealth?.riskLevel || 'medium';
    const objectionSeverity = analyses.objections?.objectionInventory?.some(
      (obj: any) => obj.severity > 80
    ) ? 'high' : 'medium';
    
    if (dealRiskLevel === 'critical' || objectionSeverity === 'high') return 'high';
    if (dealRiskLevel === 'high') return 'medium';
    return 'low';
  }
  
  private generateNextSteps(analyses: any, context: AnalysisContext): string[] {
    const steps: string[] = [];
    
    // Add family-specific next steps for Gold IRA
    if (context.metadata.familyMembers && context.metadata.familyMembers !== 'none') {
      steps.push('Schedule joint call with spouse/family members');
    }
    
    // Add account-specific next steps
    if (context.metadata.accountTypes.includes('401k')) {
      steps.push('Provide 401k rollover education materials');
    }
    
    // Add experience-level appropriate next steps
    if (context.metadata.investmentExperience === 'none') {
      steps.push('Send Gold IRA basics educational package');
    }
    
    // Add action plan next steps if available
    if (analyses.actionPlan?.followUpSequence) {
      steps.push(...analyses.actionPlan.followUpSequence
        .slice(0, 3)
        .map((seq: any) => seq.objective));
    }
    
    return steps.slice(0, 5);
  }
  
  /**
   * Mock analysis response for development/testing
   * In production, this would be replaced with actual LLM API calls
   */
  private mockAnalysisResponse(promptId: string, prompt: string, context: AnalysisContext): any {
    const mockResponses = {
      conversation: {
        conversationScorecard: {
          overallQuality: Math.floor(Math.random() * 30) + 70,
          discovery: Math.floor(Math.random() * 30) + 70,
          rapportBuilding: Math.floor(Math.random() * 30) + 60,
          valuePresentation: Math.floor(Math.random() * 30) + 65,
          objectionHandling: Math.floor(Math.random() * 30) + 60,
          nextStepsClarity: Math.floor(Math.random() * 30) + 70
        },
        keyMoments: [
          {
            timestamp: "05:23",
            moment: "Prospect expressed concern about market volatility",
            impact: "negative",
            improvementTactic: "Acknowledge concern and pivot to gold as stability hedge",
            evidence: "[Mock evidence from transcript]"
          }
        ],
        missedOpportunities: [
          {
            opportunity: "Family financial planning discussion",
            location: "Mid-conversation when spouse was mentioned",
            betterApproach: "Ask about joint financial goals and decision-making process",
            potentialImpact: "Better qualification and higher close rate"
          }
        ]
      },
      psychology: {
        profileSummary: `${context.metadata.prospectName} shows analytical decision-making style with moderate risk tolerance`,
        personalityType: {
          primary: "analytical",
          confidence: 85,
          evidence: ["Asked detailed questions about storage", "Requested documentation"],
          decisionStyle: "data-driven"
        }
      },
      objections: {
        objectionInventory: [
          {
            objection: "Concerned about gold storage and security",
            type: "process",
            severity: 60,
            addressed: "partially",
            evidence: "[Mock evidence from transcript]"
          }
        ]
      },
      dealRisk: {
        dealHealth: {
          overallScore: 75,
          progressionLikelihood: 70,
          riskLevel: "medium",
          keyIndicators: ["Strong interest", "Budget qualified", "Family support needed"]
        }
      },
      actionPlan: {
        immediateActions: [
          {
            action: "Send IRA rollover guide",
            priority: "high",
            deadline: "Within 24 hours",
            owner: context.metadata.salesRep,
            deliverable: "Educational materials package",
            successCriteria: "Prospect reviews materials"
          }
        ]
      },
      qualification: {
        qualificationSummary: {
          opportunityScore: Math.floor(Math.random() * 30) + 65,
          recommendation: "proceed_cautiously",
          confidence: 78,
          keyQualifiers: ["Budget qualified", "Timeline appropriate", "Family decision-making needed"],
          redFlags: ["Spouse involvement unclear"]
        }
      }
    };
    
    return mockResponses[promptId as keyof typeof mockResponses] || {};
  }
}