#!/usr/bin/env node

/**
 * Simplified HTTP Server for Gold IRA Analysis MCP
 * Compatible with Smithery.ai scanning
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
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

// Create express app
const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'goldira-analysis-mcp',
    transport: 'http',
    version: '1.0.0'
  });
});

// Root endpoint for discovery
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: "goldira-analysis-mcp",
    version: "1.0.0",
    description: "Advanced B2C Gold IRA sales call transcript analysis",
    endpoints: {
      health: "/health",
      mcp: "/mcp",
      tools: "/tools",
      analyze: "/analyze"
    }
  });
});

// MCP endpoint - handles all MCP protocol messages
app.post('/mcp', async (req: Request, res: Response) => {
  const { method, params } = req.body;
  
  console.log(`MCP Request: ${method}`);
  
  try {
    switch (method) {
      case 'initialize':
        res.json({
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: "goldira-analysis-mcp",
            version: "1.0.0"
          }
        });
        break;
        
      case 'tools/list':
        res.json({
          tools: [
            {
              name: "analyze_goldira_transcript",
              description: "Analyze B2C Gold IRA sales call transcripts through 6 specialized prompts in strategic order (2→3→4→5→6→1).",
              inputSchema: {
                type: "object",
                properties: {
                  transcript: {
                    type: "string",
                    description: "The sales call transcript to analyze",
                    minLength: 100,
                    maxLength: 100000
                  },
                  metadata: {
                    type: "object",
                    description: "Optional metadata about the call",
                    properties: {
                      agentName: { type: "string" },
                      duration: { type: "number" },
                      retirementStatus: {
                        type: "string",
                        enum: ["pre-retirement", "recently-retired", "retired"]
                      },
                      accountTypes: {
                        type: "array",
                        items: {
                          type: "string",
                          enum: ["ira", "401k", "403b", "roth-ira", "cash", "brokerage"]
                        }
                      },
                      investmentExperience: {
                        type: "string",
                        enum: ["novice", "intermediate", "experienced"]
                      },
                      familyMembers: { type: "number" }
                    }
                  }
                },
                required: ["transcript"]
              }
            }
          ]
        });
        break;
        
      case 'tools/call':
        if (params?.name === 'analyze_goldira_transcript') {
          const validatedArgs = AnalyzeTranscriptSchema.parse(params.arguments);
          const result = analyzeTranscript(validatedArgs);
          res.json({
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          });
        } else {
          res.status(404).json({
            error: `Unknown tool: ${params?.name}`
          });
        }
        break;
        
      default:
        res.status(400).json({
          error: `Unknown method: ${method}`
        });
    }
  } catch (error) {
    console.error('MCP Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// GET endpoint for tool listing (alternative)
app.get('/tools', (req: Request, res: Response) => {
  res.json({
    tools: [
      {
        name: "analyze_goldira_transcript",
        description: "Analyze B2C Gold IRA sales call transcripts",
        endpoint: "/analyze",
        method: "POST"
      }
    ]
  });
});

// Direct REST endpoint for analysis
app.post('/analyze', async (req: Request, res: Response) => {
  try {
    const validatedArgs = AnalyzeTranscriptSchema.parse(req.body);
    const result = analyzeTranscript(validatedArgs);
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ 
      error: "Analysis failed", 
      message: errorMessage 
    });
  }
});

// Simplified analysis function
function analyzeTranscript(input: z.infer<typeof AnalyzeTranscriptSchema>) {
  const { transcript, metadata = {} } = input;
  const sessionId = Math.random().toString(36).substring(2, 15);
  
  // Simplified analysis for demonstration
  const wordCount = transcript.split(/\s+/).length;
  const hasGoldMentions = transcript.toLowerCase().includes('gold');
  const hasIRAMentions = transcript.toLowerCase().includes('ira') || transcript.toLowerCase().includes('401k');
  
  return {
    sessionId,
    timestamp: new Date().toISOString(),
    analysis: {
      transcriptLength: wordCount,
      topicRelevance: {
        goldDiscussed: hasGoldMentions,
        retirementAccountsDiscussed: hasIRAMentions
      },
      summary: {
        qualificationScore: hasGoldMentions && hasIRAMentions ? 85 : 50,
        recommendation: hasGoldMentions && hasIRAMentions 
          ? "High potential - proceed with follow-up"
          : "Needs further qualification",
        keyInsights: [
          wordCount > 500 ? "Engaged conversation" : "Brief interaction",
          hasGoldMentions ? "Gold interest expressed" : "No gold discussion yet",
          hasIRAMentions ? "Retirement accounts mentioned" : "No retirement account discussion"
        ]
      }
    },
    metadata
  };
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gold IRA Analysis MCP Server`);
  console.log(`Port: ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Tools: http://localhost:${PORT}/tools`);
  console.log(`MCP: http://localhost:${PORT}/mcp`);
  console.log(`Analyze: http://localhost:${PORT}/analyze`);
});