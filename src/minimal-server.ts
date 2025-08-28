#!/usr/bin/env node

/**
 * Minimal MCP HTTP Server for Smithery
 * Follows exact MCP HTTP transport specification
 */

import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Gold IRA Analysis Functions (from mcp-over-http-server.ts)
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

// Health endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// MCP HTTP endpoint - handles JSON-RPC over HTTP
app.post('/mcp', async (req: Request, res: Response) => {
  const { method, params, id } = req.body;
  
  console.log(`MCP Request: ${method} (ID: ${id})`);
  
  try {
    let result;
    
    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: "goldira-analysis-mcp",
            version: "1.0.0"
          }
        };
        break;
        
      case 'tools/list':
        result = {
          tools: [
            {
              name: "analyze_goldira_transcript",
              description: "Analyze Gold IRA sales call transcripts",
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
        break;
        
      case 'tools/call':
        if (params?.name === 'analyze_goldira_transcript') {
          const { transcript } = params.arguments as { transcript: string };
          
          if (!transcript) {
            throw new Error("Transcript is required");
          }

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

          result = {
            content: [
              {
                type: "text",
                text: fullAnalysis
              }
            ]
          };
        } else {
          throw new Error(`Unknown tool: ${params?.name}`);
        }
        break;
        
      default:
        throw new Error(`Unknown method: ${method}`);
    }
    
    res.json({ jsonrpc: "2.0", id, result });
    
  } catch (error) {
    console.error(`MCP Error:`, error);
    res.json({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      }
    });
  }
});

// Catch-all for debugging
app.all('*', (req: Request, res: Response) => {
  console.log(`${req.method} ${req.path} - Unknown endpoint`);
  res.status(404).json({ 
    error: 'Not found',
    available: ['/health', '/mcp']
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Minimal MCP Server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`MCP: http://localhost:${PORT}/mcp`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Server shutting down gracefully...');
  process.exit(0);
});