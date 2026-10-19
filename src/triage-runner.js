const JiraClient = require('./jira-client');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env if present
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

const client = new JiraClient();
const projectKey = process.env.JIRA_PROJECT_KEY || 'KAN';

async function runTriageSimulation() {
  console.log('===========================================================');
  console.log('⚡ PLAYLAB PRODUCT OPERATIONS: AUTOMATED INTAKE & TRIAGE');
  console.log('===========================================================\n');

  // 1. Resolve a valid Issue Type dynamically for this Jira project
  console.log(`📡 Connecting to Jira Cloud at ${process.env.JIRA_BASE_URL}...`);
  console.log(`🔍 Inspecting project settings for "${projectKey}"...`);

  let issueTypeSelector = { name: 'Task' };
  try {
    const projectRes = await client.request(`/rest/api/3/project/${projectKey}`);
    if (projectRes && projectRes.status === 200 && projectRes.data && projectRes.data.issueTypes) {
      const standardTypes = projectRes.data.issueTypes.filter(t => !t.subtask);
      const matched = standardTypes.find(t => /task/i.test(t.name))
        || standardTypes.find(t => /story/i.test(t.name))
        || standardTypes.find(t => /bug/i.test(t.name))
        || standardTypes[0];
      
      if (matched) {
        issueTypeSelector = { id: matched.id };
        console.log(`✓ Detected Jira Issue Type: "${matched.name}" (ID: ${matched.id})`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not inspect project metadata, falling back to standard Task name:', err.message);
  }

  // 2. Ingest raw educator feedback into structured Jira ticket
  console.log('\n📥 Ingesting raw educator incident report into Jira...');
  const newTicket = {
    project: { key: projectKey },
    summary: '[Playlab Ops] Teacher AI Quiz Generator - Timeout on Step 3 for Classrooms > 30 Students',
    issuetype: issueTypeSelector,
    labels: ['educator-feedback', 'ai-app', 'product-ops', 'triage-needed'],
    description: client.textToAdf(
      'SOURCE: Educator Support Queue (Chicago Public Schools Pilot)\n\n' +
      'ISSUE DESCRIPTION: Multiple 8th-grade science teachers reported that when generating personalized quizzes with more than 30 student profiles loaded simultaneously, the backend AI worker times out after 45 seconds, showing a generic "Network Error" modal.\n\n' +
      'USER IMPACT: 4 schools impacted during morning testing block. Teachers had to manually divide classrooms into smaller batches.\n\n' +
      'STEPS TO REPRODUCE:\n' +
      '1. Open Playlab App: "Custom Science Quiz Builder"\n' +
      '2. Upload class roster CSV with 32 students\n' +
      '3. Click "Generate Tiered Prompts"\n' +
      '4. Observe timeout spinning indefinitely after 45s\n\n' +
      'EXPECTED OUTCOME: Worker should either handle chunked batch generation asynchronously or provide a clear progress bar with graceful queue management.'
    )
  };

  const createRes = await client.createIssue(newTicket);
  if (createRes.status !== 201) {
    console.error('❌ Failed to create issue in Jira. HTTP Status:', createRes.status);
    console.error('Error Details:', JSON.stringify(createRes.data || createRes.raw, null, 2));
    process.exit(1);
  }

  const issueKey = createRes.data.key;
  console.log(`✅ Issue Successfully Created in Jira: ${issueKey}`);
  console.log(`🔗 Direct Ticket Link: ${process.env.JIRA_BASE_URL}/browse/${issueKey}\n`);

  // 3. Autonomous Operational Triage & Engineering Recommendation
  console.log(`🔍 Executing Operational AI Diagnosis for ${issueKey}...`);
  const triageAnalysis = 
    '⚡ [AI Product Ops Assistant - Automated Triage Analysis]\n\n' +
    '  SEVERITY: HIGH (P1) - Actively blocking educator adoption during live classroom hours.\n' +
    '  BLAST RADIUS: Limited to batch roster uploads (>25 students). Single-student and small group generation remains operational.\n' +
    '  ROOT CAUSE HYPOTHESIS: Gateway timeout on synchronous API call to LLM worker. Lack of async job queuing for high-token prompt batches.\n\n' +
    'RECOMMENDED ENGINEERING SQUAD ACTIONS:\n' +
    '1. Immediate Mitigation: Add frontend chunking (split roster into 15-student batches in client worker).\n' +
    '2. Permanent Architecture: Transition quiz generation pipeline to async background task with Redis/BullMQ and WebSocket progress polling.\n' +
    '3. Educator Messaging: Add friendly "Batch processing..." modal to prevent teachers from refreshing.\n\n' +
    'STAKEHOLDER COMM: Pilot school coordinators informed that a hotfix is being evaluated for tomorrow morning.';

  const commentRes = await client.addComment(issueKey, triageAnalysis);
  if (commentRes.status === 201) {
    console.log(`✅ Triage Analysis & Action Items posted directly to ${issueKey} comments!`);
  } else {
    console.warn(`⚠️ Issue was created (${issueKey}), but comment failed with status ${commentRes.status}:`, commentRes.data);
  }

  console.log('\n🎉 Operational triage complete! Ticket is staged for Engineering Sprint Queue in Jira.');
}

runTriageSimulation().catch(err => {
  console.error('Fatal error running triage:', err);
  process.exit(1);
});
