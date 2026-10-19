const https = require('https');

/**
 * Lightweight, zero-dependency Atlassian Jira Cloud REST API Client
 */
class JiraClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || process.env.JIRA_BASE_URL;
    this.email = config.email || process.env.JIRA_EMAIL;
    this.apiToken = config.apiToken || process.env.JIRA_API_TOKEN;

    if (!this.baseUrl || !this.email || !this.apiToken) {
      throw new Error('JiraClient requires JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN');
    }

    // Strip protocol from host
    this.host = this.baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
  }

  request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.host,
        path: path,
        method: method,
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  // Create issue
  createIssue(fields) {
    return this.request('/rest/api/3/issue', 'POST', { fields });
  }

  // Add comment in Atlassian Document Format (ADF)
  addComment(issueKeyOrId, textOrAdf) {
    const body = typeof textOrAdf === 'string' ? this.textToAdf(textOrAdf) : textOrAdf;
    return this.request(`/rest/api/3/issue/${issueKeyOrId}/comment`, 'POST', { body });
  }

  // Search issues via JQL
  search(jql, maxResults = 10) {
    const encodedJql = encodeURIComponent(jql);
    return this.request(`/rest/api/3/search/jql?jql=${encodedJql}&maxResults=${maxResults}`);
  }

  // Fetch single issue details
  getIssue(issueKeyOrId, fields = 'summary,status,labels,created,comment,priority,assignee') {
    return this.request(`/rest/api/3/issue/${issueKeyOrId}?fields=${fields}`);
  }

  // Utility to convert text paragraphs to ADF
  textToAdf(text) {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    return {
      version: 1,
      type: 'doc',
      content: paragraphs.map(p => ({
        type: 'paragraph',
        content: [{ type: 'text', text: p.trim() }]
      }))
    };
  }
}

module.exports = JiraClient;
