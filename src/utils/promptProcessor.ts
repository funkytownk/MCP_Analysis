import { readFileSync } from 'fs';
import { join } from 'path';
import type { AnalysisContext, GoldIRAMetadata } from '../types/goldira.js';

/**
 * Utility class for processing Gold IRA analysis prompts
 * Handles prompt loading, variable substitution, and context management
 */
export class PromptProcessor {
  private promptsPath: string;
  
  constructor(promptsPath: string = './Prompts1-6') {
    this.promptsPath = promptsPath;
  }
  
  /**
   * Load a prompt template from file
   */
  private loadPromptTemplate(fileName: string): string {
    try {
      const promptPath = join(process.cwd(), this.promptsPath, fileName);
      return readFileSync(promptPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to load prompt ${fileName}: ${error}`);
    }
  }
  
  /**
   * Process conversation analysis prompt (Prompt 2 - executed first)
   */
  processConversationPrompt(context: AnalysisContext): string {
    const template = this.loadPromptTemplate('Prompt.2');
    
    return template
      .replace('{transcript}', context.transcript)
      .replace('{duration}', context.metadata.duration.toString())
      .replace('{salesRep}', context.metadata.salesRep)
      .replace('{prospectName}', context.metadata.prospectName);
  }
  
  /**
   * Process psychology analysis prompt (Prompt 3 - executed second)
   */
  processPsychologyPrompt(context: AnalysisContext): string {
    const template = this.loadPromptTemplate('Prompt.3');
    
    return template
      .replace('{transcript}', context.transcript)
      .replace('{prospectName}', context.metadata.prospectName)
      .replace('{prospectRole}', this.getProspectRole(context.metadata))
      .replace('{companyName}', this.getCompanyName(context.metadata));
  }
  
  /**
   * Process objection analysis prompt (Prompt 4 - executed third)
   */
  processObjectionPrompt(context: AnalysisContext): string {
    const template = this.loadPromptTemplate('Prompt.4');
    
    return template
      .replace('{transcript}', context.transcript)
      .replace('{prospectName}', context.metadata.prospectName)
      .replace('{personalityType}', this.extractPersonalityType(context))
      .replace('{industry}', this.getIndustryContext(context.metadata));
  }
  
  /**
   * Process deal risk analysis prompt (Prompt 5 - executed fourth)
   */
  processRiskAnalysisPrompt(context: AnalysisContext): string {
    const template = this.loadPromptTemplate('Prompt.5');
    
    return template
      .replace('{transcript}', context.transcript)
      .replace('{dealValue}', context.metadata.accountValues)
      .replace('{currentStage}', this.getCurrentStage(context.metadata))
      .replace('{timeline}', context.metadata.timeframe);
  }
  
  /**
   * Process action plan prompt (Prompt 6 - executed fifth)
   */
  processActionPlanPrompt(context: AnalysisContext): string {
    const template = this.loadPromptTemplate('Prompt.6');
    
    return template
      .replace('{conversationAnalysis}', JSON.stringify(context.conversationInsights))
      .replace('{psychologicalProfile}', JSON.stringify(context.psychologyProfile))
      .replace('{currentStage}', this.getCurrentStage(context.metadata));
  }
  
  /**
   * Process strategic qualification prompt (Prompt 1 - executed last with full context)
   */
  processQualificationPrompt(context: AnalysisContext): string {
    const template = this.loadPromptTemplate('Prompt.1');
    
    return template
      .replace('{transcript}', context.transcript)
      .replace('{companyName}', this.getCompanyName(context.metadata))
      .replace('{industry}', this.getIndustryContext(context.metadata))
      .replace('{companySize}', this.getCompanySize(context.metadata))
      .replace('{dealValue}', context.metadata.accountValues)
      .replace('{knownCompetitors}', this.getKnownCompetitors(context.metadata))
      .replace('{solutionType}', this.getSolutionType(context.metadata))
      .replace('{complexity}', this.getComplexity(context.metadata));
  }
  
  // Helper methods for Gold IRA B2C context
  
  private getProspectRole(metadata: GoldIRAMetadata): string {
    if (metadata.retirementStatus === 'retired') return 'Retiree';
    if (metadata.retirementStatus === 'recently-retired') return 'Recent Retiree';
    return 'Pre-Retiree';
  }
  
  private getCompanyName(metadata: GoldIRAMetadata): string {
    return `${metadata.prospectName}'s Household`;
  }
  
  private getIndustryContext(metadata: GoldIRAMetadata): string {
    return 'Personal Financial Services - Gold IRA';
  }
  
  private getCompanySize(metadata: GoldIRAMetadata): string {
    const familyCount = metadata.familyMembers.split(',').length;
    if (familyCount <= 1) return 'Individual';
    if (familyCount === 2) return 'Couple';
    return 'Family';
  }
  
  private getKnownCompetitors(metadata: GoldIRAMetadata): string {
    return 'Traditional financial advisors, other precious metals companies, bank investment products';
  }
  
  private getSolutionType(metadata: GoldIRAMetadata): string {
    const hasRetirementAccounts = metadata.accountTypes.some(type => 
      ['traditional-ira', '401k', 'roth-ira'].includes(type)
    );
    
    if (hasRetirementAccounts) {
      return 'Gold IRA Rollover';
    } else if (metadata.accountTypes.includes('cash-savings')) {
      return 'Gold IRA Contribution';
    }
    return 'Gold IRA Setup';
  }
  
  private getComplexity(metadata: GoldIRAMetadata): string {
    if (metadata.investmentExperience === 'none') return 'High - Education Required';
    if (metadata.investmentExperience === 'basic') return 'Moderate - Some Guidance';
    if (metadata.investmentExperience === 'experienced') return 'Low - Self-Directed';
    return 'Moderate';
  }
  
  private getCurrentStage(metadata: GoldIRAMetadata): string {
    switch (metadata.callPurpose) {
      case 'cold-call': return 'Initial Contact';
      case 'follow-up': return 'Follow-up';
      case 'consultation': return 'Consultation';
      case 'closing-call': return 'Closing';
      default: return 'Unknown';
    }
  }
  
  private extractPersonalityType(context: AnalysisContext): string {
    // Extract from psychology analysis if available
    if (context.psychologyProfile?.personalityType?.primary) {
      return context.psychologyProfile.personalityType.primary;
    }
    return 'Unknown - Analyze conversation patterns';
  }
}

/**
 * Factory function to create configured prompt processor
 */
export function createPromptProcessor(promptsPath?: string): PromptProcessor {
  return new PromptProcessor(promptsPath);
}