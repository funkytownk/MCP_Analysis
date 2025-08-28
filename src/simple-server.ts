#!/usr/bin/env node

/**
 * Simplified Gold IRA Analysis MCP Server for smithery.ai
 * 
 * Uses the standard MCP SDK directly without the mcp-framework wrapper
 * to ensure compatibility with smithery.ai deployment
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
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

// Mock prompt content (in production, these would be loaded from Prompts1-6 files)
const PROMPT_CONTENTS = {
  "Prompt.2": "Analyze conversation dynamics, rapport building, and engagement quality...",
  "Prompt.3": "Analyze customer psychology, decision-making style, and motivations...",
  "Prompt.4": "Identify and analyze objections, handling effectiveness...",
  "Prompt.5": "Assess deal risk factors and progression likelihood...",
  "Prompt.6": "Create action plan and follow-up strategy...",
  "Prompt.1": "Final comprehensive qualification assessment incorporating all previous analyses...",
};

class GoldIRAAnalysisMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
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

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === "analyze_goldira_transcript") {
        try {
          // Validate input
          const validatedArgs = AnalyzeTranscriptSchema.parse(args);
          
          // Generate analysis instructions for AI execution
          const result = this.generateAnalysisInstructions(validatedArgs);
          
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
  }

  private generateAnalysisInstructions(input: z.infer<typeof AnalyzeTranscriptSchema>) {
    const { transcript, metadata = {} } = input;
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    const executionOrder = [
      { order: 1, promptId: 'conversation', fileName: 'Prompt.2', title: 'Conversation Dynamics Analysis' },
      { order: 2, promptId: 'psychology', fileName: 'Prompt.3', title: 'Psychology & Decision-Making Profile' },
      { order: 3, promptId: 'objections', fileName: 'Prompt.4', title: 'Objection Analysis & Handling' },
      { order: 4, promptId: 'dealRisk', fileName: 'Prompt.5', title: 'Deal Risk Assessment' },
      { order: 5, promptId: 'actionPlan', fileName: 'Prompt.6', title: 'Action Plan & Follow-up Strategy' },
      { order: 6, promptId: 'qualification', fileName: 'Prompt.1', title: 'Strategic Qualification Assessment (FINAL)' }
    ];

    return {
      sessionId,
      timestamp: new Date().toISOString(),
      
      // Instructions for the AI assistant
      analysisInstructions: `
# Gold IRA Sales Transcript Analysis

You are analyzing a B2C Gold IRA sales call transcript through 6 specialized prompts that must be executed in this specific order: 2→3→4→5→6→1

**CRITICAL EXECUTION ORDER**: Prompt.2 → Prompt.3 → Prompt.4 → Prompt.5 → Prompt.6 → Prompt.1 (final assessment)

Each prompt builds on the previous analysis, with Prompt.1 serving as the comprehensive final qualification assessment that incorporates insights from all previous prompts.

**B2C Gold IRA Context:**
- Focus: Individual/family retirement planning with precious metals
- Target: Pre-retirement and retired individuals
- Key Factors: Retirement accounts (IRA, 401k, etc.), family decision-making, investment experience
- Goal: Qualification for Gold IRA rollover or purchase

Execute each prompt in order and provide structured JSON results.
      `,
      
      // The transcript to analyze
      transcript,
      
      // Call metadata
      metadata,
      
      // Prompts in execution order
      prompts: executionOrder.map(step => ({
        order: step.order,
        id: step.promptId,
        fileName: step.fileName,
        title: step.title,
        prompt: PROMPT_CONTENTS[step.fileName as keyof typeof PROMPT_CONTENTS],
        context: this.buildPromptContext(step.promptId, metadata),
        isFirstPrompt: step.order === 1,
        isFinalPrompt: step.promptId === 'qualification'
      })),
      
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
      
      // Processing metadata
      processing: {
        validated: true,
        sanitized: true,
        processingTime: Date.now()
      }
    };
  }

  private buildPromptContext(promptId: string, metadata: any): string {
    const baseContext = `
**Call Context:**
- Agent: ${metadata.agentName || 'Not specified'}
- Duration: ${metadata.duration || 'Not specified'} minutes
- Retirement Status: ${metadata.retirementStatus || 'Not specified'}
- Account Types: ${metadata.accountTypes?.join(', ') || 'Not specified'}
- Investment Experience: ${metadata.investmentExperience || 'Not specified'}
- Family Members: ${metadata.familyMembers || 'Not specified'}
    `;

    const contextSpecific = {
      conversation: "Focus on conversation flow, rapport building, and engagement quality.",
      psychology: "Build on conversation insights to understand personality and decision-making style.",
      objections: "Identify objections and assess handling effectiveness based on psychology profile.",
      dealRisk: "Evaluate deal progression likelihood using conversation, psychology, and objection insights.",
      actionPlan: "Create specific follow-up actions based on complete analysis so far.",
      qualification: "FINAL comprehensive assessment incorporating ALL previous analyses."
    };

    return baseContext + "\n\n" + (contextSpecific[promptId as keyof typeof contextSpecific] || "");
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on('SIGINT', async () => {
      console.log("\n🛑 Shutting down Gold IRA MCP server...");
      await this.server.close();
      process.exit(0);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.log("🎯 Gold IRA MCP Analysis Server Started!");
    console.log("📊 Analysis Order: Prompt 2→3→4→5→6→1");
    console.log("🎨 Focus: B2C Gold IRA Sales Transcripts");
  }
}

// Start the server
const server = new GoldIRAAnalysisMCPServer();
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});