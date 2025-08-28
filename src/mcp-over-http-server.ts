#!/usr/bin/env node

/**
 * Standard MCP Server over HTTP Transport for Smithery
 * Based on working stdio server but using HTTP transport
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import express from "express";
import cors from "cors";

// Input validation schema
const AnalyzeTranscriptSchema = z.object({
  transcript: z.string().min(100).max(100000),
});

// Gold IRA Analysis Functions (from original server)
function analyzeOverallCallQuality(transcript: string): string {
  const prompts = [
    "Analyze the overall quality and professionalism of this Gold IRA sales call",
    "Rate the sales representative's performance on a scale of 1-10 in the following areas:",
    "- Opening and rapport building",
    "- Needs assessment and questioning", 
    "- Product presentation and education",
    "- Objection handling",
    "- Closing attempts and urgency creation",
    "- Overall professionalism and compliance",
    "Provide specific examples from the transcript to support each rating."
  ];

  return prompts.join('\n') + '\n\nTranscript to analyze:\n' + transcript.slice(0, 2000) + '...';
}

function identifyCustomerProfile(transcript: string): string {
  const prompts = [
    "Based on this Gold IRA sales call transcript, create a detailed customer profile including:",
    "1. Demographics (age, location, occupation if mentioned)",
    "2. Financial situation indicators (assets, income, investment experience)",
    "3. Investment goals and concerns",
    "4. Risk tolerance and timeline", 
    "5. Decision-making style and influencers",
    "6. Pain points and motivations",
    "7. Likely objections and concerns",
    "Use specific quotes from the transcript to support your analysis."
  ];

  return prompts.join('\n') + '\n\nTranscript to analyze:\n' + transcript.slice(0, 2000) + '...';
}

function assessQualificationLevel(transcript: string): string {
  const prompts = [
    "Evaluate the prospect's qualification level for Gold IRA investment based on this call:",
    "QUALIFICATION CRITERIA:",
    "- Minimum investable assets ($50K+ typically required)",
    "- Age and retirement timeline (typically 50+ for maximum benefit)",
    "- Current retirement account status (401k, IRA, etc.)",
    "- Investment sophistication and precious metals knowledge",
    "- Decision-making authority and timeline",
    "- Compliance with suitability requirements",
    "Provide a qualification score (1-10) and recommend next steps."
  ];

  return prompts.join('\n') + '\n\nTranscript to analyze:\n' + transcript.slice(0, 2000) + '...';
}

function evaluateComplianceAdherence(transcript: string): string {
  const prompts = [
    "Review this Gold IRA sales call for compliance with precious metals and retirement account regulations:",
    "CHECK FOR:",
    "- Proper risk disclosures and suitability discussions",
    "- Accurate product information and fee transparency",
    "- Appropriate recommendations based on customer needs",
    "- Professional conduct and ethical sales practices",
    "- Regulatory compliance (SEC, CFTC, IRS guidelines)",
    "- Documentation and verification requirements",
    "Identify any potential compliance issues and provide recommendations."
  ];

  return prompts.join('\n') + '\n\nTranscript to analyze:\n' + transcript.slice(0, 2000) + '...';
}

function identifyFollowUpActions(transcript: string): string {
  const prompts = [
    "Based on this Gold IRA sales call, recommend specific follow-up actions:",
    "1. Immediate next steps (within 24-48 hours)",
    "2. Information needed from prospect",
    "3. Documentation to send",
    "4. Objections to address in follow-up",
    "5. Timeline for next contact",
    "6. Alternative products or strategies to consider",
    "7. Risk management and compliance considerations",
    "Prioritize actions by importance and provide specific talking points."
  ];

  return prompts.join('\n') + '\n\nTranscript to analyze:\n' + transcript.slice(0, 2000) + '...';
}

function generateStrategicRecommendations(transcript: string): string {
  const prompts = [
    "Provide strategic recommendations for this Gold IRA prospect based on the call analysis:",
    "STRATEGIC AREAS:",
    "- Optimal approach for this specific customer type",
    "- Product recommendations and portfolio allocation",
    "- Timing and market positioning strategies",
    "- Risk mitigation and compliance considerations",
    "- Competitive advantages to emphasize",
    "- Long-term relationship building opportunities",
    "Include specific tactics and potential objection responses."
  ];

  return prompts.join('\n') + '\n\nTranscript to analyze:\n' + transcript.slice(0, 2000) + '...';
}

// Create the MCP server
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

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "analyze_goldira_transcript",
        description: "Analyze Gold IRA sales call transcripts through 6 specialized prompts executed in strategic order",
        inputSchema: {
          type: "object",
          properties: {
            transcript: {
              type: "string",
              description: "Sales call transcript text"
            }
          },
          required: ["transcript"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name !== "analyze_goldira_transcript") {
    throw new Error(`Unknown tool: ${name}`);
  }

  const parsed = AnalyzeTranscriptSchema.parse(args);
  const { transcript } = parsed;

  // Execute the 6 prompts in strategic order: 2→3→4→5→6→1
  const analyses = {
    customerProfile: identifyCustomerProfile(transcript),
    qualificationLevel: assessQualificationLevel(transcript),
    complianceAdherence: evaluateComplianceAdherence(transcript),
    followUpActions: identifyFollowUpActions(transcript),
    strategicRecommendations: generateStrategicRecommendations(transcript),
    overallCallQuality: analyzeOverallCallQuality(transcript)
  };

  const fullAnalysis = `
# Gold IRA Sales Call Analysis

## 1. Customer Profile Analysis
${analyses.customerProfile}

## 2. Qualification Assessment  
${analyses.qualificationLevel}

## 3. Compliance Review
${analyses.complianceAdherence}

## 4. Follow-Up Actions
${analyses.followUpActions}

## 5. Strategic Recommendations
${analyses.strategicRecommendations}

## 6. Overall Call Quality Evaluation
${analyses.overallCallQuality}

---
*Analysis complete. Review each section for actionable insights and next steps.*
`;

  return {
    content: [
      {
        type: "text",
        text: fullAnalysis
      }
    ]
  };
});

// Create Express app for HTTP transport
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', server: 'goldira-analysis-mcp' });
});

// MCP over SSE endpoint
app.get('/mcp', (req, res) => {
  const transport = new SSEServerTransport("/mcp", res);
  server.connect(transport);
});

// MCP over HTTP POST endpoint (for tools that prefer JSON-RPC over HTTP)
app.post('/mcp', (req, res) => {
  const transport = new SSEServerTransport("/mcp", res);
  server.connect(transport);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Server over HTTP running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`MCP SSE: http://localhost:${PORT}/mcp`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('MCP Server shutting down gracefully...');
  process.exit(0);
});