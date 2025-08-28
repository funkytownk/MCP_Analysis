#!/usr/bin/env node

/**
 * Debug HTTP Server for Gold IRA Analysis MCP
 * Logs all requests to understand Smithery scanning
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { z } from "zod";

const app = express();

// Comprehensive CORS
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json());

// Log all requests
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('---');
  next();
});

// Respond to all possible paths
app.all('*', (req: Request, res: Response) => {
  console.log(`Handling ${req.method} ${req.path}`);
  
  // Health check
  if (req.path === '/health') {
    res.json({
      status: 'ok',
      service: 'goldira-analysis-mcp',
      transport: 'http',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // Root discovery
  if (req.path === '/' || req.path === '') {
    res.json({
      name: "goldira-analysis-mcp",
      version: "1.0.0",
      description: "Advanced B2C Gold IRA sales call transcript analysis",
      mcp: {
        protocolVersion: "2024-11-05",
        capabilities: ["tools"],
        transport: "http"
      },
      endpoints: {
        health: "/health",
        mcp: "/mcp",
        tools: "/tools"
      }
    });
    return;
  }
  
  // MCP protocol endpoint
  if (req.path === '/mcp') {
    if (req.method === 'GET') {
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
      return;
    }
    
    if (req.method === 'POST') {
      const { method, params, id } = req.body || {};
      
      console.log(`MCP Method: ${method}`);
      
      const response: any = { id };
      
      switch (method) {
        case 'initialize':
          response.result = {
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
          response.result = {
            tools: [{
              name: "analyze_goldira_transcript",
              description: "Analyze B2C Gold IRA sales call transcripts through 6 specialized prompts",
              inputSchema: {
                type: "object",
                properties: {
                  transcript: {
                    type: "string",
                    description: "The sales call transcript to analyze",
                    minLength: 100,
                    maxLength: 100000
                  }
                },
                required: ["transcript"]
              }
            }]
          };
          break;
          
        case 'tools/call':
          if (params?.name === 'analyze_goldira_transcript') {
            response.result = {
              content: [{
                type: "text",
                text: JSON.stringify({
                  analysis: "Sample analysis result",
                  timestamp: new Date().toISOString()
                }, null, 2)
              }]
            };
          } else {
            response.error = {
              code: -32602,
              message: `Unknown tool: ${params?.name}`
            };
          }
          break;
          
        default:
          response.error = {
            code: -32601,
            message: `Unknown method: ${method}`
          };
      }
      
      res.json(response);
      return;
    }
  }
  
  // Tools endpoint
  if (req.path === '/tools') {
    res.json({
      tools: [{
        name: "analyze_goldira_transcript",
        description: "Analyze B2C Gold IRA sales call transcripts",
        endpoint: "/analyze",
        method: "POST",
        schema: {
          type: "object",
          properties: {
            transcript: { type: "string", minLength: 100 }
          },
          required: ["transcript"]
        }
      }]
    });
    return;
  }
  
  // Catch all - return info about what was requested
  res.json({
    message: `Received ${req.method} request to ${req.path}`,
    timestamp: new Date().toISOString(),
    available_endpoints: ["/", "/health", "/mcp", "/tools"],
    request_info: {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: Object.keys(req.headers),
      body_keys: req.body ? Object.keys(req.body) : []
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=== Debug MCP Server Started ===`);
  console.log(`Port: ${PORT}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Endpoints:`);
  console.log(`  GET  / - Discovery`);
  console.log(`  GET  /health - Health check`);
  console.log(`  GET  /mcp - MCP info`);
  console.log(`  POST /mcp - MCP protocol`);
  console.log(`  GET  /tools - Tools list`);
  console.log(`Waiting for requests...`);
  console.log(`================================`);
});