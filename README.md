# Gold IRA Sales Analysis MCP Server

An advanced Model Context Protocol (MCP) server for analyzing B2C Gold IRA sales call transcripts through 6 specialized prompts executed in strategic order. Compatible with Claude Code, Gemini CLI, and other MCP clients. Hosted on [smithery.ai](https://smithery.ai) for broad accessibility.

## 🎯 Purpose

This MCP server provides AI assistants with structured prompts and context to perform comprehensive analysis of B2C Gold IRA sales calls. Instead of running the analysis internally, it supplies the AI with everything needed to execute the analysis using their own LLM capabilities.

## 🔄 Analysis Framework

### Execution Order: 2→3→4→5→6→1

The system executes 6 specialized prompts in a specific strategic order, with each analysis building context for the next:

1. **Prompt.2** - Conversation Dynamics Analysis *(First execution)*
2. **Prompt.3** - Psychology & Decision-Making Profile 
3. **Prompt.4** - Objection Analysis & Handling
4. **Prompt.5** - Deal Risk Assessment  
5. **Prompt.6** - Action Plan & Follow-up Strategy
6. **Prompt.1** - Strategic Qualification Assessment *(FINAL comprehensive)*

> **Critical Note**: Prompt.1 serves as the FINAL comprehensive assessment that synthesizes insights from all 5 previous analyses.

## 🎨 B2C Gold IRA Focus

Specifically designed for **Business-to-Consumer** Gold IRA sales analysis:

- **Target Audience**: Individual/family retirement planning
- **Key Factors**: Retirement accounts (IRA, 401k, etc.), family decision-making, investment experience
- **Context**: Pre-retirement and retired individuals considering precious metals
- **Goal**: Qualification for Gold IRA rollover or direct purchase

## 🚀 Quick Start

### Installation

```bash
npm install
npm run build
```

### Using with Claude Code

```bash
# Add to your Claude Code configuration
{
  "mcpServers": {
    "goldira-analysis": {
      "command": "node",
      "args": ["/path/to/dist/server.js"],
      "env": {}
    }
  }
}
```

### Using with Gemini CLI

```bash
# Configure MCP server in Gemini CLI
gemini mcp add goldira-analysis node /path/to/dist/server.js
```

### Smithery.ai Hosting

This server is available on [smithery.ai](https://smithery.ai) for instant access.

## 🛠 Usage

### Basic Analysis

```typescript
// Call the MCP tool
const result = await mcpClient.callTool('analyze_goldira_transcript', {
  transcript: "Your sales call transcript here...",
  metadata: {
    agentName: "John Smith",
    duration: 45,
    retirementStatus: "pre-retirement", 
    accountTypes: ["401k", "ira"],
    investmentExperience: "intermediate",
    familyMembers: 2
  }
});

// The result contains structured prompts and instructions
// for your AI assistant to execute
console.log(result.prompts); // Array of 6 prompts in order 2→3→4→5→6→1
console.log(result.analysisInstructions); // System instructions 
console.log(result.executionGuidance); // Step-by-step guidance
```

## 🔒 Security Features

- **Input Validation**: Comprehensive Zod schema validation and sanitization
- **Rate Limiting**: 100 requests/15min general, 5 analyses/minute
- **Session Management**: Secure session tracking with 30-minute timeout
- **Security Headers**: Helmet.js integration with CSP, HSTS, XSS protection
- **Audit Logging**: Complete security event logging and monitoring

## 🎉 Features

- ✅ Multi-AI assistant compatibility (Claude Code, Gemini CLI)
- ✅ Strategic 6-prompt execution order (2→3→4→5→6→1)
- ✅ B2C Gold IRA specialized analysis
- ✅ Enterprise-grade security validation
- ✅ Smithery.ai hosted for instant access
- ✅ Comprehensive documentation and examples
- ✅ TypeScript with full type safety
- ✅ Rate limiting and session management
- ✅ React frontend interface included

---

**Built for the future of AI-powered sales analysis** 🚀