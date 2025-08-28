import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Define session configuration schema
export const configSchema = z.object({
  // No special configuration needed for this server
});

// Utility functions for data extraction
function extractContactInfo(transcript: string): {
  name?: string;
  phone?: string;
  email?: string;
  location?: string;
} {
  // Look for prospect name in context - often mentioned after "speak with" or "calling for"
  const prospectNameMatch = transcript.match(/(?:speak with|calling for|regarding)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i) ||
                           transcript.match(/(?:Yes,?\s*this is|I'm|My name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  
  const phoneMatch = transcript.match(/\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/);
  const emailMatch = transcript.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  
  // Look for location mentions - states, cities, geographic references
  const locationMatch = transcript.match(/(?:located in|from|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i) ||
                        transcript.match(/([A-Z][a-z]+)\s+near\s+the\s+I-/i);

  return {
    name: prospectNameMatch ? prospectNameMatch[1] : undefined,
    phone: phoneMatch ? `(${phoneMatch[1]})${phoneMatch[2]}-${phoneMatch[3]}` : undefined,
    email: emailMatch ? emailMatch[1] : undefined,
    location: locationMatch ? locationMatch[1] : undefined,
  };
}

function extractFinancialInfo(transcript: string): {
  amounts: string[];
  investments: string[];
  timeline?: string;
} {
  // Look for dollar amounts with more context - avoid years and other numbers
  const dollarMatches = Array.from(transcript.matchAll(/\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)\s*(?:thousand|k)?/gi))
    .filter(match => {
      const amount = parseInt(match[1].replace(/,/g, ''));
      return amount >= 1000; // Only include meaningful financial amounts
    });
  
  const investmentMatches = Array.from(transcript.matchAll(/(?:401\s*k|IRA|Roth|CD|checking account|savings|stock market|bond|mutual fund)/gi));
  const timelineMatch = transcript.match(/(?:retire|retirement).*?(\d+)\s*(?:year|month)/i);

  return {
    amounts: [...new Set(dollarMatches.map(match => '$' + match[1]))],
    investments: [...new Set(investmentMatches.map(match => match[0]))],
    timeline: timelineMatch ? timelineMatch[0] : undefined,
  };
}

function extractAge(transcript: string): number | undefined {
  // Look for age in various contexts
  const ageMatch = transcript.match(/(?:I'm|I am|age|you're)\s*(\d{1,2})\s*years?\s*old/i) ||
                   transcript.match(/(\d{1,2})\s*years?\s*old/i) ||
                   transcript.match(/(?:I'm|I am)\s*(\d{1,2})/i);
  
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    // Validate age is reasonable (25-100)
    return age >= 25 && age <= 100 ? age : undefined;
  }
  return undefined;
}

function calculateProspectScore(transcript: string): number {
  let score = 0;
  const financial = extractFinancialInfo(transcript);
  const age = extractAge(transcript);
  
  // Financial capacity (0-60 points)
  if (financial.amounts.some(amount => parseInt(amount.replace(/[,$k]/gi, '')) >= 100)) score += 40;
  else if (financial.amounts.some(amount => parseInt(amount.replace(/[,$k]/gi, '')) >= 50)) score += 25;
  else if (financial.amounts.length > 0) score += 10;

  // Age factor (0-30 points)
  if (age && age >= 55) score += 30;
  else if (age && age >= 45) score += 20;
  else if (age && age >= 35) score += 10;

  // Investment experience (0-40 points)
  if (financial.investments.length >= 3) score += 40;
  else if (financial.investments.length >= 2) score += 25;
  else if (financial.investments.length >= 1) score += 15;

  // Interest level (0-35 points)
  if (transcript.toLowerCase().includes('interested') || transcript.toLowerCase().includes('ready')) score += 25;
  if (transcript.toLowerCase().includes('gold') || transcript.toLowerCase().includes('silver')) score += 10;

  // Timeline urgency (0-35 points)
  if (transcript.toLowerCase().includes('soon') || transcript.toLowerCase().includes('immediate')) score += 35;
  else if (transcript.toLowerCase().includes('month') || transcript.toLowerCase().includes('week')) score += 20;
  else if (transcript.toLowerCase().includes('year')) score += 10;

  return Math.min(score, 200);
}

// Comprehensive Gold IRA Sales Analysis Function
function generateComprehensiveAnalysis(transcript: string): string {
  return `You are a world-class sales expert and transcript analysis engine, combining the best elements of Jordan Belfort's **Straight Line Method** and Michael Oliver's **Natural Selling.** Your primary objective is to dissect this precious metals sales call transcript and generate a **comprehensive, hyper-detailed lead card** that will empower brokers to close the prospect in their next interaction.

Your mission is to mine the call for **every shred of actionable intelligence**. Picture yourself as a strategist who needs to understand the prospect more deeply than they understand themselves—revealing their fears, motivations, financial nuances, emotional triggers, and anything that can be leveraged to maximize the chance of closing the sale.

Additionally, anywhere you provide **recommendations** (such as coaching or strategies for addressing objections), you must also explain **why** you are making that recommendation and include a **brief, practical example**. For instance, rather than just "craft a compelling narrative," you might say: "Tell a story that relates to their feelings of uncertainty about future market conditions, and show how gold investments historically provided a sense of control and security."

Analyze this transcript and provide your findings in a comprehensive analysis format covering:

### 1. **Extract and Organize Core Information**

#### a) Prospect Details
* Capture the prospect's core information: full name, email, phone, address, significant financial accounts, work history, family details, and financial capability level.
* Summarize the call in **extreme detail**, explaining what the prospect said and the salesperson's responses. Reveal how each piece of info might affect their buying decision.
* Include any relevant notes and background details (e.g. children going to college, other stressors, etc.).
* Classify the prospect's position in the sales process (e.g., early curiosity, mid-stage with specific objections, near closing, etc.).

#### b) Psychological Analysis
* Identify the prospect's "hot buttons" (deep emotional drivers such as fear of inflation, distrust of traditional banking, desire for control over finances, retirement security, etc.).
* Elucidate the emotional undercurrents and personal motivations behind these hot buttons.
* Include the **reason for interest** in gold/metals and the **prospect_score** (out of 200), along with a **rationale** justifying the score.
* Pinpoint any **explicit** or **implicit** objections and provide **tailored**, highly specific rebuttals or next steps to address them.
* Describe the decision-making style, urgency level, trust level, interest level, tone, and psychological profile.
* Wherever possible, clarify **why** your rebuttal or insight addresses their concern, and give a **short example** of how to use it in a conversation.

### 2. **Custom Action Plan**
* Propose a **step-by-step** follow-up strategy, including precise talking points, recommended tone, urgency triggers (e.g., referencing timely market changes or recent Fed decisions), and an ironclad closing strategy.
* Include recommended emails to send, to-do items, rapport-building suggestions, things to avoid, and a custom urgency strategy.
* Indicate **why** each action is critical and how it links directly to the prospect's objections or emotional drivers.
* Provide **examples** of how to phrase key statements or questions.

### 3. **Salesperson Performance Metrics**
* Analyze **speaking time distribution** (salesperson vs. prospect).
* Report the **question-to-statement ratio**, any key filler words, or tone shifts.
* Note how many times the salesperson attempted to close and whether those attempts were effective.
* Provide **actionable coaching** recommendations.
  * Base your advice on Jordan Belfort's **Straight Line Method** and Michael Oliver's **Natural Selling**.
  * Always explain **why** the recommendation is valuable.
  * Provide a **short, practical example** of how to implement it (e.g., "Use emotional framing like: 'Imagine the peace of mind knowing this is protected from market chaos…'").

### 4. **Follow-Up Scheduling**
* Create a **follow-up event summary**, including a clear name, conversation highlights, emotional and tactical factors, and a closing plan.
* Record the **date/time of the next follow-up** (if set) or recommend one based on urgency and lead context.
* Include the original call's **date and time** for timeline accuracy.

### 5. **Depth and Granularity**
* Every data point must be paired with **rationale**: why it matters, what it tells us, and how it can be used.
* Treat this analysis as a **sales strategist's intelligence report** — not a CRM note. This should feel like a tool that **arms a closer** with everything they need to succeed.
* Prioritize clarity, depth, and **tactical usability**.

**Transcript to Analyze:**
${transcript}

Provide a comprehensive analysis covering all these areas with specific, actionable intelligence and detailed reasoning for every recommendation.`;
}


// Export server creation function for Smithery CLI
export default function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new Server({
    name: "goldira-analysis-mcp",
    version: "3.0.0",
  }, {
    capabilities: {
      tools: {},
    },
  });

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "analyze_goldira_transcript",
          description: "World-class sales expert transcript analysis combining Jordan Belfort's Straight Line Method and Michael Oliver's Natural Selling. Generates hyper-detailed lead cards with psychological analysis, objection handling, and tactical recommendations for maximum closing potential.",
          inputSchema: {
            type: "object",
            properties: {
              transcript: {
                type: "string",
                description: "Complete sales call transcript text"
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

    const parsed = z.object({ transcript: z.string() }).parse(args);
    const { transcript } = parsed;

    // Generate comprehensive sales analysis using world-class sales expert prompt
    const fullAnalysis = generateComprehensiveAnalysis(transcript);

    return {
      content: [
        {
          type: "text",
          text: fullAnalysis
        }
      ],
    };
  });

  return server;
}

// STDIO compatibility for local development
async function main() {
  const server = createServer({
    config: {},
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Enhanced Gold IRA Analysis MCP Server running in stdio mode");
}

// Run STDIO mode when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}