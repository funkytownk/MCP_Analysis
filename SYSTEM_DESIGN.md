# Gold IRA Sales Transcript Analysis MCP Server
## System Design Specification

### Overview

**Product**: Enterprise-grade MCP server for B2C Gold IRA sales call transcript analysis  
**Purpose**: Automated analysis of Gold IRA sales conversations through 6 specialized prompts delivering actionable insights  
**Architecture**: Wave-orchestrated, enterprise-ready MCP server with Sequential analysis pipeline  
**Execution Order**: 2 → 3 → 4 → 5 → 6 → 1 (Strategic Qualification as final comprehensive assessment)

### Core Requirements

#### Functional Requirements
1. **Single Input Processing**: Accept Gold IRA sales call transcript via tool invocation
2. **Sequential Analysis**: Process transcript through 6 prompts in specific order:
   - **Prompt 2**: Conversation Dynamics Analysis (First)
   - **Prompt 3**: Psychological Profile Analysis  
   - **Prompt 4**: Objection Handling Analysis
   - **Prompt 5**: Deal Risk Assessment
   - **Prompt 6**: Action Plan Generation
   - **Prompt 1**: Strategic Qualification Analysis (Final - comprehensive assessment)
3. **Rich JSON Output**: Return structured, detailed analysis for each prompt
4. **Context Preservation**: Maintain analysis context between prompts for enhanced insights
5. **B2C Gold IRA Focus**: Specialized for precious metals IRA sales conversations

#### Non-Functional Requirements
- **Performance**: <3s total analysis time per transcript
- **Reliability**: 99.9% uptime with graceful error handling
- **Security**: Enterprise-grade authentication and PII protection
- **Scalability**: Handle concurrent analysis requests
- **Compliance**: Financial services compliance and audit logging

### System Architecture

#### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Claude Code   │───▶│   MCP Transport     │───▶│  Analysis Engine    │
│                 │    │  (HTTP/SSE/stdio)  │    │                     │
└─────────────────┘    └─────────────────────┘    └─────────────────────┘
                                                            │
                               ┌─────────────────────────────┼─────────────────────────────┐
                               │                             ▼                             │
                               │                  ┌─────────────────────┐                  │
                               │                  │  Prompt Controller  │                  │
                               │                  │   Order: 2→3→4→5→6→1 │                  │
                               │                  └─────────────────────┘                  │
                               │                             │                             │
                               │        ┌────────────────────┼────────────────────┐        │
                               │        ▼                    ▼                    ▼        │
                               │ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
                               │ │   Prompt 2  │    │   Prompt 4  │    │   Prompt 6  │     │
                               │ │Conversation │    │ Objections  │    │Action Plan  │     │
                               │ └─────────────┘    └─────────────┘    └─────────────┘     │
                               │ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
                               │ │   Prompt 3  │    │   Prompt 5  │    │   Prompt 1  │     │
                               │ │Psychology   │    │ Deal Risk   │    │Qualification│     │
                               │ └─────────────┘    └─────────────┘    └─────────────┘     │
                               └───────────────────────────────────────────────────────────┘
```

#### Component Design

##### 1. MCP Server Core
- **Framework**: MCP Framework (TypeScript)
- **Transport**: Streamable HTTP with SSE notifications
- **Session Management**: Stateful with persistent context
- **Authentication**: JWT/API Key based with financial compliance

##### 2. Analysis Engine
**Components**:
- `TranscriptProcessor`: Input validation and B2C Gold IRA preprocessing
- `PromptOrchestrator`: Sequential execution (2→3→4→5→6→1) with context passing
- `AnalysisContext`: Cross-prompt state management with IRA-specific insights
- `ResponseFormatter`: JSON structure validation and financial compliance formatting

**Data Flow**:
```
Input → Validation → Context Setup → Prompt 2 → Prompt 3 → Prompt 4 → Prompt 5 → Prompt 6 → Prompt 1 → Aggregation → Output
```

##### 3. Prompt Processing Pipeline (Execution Order: 2→3→4→5→6→1)

**Prompt 2: Conversation Analysis (First)**
- Input: Raw transcript + Gold IRA context metadata
- Output: Conversation quality, missed opportunities, IRA-specific tactics
- Context Pass: Conversation insights → Prompt 3

**Prompt 3: Psychological Profiling (Second)**
- Input: Transcript + conversation insights
- Output: Personality assessment, financial motivation drivers, communication preferences
- Context Pass: Psychology profile → Prompt 4

**Prompt 4: Objection Analysis (Third)**
- Input: Transcript + psychology profile
- Output: IRA objection inventory, precious metals concerns, response strategies
- Context Pass: Objection insights → Prompt 5

**Prompt 5: Deal Risk Assessment (Fourth)**
- Input: Transcript + objection analysis
- Output: Financial risk analysis, compliance concerns, family stakeholder mapping
- Context Pass: Risk assessment → Prompt 6

**Prompt 6: Action Planning (Fifth)**
- Input: All previous analyses
- Output: Immediate actions, follow-up sequence, family engagement strategy
- Context Pass: Complete analysis context → Prompt 1

**Prompt 1: Strategic Qualification (Final)**
- Input: All previous analyses + full context
- Output: Comprehensive opportunity assessment, investment readiness, final recommendation
- **Enhanced by**: All previous prompt insights for superior qualification accuracy

### Technical Implementation

#### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: MCP Framework with TypeScript
- **Validation**: Zod schemas for type safety
- **Security**: JWT authentication with PII protection
- **Logging**: Structured logging with financial compliance audit trails
- **Testing**: Jest with comprehensive Gold IRA scenario coverage

#### Tool Definition (Updated for B2C Gold IRA)
```typescript
const AnalyzeGoldIRATranscriptTool = z.object({
  transcript: z.string().min(100).describe("Gold IRA sales call transcript text"),
  metadata: z.object({
    prospectName: z.string().describe("Primary prospect name"),
    prospectAge: z.number().optional().describe("Prospect's age"),
    retirementStatus: z.enum(['pre-retirement', 'recently-retired', 'retired']).describe("Retirement status"),
    accountTypes: z.array(z.enum(['traditional-ira', '401k', 'roth-ira', 'cash-savings', 'other-investments'])).describe("Current account types"),
    accountValues: z.string().describe("Estimated total account values"),
    familyMembers: z.string().describe("Spouse/family members involved in decision"),
    investmentExperience: z.enum(['none', 'basic', 'moderate', 'experienced']).describe("Investment experience level"),
    goldIRAInterest: z.enum(['researching', 'considering', 'ready-to-act', 'undecided']).describe("Level of Gold IRA interest"),
    currentConcerns: z.string().describe("Primary financial concerns mentioned"),
    timeframe: z.string().describe("Expected decision timeframe"),
    duration: z.number().describe("Call duration in minutes"),
    salesRep: z.string().describe("Sales representative name"),
    callPurpose: z.enum(['cold-call', 'follow-up', 'consultation', 'closing-call']).describe("Purpose of the call"),
    previousContact: z.boolean().describe("Whether this is a repeat contact")
  }).describe("Gold IRA call context metadata")
});
```

#### Data Models

#### Input Schema (Updated for Gold IRA B2C)
```json
{
  "transcript": "string (required, min 100 chars)",
  "metadata": {
    "prospectName": "string",
    "prospectAge": "number (optional)",
    "retirementStatus": "enum: pre-retirement|recently-retired|retired",
    "accountTypes": ["traditional-ira", "401k", "roth-ira", "cash-savings", "other-investments"],
    "accountValues": "string",
    "familyMembers": "string",
    "investmentExperience": "enum: none|basic|moderate|experienced", 
    "goldIRAInterest": "enum: researching|considering|ready-to-act|undecided",
    "currentConcerns": "string",
    "timeframe": "string",
    "duration": "number",
    "salesRep": "string",
    "callPurpose": "enum: cold-call|follow-up|consultation|closing-call",
    "previousContact": "boolean"
  }
}
```

#### Output Schema (Execution Order: 2→3→4→5→6→1)
```json
{
  "analysisId": "string",
  "timestamp": "ISO string", 
  "processingTime": "number (ms)",
  "executionOrder": ["conversation", "psychology", "objections", "dealRisk", "actionPlan", "qualification"],
  "analyses": {
    "conversation": { /* Prompt 2 JSON structure - executed first */ },
    "psychology": { /* Prompt 3 JSON structure - executed second */ },
    "objections": { /* Prompt 4 JSON structure - executed third */ },
    "dealRisk": { /* Prompt 5 JSON structure - executed fourth */ },
    "actionPlan": { /* Prompt 6 JSON structure - executed fifth */ },
    "qualification": { /* Prompt 1 JSON structure - executed last with full context */ }
  },
  "summary": {
    "overallQualificationScore": "number (enhanced by all previous analyses)",
    "investmentReadiness": "enum: high|medium|low|not-ready",
    "keyInsights": ["string"],
    "criticalActions": ["string"], 
    "riskLevel": "enum: low|medium|high|critical",
    "recommendedNextSteps": ["string"]
  }
}
```

### Gold IRA Specific Features

#### B2C Focus Areas
- **Retirement Planning**: Age-appropriate strategies and timeline considerations
- **Family Dynamics**: Spouse involvement and family financial planning
- **Account Types**: IRA, 401k, Roth IRA, cash savings portfolio analysis
- **Investment Experience**: Tailored approach based on financial sophistication
- **Regulatory Compliance**: IRA transfer rules and tax implications
- **Precious Metals Education**: Gold/silver market dynamics and storage options

#### Enhanced Context Flow
1. **Conversation Analysis** → Identifies communication style and rapport level
2. **Psychology Profile** → Maps financial motivations and decision-making style  
3. **Objection Handling** → Captures precious metals and IRA-specific concerns
4. **Risk Assessment** → Evaluates family dynamics and financial readiness
5. **Action Planning** → Creates family-inclusive follow-up strategy
6. **Strategic Qualification** → **Enhanced Final Assessment** using all previous insights

### Performance Requirements

#### Response Time Targets
- **Total Analysis**: <3 seconds
- **Per-Prompt Average**: <400ms (6 prompts in sequence)
- **Context Switching**: <50ms between prompts
- **Final Qualification**: <600ms (enhanced processing with full context)

#### Security & Compliance
- **PII Protection**: Customer data encryption and masking
- **Financial Compliance**: Audit trails for regulatory requirements
- **Data Retention**: Configurable retention policies for financial records
- **Access Control**: Role-based access for compliance officers

### Implementation Roadmap

#### Phase 1: Core Infrastructure (Week 1-2)
- MCP server setup with Gold IRA-specific configuration
- Prompt execution order implementation (2→3→4→5→6→1)
- B2C metadata schema development
- Development environment with IRA test scenarios

#### Phase 2: Gold IRA Analysis Pipeline (Week 3-4)
- Sequential prompt processors with IRA context
- Enhanced final qualification with full context integration
- B2C-specific JSON output formatting
- Family dynamics and account type handling

#### Phase 3: Financial Compliance Features (Week 5-6)
- PII protection and data security
- Financial services compliance logging
- Performance optimization for B2C scale
- Regulatory audit capabilities

#### Phase 4: Testing and Production (Week 7-8)
- Gold IRA scenario test suite
- B2C conversation load testing
- Financial compliance validation
- Production deployment with monitoring

### Success Criteria

#### Functional Success
- ✅ Sequential execution in correct order (2→3→4→5→6→1)
- ✅ Enhanced final qualification using all previous analyses
- ✅ B2C Gold IRA-specific insights and recommendations
- ✅ Family dynamics and account portfolio analysis

#### Business Success
- ✅ Improved Gold IRA sales qualification accuracy
- ✅ Enhanced family engagement strategies
- ✅ Reduced compliance risk through proper analysis
- ✅ Increased conversion rates through better insights

---

*This specification serves as the authoritative design document for the Gold IRA Sales Transcript Analysis MCP Server implementation with the corrected execution order and B2C focus.*