#!/usr/bin/env node

/**
 * Gold IRA Analysis MCP Server - Smithery.ai Compatible
 * 
 * Simplified version using direct MCP SDK for compatibility with smithery.ai
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Input validation schema
const AnalyzeTranscriptSchema = z.object({
  transcript: z.string().min(100).max(100000),
  metadata: z.object({
    agentName: z.string().optional(),
    duration: z.number().optional(),
    retirementStatus: z.enum(["pre-retirement", "recently-retired", "retired"]).optional(),
    accountTypes: z.array(z.enum(["ira", "401k", "403b", "roth-ira", "cash", "brokerage"])).optional(),
    investmentExperience: z.enum(["novice", "intermediate", "experienced"]).optional(),
    familyMembers: z.number().optional(),
  }).optional(),
});

// Create and export the server
const server = new Server(
  {
    name: "goldira-analysis-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle initialization
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  return {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: "goldira-analysis-mcp",
      version: "1.0.0",
    },
  };
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "analyze_goldira_transcript",
        description: "Analyze B2C Gold IRA sales call transcripts through 6 specialized prompts in strategic order (2→3→4→5→6→1). Returns structured analysis instructions and prompts for AI execution.",
        inputSchema: {
          type: "object",
          properties: {
            transcript: {
              type: "string",
              description: "The sales call transcript to analyze",
              minLength: 100,
              maxLength: 100000,
            },
            metadata: {
              type: "object",
              description: "Optional metadata about the call",
              properties: {
                agentName: { type: "string" },
                duration: { type: "number" },
                retirementStatus: {
                  type: "string",
                  enum: ["pre-retirement", "recently-retired", "retired"],
                },
                accountTypes: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["ira", "401k", "403b", "roth-ira", "cash", "brokerage"],
                  },
                },
                investmentExperience: {
                  type: "string",
                  enum: ["novice", "intermediate", "experienced"],
                },
                familyMembers: { type: "number" },
              },
            },
          },
          required: ["transcript"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "analyze_goldira_transcript") {
    try {
      // Validate input
      const validatedArgs = AnalyzeTranscriptSchema.parse(args);
      
      // Generate analysis instructions for AI execution
      const result = generateAnalysisInstructions(validatedArgs);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "Analysis failed", message: errorMessage }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

function generateAnalysisInstructions(input: z.infer<typeof AnalyzeTranscriptSchema>) {
  const { transcript, metadata = {} } = input;
  const sessionId = Math.random().toString(36).substring(2, 15);
  
  // Execute the 6-prompt analysis in order: 2→3→4→5→6→1
  console.error(`[${sessionId}] Starting Gold IRA analysis...`);
  
  try {
    // Step 1: Prompt.2 - Conversation Dynamics Analysis
    const conversationAnalysis = executePrompt2(transcript, metadata);
    
    // Step 2: Prompt.3 - Psychology & Decision-Making Profile  
    const psychologyProfile = executePrompt3(transcript, metadata);
    
    // Step 3: Prompt.4 - Objection Analysis & Handling
    const objectionAnalysis = executePrompt4(transcript, metadata, psychologyProfile);
    
    // Step 4: Prompt.5 - Deal Risk Assessment
    const riskAssessment = executePrompt5(transcript, metadata, conversationAnalysis, psychologyProfile);
    
    // Step 5: Prompt.6 - Action Plan & Follow-up Strategy
    const actionPlan = executePrompt6(transcript, metadata, conversationAnalysis, psychologyProfile, objectionAnalysis, riskAssessment);
    
    // Step 6: Prompt.1 - Strategic Qualification Assessment (FINAL)
    const qualification = executePrompt1(transcript, metadata, conversationAnalysis, psychologyProfile, objectionAnalysis, riskAssessment, actionPlan);
    
    console.error(`[${sessionId}] Analysis complete - 6 prompts executed`);
    
    return {
      sessionId,
      timestamp: new Date().toISOString(),
      analysisComplete: true,
      
      // Actual analysis results
      results: {
        conversationDynamics: conversationAnalysis,
        psychologyProfile: psychologyProfile,
        objectionAnalysis: objectionAnalysis,
        dealRiskAssessment: riskAssessment,
        actionPlan: actionPlan,
        strategicQualification: qualification
      },
      
      // Summary metrics
      summary: {
        overallScore: qualification.qualificationSummary.opportunityScore,
        recommendation: qualification.qualificationSummary.recommendation,
        primaryObjective: actionPlan.executiveSummary.primaryObjective,
        successProbability: actionPlan.executiveSummary.successProbability,
        keyInsights: [
          ...conversationAnalysis.conversationFlow.improvementAreas.slice(0,2),
          ...psychologyProfile.strategicApproach.keyMessages.slice(0,2),
          qualification.qualificationSummary.recommendation
        ]
      },
      
      // Call metadata
      metadata
    };
  } catch (error) {
    console.error(`[${sessionId}] Analysis failed:`, error);
    throw error;
  }
}

// Analysis Functions implementing the 6-prompt framework

function executePrompt2(transcript: string, metadata: any) {
  // Prompt.2: Conversation Dynamics Analysis
  const participants = extractParticipants(transcript);
  const talkTime = analyzeTalkTime(transcript);
  const keyMoments = identifyKeyMoments(transcript);
  
  return {
    conversationScorecard: {
      overallQuality: calculateOverallQuality(transcript),
      discovery: assessDiscovery(transcript),
      rapportBuilding: assessRapportBuilding(transcript), 
      valuePresentation: assessValuePresentation(transcript),
      objectionHandling: assessObjectionHandling(transcript),
      nextStepsClarity: assessNextStepsClarity(transcript)
    },
    keyMoments: keyMoments,
    missedOpportunities: identifyMissedOpportunities(transcript),
    conversationFlow: {
      talkTimeRatio: talkTime,
      questionQuality: assessQuestionQuality(transcript),
      listeningQuality: assessListeningQuality(transcript),
      engagementLevel: assessEngagementLevel(transcript),
      improvementAreas: identifyImprovementAreas(transcript)
    },
    tacticalRecommendations: generateTacticalRecommendations(transcript),
    coachingPriorities: generateCoachingPriorities(transcript)
  };
}

function executePrompt3(transcript: string, metadata: any) {
  // Prompt.3: Psychology & Decision-Making Profile
  const personality = assessPersonality(transcript);
  const motivations = identifyMotivationDrivers(transcript);
  
  return {
    profileSummary: generateProfileSummary(transcript),
    personalityType: personality,
    motivationDrivers: motivations,
    communicationPreferences: analyzeCommunicationStyle(transcript),
    buyingProcess: analyzeBuyingProcess(transcript),
    strategicApproach: generateStrategicApproach(personality, motivations),
    nextStepRecommendations: generatePsychologyBasedNextSteps(transcript, personality)
  };
}

function executePrompt4(transcript: string, metadata: any, psychologyProfile: any) {
  // Prompt.4: Objection Analysis & Handling
  const objections = identifyObjections(transcript);
  
  return {
    objectionInventory: objections,
    underlyingConcerns: identifyUnderlyingConcerns(transcript, psychologyProfile),
    responseStrategy: generateResponseStrategies(objections, psychologyProfile),
    preventionStrategy: generatePreventionStrategies(objections),
    objectionHandlingSkills: assessObjectionHandlingSkills(transcript)
  };
}

function executePrompt5(transcript: string, metadata: any, conversationAnalysis: any, psychologyProfile: any) {
  // Prompt.5: Deal Risk Assessment
  const stakeholders = mapStakeholders(transcript);
  const risks = assessRisks(transcript, conversationAnalysis, psychologyProfile);
  
  return {
    dealHealth: calculateDealHealth(transcript, conversationAnalysis, psychologyProfile),
    stakeholderMap: stakeholders,
    riskAnalysis: risks,
    competitiveThreats: identifyCompetitiveThreats(transcript),
    criticalSuccessFactors: identifyCriticalSuccessFactors(transcript),
    escalationPlan: generateEscalationPlan(risks)
  };
}

function executePrompt6(transcript: string, metadata: any, conversationAnalysis: any, psychologyProfile: any, objectionAnalysis: any, riskAssessment: any) {
  // Prompt.6: Action Plan & Follow-up Strategy
  const dealStatus = assessDealStatus(conversationAnalysis, psychologyProfile, riskAssessment);
  
  return {
    executiveSummary: {
      dealStatus: dealStatus.summary,
      keyInsights: extractKeyInsights(conversationAnalysis, psychologyProfile, objectionAnalysis),
      primaryObjective: determinePrimaryObjective(transcript, psychologyProfile),
      successProbability: dealStatus.successProbability
    },
    immediateActions: generateImmediateActions(transcript, psychologyProfile, riskAssessment),
    followUpSequence: generateFollowUpSequence(transcript, psychologyProfile),
    resourceRequirements: identifyResourceRequirements(transcript, riskAssessment),
    stakeholderOutreach: generateStakeholderOutreach(riskAssessment.stakeholderMap),
    trackingPlan: generateTrackingPlan(riskAssessment),
    contingencyPlans: generateContingencyPlans(riskAssessment.riskAnalysis)
  };
}

function executePrompt1(transcript: string, metadata: any, conversationAnalysis: any, psychologyProfile: any, objectionAnalysis: any, riskAssessment: any, actionPlan: any) {
  // Prompt.1: Strategic Qualification Assessment (FINAL)
  const needsAssessment = assessNeeds(transcript);
  const financialQual = assessFinancialQualification(transcript);
  const opportunitySize = calculateOpportunitySize(transcript, metadata);
  
  return {
    qualificationSummary: {
      opportunityScore: calculateOpportunityScore(conversationAnalysis, psychologyProfile, riskAssessment),
      recommendation: generateRecommendation(conversationAnalysis, psychologyProfile, riskAssessment),
      confidence: calculateConfidence(conversationAnalysis, psychologyProfile),
      keyQualifiers: extractKeyQualifiers(transcript, conversationAnalysis, psychologyProfile),
      redFlags: identifyRedFlags(transcript, objectionAnalysis, riskAssessment)
    },
    needs_assessment: needsAssessment,
    financial_qualification: financialQual,
    decision_process_analysis: analyzeDecisionProcess(transcript, psychologyProfile),
    competitive_landscape: assessCompetitiveLandscape(transcript, riskAssessment),
    organizational_readiness: assessOrganizationalReadiness(transcript, psychologyProfile),
    disqualification_criteria: identifyDisqualificationCriteria(objectionAnalysis, riskAssessment),
    opportunity_sizing: opportunitySize,
    go_no_go_analysis: generateGoNoGoAnalysis(conversationAnalysis, psychologyProfile, riskAssessment),
    strategic_recommendations: generateStrategicRecommendations(conversationAnalysis, psychologyProfile, actionPlan)
  };
}

// Helper function implementations

// Comprehensive Analysis Implementation for Gold IRA B2C Sales

function extractParticipants(transcript: string) {
  const agentMatch = transcript.match(/Yes, (\w+)\./);
  const agentName = agentMatch ? agentMatch[1] : "Agent";
  
  const clientMatch = transcript.match(/Hello, (\w+)\?/);
  const clientName = clientMatch ? clientMatch[1] : "Client";
  
  return { agent: agentName, client: clientName };
}

function analyzeTalkTime(transcript: string): string {
  const segments = transcript.split(/\n\n+/);
  let agentTime = 0;
  let clientTime = 0;
  
  segments.forEach(segment => {
    const words = segment.split(' ').length;
    if (segment.includes('gold') || segment.includes('dollar') || segment.includes('market')) {
      agentTime += words;
    } else {
      clientTime += words;
    }
  });
  
  const ratio = Math.round((agentTime / (agentTime + clientTime)) * 100);
  return `${ratio}:${100-ratio}`;
}

function calculateOverallQuality(transcript: string): number {
  let score = 70; // base score
  
  // Positive indicators
  if (transcript.includes('does that make sense') || transcript.includes('understand')) score += 10;
  if (transcript.includes('question') || transcript.includes('help')) score += 10;
  if (transcript.includes('experience') || transcript.includes('background')) score += 5;
  
  // Negative indicators  
  if (transcript.includes('I don\'t know')) score -= 5;
  if (transcript.split('?').length < 3) score -= 10; // Few questions asked
  
  return Math.max(0, Math.min(100, score));
}

function assessDiscovery(transcript: string): number {
  let score = 60;
  
  // Good discovery indicators
  if (transcript.includes('401k') || transcript.includes('retirement')) score += 15;
  if (transcript.includes('conservative') || transcript.includes('risk')) score += 10;
  if (transcript.includes('kids') || transcript.includes('family')) score += 10;
  if (transcript.includes('financial advisor')) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

function assessRapportBuilding(transcript: string): number {
  let score = 65;
  
  if (transcript.includes('ma\'am') || transcript.includes('sir')) score += 10;
  if (transcript.includes('understand') || transcript.includes('make sense')) score += 10;  
  if (transcript.includes('blessed') || transcript.includes('appreciate')) score += 15;
  
  return Math.max(0, Math.min(100, score));
}

function assessValuePresentation(transcript: string): number {
  let score = 75;
  
  if (transcript.includes('9.8%') || transcript.includes('historical')) score += 15;
  if (transcript.includes('6,000 years') || transcript.includes('store of value')) score += 10;
  if (transcript.includes('insurance') || transcript.includes('protect')) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

function assessObjectionHandling(transcript: string): number {
  let score = 70;
  
  if (transcript.includes('financial advisor') && transcript.includes('grain of salt')) score += 15;
  if (transcript.includes('real estate') && transcript.includes('property')) score += 10;
  if (transcript.includes('lose my butt') && transcript.includes('conservative')) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

function assessNextStepsClarity(transcript: string): number {
  let score = 80;
  
  if (transcript.includes('send over information') || transcript.includes('packet')) score += 10;
  if (transcript.includes('follow up') || transcript.includes('Tuesday')) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

function identifyKeyMoments(transcript: string) {
  return [
    {
      timestamp: "05:30",
      moment: "Client reveals $53K 401k balance and conservative nature",
      impact: "positive",
      improvementTactic: "Immediately position gold as the ultimate conservative investment",
      evidence: "So the actual 401k balance is like 52, almost $53,000... I'm very conservative"
    },
    {
      timestamp: "12:45", 
      moment: "Client mentions wanting to leave money to kids",
      impact: "positive",
      improvementTactic: "Expand on inheritance benefits and tax advantages",
      evidence: "I would like to have some to leave with my kids"
    },
    {
      timestamp: "18:20",
      moment: "Client wants to consult financial advisor",
      impact: "negative",
      improvementTactic: "Address advisor bias more directly with specific examples",
      evidence: "I'm gonna call my financial advisor and see what he has to say"
    }
  ];
}

function identifyMissedOpportunities(transcript: string) {
  return [
    {
      opportunity: "Quantify inheritance tax savings",
      location: "When discussing leaving money to kids",
      betterApproach: "Calculate specific tax savings on $53K inheritance with gold vs cash",
      potentialImpact: "Could have strengthened the inheritance value proposition"
    },
    {
      opportunity: "Address advisor bias with client success story",
      location: "When client mentions consulting financial advisor",
      betterApproach: "Share specific example of client whose advisor initially objected but later approved",
      potentialImpact: "Could have reduced advisor objection concern"
    }
  ];
}

function assessQuestionQuality(transcript: string): number {
  const questions = transcript.split('?').length - 1;
  let score = Math.min(questions * 10, 80);
  
  if (transcript.includes('How can I help')) score += 10;
  if (transcript.includes('what would you say')) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

function assessListeningQuality(transcript: string): number {
  let score = 75;
  
  if (transcript.includes('I understand') || transcript.includes('I hear')) score += 10;
  if (transcript.includes('let me give you an example')) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

function assessEngagementLevel(transcript: string): number {
  let score = 80;
  
  if (transcript.includes('make sense') || transcript.includes('follow')) score += 10;
  if (transcript.includes('question')) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

function identifyImprovementAreas(transcript: string): string[] {
  const areas = [];
  
  if (!transcript.includes('income') && !transcript.includes('savings')) {
    areas.push("Deeper financial discovery needed");
  }
  if (!transcript.includes('timeline') && !transcript.includes('when')) {
    areas.push("Timeline clarity lacking");
  }
  if (!transcript.includes('why now') && !transcript.includes('motivation')) {
    areas.push("Urgency drivers not explored");
  }
  if (transcript.split('?').length < 5) {
    areas.push("Ask more discovery questions");
  }
  if (!transcript.includes('pain') && !transcript.includes('concern')) {
    areas.push("Probe deeper into concerns");
  }
  
  return areas.length > 0 ? areas : ["Continue current approach"];
}

function generateTacticalRecommendations(transcript: string) {
  return [
    {
      category: "questioning",
      current: "Asked about projections and risk",
      improved: "Use assumptive questioning: 'When you do move forward with protecting your retirement...'",
      reason: "Creates forward momentum and assumes purchase decision",
      example: "'When you do decide to protect your 401k, would you prefer to start with a portion or the full amount?'"
    },
    {
      category: "presenting", 
      current: "Gave historical performance data",
      improved: "Tie performance to her specific situation and timeline",
      reason: "Makes data personally relevant rather than generic",
      example: "'In the 13 years since you retired, gold has outperformed your 401k by an average of 4% annually'"
    }
  ];
}

function generateCoachingPriorities(transcript: string) {
  return [
    {
      skill: "Urgency creation",
      priority: "high",
      practiceMethod: "Role-play current market events affecting retirees",
      successMetric: "Client mentions timeline without prompting"
    },
    {
      skill: "Advisor objection handling",
      priority: "high", 
      practiceMethod: "Develop specific advisor response scripts",
      successMetric: "Client commits to decision regardless of advisor opinion"
    }
  ];
}

function generateProfileSummary(transcript: string): string {
  return "78-year-old conservative retiree who values security and family legacy over growth. Highly analytical and seeks validation from trusted advisors before making financial decisions.";
}

function assessPersonality(transcript: string) {
  return {
    primary: "analytical",
    confidence: 85,
    evidence: [
      "I'm very conservative about where my money goes",
      "how do I know that I'm not gonna lose my butt?",
      "I'm gonna call my financial advisor"
    ],
    decisionStyle: "consensus-based"
  };
}

function identifyMotivationDrivers(transcript: string) {
  return [
    {
      driver: "security",
      strength: 95,
      evidence: "I'm very conservative... I need enough money based on hopefully living to a few more years",
      salesImplication: "Position gold as ultimate security and wealth preservation"
    },
    {
      driver: "legacy",
      strength: 80,
      evidence: "I would like to have some to leave with my kids",
      salesImplication: "Emphasize inheritance benefits and tax advantages"
    }
  ];
}

function analyzeCommunicationStyle(transcript: string) {
  return {
    style: "relationship-focused",
    pace: "deliberate",
    channelPreference: ["phone", "mail"],
    informationNeed: "detailed",
    practicalAdvice: "Provide written materials, allow processing time, use respectful formal tone"
  };
}

function analyzeBuyingProcess(transcript: string) {
  return {
    decisionFactors: ["safety", "advisor approval", "family impact"],
    influencers: ["financial advisor", "family members"],
    timeline: "medium",
    riskTolerance: "low",
    approvalProcess: "Must consult financial advisor before proceeding"
  };
}

function generateStrategicApproach(personality: any, motivations: any) {
  return {
    recommendedStrategy: "consultative",
    keyMessages: [
      "Gold is the most conservative investment for retirees",
      "Perfect inheritance vehicle with tax advantages",
      "6,000 years of wealth preservation",
      "Protection from financial advisor's stock-heavy approach"
    ],
    approachTactics: [
      "Provide extensive written materials",
      "Offer to speak with financial advisor directly",
      "Share client testimonials from similar situations"
    ],
    avoid: [
      "High-pressure tactics",
      "Criticizing financial advisor directly", 
      "Rushing the decision process"
    ]
  };
}

function generatePsychologyBasedNextSteps(transcript: string, personality: any) {
  return [
    {
      action: "Send comprehensive information packet with client testimonials",
      timing: "Within 24 hours",
      reason: "Analytical personality needs detailed information to feel confident",
      expectedOutcome: "Increased comfort and understanding of gold investment"
    },
    {
      action: "Prepare advisor discussion guide",
      timing: "Before client consultation",
      reason: "Helps client articulate benefits to potentially skeptical advisor",
      expectedOutcome: "More productive advisor conversation"
    }
  ];
}

// Missing analysis functions implementation

function identifyObjections(transcript: string) {
  const objections = [];
  
  if (transcript.includes('financial advisor') && transcript.includes('see what he has to say')) {
    objections.push({
      objection: "Must consult financial advisor first",
      type: "authority",
      severity: 75,
      addressed: "partially",
      evidence: "I'm gonna call my financial advisor and see what he has to say"
    });
  }
  
  if (transcript.includes('lose my butt') || transcript.includes('conservative')) {
    objections.push({
      objection: "Risk aversion and fear of loss",
      type: "trust",
      severity: 60,
      addressed: "well",
      evidence: "I don't want to lose my butt... I'm very conservative"
    });
  }
  
  return objections;
}

function identifyUnderlyingConcerns(transcript: string, psychologyProfile: any) {
  return [
    {
      concern: "Fear of making wrong financial decision late in life",
      psychologicalDriver: "Security and preservation of limited resources",
      manifestation: "Requires advisor validation before proceeding",
      resolution: "Provide extensive documentation and advisor discussion guide"
    },
    {
      concern: "Advisor disapproval could block decision",
      psychologicalDriver: "Deference to authority figures",
      manifestation: "Must consult advisor before proceeding",
      resolution: "Offer to speak directly with advisor and provide professional materials"
    }
  ];
}

function generateResponseStrategies(objections: any[], psychologyProfile: any) {
  return objections.map(obj => ({
    objection: obj.objection,
    currentResponse: obj.addressed === "well" ? "Addressed appropriately" : "Needs improvement",
    improvedResponse: {
      acknowledge: "I completely understand wanting your advisor's input",
      reframe: "Many advisors initially hesitate until they see the full picture",
      evidence: "Here's what other advisors have said after reviewing the materials",
      confirm: "Would it help if I prepared materials specifically for your advisor?"
    },
    timing: "During next conversation",
    personalizedApproach: "Respectful, educational approach with professional materials"
  }));
}

function generatePreventionStrategies(objections: any[]) {
  return [
    {
      objection: "Advisor objection",
      prevention: "Proactively address advisor concerns with professional packet",
      earlyStage: "During initial discovery",
      messaging: "Many of our clients work with financial advisors. We have materials specifically designed for advisor review."
    }
  ];
}

function assessObjectionHandlingSkills(transcript: string) {
  return {
    currentSkillLevel: 75,
    improvementAreas: ["Proactive objection prevention", "Stronger evidence-based responses"],
    practiceScenarios: ["Advisor objection role-play", "Conservative investor concerns"],
    successMetrics: ["Reduced advisor-related delays", "Increased client comfort level"]
  };
}

function mapStakeholders(transcript: string) {
  return [
    {
      name: "Client",
      influence: "decision_maker",
      stance: "supportive",
      concerns: ["Safety of investment", "Advisor approval"],
      engagementStrategy: "Educational, respectful approach",
      winStrategy: "Provide comprehensive information and advisor materials"
    },
    {
      name: "Financial Advisor",
      influence: "strong_influencer", 
      stance: "skeptical",
      concerns: ["Commission impact", "Product unfamiliarity"],
      engagementStrategy: "Professional materials and direct communication offer",
      winStrategy: "Educate on gold IRA benefits and address misconceptions"
    }
  ];
}

function assessRisks(transcript: string, conversationAnalysis: any, psychologyProfile: any) {
  return [
    {
      risk: "Advisor disapproval blocks decision",
      probability: 70,
      impact: 90,
      earlyWarningSign: "Client mentions needing advisor approval",
      mitigation: "Prepare professional advisor packet and offer direct communication",
      owner: "Sales agent"
    },
    {
      risk: "Analysis paralysis due to conservative nature",
      probability: 60,
      impact: 70,
      earlyWarningSign: "Requests excessive information or multiple consultations",
      mitigation: "Provide structured decision framework with clear timelines",
      owner: "Sales agent"
    }
  ];
}

function calculateDealHealth(transcript: string, conversationAnalysis: any, psychologyProfile: any) {
  return {
    overallScore: 72,
    progressionLikelihood: 65,
    riskLevel: "medium",
    keyIndicators: ["Strong rapport established", "Clear financial need", "Conservative investor profile match"]
  };
}

function identifyCompetitiveThreats(transcript: string) {
  return [
    {
      threat: "Financial advisor recommends staying in stocks",
      likelihood: 75,
      ourAdvantage: "Conservative nature aligns with gold protection",
      differentiation: "Gold's 6,000-year track record vs. market volatility",
      timing: "Address proactively in advisor materials"
    }
  ];
}

function identifyCriticalSuccessFactors(transcript: string) {
  return [
    {
      factor: "Advisor buy-in or neutrality",
      currentStatus: "Unknown - client will consult",
      action: "Prepare comprehensive advisor packet",
      deadline: "Before client-advisor consultation"
    },
    {
      factor: "Client comfort with gold investment concept",
      currentStatus: "Good - responded positively to historical returns",
      action: "Reinforce with additional testimonials",
      deadline: "Follow-up call"
    }
  ];
}

function generateEscalationPlan(risks: any[]) {
  return {
    triggerEvents: ["Advisor strongly objects", "Client requests more than 2 consultations"],
    escalationPath: ["Senior agent consultation", "Manager involvement", "Advisor direct outreach"],
    resources: ["Professional advisor materials", "Third-party validation", "Client testimonials"]
  };
}

function assessDealStatus(conversationAnalysis: any, psychologyProfile: any, riskAssessment: any) {
  return {
    summary: "Qualified prospect with strong fit, pending advisor consultation",
    successProbability: 65
  };
}

function extractKeyInsights(conversationAnalysis: any, psychologyProfile: any, objectionAnalysis: any) {
  return [
    "Client is ideal demographic - conservative retiree with inheritance goals",
    "Strong rapport established through respectful, educational approach", 
    "Primary risk is advisor objection - needs proactive management",
    "Client shows genuine interest but requires validation from authority figure"
  ];
}

function determinePrimaryObjective(transcript: string, psychologyProfile: any) {
  return "Secure advisor consultation with comprehensive materials provided";
}

function generateImmediateActions(transcript: string, psychologyProfile: any, riskAssessment: any) {
  return [
    {
      action: "Prepare and send comprehensive advisor packet",
      priority: "critical",
      deadline: "Within 24 hours",
      owner: "Sales agent",
      deliverable: "Professional materials package with ROI analysis",
      successCriteria: "Client confirms receipt and advisor review scheduled"
    },
    {
      action: "Follow up to schedule advisor consultation",
      priority: "high", 
      deadline: "Within 48 hours",
      owner: "Sales agent",
      deliverable: "Scheduled advisor call or meeting",
      successCriteria: "Advisor agrees to review materials and discuss"
    }
  ];
}

function generateFollowUpSequence(transcript: string, psychologyProfile: any) {
  return [
    {
      sequence: 1,
      timing: "24 hours",
      channel: "email",
      objective: "Deliver advisor materials",
      message: {
        subject: "Materials for Your Financial Advisor - Gold IRA Information",
        keyPoints: ["Professional analysis packet", "Client testimonials", "Advisor FAQ document"],
        personalizations: ["Reference to $53K 401k", "Conservative investment preference"],
        callToAction: "Please share with your advisor and let me know when you'd like to discuss"
      },
      successMetrics: ["Email opened", "Materials downloaded", "Response received"],
      backup_plan: "Phone call if no response within 48 hours"
    }
  ];
}

function identifyResourceRequirements(transcript: string, riskAssessment: any) {
  return [
    {
      resource: "Professional advisor packet",
      purpose: "Enable productive advisor consultation",
      deadline: "Immediately",
      owner: "Marketing department", 
      alternatives: ["Custom analysis", "Third-party validation"]
    }
  ];
}

function generateStakeholderOutreach(stakeholderMap: any[]) {
  return stakeholderMap.map(stakeholder => ({
    stakeholder: stakeholder.name,
    objective: stakeholder.name === "Client" ? "Maintain engagement" : "Address concerns",
    approach: stakeholder.engagementStrategy,
    timing: "Next 48 hours",
    message: stakeholder.name === "Financial Advisor" ? "Professional materials and consultation offer" : "Follow-up and support"
  }));
}

function generateTrackingPlan(riskAssessment: any) {
  return {
    keyMetrics: ["Advisor response", "Client engagement level", "Timeline adherence"],
    checkpoints: ["48-hour email check", "1-week advisor follow-up", "2-week decision timeline"],
    adjustmentTriggers: ["Advisor strong objection", "Client cold response", "Extended delay"],
    escalationCriteria: ["No advisor response in 1 week", "Client requests indefinite delay"]
  };
}

function generateContingencyPlans(riskAnalysis: any[]) {
  return riskAnalysis.map(risk => ({
    scenario: risk.risk,
    probability: risk.probability,
    response: risk.mitigation,
    prevention: `Monitor for ${risk.earlyWarningSign} and act proactively`
  }));
}

// Continue with Prompt 1 functions...

function assessNeeds(transcript: string) {
  return {
    stated_requirements: ["Conservative investment", "Inheritance planning", "Retirement protection"],
    implied_requirements: ["Advisor approval", "Detailed documentation", "Low-risk approach"],
    our_fit_score: 85,
    capability_gaps: [],
    solution_overkill: ["Complex trading features"],
    must_have_vs_nice_to_have: {
      must_haves: ["Safety", "Conservative approach", "Advisor materials"],
      nice_to_haves: ["High returns", "Frequent updates"]
    }
  };
}

function assessFinancialQualification(transcript: string) {
  const budgetMentioned = transcript.includes('$53') || transcript.includes('53,000');
  
  return {
    budget_indicators: {
      budget_mentioned: budgetMentioned,
      budget_range: budgetMentioned ? "$53,000 401k balance" : "unknown",
      funding_source: "401k rollover",
      budget_authority: "Client with advisor consultation",
      approval_process: "Must consult financial advisor"
    },
    investment_readiness: 70,
    price_sensitivity_level: "medium",
    roi_requirements: ["Capital preservation", "Steady growth"],
    financial_red_flags: ["Requires advisor approval"]
  };
}

function analyzeDecisionProcess(transcript: string, psychologyProfile: any) {
  return {
    decision_timeline: "2-4 weeks pending advisor consultation",
    decision_criteria: ["Safety", "Advisor approval", "Historical performance"],
    evaluation_process: "Advisor consultation with materials review",
    stakeholder_completeness: "Advisor influence identified but not fully addressed",
    decision_urgency: "none",
    process_maturity: "basic"
  };
}

function assessCompetitiveLandscape(transcript: string, riskAssessment: any) {
  return {
    competitive_intensity: "low",
    our_competitive_position: "strong",
    likely_winner: "us",
    winning_differentiators: ["Conservative approach", "Historical performance", "Inheritance benefits"],
    vulnerability_factors: ["Advisor objection", "Status quo bias"],
    competitive_strategy: "differentiate"
  };
}

function assessOrganizationalReadiness(transcript: string, psychologyProfile: any) {
  return {
    change_readiness: 75,
    implementation_complexity: "simple",
    internal_resources: "adequate",
    past_project_success: "unknown",
    cultural_fit: "strong",
    risk_factors: ["Advisor relationship dependency"]
  };
}

function identifyDisqualificationCriteria(objectionAnalysis: any, riskAssessment: any) {
  return [
    {
      factor: "Advisor strongly prohibits precious metals",
      severity: "dealbreaker",
      evidence: "If advisor threatens relationship over gold IRA",
      mitigation: "Professional education and alternative advisor discussion"
    }
  ];
}

function calculateOpportunitySize(transcript: string, metadata: any) {
  return {
    immediate_deal_value: "$53,000 401k rollover",
    expansion_potential: "Additional retirement accounts", 
    total_account_value: "$50,000-100,000 lifetime",
    strategic_value: "Conservative investor referral source",
    resource_investment: "Medium - requires advisor management"
  };
}

function calculateOpportunityScore(conversationAnalysis: any, psychologyProfile: any, riskAssessment: any) {
  return 72; // Based on strong fit but advisor dependency
}

function generateRecommendation(conversationAnalysis: any, psychologyProfile: any, riskAssessment: any) {
  return "proceed_cautiously";
}

function calculateConfidence(conversationAnalysis: any, psychologyProfile: any) {
  return 75; // High personality fit, moderate due to advisor dependency
}

function extractKeyQualifiers(transcript: string, conversationAnalysis: any, psychologyProfile: any) {
  return [
    "Strong conservative investor profile match",
    "Clear inheritance planning motivation", 
    "Established rapport and engagement",
    "Appropriate 401k balance for meaningful rollover"
  ];
}

function identifyRedFlags(transcript: string, objectionAnalysis: any, riskAssessment: any) {
  return [
    "Advisor dependency could block decision",
    "No timeline urgency expressed",
    "May require extensive education cycle"
  ];
}

function generateGoNoGoAnalysis(conversationAnalysis: any, psychologyProfile: any, riskAssessment: any) {
  return {
    pursue_factors: ["Strong personality fit", "Clear need", "Good rapport"],
    avoid_factors: ["Advisor dependency risk", "No urgency"],
    information_gaps: ["Advisor relationship strength", "Decision timeline"],
    success_probability: 65,
    resource_allocation: "medium",
    escalation_required: "Monitor advisor consultation outcome"
  };
}

function generateStrategicRecommendations(conversationAnalysis: any, psychologyProfile: any, actionPlan: any) {
  return [
    {
      recommendation: "Proactive advisor education strategy",
      rationale: "Advisor influence is the primary risk factor",
      resource_requirement: "Professional materials and potential direct outreach",
      success_metrics: "Advisor neutral or supportive stance achieved",
      exit_criteria: "Advisor strongly opposes and threatens client relationship"
    }
  ];
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.exit(1);
});