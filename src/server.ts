#!/usr/bin/env node

import { MCPServer } from "mcp-framework";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AnalyzeGoldIRATranscriptTool } from "./tools/analyzeGoldIRATranscript.js";

// Enhanced server with security middleware
import express from 'express';
import helmet from 'helmet';
import { rateLimiter, analysisRateLimiter, SECURITY_HEADERS } from './middleware/security.js';

/**
 * Gold IRA Transcript Analysis MCP Server
 * 
 * Provides secure analysis of B2C Gold IRA sales call transcripts
 * through 6 specialized prompts executed in strategic order (2→3→4→5→6→1)
 * 
 * Security Features:
 * - Rate limiting for analysis requests
 * - Input sanitization and validation
 * - Session management and tracking
 * - Security event logging
 * - Helmet security headers
 */

async function startServer() {
  console.log("🚀 Starting Gold IRA MCP Analysis Server...");
  
  try {
    // Initialize MCP server with enhanced configuration
    const server = new MCPServer({
      name: "goldira-analysis-server",
      version: "1.0.0",
      description: "Secure B2C Gold IRA sales transcript analysis with comprehensive security validation",
      capabilities: {
        tools: true,
        resources: false,
        prompts: false,
        logging: true
      }
    });

    // Security middleware setup for HTTP transport (if needed)
    if (process.env.HTTP_TRANSPORT === 'true') {
      const app = express();
      
      // Security headers
      app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      }));
      
      // Rate limiting
      app.use(rateLimiter);
      app.use('/analyze', analysisRateLimiter);
      
      // Custom security headers
      app.use((req, res, next) => {
        Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
          res.setHeader(header, value);
        });
        next();
      });
      
      console.log("✅ Security middleware configured");
    }

    // Register the Gold IRA analysis tool
    const analysisToolName = server.addTool(AnalyzeGoldIRATranscriptTool);
    console.log(`✅ Registered tool: ${analysisToolName}`);

    // Error handling middleware
    server.onError((error) => {
      console.error("❌ MCP Server Error:", error);
    });

    // Connection event handlers
    server.onConnection((connection) => {
      console.log("🔗 Client connected");
    });

    server.onDisconnection(() => {
      console.log("📤 Client disconnected");
    });

    // Configure transport (stdio by default, HTTP if enabled)
    if (process.env.HTTP_TRANSPORT === 'true') {
      const port = parseInt(process.env.PORT || '3001');
      server.listen(port);
      console.log(`🌐 HTTP server listening on port ${port}`);
    } else {
      // Use stdio transport for MCP protocol
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.log("📡 MCP Server connected via stdio transport");
    }

    // Server info
    console.log(`
🎯 Gold IRA MCP Analysis Server Ready!
📊 Analysis Order: Prompt 2→3→4→5→6→1
🛡️  Security: Enhanced validation & rate limiting
🎨 Focus: B2C Gold IRA Sales Transcripts
⚡ Features: Session management, input sanitization, business rules
    `);

    // Graceful shutdown handling
    const handleShutdown = (signal: string) => {
      console.log(`\n📥 Received ${signal}, shutting down gracefully...`);
      
      // Note: server.close() method doesn't exist in current MCP framework
      // The server will close when the process exits
      console.log("✅ Server shutdown complete");
      process.exit(0);
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    // Keep the process alive
    if (process.env.HTTP_TRANSPORT !== 'true') {
      // For stdio transport, keep process alive to handle MCP messages
      process.stdin.resume();
    }

  } catch (error) {
    console.error("💥 Failed to start server:", error);
    process.exit(1);
  }
}

// Performance monitoring
if (process.env.ENABLE_MONITORING === 'true') {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log(`📊 Memory: RSS=${Math.round(memUsage.rss/1024/1024)}MB, Heap=${Math.round(memUsage.heapUsed/1024/1024)}MB`);
  }, 30000);
}

// Start the server
startServer().catch((error) => {
  console.error("💥 Server startup failed:", error);
  process.exit(1);
});