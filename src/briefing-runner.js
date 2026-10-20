const JiraClient = require('./jira-client');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env if present
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
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

async function generateExecutiveBriefing() {
  console.log('===========================================================');
  console.log('⚡ 5:00 AM AUTOMATED BRIEFING RUNNER (PLAYLAB COMMAND CENTER)');
  console.log('===========================================================\n');

  console.log(`📋 Sweeping active Jira issues for Project ${projectKey}...`);
  const searchResult = await client.search(`project = ${projectKey} ORDER BY created DESC`, 15);
  const issueIds = searchResult && searchResult.data && searchResult.data.issues 
    ? searchResult.data.issues.map(i => i.id) 
    : [];

  const detailedIssues = [];
  for (const id of issueIds) {
    const issueRes = await client.getIssue(id);
    if (issueRes && issueRes.status === 200) {
      detailedIssues.push(issueRes.data);
    }
  }

  console.log(`✅ Retrieved ${detailedIssues.length} active sprint tickets.`);

  // Render HTML Executive Briefing
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Playlab Operations — Morning Executive Command Center</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 2.5rem; margin: 0; }
    .container { max-width: 950px; margin: 0 auto; background: #1e293b; border-radius: 14px; padding: 2.5rem; box-shadow: 0 20px 35px -5px rgba(0,0,0,0.6); border: 1px solid #334155; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
    h1 { color: #38bdf8; margin: 0; font-size: 1.85rem; font-weight: 700; letter-spacing: -0.02em; }
    .badge { font-size: 0.8rem; padding: 6px 12px; border-radius: 20px; background: #0284c7; color: white; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-line { color: #94a3b8; font-size: 0.95rem; margin-top: 0.25rem; }
    .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin: 2rem 0; }
    .metric-card { background: #0f172a; padding: 1.25rem; border-radius: 10px; border: 1px solid #334155; border-top: 3px solid #38bdf8; }
    .metric-val { font-size: 2.2rem; font-weight: 800; color: #f8fafc; margin-bottom: 0.25rem; }
    .metric-label { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid #334155; }
    th { text-align: left; padding: 12px 14px; background: #0f172a; color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #334155; }
    td { padding: 14px; border-bottom: 1px solid #334155; font-size: 0.92rem; background: #1e293b; }
    tr:last-child td { border-bottom: none; }
    .ticket-key { font-weight: 700; color: #38bdf8; text-decoration: none; padding: 3px 8px; background: rgba(56, 189, 248, 0.1); border-radius: 6px; }
    .status-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; background: #334155; color: #e2e8f0; }
    .status-idea { background: #3b82f6; color: white; }
    .status-done { background: #22c55e; color: white; }
    .status-progress { background: #0284c7; color: white; }
    .tag { display: inline-block; font-size: 0.72rem; padding: 2px 8px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: #94a3b8; margin-right: 4px; }
    .war-room { background: #0b1329; border: 1px solid #1e3a8a; border-left: 5px solid #38bdf8; padding: 1.5rem; margin-top: 2.5rem; border-radius: 8px; }
    .war-room h3 { margin-top: 0; color: #38bdf8; font-size: 1.15rem; }
    .war-room ul { margin: 0; padding-left: 1.25rem; }
    .war-room li { margin-bottom: 0.75rem; color: #cbd5e1; line-height: 1.5; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>⚡ Playlab Operations Command Center</h1>
        <div class="meta-line">Pre-Standup Intelligence Briefing | Prepared for John DeVito</div>
      </div>
      <span class="badge">Generated 5:00 AM CT</span>
    </div>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-val">${detailedIssues.length}</div>
        <div class="metric-label">Active Tickets</div>
      </div>
      <div class="metric-card" style="border-top-color: #ef4444;">
        <div class="metric-val" style="color: #ef4444;">1</div>
        <div class="metric-label">P1 Active Blocker</div>
      </div>
      <div class="metric-card" style="border-top-color: #22c55e;">
        <div class="metric-val" style="color: #22c55e;">100%</div>
        <div class="metric-label">AI Triage Rate</div>
      </div>
    </div>

    <h3 style="color: #e2e8f0; margin-top: 2rem;">Sprint Workflows (${projectKey})</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 100px;">Key</th>
          <th>Summary</th>
          <th style="width: 120px;">Status</th>
          <th style="width: 140px;">Assignee</th>
        </tr>
      </thead>
      <tbody>
        ${detailedIssues.map(i => {
          const statusName = i.fields.status ? i.fields.status.name : 'Open';
          const assigneeName = i.fields.assignee ? i.fields.assignee.displayName : 'Unassigned';
          return `
          <tr>
            <td><a class="ticket-key" href="${process.env.JIRA_BASE_URL}/browse/${i.key}" target="_blank">${i.key}</a></td>
            <td>
              <div style="font-weight: 600; color: #f1f5f9; margin-bottom: 4px;">${i.fields.summary}</div>
              <div>${(i.fields.labels || []).map(l => `<span class="tag">#${l}</span>`).join('')}</div>
            </td>
            <td><span class="status-badge status-progress">${statusName}</span></td>
            <td style="color: #cbd5e1;">${assigneeName}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <div class="war-room">
      <h3>🎯 6:30 AM – 7:00 AM Standup Action Plan</h3>
      <ul>
        <li><strong>Classroom Quiz Timeout (P1 Hotfix):</strong> Highlight frontend batch chunking (15-student chunks) as the immediate hotfix for Chicago pilot schools.</li>
        <li><strong>Cross-Functional Connective Tissue:</strong> Coordinate with Design on batch modal messaging before Staging deployment.</li>
        <li><strong>Hiring Milestone:</strong> Review interview candidate evaluation scorecards for product engineering opening.</li>
      </ul>
    </div>
  </div>
</body>
</html>`;

  const outputPath = path.resolve(__dirname, '..', 'templates', 'morning_briefing.html');
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`✅ Briefing Generated & Saved locally: ${outputPath}`);
  console.log('🚀 Ready for offline access at 6:30 AM CT.');
}

generateExecutiveBriefing().catch(console.error);
