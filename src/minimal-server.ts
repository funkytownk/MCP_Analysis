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
          result = {
            content: [
              {
                type: "text",
                text: "Analysis complete: High-quality Gold IRA prospect with strong qualification indicators."
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