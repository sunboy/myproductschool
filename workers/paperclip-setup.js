/**
 * HackProduct Paperclip Setup Script
 *
 * Run ONCE after `npx paperclipai onboard --yes` to:
 * 1. Create the HackProduct Growth company
 * 2. Hire all 5 agents with correct adapter configs and heartbeat schedules
 *
 * Prerequisites:
 *   - Paperclip running at http://localhost:3100
 *   - PAPERCLIP_API_KEY set in .env.local (get from Paperclip UI → Settings → API Keys)
 *   - WORKER_SECRET set (any random string)
 *
 * Run: node workers/paperclip-setup.js
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const API_URL = process.env.PAPERCLIP_API_URL || 'http://localhost:3100';
const API_KEY = process.env.PAPERCLIP_API_KEY;
const WORKER_SECRET = process.env.WORKER_SECRET;
const CWD = resolve(__dirname, '..');

if (!API_KEY) {
  console.error('❌  PAPERCLIP_API_KEY not set in .env.local');
  console.error('   Get it from: Paperclip UI → Settings → API Keys');
  process.exit(1);
}

async function api(path, method = 'GET', body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function setup() {
  console.log('🚀  HackProduct Paperclip Setup\n');

  // ── 1. Create Company ──────────────────────────────────────────────────────
  console.log('1/3  Creating HackProduct Growth company...');
  const company = await api('/api/companies', 'POST', {
    name: 'HackProduct Growth',
    description: 'Grow HackProduct to 1,000 waitlist signups by publishing authoritative content about product thinking for engineers — twice a week, until launch.',
    monthlyBudgetCents: 5000, // $50
  });
  const companyId = company.id;
  console.log(`     ✅  Company created: ${companyId}\n`);

  // ── 2. Hire Agents ─────────────────────────────────────────────────────────
  console.log('2/3  Hiring agents...\n');

  const agents = [
    {
      name: 'CEO Agent',
      config: {
        name: 'hackproduct-ceo',
        role: 'Chief Executive Officer',
        monthlyBudgetCents: 1000,
        adapters: {
          adapterType: 'claude_local',
          adapterConfig: {
            cwd: CWD,
            model: 'claude-opus-4-6',
          },
        },
      },
      heartbeat: { cron: '0 8 * * 1', description: 'Monday 8am — read calendar, assign weekly posts to Writer' },
    },
    {
      name: 'Writer Agent',
      config: {
        name: 'hackproduct-writer',
        role: 'Content Writer',
        monthlyBudgetCents: 2000,
        adapters: {
          adapterType: 'claude_local',
          adapterConfig: {
            cwd: CWD,
            model: 'claude-sonnet-4-6',
          },
        },
      },
      heartbeat: { cron: '0 9 * * 2,5', description: 'Tue + Fri 9am — research, write 600-700 word draft, save to Notion' },
    },
    {
      name: 'Image Agent',
      config: {
        name: 'hackproduct-image',
        role: 'Visual Designer',
        monthlyBudgetCents: 500,
        adapters: {
          adapterType: 'http',
          adapterConfig: {
            url: 'https://hackproduct-image-worker.fly.dev/generate',
            headers: { Authorization: `Bearer ${WORKER_SECRET || 'REPLACE_WITH_WORKER_SECRET'}` },
          },
        },
      },
    },
    {
      name: 'Publisher Agent',
      config: {
        name: 'hackproduct-publisher',
        role: 'Distribution Manager',
        monthlyBudgetCents: 200,
        adapters: {
          adapterType: 'http',
          adapterConfig: {
            url: 'https://hackproduct-publisher-worker.fly.dev/publish',
            headers: { Authorization: `Bearer ${WORKER_SECRET || 'REPLACE_WITH_WORKER_SECRET'}` },
          },
        },
      },
    },
    {
      name: 'Growth Agent',
      config: {
        name: 'hackproduct-growth',
        role: 'Growth Analyst',
        monthlyBudgetCents: 100,
        adapters: {
          adapterType: 'process',
          adapterConfig: {
            command: `node ${resolve(__dirname, 'growth-worker/index.js')}`,
            cwd: CWD,
            env: {
              NOTION_INTEGRATION_TOKEN: process.env.NOTION_INTEGRATION_TOKEN || '',
              SUBSTACK_API_KEY: process.env.SUBSTACK_API_KEY || '',
              SUBSTACK_PUBLICATION_URL: process.env.SUBSTACK_PUBLICATION_URL || '',
              BUFFER_ACCESS_TOKEN: process.env.BUFFER_ACCESS_TOKEN || '',
            },
          },
        },
      },
      heartbeat: { cron: '0 22 * * 0', description: 'Sunday 10pm — collect metrics, write to Notion Growth Tracker' },
    },
  ];

  const hiredAgents = {};

  for (const { name, config: agentConfig, heartbeat } of agents) {
    process.stdout.write(`     Hiring ${name}... `);
    const hired = await api(`/api/companies/${companyId}/agents`, 'POST', agentConfig);
    hiredAgents[agentConfig.name] = hired.id;
    console.log(`✅  ${hired.id}`);

    if (heartbeat) {
      await api(`/api/companies/${companyId}/routines`, 'POST', {
        agentId: hired.id,
        cron: heartbeat.cron,
        description: heartbeat.description,
      });
      console.log(`            ⏰  Heartbeat: ${heartbeat.cron}`);
    }
  }

  // ── 3. Set Reporting Structure ─────────────────────────────────────────────
  console.log('\n3/3  Setting org chart (all agents report to CEO)...');
  const ceoId = hiredAgents['hackproduct-ceo'];

  for (const [name, agentId] of Object.entries(hiredAgents)) {
    if (name === 'hackproduct-ceo') continue;
    await api(`/api/companies/${companyId}/agents/${agentId}`, 'PATCH', {
      reportingTo: ceoId,
    });
  }
  console.log('     ✅  Org chart set\n');

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('─'.repeat(60));
  console.log('✅  Setup complete!\n');
  console.log(`Company ID: ${companyId}`);
  console.log(`Add to .env.local:  PAPERCLIP_COMPANY_ID=${companyId}\n`);
  console.log('Agent IDs:');
  for (const [name, id] of Object.entries(hiredAgents)) {
    console.log(`  ${name}: ${id}`);
  }
  console.log('\nNext steps:');
  console.log('  1. Add PAPERCLIP_COMPANY_ID to .env.local');
  console.log('  2. Deploy image-worker + publisher-worker to Fly.io (Week 2)');
  console.log('  3. Manually trigger Writer Agent: paperclipai heartbeat run --agent-name hackproduct-writer');
  console.log('  4. Review the draft in Notion → approve in Paperclip UI');
}

setup().catch(err => {
  console.error('\n❌  Setup failed:', err.message);
  process.exit(1);
});
