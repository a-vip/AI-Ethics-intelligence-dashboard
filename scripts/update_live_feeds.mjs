import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outFile = path.join(rootDir, 'data', 'live-feed.json');
const wpMirrorFile = path.resolve(rootDir, '..', 'avi-wp-theme', 'apps', 'dashboard', 'data', 'live-feed.json');

const SOURCES = [
  {
    key: 'arxiv',
    name: 'arXiv (LAWS & AI Safety)',
    category: 'Academic / Preprints',
    url: 'https://export.arxiv.org/api/query?search_query=all:%22autonomous+weapons%22+OR+all:%22meaningful+human+control%22+OR+all:%22AI+safety+evaluation%22&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending'
  },
  {
    key: 'un',
    name: 'UN News (Peace & Security)',
    category: 'UN / Treaty Bodies',
    url: 'https://news.un.org/feed/subscribe/en/news/topic/peace-and-security/feed/rss.xml'
  },
  {
    key: 'icrc',
    name: 'ICRC Humanitarian Law & Policy',
    category: 'IHL & Treaty Bodies',
    url: 'https://blogs.icrc.org/law-and-policy/feed/'
  },
  {
    key: 'lieber',
    name: 'Lieber Institute (West Point)',
    category: 'Military & IHL Scholarship',
    url: 'https://lieber.westpoint.edu/feed/'
  },
  {
    key: 'justsec',
    name: 'Just Security',
    category: 'National Security & Law',
    url: 'https://www.justsecurity.org/feed/'
  },
  {
    key: 'nature',
    name: 'Nature Machine Intelligence',
    category: 'Peer-Reviewed Science',
    url: 'https://www.nature.com/natmachintell.rss'
  },
  {
    key: 'hrw',
    name: 'Human Rights Watch',
    category: 'Human Rights & IHL',
    url: 'https://www.hrw.org/rss/news'
  },
  {
    key: 'mit',
    name: 'MIT Technology Review (AI)',
    category: 'Frontier Tech & Policy',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed'
  },
  {
    key: 'avi',
    name: 'Avi Perera OSINT & Research',
    category: 'Sovereign Dossiers',
    url: 'https://aviperera.com/feed/'
  }
];

function decodeEntities(str = '') {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#8216;|&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1] : '';
}

function parseXmlItems(xml, source, limit = 6) {
  const items = [];
  const rssBlocks = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)];
  if (rssBlocks.length) {
    for (const m of rssBlocks.slice(0, limit)) {
      const b = m[1];
      const title = decodeEntities(extractTag(b, 'title'));
      const url = decodeEntities(extractTag(b, 'link')).replace(/\s+/g, '');
      const pub = decodeEntities(extractTag(b, 'pubDate') || extractTag(b, 'dc:date'));
      const desc = decodeEntities(extractTag(b, 'description'));
      const d = pub ? new Date(pub) : new Date();
      const ts = isNaN(d.getTime()) ? Math.floor(Date.now() / 1000) : Math.floor(d.getTime() / 1000);
      if (title && url.startsWith('http')) {
        items.push({
          title,
          url,
          date: new Date(ts * 1000).toISOString().slice(0, 10),
          ts,
          source: source.name,
          key: source.key,
          category: source.category,
          summary: desc.slice(0, 210) + (desc.length > 210 ? '...' : '')
        });
      }
    }
    return items;
  }

  const atomBlocks = [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)];
  for (const m of atomBlocks.slice(0, limit)) {
    const b = m[1];
    const title = decodeEntities(extractTag(b, 'title'));
    const linkAlt = b.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i)
      || b.match(/<link[^>]+href=["']([^"']+)["']/i);
    const url = linkAlt ? linkAlt[1].trim() : '';
    const pub = decodeEntities(extractTag(b, 'published') || extractTag(b, 'updated'));
    const desc = decodeEntities(extractTag(b, 'summary') || extractTag(b, 'content'));
    const d = pub ? new Date(pub) : new Date();
    const ts = isNaN(d.getTime()) ? Math.floor(Date.now() / 1000) : Math.floor(d.getTime() / 1000);
    if (title && url.startsWith('http')) {
      items.push({
        title,
        url,
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        ts,
        source: source.name,
        key: source.key,
        category: source.category,
        summary: desc.slice(0, 210) + (desc.length > 210 ? '...' : '')
      });
    }
  }
  return items;
}

function isRelevant(sourceKey, title, desc) {
  if (['arxiv', 'mit', 'nature', 'avi'].includes(sourceKey)) return true;
  const txt = `${title} ${desc}`;
  return /\bAI\b/.test(txt) || /\b(artificial intelligence|lethal autonomous|autonomous weapon|killer robot|drone swarm|loitering munition|algorithmic|biometric|facial recognition|mass surveillance|cyberattack|frontier model|LLM|GPT-|Claude |Gemini |human control|article 36|CCW|deepfake|abliteration|guardrail|spyware|pegasus|palantir|autonomous targeting|machine learning|robotic weapon)\b/i.test(txt);
}

const CURATED_BASELINE = [
  {
    title: 'UN CCW 7th Review Conference Opens in Geneva (Nov 16–20, 2026) — 128 Parties Debate Two-Tier LAWS Mandate',
    url: 'https://disarmament.unoda.org/the-convention-on-certain-conventional-weapons/',
    date: '2026-11-16',
    ts: Math.floor(new Date('2026-11-16T09:00:00Z').getTime() / 1000),
    source: 'UNODA / CCW Geneva',
    key: 'un',
    category: 'UN / Treaty Bodies',
    sev: 'CRITICAL',
    summary: '128 High Contracting Parties review 2026 GGE Rolling Text on Tier-1 LAWS prohibitions and Tier-2 Meaningful Human Control obligations.'
  },
  {
    title: 'Google Releases Gemini 4 Hydrogen (Nov 12) & Carbon (Nov 10) with Runtime CoT Safety Monitors Under CA SB 53',
    url: 'https://deepmind.google/technologies/gemini/',
    date: '2026-11-12',
    ts: Math.floor(new Date('2026-11-12T12:00:00Z').getTime() / 1000),
    source: 'Google DeepMind / FSF 2.0',
    key: 'mit',
    category: 'Frontier Safety',
    sev: 'HIGH',
    summary: 'Hydrogen trims agentic shortcut risk by 81% vs 3.8 Flash under CA TFAIA & EU AI Act Art. 51–55 Systemic Risk transparency.'
  },
  {
    title: 'Anthropic Launches Claude Fable 5.2 & Restricted Mythos 5.2; OpenAI Deploys GPT-6 Cyber Under Daybreak Red',
    url: 'https://aviperera.com/ai-policy-tracker/',
    date: '2026-11-09',
    ts: Math.floor(new Date('2026-11-09T12:00:00Z').getTime() / 1000),
    source: 'Frontier Safety Registry',
    key: 'avi',
    category: 'Frontier Cyber Risk',
    sev: 'CRITICAL',
    summary: 'First frontier generation autonomously chaining zero-day exploits; general weights withheld and restricted to vetted cyber defenders.'
  },
  {
    title: 'Abliteration.ai: Orthogonal Representation Surgery Strips Open-Weight Guardrails (DeepSeek-V4 / Llama 4) in Minutes',
    url: 'https://aviperera.com/abliteration-ai-removing-guardrails-international-security/',
    date: '2026-10-08',
    ts: Math.floor(new Date('2026-10-08T12:00:00Z').getTime() / 1000),
    source: 'Avi Perera OSINT & Research',
    key: 'avi',
    category: 'Guardrail Abliteration',
    sev: 'CRITICAL',
    summary: 'Demonstrates fragility of open-weight refusal fine-tuning and gaps inside EU AI Act Art. 53 open-source exemptions.'
  },
  {
    title: 'EU AI Act Regulation (EU) 2024/1689 Reaches Full General Applicability — High-Risk Biometrics & Art. 55 Live',
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ:L_202401689',
    date: '2026-08-02',
    ts: Math.floor(new Date('2026-08-02T09:00:00Z').getTime() / 1000),
    source: 'European Union AI Office',
    key: 'icrc',
    category: 'Binding Hard Law',
    sev: 'HIGH',
    summary: 'Enforces mandatory conformity assessments, Annex III fundamental-rights audits, and post-market incident reporting across EU27.'
  },
  {
    title: 'ICRC Position & May 2026 Appeal: Urgent Need for Legally Binding Treaty Rules on Autonomous Weapon Systems',
    url: 'https://www.icrc.org/en/law-and-policy/autonomous-weapon-systems',
    date: '2026-05-12',
    ts: Math.floor(new Date('2026-05-12T10:00:00Z').getTime() / 1000),
    source: 'ICRC IHL Division',
    key: 'icrc',
    category: 'UN / Treaty Bodies',
    sev: 'CRITICAL',
    summary: 'Reaffirms prohibition of unpredictable AWS and anti-personnel autonomous targeting under Customary IHL and Geneva AP I Art. 36.'
  },
  {
    title: 'Paris Criminal Court Ruling in Lafarge Corporate Complicity Case Sets Precedent for Dual-Use Cloud & AI Vendors',
    url: 'https://www.ecchr.eu/en/case/lafarge-in-syria/',
    date: '2026-04-07',
    ts: Math.floor(new Date('2026-04-07T12:00:00Z').getTime() / 1000),
    source: 'ECCHR / Legal Precedent',
    key: 'hrw',
    category: 'Corporate Liability',
    sev: 'CRITICAL',
    summary: 'Rejects neutral commercial vendor defense where infrastructure knowingly facilitates IHL violations and crimes against humanity.'
  },
  {
    title: 'UNGA Resolution A/RES/80/57 on Lethal Autonomous Weapons Systems Adopted 164–6–7',
    url: 'https://docs.un.org/en/A/RES/80/57',
    date: '2025-12-01',
    ts: Math.floor(new Date('2025-12-01T14:00:00Z').getTime() / 1000),
    source: 'UN General Assembly',
    key: 'un',
    category: 'UN / Treaty Bodies',
    sev: 'HIGH',
    summary: '164 Member States vote for urgent international LAWS treaty work; Belarus, Burundi, DPRK, Israel, Russia, and United States vote against.'
  }
];

async function run() {
  const collected = [];
  const sourceStats = [];

  for (const src of SOURCES) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(src.url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'SovereignIntelligenceDashboard/7.0 (https://aviperera.com)' }
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const rawParsed = parseXmlItems(xml, src, 12);
      const parsed = rawParsed.filter(it => isRelevant(src.key, it.title, it.summary)).slice(0, 6);
      collected.push(...parsed);
      sourceStats.push({ key: src.key, name: src.name, category: src.category, count: parsed.length, status: parsed.length ? 'live' : 'filtered' });
      console.log(`[OK] ${src.key}: ${parsed.length}/${rawParsed.length} relevant items`);
    } catch (err) {
      clearTimeout(timer);
      sourceStats.push({ key: src.key, name: src.name, category: src.category, count: 0, status: 'degraded', error: err.message });
      console.log(`[WARN] ${src.key}: ${err.message}`);
    }
  }

  // Merge live items + baseline so high-authority baseline milestones remain available when offline
  const seenUrls = new Set();
  const merged = [];
  for (const item of [...collected, ...CURATED_BASELINE]) {
    if (!seenUrls.has(item.url)) {
      seenUrls.add(item.url);
      merged.push(item);
    }
  }
  merged.sort((a, b) => b.ts - a.ts);

  const payload = {
    generatedAt: new Date().toISOString(),
    count: merged.length,
    sources: sourceStats,
    items: merged.slice(0, 64)
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${outFile} (${payload.count} items)`);

  if (fs.existsSync(path.dirname(wpMirrorFile))) {
    fs.writeFileSync(wpMirrorFile, JSON.stringify(payload, null, 2));
    console.log(`Mirrored ${wpMirrorFile}`);
  }
}

run();
