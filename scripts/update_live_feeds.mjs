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

const CURATED_BASELINE = [
  {
    title: 'Seventh Review Conference of the Convention on Certain Conventional Weapons (CCW) Convenes in Geneva (Nov 16–20, 2026)',
    url: 'https://disarmament.unoda.org/the-convention-on-certain-conventional-weapons/',
    date: '2026-11-16',
    ts: Math.floor(new Date('2026-11-16T08:00:00Z').getTime() / 1000),
    source: 'UNODA / CCW Geneva',
    key: 'un',
    category: 'UN / Treaty Bodies',
    summary: '128 High Contracting Parties review 2026 GGE Rolling Text on Lethal Autonomous Weapons Systems (LAWS) and two-tier prohibition/regulation mandate ahead of treaty negotiations.'
  },
  {
    title: 'ICRC Position & May 2026 Appeal: Urgent Need for Binding International Rules on Autonomous Weapon Systems',
    url: 'https://www.icrc.org/en/law-and-policy/autonomous-weapon-systems',
    date: '2026-05-12',
    ts: Math.floor(new Date('2026-05-12T10:00:00Z').getTime() / 1000),
    source: 'ICRC IHL Division',
    key: 'icrc',
    category: 'UN / Treaty Bodies',
    summary: 'Reaffirms prohibition of unpredictable AWS and anti-personnel autonomous targeting under Customary IHL and Geneva Conventions Additional Protocol I Art. 36.'
  },
  {
    title: 'UNGA Resolution A/RES/80/57: Lethal Autonomous Weapons Systems Adopted 164–6–7',
    url: 'https://docs.un.org/en/A/RES/80/57',
    date: '2025-12-01',
    ts: Math.floor(new Date('2025-12-01T14:00:00Z').getTime() / 1000),
    source: 'UN General Assembly',
    key: 'un',
    category: 'UN / Treaty Bodies',
    summary: '164 Member States vote in favour of advancing urgent international legal instruments on LAWS; 6 states (Belarus, Burundi, DPRK, Israel, Russia, United States) vote against.'
  },
  {
    title: 'EU AI Act Full General Applicability (Aug 2, 2026): High-Risk Annex III Biometric & Law Enforcement Obligations Live',
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ:L_202401689',
    date: '2026-08-02',
    ts: Math.floor(new Date('2026-08-02T09:00:00Z').getTime() / 1000),
    source: 'European Union AI Office',
    key: 'eu',
    category: 'Regulation & Hard Law',
    summary: 'Regulation (EU) 2024/1689 mandatory conformity assessments, post-market bias monitoring, and serious incident reporting enter general enforcement across EU27.'
  },
  {
    title: 'ICJ Provisional Measures (South Africa v. Israel) & Algorithmic Targeting Evidentiary Record',
    url: 'https://www.icj-cij.org/case/192',
    date: '2026-04-18',
    ts: Math.floor(new Date('2026-04-18T11:00:00Z').getTime() / 1000),
    source: 'International Court of Justice',
    key: 'lawfare',
    category: 'International Justice',
    summary: 'Documents state obligations to prevent genocidal acts and preserve evidence relating to automated target-generation pipelines (Lavender, Habsora, Where\'s Daddy?).'
  },
  {
    title: 'Paris Criminal Court Ruling in Lafarge Corporate Complicity Case Sets Supply-Chain Standard for Dual-Use Tech',
    url: 'https://www.ecchr.eu/en/case/lafarge-in-syria/',
    date: '2026-04-07',
    ts: Math.floor(new Date('2026-04-07T12:00:00Z').getTime() / 1000),
    source: 'ECCHR / Legal Precedent',
    key: 'hrw',
    category: 'Corporate Liability',
    summary: 'Rejects neutral commercial service defense where corporate infrastructure knowingly facilitates crimes against humanity under international criminal law.'
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
      const parsed = parseXmlItems(xml, src, 6);
      collected.push(...parsed);
      sourceStats.push({ key: src.key, name: src.name, category: src.category, count: parsed.length, status: parsed.length ? 'live' : 'empty' });
      console.log(`[OK] ${src.key}: ${parsed.length} items`);
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
