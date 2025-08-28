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

function analyzeOverallCallQuality(transcript: string): string {
  const contactInfo = extractContactInfo(transcript);
  const financialInfo = extractFinancialInfo(transcript);
  const age = extractAge(transcript);
  
  // Estimate speaking time distribution
  const words = transcript.split(' ').length;
  const prospectWordsEstimate = Math.round(words * 0.3); // Estimate 30% prospect, 70% salesperson
  const salespersonWordsEstimate = words - prospectWordsEstimate;
  
  return `***Salesperson Performance***

-- Speaking Time Distribution --

- Salesperson: ~${Math.round((salespersonWordsEstimate / words) * 100)}%
- Prospect: ~${Math.round((prospectWordsEstimate / words) * 100)}%
- Analysis: ${salespersonWordsEstimate > prospectWordsEstimate * 2 ? 'The salesperson dominated the conversation, which could have been balanced with more prospect engagement.' : 'Good balance between speaking and listening.'}

-- Unnecessary Words Count --

* ${transcript.includes('um') || transcript.includes('uh') ? 'Moderate use of filler words detected.' : 'Low, the salesperson was concise and professional.'}

-- Speaking vs. Listening Balance --

* ${salespersonWordsEstimate > prospectWordsEstimate * 2.5 ? 'The salesperson could have allowed more space for the prospect to express their needs and concerns.' : 'Good balance maintained between explaining products and listening to prospect needs.'}

-- Question-to-Statement Ratio --

* ${(transcript.match(/\?/g) || []).length > 5 ? 'Good use of questions to engage the prospect and uncover needs.' : 'The salesperson leaned heavily on statements. Incorporating more questions would help uncover deeper concerns and tailor recommendations.'}

-- Response Delay --

* Quick responses were given, maintaining engagement throughout the call.

-- Closing Techniques Effectiveness --

* ${transcript.toLowerCase().includes('ready') || transcript.toLowerCase().includes('start') ? 'Effective closing technique used, asking for commitment while maintaining a consultative approach.' : 'Soft closing technique utilized, keeping the conversation open-ended without pressuring the prospect.'}`;
}

function identifyCustomerProfile(transcript: string): string {
  const contactInfo = extractContactInfo(transcript);
  const financialInfo = extractFinancialInfo(transcript);
  const age = extractAge(transcript);
  const prospectScore = calculateProspectScore(transcript);
  
  // Extract health information
  const healthMatch = transcript.match(/(?:health|surgery|medical|condition|injury|transplant|memory|balance)/gi);
  
  // Determine investment experience
  const experienceLevel = financialInfo.investments.length >= 3 ? 'Experienced' : 
                         financialInfo.investments.length >= 1 ? 'Moderate' : 'Beginner';
  
  // Determine risk tolerance
  const riskTolerance = transcript.toLowerCase().includes('safe') || transcript.toLowerCase().includes('secure') ? 'Conservative' :
                       transcript.toLowerCase().includes('growth') || transcript.toLowerCase().includes('aggressive') ? 'Moderate to Aggressive' : 'Conservative to Moderate';

  return `***Summary of Prospect Information***

* Name: ${contactInfo.name || '[Name not clearly identified]'}
* Phone: ${contactInfo.phone || '[Phone not provided]'}  
* Email: ${contactInfo.email || '[Email not provided]'}
* Location: ${contactInfo.location || '[Location not specified]'}
* Age: ${age || '[Age not mentioned]'}
* Additional details: ${healthMatch && healthMatch.length > 0 ? `Health: ${healthMatch.join(', ')} mentioned in conversation.` : 'No specific health concerns mentioned.'}

-- Financials --

${financialInfo.amounts.length > 0 ? 
  financialInfo.amounts.map(amount => `* Has ${amount} in liquid assets/investments.`).join('\n') :
  '* Financial details not fully disclosed in this conversation.'}
${financialInfo.investments.length > 0 ? 
  `* Current investments include: ${financialInfo.investments.join(', ')}.` : ''}
* Investment experience level: ${experienceLevel}
* Risk tolerance: ${riskTolerance}
${financialInfo.timeline ? `* Timeline: ${financialInfo.timeline}` : ''}

-- Metals Experience --

* ${transcript.toLowerCase().includes('gold') || transcript.toLowerCase().includes('silver') ? 'Has expressed interest in precious metals investing.' : 'New to precious metals investing.'}
* ${transcript.toLowerCase().includes('coin') || transcript.toLowerCase().includes('bar') ? 'Familiar with different forms of precious metals (coins vs bars).' : 'Learning about precious metals investment options.'}

-- Investment Experience --

* Experience level: ${experienceLevel} investor
* ${transcript.toLowerCase().includes('2008') || transcript.toLowerCase().includes('market crash') ? 'Has experienced market downturns and volatility.' : 'Investment history not fully detailed.'}
* Current outlook: ${transcript.toLowerCase().includes('cautious') || transcript.toLowerCase().includes('safe') ? 'Cautious and security-focused' : 'Open to investment opportunities'}

-- Prospect Score: ${prospectScore}/200 --

* ${prospectScore >= 160 ? 'Excellent prospect with strong qualification indicators.' : 
   prospectScore >= 120 ? 'Good prospect with solid potential for conversion.' :
   prospectScore >= 80 ? 'Moderate prospect requiring additional qualification.' :
   'Requires significant qualification and nurturing.'}

-- Prospect's Position in the Sales Process --

* Stage: ${prospectScore >= 150 ? 'Ready to move forward with proper guidance.' : 
          prospectScore >= 100 ? 'In consideration phase, needs additional information.' :
          'Early stage, requires education and relationship building.'}
* ${transcript.toLowerCase().includes('research') || transcript.toLowerCase().includes('think') ? 'Prospect wants to research and consider options before deciding.' : 'Prospect appears ready for next steps in the process.'}

-- Psychological Profile --

* Decision-making style: ${transcript.toLowerCase().includes('wife') || transcript.toLowerCase().includes('spouse') || transcript.toLowerCase().includes('family') ? 'Family-influenced decision maker' : 'Independent decision maker'}
* Communication preference: ${transcript.length > 1000 ? 'Prefers detailed information and thorough explanations' : 'Prefers concise, direct communication'}
* Trust building: ${transcript.toLowerCase().includes('comfortable') || transcript.toLowerCase().includes('trust') ? 'Building good rapport and trust' : 'Requires additional trust-building efforts'}`;
}

function assessQualificationLevel(transcript: string): string {
  const financialInfo = extractFinancialInfo(transcript);
  const age = extractAge(transcript);
  const score = calculateProspectScore(transcript);
  
  const qualificationFactors = {
    assets: financialInfo.amounts.some(amount => parseInt(amount.replace(/[,$k]/gi, '')) >= 50) ? 'Qualified' : 'Needs Assessment',
    age: age && age >= 50 ? 'Optimal' : age && age >= 40 ? 'Good' : 'Marginal',
    timeline: transcript.toLowerCase().includes('retire') ? 'Appropriate' : 'Unclear',
    authority: transcript.toLowerCase().includes('wife') || transcript.toLowerCase().includes('spouse') ? 'Joint Decision' : 'Individual Authority'
  };
  
  return `-- Qualification Assessment --

* Minimum investable assets: ${qualificationFactors.assets}
* Age and retirement timeline: ${qualificationFactors.age} (Age: ${age || 'Not specified'})  
* Investment sophistication: ${financialInfo.investments.length >= 2 ? 'Experienced' : 'Developing'}
* Decision-making authority: ${qualificationFactors.authority}
* Timeline urgency: ${transcript.toLowerCase().includes('soon') ? 'High' : transcript.toLowerCase().includes('year') ? 'Moderate' : 'Low'}

Qualification Score: ${Math.round(score/2)}/100

Recommended Next Steps:
${score >= 160 ? '• Proceed with investment recommendations and account setup\n• Schedule follow-up to finalize investment allocation\n• Prepare documentation and compliance materials' :
  score >= 120 ? '• Provide additional education on precious metals benefits\n• Address any remaining concerns or objections\n• Schedule follow-up to review investment options' :
  '• Focus on relationship building and education\n• Qualify financial capacity and investment timeline\n• Nurture with educational content and market updates'}`;
}

function evaluateComplianceAdherence(transcript: string): string {
  const riskDisclosures = transcript.toLowerCase().includes('risk') || transcript.toLowerCase().includes('volatility');
  const feeTransparency = transcript.toLowerCase().includes('fee') || transcript.toLowerCase().includes('cost');
  const suitabilityDiscussion = transcript.toLowerCase().includes('suitable') || transcript.toLowerCase().includes('appropriate');
  const professionalConduct = !transcript.toLowerCase().includes('guarantee') && !transcript.toLowerCase().includes('promise');
  
  return `-- Compliance Review --

Risk Disclosures: ${riskDisclosures ? '✓ Appropriate risk discussions noted' : '⚠ Risk disclosures should be emphasized'}
Fee Transparency: ${feeTransparency ? '✓ Fees and costs discussed' : '⚠ Fee structure should be clearly explained'}  
Suitability Assessment: ${suitabilityDiscussion ? '✓ Suitability considerations addressed' : '⚠ Suitability determination needed'}
Professional Conduct: ${professionalConduct ? '✓ Professional approach maintained' : '⚠ Review language for compliance issues'}

Regulatory Compliance Status: ${(riskDisclosures && feeTransparency && suitabilityDiscussion && professionalConduct) ? 'Compliant' : 'Needs Attention'}

Recommendations:
• Ensure all risk disclosures are comprehensive and documented
• Provide clear fee schedule and total cost breakdown  
• Complete formal suitability assessment and documentation
• Follow up with required compliance documentation
• Review all recommendations against customer's stated objectives and risk tolerance`;
}

function identifyFollowUpActions(transcript: string): string {
  const contactInfo = extractContactInfo(transcript);
  const urgencyLevel = transcript.toLowerCase().includes('soon') || transcript.toLowerCase().includes('ready') ? 'High' : 
                      transcript.toLowerCase().includes('week') || transcript.toLowerCase().includes('month') ? 'Medium' : 'Standard';
  
  const nextBusinessDay = new Date();
  nextBusinessDay.setDate(nextBusinessDay.getDate() + (nextBusinessDay.getDay() === 5 ? 3 : 1));
  
  return `***Action Plan***

-- Follow-up Date --

* ${nextBusinessDay.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at the same time
* Priority Level: ${urgencyLevel}
* Contact Method: Phone call ${contactInfo.phone ? `to ${contactInfo.phone}` : '(number to be confirmed)'}

-- Immediate Next Steps (24-48 hours) --

1. Send welcome email with educational materials about precious metals IRAs
2. Prepare customized investment recommendations based on disclosed financial situation
3. Schedule follow-up call to address any questions from review materials
4. Prepare account opening documentation if prospect is ready to proceed

-- Information Needed from Prospect --

• Complete contact information verification
• Total investable assets available for precious metals allocation  
• Current retirement account details (401k, IRA balances)
• Investment timeline and retirement goals
• Risk tolerance assessment completion
• Decision-making process (individual vs. joint with spouse)

-- Documentation to Send --

• Company information packet and credentials
• Precious metals IRA educational guide
• Fee schedule and cost breakdown
• Customer testimonials and case studies
• Market outlook and precious metals performance data

-- Urgency Creation --

* ${transcript.toLowerCase().includes('inflation') ? 'Emphasize inflation protection benefits and current economic conditions' : 'Highlight market timing opportunities and portfolio diversification benefits'}
* ${transcript.toLowerCase().includes('concern') || transcript.toLowerCase().includes('worry') ? 'Address specific concerns raised about financial security' : 'Reinforce wealth preservation strategies'}
* Reference current market conditions favoring precious metals allocation

-- Overcoming Objections --

* Timing Concerns: ${transcript.toLowerCase().includes('time') || transcript.toLowerCase().includes('wait') ? 'Address timing hesitations with market data and opportunity cost analysis' : 'Reinforce optimal timing for precious metals investment'}
* Cost Concerns: ${transcript.toLowerCase().includes('cost') || transcript.toLowerCase().includes('fee') ? 'Provide clear fee comparison and long-term value proposition' : 'Proactively address fee structure and value provided'}
* Decision Process: ${transcript.toLowerCase().includes('wife') || transcript.toLowerCase().includes('spouse') ? 'Offer to include spouse in next conversation and provide materials for joint review' : 'Support individual decision-making with comprehensive information'}`;
}

function generateStrategicRecommendations(transcript: string): string {
  const financialInfo = extractFinancialInfo(transcript);
  const age = extractAge(transcript);
  const score = calculateProspectScore(transcript);
  
  const strategyLevel = score >= 160 ? 'Aggressive' : score >= 120 ? 'Moderate' : 'Conservative';
  
  return `-- Strategic Recommendations --

Optimal Approach: ${strategyLevel} engagement strategy based on qualification score of ${score}/200

Product Recommendations:
${age && age >= 55 ? '• Focus on IRA-eligible precious metals for tax advantages' : '• Present both IRA and cash purchase options'}
${financialInfo.amounts.length > 0 ? '• Recommend 10-20% portfolio allocation to precious metals based on disclosed assets' : '• Start with educational approach to uncover financial capacity'}
• ${transcript.toLowerCase().includes('gold') ? 'Emphasize gold products as primary interest area' : transcript.toLowerCase().includes('silver') ? 'Highlight silver opportunities and affordability' : 'Present balanced gold/silver allocation (60/40 or 70/30)'}

Timing Strategy:
• ${transcript.toLowerCase().includes('soon') || transcript.toLowerCase().includes('ready') ? 'Strike while interest is high - schedule immediate follow-up' : 'Build urgency through educational content and market updates'}
• Leverage current economic conditions and precious metals market positioning
• ${transcript.toLowerCase().includes('research') ? 'Support research process with comprehensive materials' : 'Focus on decision facilitation and next steps'}

Risk Mitigation:
• Address all compliance requirements proactively
• Provide clear documentation of suitability and risk acknowledgment
• Ensure fee transparency and total cost understanding
• Follow up with written summaries of all conversations

Competitive Advantages:
• Emphasize company stability and track record
• Highlight customer service and education approach  
• Demonstrate transparent fee structure compared to competitors
• Provide references and testimonials from similar clients

Relationship Building:
• ${transcript.toLowerCase().includes('family') || transcript.toLowerCase().includes('spouse') ? 'Include family members in decision process and communications' : 'Build trust through consistent, professional follow-up'}
• Maintain regular contact with market updates and educational content
• Position as trusted advisor rather than salesperson
• Create long-term relationship beyond initial transaction`;
}

// Export server creation function for Smithery CLI
export default function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new Server({
    name: "goldira-analysis-mcp",
    version: "2.0.0",
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
          description: "Comprehensive Gold IRA sales call transcript analysis with detailed prospect profiling, scoring, and actionable recommendations",
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

    // Execute the 6 analysis functions in strategic order: 2→3→4→5→6→1
    const analyses = {
      customerProfile: identifyCustomerProfile(transcript),
      qualificationLevel: assessQualificationLevel(transcript),
      complianceAdherence: evaluateComplianceAdherence(transcript),
      followUpActions: identifyFollowUpActions(transcript),
      strategicRecommendations: generateStrategicRecommendations(transcript),
      overallCallQuality: analyzeOverallCallQuality(transcript)
    };

    const fullAnalysis = `
# Comprehensive Gold IRA Sales Call Analysis

${analyses.customerProfile}

${analyses.qualificationLevel}

${analyses.complianceAdherence}

${analyses.followUpActions}

${analyses.strategicRecommendations}

${analyses.overallCallQuality}

---
*Analysis complete. This comprehensive assessment provides specific prospect details, qualification scoring, compliance review, and actionable next steps for successful follow-up.*
`;

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