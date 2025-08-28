#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Test transcript (shortened for testing)
const testTranscript = `Hello, Claire?

Yes, this is Claire.

Hi Claire, my name is Brian. I'm calling from Patriot Gold Group. I understand you've been looking into ways to protect your retirement savings. How can I help you today?

Well, I've been hearing a lot about the economy and stuff, and I'm just, you know, I'm 65 and I'm very conservative, and I don't want to lose my butt, you know what I mean?

Oh, absolutely. That's very wise of you, Claire. Being conservative at this stage of your life is exactly the right approach. Can you tell me a little bit about your current retirement situation? Do you have a 401k or IRA that you're concerned about?

Yes, I do have a 401k. The actual 401k balance is like 52, almost $53,000. And I'm very conservative. I don't want any risk.

I completely understand, Claire. $53,000 is a substantial amount that you've worked hard to save. And you're absolutely right to be conservative. That's actually exactly why I wanted to speak with you today. Gold has been used as a store of value for over 6,000 years. In fact, over the past 20 years, gold has averaged about 9.8% annually. Does that sound like something that might interest you?

Well, yeah, it does. I mean, I would like to have some to leave with my kids too, you know?

That's wonderful, Claire. Gold is actually an excellent inheritance vehicle. When you pass gold to your children, there are significant tax advantages compared to cash or stocks. Let me ask you - when you think about protecting that $53,000, what's most important to you?

Well, just that it's safe and that, you know, I don't lose money. I'm gonna call my financial advisor and see what he has to say about it.

That's very smart, Claire. I always encourage my clients to involve their financial advisors in these decisions. In fact, I work with many financial advisors, and I'd be happy to send over some professional materials that your advisor can review. Many advisors take what gold companies say with a grain of salt until they see the full picture. Would that be helpful?

Yeah, that would be great.

Excellent. I'll send you a comprehensive packet with all the information, including historical performance data and client testimonials. Can I follow up with you next Tuesday to see how your conversation with your advisor went?

Yes, that would be fine.

Perfect, Claire. I'll get that information over to you today, and I'll call you Tuesday afternoon. Thank you so much for your time.

Thank you, Brian. I appreciate it.

Have a blessed day, Claire.

You too. Bye-bye.`;

async function testMCPServer() {
  console.log('🧪 Testing MCP Server with Gold IRA Transcript Analysis...\n');

  const serverPath = path.join(__dirname, 'src/index.ts');
  
  // Use tsx to run TypeScript directly
  const serverProcess = spawn('npx', ['tsx', serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseData = '';
  let errorData = '';

  serverProcess.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  serverProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  // Send MCP request to analyze transcript
  const request = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "analyze_goldira_transcript",
      arguments: {
        transcript: testTranscript,
        metadata: {
          date: new Date().toISOString(),
          duration: 10,
          agent: "Brian",
          client: "Claire"
        }
      }
    }
  };

  console.log('📤 Sending analysis request...');
  serverProcess.stdin.write(JSON.stringify(request) + '\n');
  
  // Wait for response
  await new Promise(resolve => {
    setTimeout(() => {
      serverProcess.kill();
      resolve();
    }, 5000); // 5 second timeout
  });

  console.log('📥 Analysis Results:');
  console.log('='.repeat(50));
  
  if (responseData) {
    try {
      const response = JSON.parse(responseData);
      console.log(JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  } else {
    console.log('No response data received');
  }
  
  if (errorData) {
    console.log('\n🔍 Debug Output:');
    console.log('-'.repeat(30));
    console.log(errorData);
  }
}

testMCPServer().catch(console.error);