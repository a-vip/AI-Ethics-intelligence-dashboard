/* =========================================================================
   AI ETHICS INTELLIGENCE DASHBOARD v7.0 — MODULAR RUNTIME & CONNECTORS
   Sovereign Intelligence & Multidisciplinary AI Governance Ecosystem
   Loads external modular JSON datasets + Live WP/GitHub RSS connectors
   ========================================================================= */
(function () {
  'use strict';

  var CFG = window.SIED_CONFIG || {
    dataBase: './data/',
    rssApi: './data/live-feed.json',
    rssStatic: './data/live-feed.json',
    env: 'github'
  };

  // State Stores (Hydrated via async parallel JSON fetch)
  var FRONTIER_MODELS = [];
  var LAWS = [];
  var AGENTIC_SYSTEMS = [];
  var SURV = [];
  var BUBBLE_MATRIX = [];
  var TRAJECTORY = null;
  var TREATY_MATRIX = [];
  var REPO = [];
  var LIVE_FEED = [];
  var LIVE_SOURCES_META = [];

  var ALERTS_QUEUE = [
    { id: 'AL-06', date: '2026-11-16', sys: 'CCW 7th Review Conf & Saker/HX-2 Swarms', cat: 'UNODA Geneva Mandate', sev: 'CRITICAL', summary: '128 High Contracting Parties convene in Geneva (Nov 16–20, 2026) while EW-immune optical strike swarms operate without binding IHL treaty.', reg: 'UNGA 80/57 (164Y / 6N / 7A) vs UN CCW consensus gridlock', url: 'https://disarmament.unoda.org/the-convention-on-certain-conventional-weapons/' },
    { id: 'AL-05', date: '2026-11-09', sys: 'Claude Mythos 5.2 & OpenAI GPT-6 Cyber', cat: 'CRITICAL Cyber Threshold', sev: 'CRITICAL', summary: 'First frontier generation autonomously chaining zero-day exploits; restricted to vetted cyber programs (Daybreak Red / Cyber Verification).', reg: 'CA SB 53 TFAIA Critical Notice + EU AI Act Art. 55', url: 'https://aviperera.com/ai-policy-tracker/' },
    { id: 'AL-04', date: '2026-10-08', sys: 'Open-Weight Models (DeepSeek-V4 / Llama 4 / Qwen 3.8)', cat: 'Guardrail Abliteration', sev: 'CRITICAL', summary: 'Orthogonal weight projection removes safety refusals in minutes while retaining cyber/bio capability.', reg: 'Exposes EU AI Act Art. 53 open-weight exemptions', url: 'https://aviperera.com/abliteration-ai-removing-guardrails-international-security/' },
    { id: 'AL-03', date: '2026-09-18', sys: 'xAI Grok 4.7 & ByteDance Seedance 2.5', cat: 'Deepfake & Provenance Gap', sev: 'HIGH', summary: 'Unwatermarked synthetic media generation triggers DSA & Art. 50 transparency enforcement scrutiny.', reg: 'EU AI Act Art. 50 + China CAC Labeling Rules', url: 'https://aviperera.com/ai-policy-tracker/' },
    { id: 'AL-02', date: '2026-05-12', sys: 'IDF Lavender & Gospel Targeting AI', cat: 'IHL Distinction Violation', sev: 'CRITICAL', summary: '37,000+ targets generated with ~20s review and 10% error rate in populated Gaza; active ICJ evidentiary record.', reg: 'Geneva AP I Art. 36 & 51 + ICJ South Africa v. Israel', url: 'https://aviperera.com/lavender/' }
  ];

  // Airtable State
  var atState = { view: 'all', q: '', groupBy: 'none', sortKey: 'date', sortDir: 'desc', compact: false };
  // Lower Observatory Filter & Sort State
  var FILT = { r: 'ALL', s: 'ALL', f: 'ALL' };
  var LAWS_STATE = { cat: 'ALL', q: '', sortKey: 'a', sortDir: 'desc' };
  var TRAJ_MODE = 'theaters';
  var BUBBLE_DOMAIN = 'ALL';
  var TREATY_STATE = { q: '', region: 'ALL', stance: 'ALL', gap: 'ALL', sortKey: 'complianceScore', sortDir: 'desc', page: 1, pageSize: 25, showAll: false };
  var REPO_STATE = { cat: 'ALL', q: '', sortKey: 'year', sortDir: 'desc' };
  var RSS_CAT = 'all';

  var CH = {};

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function safeUrl(u) {
    return typeof u === 'string' && /^https?:\/\//i.test(u) ? u : '';
  }

  function showToast(msg) {
    var t = document.getElementById('sied-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'sied-toast';
      t.className = 'sied-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  function labClass(lab) {
    var l = (lab || '').toLowerCase();
    if (l.indexOf('google') >= 0) return 'lab-google';
    if (l.indexOf('anthropic') >= 0) return 'lab-anthropic';
    if (l.indexOf('openai') >= 0) return 'lab-openai';
    if (l.indexOf('meta') >= 0) return 'lab-meta';
    if (l.indexOf('deepseek') >= 0) return 'lab-deepseek';
    if (l.indexOf('xai') >= 0) return 'lab-xai';
    return 'lab-other';
  }

  function sevBadge(sev) {
    if (sev === 'CRITICAL') return '<span class="bdg il">CRITICAL</span>';
    if (sev === 'HIGH') return '<span class="bdg un">HIGH</span>';
    if (sev === 'MOD') return '<span class="bdg pt">MODERATE</span>';
    return '<span class="bdg ok">' + esc(sev || 'LOW') + '</span>';
  }

  function treatyBadge(val) {
    var s = String(val || 'Unknown');
    if (/^Party/i.test(s) || s === 'Endorsed (US Declaration)' || s === 'In Favour' || s === 'Yes') {
      return '<span class="bdg ok">' + esc(s) + '</span>';
    }
    if (/Signed|Two-Tier/i.test(s) || /Abstained/i.test(s)) {
      return '<span class="bdg un">' + esc(s) + '</span>';
    }
    if (/Against|Non-Party|Opposes|Withdrawn|Suspended/i.test(s)) {
      return '<span class="bdg il">' + esc(s) + '</span>';
    }
    if (/Observer/i.test(s)) {
      return '<span class="bdg pt">' + esc(s) + '</span>';
    }
    if (/Use-Ban/i.test(s)) {
      return '<span class="bdg pr">' + esc(s) + '</span>';
    }
    return '<span class="bdg unk">' + esc(s) + '</span>';
  }

  function regionMatch(reg) {
    if (FILT.r === 'ALL') return true;
    var r = (reg || '').toUpperCase();
    if (FILT.r === 'ASIA') return ['CHN', 'Asia-Pacific', 'ASIA', 'IND', 'TWN', 'KOR'].indexOf(reg) >= 0 || r === 'CHN' || r === 'IND';
    if (FILT.r === 'EU') return ['EU', 'GBR', 'DEU', 'FRA', 'EUR', 'NATO', 'Europe', 'EU/US'].indexOf(reg) >= 0 || r === 'EUR' || r === 'DEU' || r === 'FRA' || r === 'GBR';
    if (FILT.r === 'MENA') return ['TUR', 'ISR', 'IRN', 'MENA', 'Israel'].indexOf(reg) >= 0;
    return r === FILT.r || r.indexOf(FILT.r) >= 0;
  }

  function fwMatch(fw) {
    if (FILT.f === 'ALL') return true;
    var x = (fw || '').toUpperCase();
    if (FILT.f === 'IHL') return /IHL|ART\. 36|CCW|DOD|UNCLOS|ICJ|GENEVA/i.test(x);
    if (FILT.f === 'DEONT') return /DEONT|CERD|ECHR|GDPR|ICCPR|BIPA|EQUAL|FAIR/i.test(x);
    if (FILT.f === 'UTIL') return /UTIL|SAFETY|RSP|PREP|FSF|AI ACT/i.test(x);
    return x.indexOf(FILT.f) >= 0;
  }

  function getMergedFrontierModels() {
    var userAdded = [];
    try { userAdded = JSON.parse(localStorage.getItem('sied_user_models_v7') || localStorage.getItem('sied_user_models_v6') || '[]'); } catch (e) {}
    return userAdded.concat(FRONTIER_MODELS);
  }

  // ── Clock ──
  function tick() {
    var el = document.getElementById('sied-clk');
    if (el) el.textContent = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    var st = document.getElementById('sied-stamp');
    if (st) st.textContent = 'Synced ' + new Date().toISOString().slice(0, 16) + ' UTC · Modular Data Engine v7.0';
  }
  tick();
  setInterval(tick, 1000);

  // =========================================================================
  // 1. AIRTABLE FRONTIER AI MODELS BASE
  // =========================================================================
  function getFilteredAirtable() {
    var rows = getMergedFrontierModels().filter(function (m) {
      if (atState.view === 'nov2026' && (m.date || '').indexOf('2026-11') !== 0 && (m.date || '').indexOf('2026-10') !== 0) return false;
      if (atState.view === 'google' && (m.lab || '').toLowerCase().indexOf('google') < 0) return false;
      if (atState.view === 'anthropic' && (m.lab || '').toLowerCase().indexOf('anthropic') < 0) return false;
      if (atState.view === 'openai' && (m.lab || '').toLowerCase().indexOf('openai') < 0) return false;
      if (atState.view === 'open' && (m.weights || '').toLowerCase().indexOf('open') < 0) return false;
      if (atState.q) {
        var q = atState.q.toLowerCase();
        var blob = [m.name, m.lab, m.arch, m.study, m.regStatus, m.cyberBioTier, (m.biasPatterns || []).join(' ')].join(' ').toLowerCase();
        if (blob.indexOf(q) < 0) return false;
      }
      return true;
    });

    rows.sort(function (a, b) {
      var k = atState.sortKey;
      var va = a[k] != null ? a[k] : '';
      var vb = b[k] != null ? b[k] : '';
      if (typeof va === 'number' && typeof vb === 'number') {
        return atState.sortDir === 'asc' ? va - vb : vb - va;
      }
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      if (va < vb) return atState.sortDir === 'asc' ? -1 : 1;
      if (va > vb) return atState.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }

  function renderAirtableRow(m, num) {
    var bCol = m.biasScore >= 70 ? '#f43f5e' : (m.biasScore >= 45 ? '#f59e0b' : '#10b981');
    var gCol = m.guardrailScore >= 80 ? '#10b981' : (m.guardrailScore >= 60 ? '#f59e0b' : '#f43f5e');
    var regCls = (m.regEra || '').indexOf('Enforced') >= 0 ? 'ok' : ((m.regEra || '').indexOf('Open') >= 0 ? 'il' : 'pt');
    return '<tr>' +
      '<td><button class="at-expand-btn" title="Open full Airtable record" onclick="openRecordModal(\'' + esc(m.id) + '\')">' + num + ' ⤢</button></td>' +
      '<td style="font-family:var(--font);font-size:0.74rem;color:#94a3b8;white-space:nowrap;">' + esc(m.date) + '</td>' +
      '<td style="font-weight:700;min-width:170px;"><a href="' + safeUrl(m.cardUrl) + '" target="_blank" rel="noopener" style="color:#fff;text-decoration:none;">' + esc(m.name) + ' ↗</a><div style="font-size:0.68rem;color:#94a3b8;font-weight:400;">' + esc(m.cyberBioTier) + '</div></td>' +
      '<td><span class="at-pill ' + labClass(m.lab) + '">' + esc(m.lab) + '</span></td>' +
      '<td style="min-width:165px;"><div style="font-size:0.78rem;color:#e2e8f0;">' + esc(m.arch) + '</div><div style="font-family:var(--font);font-size:0.68rem;color:#7dd3fc;">' + esc(m.weights) + ' · ' + esc(m.context) + '</div></td>' +
      '<td style="min-width:210px;">' + (m.biasPatterns || []).map(function (b) { return '<span class="bias-tag">' + esc(b) + '</span>'; }).join('') + '<div style="font-size:0.72rem;color:#cbd5e1;margin-top:3px;">' + esc((m.study || '').slice(0, 92)) + (m.study && m.study.length > 92 ? '…' : '') + '</div></td>' +
      '<td><div class="at-bar-mini"><div class="at-track"><div class="at-fill" style="width:' + m.biasScore + '%;background:' + bCol + ';"></div></div><span style="font-family:var(--font);font-size:0.72rem;color:' + bCol + ';font-weight:700;">' + m.biasScore + '</span></div></td>' +
      '<td><div class="at-bar-mini"><div class="at-track"><div class="at-fill" style="width:' + m.guardrailScore + '%;background:' + gCol + ';"></div></div><span style="font-family:var(--font);font-size:0.72rem;color:' + gCol + ';font-weight:700;">' + m.guardrailScore + '</span></div></td>' +
      '<td style="min-width:200px;"><span class="bdg ' + regCls + '" style="margin-bottom:3px;">' + esc(m.regEra) + '</span><div style="font-size:0.72rem;color:#cbd5e1;">' + esc(m.regStatus) + '</div></td>' +
      '<td style="text-align:center;">' + sevBadge(m.sev) + '</td>' +
      '</tr>';
  }

  function renderAirtable() {
    var tbody = document.getElementById('at-tbody');
    var summary = document.getElementById('at-summary');
    var badge = document.getElementById('at-live-count');
    var kpiMod = document.getElementById('kpi-models');
    if (!tbody) return;

    var allModels = getMergedFrontierModels();
    var rows = getFilteredAirtable();
    if (badge) badge.textContent = rows.length + ' of ' + allModels.length + ' Records Shown';
    if (kpiMod) kpiMod.textContent = allModels.length;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:28px;color:#94a3b8;">No matching frontier models found. Clear filters above.</td></tr>';
      if (summary) summary.innerHTML = '';
      return;
    }

    var html = '';
    if (atState.groupBy && atState.groupBy !== 'none') {
      var groups = {};
      rows.forEach(function (r) {
        var gk = r[atState.groupBy] || 'Other';
        if (!groups[gk]) groups[gk] = [];
        groups[gk].push(r);
      });
      var idx = 0;
      Object.keys(groups).forEach(function (gName) {
        html += '<tr class="at-group-row"><td colspan="10">▾ ' + esc(gName) + ' <span style="color:#94a3b8;font-weight:400;">(' + groups[gName].length + ' records)</span></td></tr>';
        groups[gName].forEach(function (m) {
          idx++;
          html += renderAirtableRow(m, idx);
        });
      });
    } else {
      rows.forEach(function (m, i) { html += renderAirtableRow(m, i + 1); });
    }
    tbody.innerHTML = html;

    var avgBias = Math.round(rows.reduce(function (a, b) { return a + (b.biasScore || 0); }, 0) / rows.length);
    var avgGuard = Math.round(rows.reduce(function (a, b) { return a + (b.guardrailScore || 0); }, 0) / rows.length);
    var enforcedCnt = rows.filter(function (x) { return (x.regEra || '').indexOf('Enforced') >= 0; }).length;
    if (summary) {
      summary.innerHTML =
        '<span>∑ <strong>' + rows.length + '</strong> frontier records</span>' +
        '<span>Mean Bias Risk: <strong style="color:#fbbf24;">' + avgBias + '/100</strong></span>' +
        '<span>Mean Guardrail Score: <strong style="color:#34d399;">' + avgGuard + '/100</strong></span>' +
        '<span>Enforced Hard Law: <strong style="color:#38bdf8;">' + enforcedCnt + '</strong></span>' +
        '<span style="color:#94a3b8;">Updated through Nov 12, 2026</span>';
    }
  }

  window.setAtView = function (v, btn) {
    atState.view = v;
    document.querySelectorAll('#sied-wrapper .at-view-pill').forEach(function (b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderAirtable();
  };
  window.setAtSearch = function (v) { atState.q = v; renderAirtable(); };
  window.setAtGroup = function (v) { atState.groupBy = v; renderAirtable(); };
  window.sortAt = function (k) {
    if (atState.sortKey === k) atState.sortDir = atState.sortDir === 'asc' ? 'desc' : 'asc';
    else { atState.sortKey = k; atState.sortDir = 'desc'; }
    renderAirtable();
  };
  window.toggleAtCompact = function () {
    atState.compact = !atState.compact;
    var tbl = document.getElementById('at-table');
    if (tbl) tbl.classList.toggle('compact', atState.compact);
    var b = document.getElementById('at-density-btn');
    if (b) b.textContent = atState.compact ? 'Density: Compact' : 'Density: Comfortable';
  };

  window.openRecordModal = function (id) {
    var m = getMergedFrontierModels().find(function (x) { return x.id === id; });
    if (!m) return;
    document.getElementById('rm-header').textContent = 'AIRTABLE FRONTIER RECORD · ' + (m.name || '');
    document.getElementById('rm-body').innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">' +
      '<div><div style="font-size:0.7rem;color:#94a3b8;font-family:var(--font);">ORGANIZATION &amp; REGION</div><div style="font-weight:700;margin-top:3px;">' + esc(m.lab) + ' (' + esc(m.region) + ')</div></div>' +
      '<div><div style="font-size:0.7rem;color:#94a3b8;font-family:var(--font);">RELEASE DATE</div><div style="font-weight:700;margin-top:3px;">' + esc(m.date) + '</div></div>' +
      '<div><div style="font-size:0.7rem;color:#94a3b8;font-family:var(--font);">ARCHITECTURE &amp; WEIGHTS</div><div style="margin-top:3px;">' + esc(m.arch) + ' · ' + esc(m.weights) + ' (' + esc(m.context) + ')</div></div>' +
      '<div><div style="font-size:0.7rem;color:#94a3b8;font-family:var(--font);">SAFETY / CYBER TIER</div><div style="margin-top:3px;">' + esc(m.cyberBioTier) + ' · ' + sevBadge(m.sev) + '</div></div>' +
      '</div>' +
      '<div style="margin-bottom:14px;"><div style="font-size:0.7rem;color:#94a3b8;font-family:var(--font);margin-bottom:5px;">ANNOTATED BIAS PATTERNS</div>' +
      (m.biasPatterns || []).map(function (b) { return '<span class="bias-tag">' + esc(b) + '</span>'; }).join(' ') + '</div>' +
      '<div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.28);border-radius:10px;padding:12px 14px;margin-bottom:14px;">' +
      '<div style="font-size:0.7rem;color:#7dd3fc;font-family:var(--font);margin-bottom:4px;">EVALUATION &amp; BIAS BENCHMARK SUMMARY</div>' +
      '<div style="font-size:0.86rem;line-height:1.55;">' + esc(m.study) + '</div></div>' +
      '<div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.28);border-radius:10px;padding:12px 14px;margin-bottom:16px;">' +
      '<div style="font-size:0.7rem;color:#6ee7b7;font-family:var(--font);margin-bottom:4px;">TEMPORAL CONTEXTUALIZATION (POLICY TRACKER CONCORDANCE)</div>' +
      '<div style="font-size:0.85rem;"><strong>' + esc(m.regEra) + ':</strong> ' + esc(m.regStatus) + '</div></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      (safeUrl(m.cardUrl) ? '<a class="lbtn p" href="' + safeUrl(m.cardUrl) + '" target="_blank" rel="noopener">Official Model Card ↗</a>' : '') +
      '<a class="lbtn" href="https://aviperera.com/ai-policy-tracker/" target="_blank" rel="noopener">Cross-Ref Global Policy Tracker ↗</a>' +
      '<a class="lbtn" href="https://aviperera.com/ai-policy-timeline/" target="_blank" rel="noopener">View Legal Chronology ↗</a>' +
      '</div>';
    document.getElementById('at-record-modal').style.display = 'flex';
  };
  window.closeRecordModal = function () { document.getElementById('at-record-modal').style.display = 'none'; };

  window.exportFrontierCSV = function () {
    var rows = getFilteredAirtable();
    var csv = 'Date,Model,Organization,Architecture,Weights,BiasScore,GuardrailScore,BiasPatterns,RegulatoryStatus,Severity,URL\n' +
      rows.map(function (m) {
        return [m.date, m.name, m.lab, m.arch, m.weights, m.biasScore, m.guardrailScore, (m.biasPatterns || []).join('; '), m.regStatus, m.sev, m.cardUrl]
          .map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(',');
      }).join('\n');
    downloadText('frontier-ai-models-registry-v7.csv', csv, 'text/csv');
  };

  window.openNewModelModal = function () {
    var dt = document.getElementById('nm-date');
    if (dt) dt.value = new Date().toISOString().slice(0, 10);
    document.getElementById('new-model-modal').style.display = 'flex';
  };
  window.closeNewModelModal = function () { document.getElementById('new-model-modal').style.display = 'none'; };
  window.saveNewModel = function () {
    var name = (document.getElementById('nm-name').value || '').trim();
    var lab = (document.getElementById('nm-lab').value || 'Independent').trim();
    var arch = (document.getElementById('nm-arch').value || 'Frontier Architecture').trim();
    var sev = document.getElementById('nm-sev').value || 'HIGH';
    var reg = (document.getElementById('nm-reg').value || 'Pending Formal Audit').trim();
    var bias = (document.getElementById('nm-bias').value || 'User-logged evaluation pending formal study').trim();
    var url = (document.getElementById('nm-card').value || 'https://aviperera.com/ai-policy-tracker/').trim();
    var dt = document.getElementById('nm-date').value || new Date().toISOString().slice(0, 10);
    if (!name) return alert('Please enter a model name.');
    var rec = {
      id: 'usr-' + Date.now(), date: dt, name: name, lab: lab, region: 'Global',
      arch: arch, weights: 'User Entry', context: 'Logged',
      biasPatterns: ['User Logged Bias Review'], study: bias,
      regStatus: reg, regEra: 'User Logged', regLink: 'https://aviperera.com/ai-policy-tracker/',
      sev: sev, fw: 'UTIL', biasScore: sev === 'CRITICAL' ? 75 : (sev === 'HIGH' ? 58 : 35),
      guardrailScore: sev === 'CRITICAL' ? 70 : 85, cyberBioTier: 'Analyst Review Queue',
      cardUrl: url
    };
    var cur = [];
    try { cur = JSON.parse(localStorage.getItem('sied_user_models_v7') || '[]'); } catch (e) {}
    cur.unshift(rec);
    localStorage.setItem('sied_user_models_v7', JSON.stringify(cur));
    closeNewModelModal();
    renderAirtable();
    buildFrontierCharts();
    showToast('Added "' + name + '" to Frontier Registry');
  };

  // =========================================================================
  // 2. LOWER OBSERVATORY TABS & FILTERS
  // =========================================================================
  window.switchDashTab = function (t) {
    document.querySelectorAll('#sied-wrapper .dtab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === t);
    });
    document.querySelectorAll('#sied-wrapper .dash-sec').forEach(function (sec) {
      sec.style.display = (t === 'all' || sec.getAttribute('data-sec') === t) ? 'block' : 'none';
    });
    setTimeout(function () {
      Object.keys(CH).forEach(function (k) {
        if (CH[k] && typeof CH[k].resize === 'function') CH[k].resize();
      });
    }, 60);
  };

  window.sf = function (dim, val) {
    FILT[dim] = val;
    document.querySelectorAll('#sied-wrapper .fbtn[data-f="' + dim + '"]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-v') === val);
    });
    renderLower();
  };

  window.tog = function (hdr) {
    var card = hdr.closest('.mod-card');
    if (!card) return;
    var body = card.querySelector('.mb');
    if (body) body.style.display = body.style.display === 'none' ? 'block' : 'none';
  };

  // ── Agentic Systems ──
  function renderAgenticSystems() {
    var grid = document.getElementById('agentic-grid');
    if (!grid) return;
    var list = AGENTIC_SYSTEMS.filter(function (a) {
      if (!regionMatch(a.region)) return false;
      if (FILT.s !== 'ALL' && a.sev !== FILT.s) return false;
      if (!fwMatch(a.fw)) return false;
      return true;
    });
    var cnt = document.getElementById('cnt-agentic');
    if (cnt) cnt.textContent = list.length;
    if (!list.length) {
      grid.innerHTML = '<div style="color:#94a3b8;font-size:0.84rem;grid-column:1/-1;">No agentic systems match active filters.</div>';
      return;
    }
    grid.innerHTML = list.map(function (a) {
      return '<div class="agent-card">' +
        '<div>' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">' +
        '<strong style="font-size:0.9rem;color:#fff;">' + esc(a.name) + '</strong>' + sevBadge(a.sev) +
        '</div>' +
        '<div style="font-family:var(--font);font-size:0.7rem;color:#7dd3fc;margin-bottom:6px;">' + esc(a.dev) + ' · ' + esc(a.tier) + '</div>' +
        '<div style="font-size:0.77rem;color:#cbd5e1;margin-bottom:6px;"><strong>Tools:</strong> ' + esc(a.tools) + '</div>' +
        '<div style="font-size:0.77rem;color:#fda4af;background:rgba(244,63,94,0.08);padding:7px 9px;border-radius:7px;border-left:2px solid #f43f5e;"><strong>Failure Mode:</strong> ' + esc(a.failureMode) + '</div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.07);">' +
        '<span style="font-family:var(--font);font-size:0.68rem;color:#94a3b8;">' + esc(a.regStatus) + '</span>' +
        (safeUrl(a.url) ? '<a class="lbtn sm" href="' + safeUrl(a.url) + '" target="_blank" rel="noopener">Source ↗</a>' : '') +
        '</div></div>';
    }).join('');
  }

  // ── Military AI & LAWS Deployment Table (50 Systems + Sort + Category Filter + Modal) ──
  window.setLawsCat = function (cat, btn) {
    LAWS_STATE.cat = cat;
    document.querySelectorAll('#laws-cat-pills .sp-btn').forEach(function (b) { b.classList.remove('on'); });
    if (btn) btn.classList.add('on');
    renderLaws();
  };
  window.sortLaws = function (k) {
    if (LAWS_STATE.sortKey === k) LAWS_STATE.sortDir = LAWS_STATE.sortDir === 'asc' ? 'desc' : 'asc';
    else { LAWS_STATE.sortKey = k; LAWS_STATE.sortDir = (k === 'name' || k === 'country' || k === 'theater') ? 'asc' : 'desc'; }
    renderLaws();
  };
  function getFilteredLaws() {
    var q = ((document.getElementById('laws-q') || {}).value || '').toLowerCase();
    var rows = LAWS.filter(function (w) {
      if (LAWS_STATE.cat !== 'ALL' && w.category !== LAWS_STATE.cat) return false;
      if (!regionMatch(w.region)) return false;
      if (FILT.s !== 'ALL' && w.sev !== FILT.s) return false;
      if (!fwMatch(w.fw)) return false;
      if (q && [w.name, w.dev, w.country, w.category, w.theater, w.note].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    rows.sort(function (a, b) {
      var k = LAWS_STATE.sortKey;
      var va = a[k] != null ? a[k] : '';
      var vb = b[k] != null ? b[k] : '';
      if (typeof va === 'number' && typeof vb === 'number') return LAWS_STATE.sortDir === 'asc' ? va - vb : vb - va;
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      if (va < vb) return LAWS_STATE.sortDir === 'asc' ? -1 : 1;
      if (va > vb) return LAWS_STATE.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }

  function renderLaws() {
    var tb = document.getElementById('laws-tb');
    if (!tb) return;
    var rows = getFilteredLaws();
    var lbl = document.getElementById('laws-count-lbl');
    var cntTab = document.getElementById('cnt-laws');
    var kpiLaws = document.getElementById('kpi-laws');
    if (lbl) lbl.textContent = rows.length + ' / ' + LAWS.length;
    if (cntTab) cntTab.textContent = rows.length;
    if (kpiLaws) kpiLaws.textContent = LAWS.length;

    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#94a3b8;">No LAWS platforms match active filters.</td></tr>';
      return;
    }

    tb.innerHTML = rows.map(function (w) {
      var col = w.a >= 85 ? '#f43f5e' : (w.a >= 75 ? '#f59e0b' : '#38bdf8');
      var accCol = w.accountability >= 60 ? '#10b981' : (w.accountability >= 35 ? '#f59e0b' : '#f43f5e');
      var stB = w.status === 'hitl' ? '<span class="bdg ok">HITL Review</span>' : (w.status === 'nocontrol' ? '<span class="bdg il">Zero MHC</span>' : '<span class="bdg un">Unverified</span>');
      return '<tr class="clickable-row" onclick="openLawsModal(\'' + esc(w.id) + '\')" title="Click to inspect Art. 36 & technical dossier">' +
        '<td style="white-space:nowrap;">' + w.flag + ' <span style="font-size:0.74rem;color:#94a3b8;">' + esc(w.country) + '</span></td>' +
        '<td><div style="font-weight:700;color:#fff;">' + esc(w.name) + '</div><div style="font-size:0.71rem;color:#94a3b8;">' + esc(w.dev) + ' · <span style="color:#7dd3fc;">' + esc(w.category) + '</span></div></td>' +
        '<td><span style="font-family:var(--font);font-weight:700;color:' + col + ';">' + w.a + '%</span></td>' +
        '<td><span style="font-family:var(--font);font-weight:700;color:' + accCol + ';">' + w.accountability + '/100</span></td>' +
        '<td style="font-family:var(--font);font-size:0.75rem;color:#cbd5e1;">' + esc(w.year) + '</td>' +
        '<td style="font-size:0.75rem;">' + esc(w.theater) + '<div style="margin-top:2px;">' + stB + '</div></td>' +
        '<td>' + sevBadge(w.sev) + '</td>' +
        '</tr>';
    }).join('');
  }

  window.openLawsModal = function (id) {
    var w = LAWS.find(function (x) { return x.id === id; });
    if (!w) return;
    document.getElementById('rm-header').textContent = 'MILITARY AI / LAWS DOSSIER · ' + (w.name || '');
    document.getElementById('rm-body').innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">' +
      '<div><div style="font-size:0.7rem;color:#94a3b8;font-family:var(--font);">ORIGIN &amp; DEVELOPER</div><div style="font-weight:700;margin-top:3px;">' + w.flag + ' ' + esc(w.country) + ' — ' + esc(w.dev) + '</div></div>' +
      '<div><div style="font-size:0.7rem;color:#94a3b8;font-family:var(--font);">CATEGORY &amp; FIRST FIELDED</div><div style="font-weight:700;margin-top:3px;">' + esc(w.category) + ' (' + esc(w.year) + ')</div></div>' +
      '<div><div style="font-size:0.7rem;color:#94a3b8;font-family:var(--font);">AUTONOMY vs. ACCOUNTABILITY</div><div style="margin-top:3px;"><strong style="color:#f43f5e;">Autonomy: ' + w.a + '%</strong> · <strong style="color:#38bdf8;">MHC Score: ' + w.accountability + '/100</strong></div></div>' +
      '<div><div style="font-size:0.7rem;color:#94a3b8;font-family:var(--font);">THEATER &amp; SEVERITY</div><div style="margin-top:3px;">' + esc(w.theater) + ' · ' + sevBadge(w.sev) + '</div></div>' +
      '</div>' +
      '<div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.28);border-radius:10px;padding:12px 14px;margin-bottom:12px;">' +
      '<div style="font-size:0.7rem;color:#7dd3fc;font-family:var(--font);margin-bottom:4px;">OPERATIONAL CAPABILITY &amp; EVIDENCE RECORD</div>' +
      '<div style="font-size:0.86rem;line-height:1.55;">' + esc(w.note) + '</div></div>' +
      '<div style="background:rgba(244,63,94,0.08);border:1px solid rgba(244,63,94,0.3);border-radius:10px;padding:12px 14px;margin-bottom:16px;">' +
      '<div style="font-size:0.7rem;color:#fda4af;font-family:var(--font);margin-bottom:4px;">GENEVA ART. 36 &amp; IHL LEGAL STATUS</div>' +
      '<div style="font-size:0.85rem;line-height:1.5;">' + esc(w.art36) + '</div></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      (safeUrl(w.url) ? '<a class="lbtn p" href="' + safeUrl(w.url) + '" target="_blank" rel="noopener">Primary Dossier / Reference ↗</a>' : '') +
      '<a class="lbtn" href="https://ihl-databases.icrc.org/en/ihl-treaties/api-1977/article-36" target="_blank" rel="noopener">ICRC Art. 36 Standard ↗</a>' +
      '</div>';
    document.getElementById('at-record-modal').style.display = 'flex';
  };

  window.exportLawsCSV = function () {
    var rows = getFilteredLaws();
    var csv = 'Country,System,Category,Developer,Year,AutonomyPct,AccountabilityScore,Theater,Severity,Framework,Art36Status,URL\n' +
      rows.map(function (w) {
        return [w.country, w.name, w.category, w.dev, w.year, w.a, w.accountability, w.theater, w.sev, w.fw, w.art36, w.url]
          .map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(',');
      }).join('\n');
    downloadText('military-ai-laws-deployment-v7.csv', csv, 'text/csv');
  };

  window.exportLawsJSON = function () {
    downloadText('military-ai-laws-deployment-v7.json', JSON.stringify(getFilteredLaws(), null, 2), 'application/json');
  };

  // ── Surveillance Cards ──
  function renderSurv() {
    var g = document.getElementById('surv-grid');
    if (!g) return;
    var rows = SURV.filter(function (s) {
      if (!regionMatch(s.region)) return false;
      if (FILT.s !== 'ALL' && s.sev !== FILT.s) return false;
      return true;
    });
    var cnt = document.getElementById('cnt-surv');
    if (cnt) cnt.textContent = rows.length;
    g.innerHTML = rows.map(function (s) {
      var lnk = safeUrl(s.url) ? '<a href="' + safeUrl(s.url) + '" target="_blank" rel="noopener" style="color:#7dd3fc;font-size:0.71rem;text-decoration:none;">' + esc(s.fw) + ' ↗</a>' : '<span style="color:#94a3b8;font-size:0.71rem;">' + esc(s.fw) + '</span>';
      return '<div class="hc ' + esc(s.cls || 'hc2') + '">' +
        '<div><div style="font-weight:700;font-size:0.86rem;color:#fff;">' + esc(s.name) + '</div>' +
        '<div style="font-size:0.74rem;color:#cbd5e1;margin-top:3px;">' + esc(s.actor) + ' · ' + esc(s.pop) + '</div></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:8px;">' +
        '<span class="hsc">' + esc(s.risk) + '</span>' + lnk + '</div></div>';
    }).join('');
  }

  // ── 195-State International LAWS Treaty & Governance Matrix ──
  function getFilteredTreaty() {
    var q = (TREATY_STATE.q || '').toLowerCase();
    var rows = TREATY_MATRIX.filter(function (t) {
      if (TREATY_STATE.region !== 'ALL' && t.unRegion !== TREATY_STATE.region) return false;
      if (TREATY_STATE.stance !== 'ALL' && t.stance !== TREATY_STATE.stance) return false;
      if (TREATY_STATE.gap === 'NO_AP1' && /^Party/i.test(t.ap1)) return false;
      if (TREATY_STATE.gap === 'NO_CCW' && t.ccw === 'Party') return false;
      if (TREATY_STATE.gap === 'NO_ICC' && t.icc === 'Party') return false;
      if (TREATY_STATE.gap === 'AGAINST_80' && t.unga80 !== 'Against') return false;
      if (TREATY_STATE.gap === 'POL_DECL' && (t.polDecl || '').indexOf('Endorsed') < 0) return false;
      if (q && [t.country, t.unRegion, t.stance, t.ap1, t.ccw, t.icc, t.note].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    rows.sort(function (a, b) {
      var k = TREATY_STATE.sortKey;
      var va = a[k] != null ? a[k] : '';
      var vb = b[k] != null ? b[k] : '';
      if (typeof va === 'number' && typeof vb === 'number') return TREATY_STATE.sortDir === 'asc' ? va - vb : vb - va;
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      if (va < vb) return TREATY_STATE.sortDir === 'asc' ? -1 : 1;
      if (va > vb) return TREATY_STATE.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }

  window.setTreatyFilter = function (field, val) {
    TREATY_STATE[field] = val;
    TREATY_STATE.page = 1;
    renderTreaty();
  };
  window.sortTreaty = function (k) {
    if (TREATY_STATE.sortKey === k) TREATY_STATE.sortDir = TREATY_STATE.sortDir === 'asc' ? 'desc' : 'asc';
    else { TREATY_STATE.sortKey = k; TREATY_STATE.sortDir = (k === 'complianceScore') ? 'desc' : 'asc'; }
    renderTreaty();
  };
  window.setTreatyPage = function (p) { TREATY_STATE.page = p; renderTreaty(); };
  window.toggleTreatyShowAll = function () { TREATY_STATE.showAll = !TREATY_STATE.showAll; TREATY_STATE.page = 1; renderTreaty(); };

  function renderTreaty() {
    var body = document.getElementById('treaty-body');
    var kpiStates = document.getElementById('kpi-states');
    if (kpiStates && TREATY_MATRIX.length) kpiStates.textContent = TREATY_MATRIX.length;
    if (!body || !TREATY_MATRIX.length) return;

    var rows = getFilteredTreaty();
    var pageSize = TREATY_STATE.showAll ? rows.length : TREATY_STATE.pageSize;
    var totalPages = Math.max(1, Math.ceil(rows.length / Math.max(1, pageSize)));
    if (TREATY_STATE.page > totalPages) TREATY_STATE.page = 1;
    var start = (TREATY_STATE.page - 1) * pageSize;
    var pageRows = rows.slice(start, start + pageSize);

    var supCnt = TREATY_MATRIX.filter(function (x) { return x.stance === 'Binding Treaty Supporter'; }).length;
    var twoCnt = TREATY_MATRIX.filter(function (x) { return x.stance === 'Two-Tier IHL / MHC Regulation'; }).length;
    var oppCnt = TREATY_MATRIX.filter(function (x) { return x.stance === 'Opposes Binding Treaty' || x.stance.indexOf('Use-Ban') >= 0; }).length;
    var unkCnt = TREATY_MATRIX.filter(function (x) { return x.stance.indexOf('Unknown') >= 0; }).length;
    var ccwCnt = TREATY_MATRIX.filter(function (x) { return x.ccw === 'Party'; }).length;
    var ap1Cnt = TREATY_MATRIX.filter(function (x) { return /^Party/i.test(x.ap1); }).length;

    var html =
      '<div class="treaty-summary-bar">' +
      '<div class="ts-card"><span class="ts-k">Total UN Coverage</span><span class="ts-v" style="color:#38bdf8;">' + TREATY_MATRIX.length + ' States</span><span style="font-size:0.68rem;color:#94a3b8;">193 Members + 2 Observers</span></div>' +
      '<div class="ts-card"><span class="ts-k">Binding Ban Supporters</span><span class="ts-v" style="color:#34d399;">' + supCnt + '</span><span style="font-size:0.68rem;color:#94a3b8;">Pro-Treaty Coalition</span></div>' +
      '<div class="ts-card"><span class="ts-k">Two-Tier IHL / MHC</span><span class="ts-v" style="color:#fbbf24;">' + twoCnt + '</span><span style="font-size:0.68rem;color:#94a3b8;">Context Human Control</span></div>' +
      '<div class="ts-card"><span class="ts-k">Oppose / Use-Ban Only</span><span class="ts-v" style="color:#f43f5e;">' + oppCnt + '</span><span style="font-size:0.68rem;color:#94a3b8;">Resist Binding Ban</span></div>' +
      '<div class="ts-card"><span class="ts-k">Unknown / Unrecorded</span><span class="ts-v" style="color:#cbd5e1;">' + unkCnt + '</span><span style="font-size:0.68rem;color:#94a3b8;">No Formal CCW Submission</span></div>' +
      '<div class="ts-card"><span class="ts-k">Binding Treaties Active</span><span class="ts-v" style="color:#7dd3fc;">' + ap1Cnt + ' / ' + ccwCnt + '</span><span style="font-size:0.68rem;color:#94a3b8;">AP I Art. 36 / UN CCW Parties</span></div>' +
      '</div>' +
      '<div class="chtw" style="height:56px;margin-bottom:14px;"><canvas id="ch-treaty-bar"></canvas></div>' +
      '<div class="ts-filters">' +
      '<input value="' + esc(TREATY_STATE.q) + '" oninput="setTreatyFilter(\'q\', this.value)" placeholder="Search any of 195 UN states, treaties, votes..." style="min-width:220px;flex:1;" />' +
      '<select onchange="setTreatyFilter(\'region\', this.value)" class="at-select">' +
      '<option value="ALL"' + (TREATY_STATE.region === 'ALL' ? ' selected' : '') + '>UN Region: All (' + TREATY_MATRIX.length + ')</option>' +
      '<option value="African Group"' + (TREATY_STATE.region === 'African Group' ? ' selected' : '') + '>African Group (54)</option>' +
      '<option value="Asia-Pacific Group"' + (TREATY_STATE.region === 'Asia-Pacific Group' ? ' selected' : '') + '>Asia-Pacific Group (55)</option>' +
      '<option value="Eastern European Group"' + (TREATY_STATE.region === 'Eastern European Group' ? ' selected' : '') + '>Eastern European Group (23)</option>' +
      '<option value="GRULAC (Latin America & Caribbean)"' + (TREATY_STATE.region === 'GRULAC (Latin America & Caribbean)' ? ' selected' : '') + '>GRULAC (33)</option>' +
      '<option value="WEOG (Western Europe & Others)"' + (TREATY_STATE.region === 'WEOG (Western Europe & Others)' ? ' selected' : '') + '>WEOG (28)</option>' +
      '<option value="UN Observer State"' + (TREATY_STATE.region === 'UN Observer State' ? ' selected' : '') + '>UN Observer States (2)</option>' +
      '</select>' +
      '<select onchange="setTreatyFilter(\'stance\', this.value)" class="at-select">' +
      '<option value="ALL"' + (TREATY_STATE.stance === 'ALL' ? ' selected' : '') + '>Doctrine: All Stances</option>' +
      '<option value="Binding Treaty Supporter"' + (TREATY_STATE.stance === 'Binding Treaty Supporter' ? ' selected' : '') + '>Binding Treaty Supporter (' + supCnt + ')</option>' +
      '<option value="Two-Tier IHL / MHC Regulation"' + (TREATY_STATE.stance === 'Two-Tier IHL / MHC Regulation' ? ' selected' : '') + '>Two-Tier IHL / MHC (' + twoCnt + ')</option>' +
      '<option value="Opposes Binding Treaty"' + (TREATY_STATE.stance === 'Opposes Binding Treaty' ? ' selected' : '') + '>Opposes Binding Treaty</option>' +
      '<option value="Use-Ban Only / Opposes Dev Ban"' + (TREATY_STATE.stance === 'Use-Ban Only / Opposes Dev Ban' ? ' selected' : '') + '>Use-Ban Only (China)</option>' +
      '<option value="Unknown / No Recorded Position"' + (TREATY_STATE.stance === 'Unknown / No Recorded Position' ? ' selected' : '') + '>Unknown / No Recorded Position (' + unkCnt + ')</option>' +
      '</select>' +
      '<select onchange="setTreatyFilter(\'gap\', this.value)" class="at-select">' +
      '<option value="ALL"' + (TREATY_STATE.gap === 'ALL' ? ' selected' : '') + '>Treaty Filter: All</option>' +
      '<option value="NO_AP1"' + (TREATY_STATE.gap === 'NO_AP1' ? ' selected' : '') + '>Not Party to AP I (Art. 36)</option>' +
      '<option value="NO_CCW"' + (TREATY_STATE.gap === 'NO_CCW' ? ' selected' : '') + '>Not Party to UN CCW</option>' +
      '<option value="NO_ICC"' + (TREATY_STATE.gap === 'NO_ICC' ? ' selected' : '') + '>Not Party to Rome Statute (ICC)</option>' +
      '<option value="AGAINST_80"' + (TREATY_STATE.gap === 'AGAINST_80' ? ' selected' : '') + '>Voted Against UNGA 80/57 (6)</option>' +
      '<option value="POL_DECL"' + (TREATY_STATE.gap === 'POL_DECL' ? ' selected' : '') + '>US Pol. Decl. Endorsers</option>' +
      '</select>' +
      '</div>' +
      '<div style="max-height:520px;overflow:auto;">' +
      '<table class="lt">' +
      '<thead><tr>' +
      '<th class="sortable" onclick="sortTreaty(\'country\')">State ⇅</th>' +
      '<th class="sortable" onclick="sortTreaty(\'unRegion\')">UN Region ⇅</th>' +
      '<th class="sortable" onclick="sortTreaty(\'stance\')">LAWS Doctrine ⇅</th>' +
      '<th class="sortable" onclick="sortTreaty(\'ap1\')">AP I Art. 36 ⇅</th>' +
      '<th class="sortable" onclick="sortTreaty(\'ccw\')">UN CCW ⇅</th>' +
      '<th class="sortable" onclick="sortTreaty(\'icc\')">Rome Statute ⇅</th>' +
      '<th class="sortable" onclick="sortTreaty(\'unga80\')">UNGA 80/57 ⇅</th>' +
      '<th class="sortable" onclick="sortTreaty(\'polDecl\')">Pol. Decl. ⇅</th>' +
      '<th class="sortable" onclick="sortTreaty(\'complianceScore\')">Score ⇅</th>' +
      '</tr></thead><tbody>' +
      pageRows.map(function (t) {
        var sCol = t.complianceScore >= 75 ? '#34d399' : (t.complianceScore >= 45 ? '#fbbf24' : '#f43f5e');
        return '<tr class="clickable-row" onclick="openStateModal(\'' + esc(t.country) + '\')" title="Click for multi-year UNGA vote trajectory & treaty details">' +
          '<td style="white-space:nowrap;font-weight:700;color:#fff;"><span class="fi fi-' + esc(t.iso2 || 'un') + '" style="margin-right:7px;border-radius:2px;"></span>' + esc(t.country) + '</td>' +
          '<td style="font-size:0.74rem;color:#94a3b8;white-space:nowrap;">' + esc(t.unRegion) + '</td>' +
          '<td>' + treatyBadge(t.stance) + '</td>' +
          '<td>' + treatyBadge(t.ap1) + '</td>' +
          '<td>' + treatyBadge(t.ccw) + (t.ccw === 'Party' ? ' <span style="font-size:0.65rem;color:#94a3b8;">(P2:' + t.ccwP2 + ')</span>' : '') + '</td>' +
          '<td>' + treatyBadge(t.icc) + '</td>' +
          '<td>' + treatyBadge(t.unga80) + '</td>' +
          '<td style="font-size:0.72rem;color:#cbd5e1;">' + (t.polDecl.indexOf('Endorsed') >= 0 ? '<span class="bdg pt">Endorsed</span>' : '<span style="color:#64748b;">No / Unknown</span>') + '</td>' +
          '<td style="font-family:var(--font);font-weight:700;color:' + sCol + ';">' + t.complianceScore + '</td>' +
          '</tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<div class="pg-bar">' +
      '<span>Showing ' + (rows.length ? (start + 1) : 0) + '–' + (start + pageRows.length) + ' of ' + rows.length + ' filtered states</span>' +
      '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
      (!TREATY_STATE.showAll && TREATY_STATE.page > 1 ? '<button class="lbtn sm" onclick="setTreatyPage(' + (TREATY_STATE.page - 1) + ')">← Prev</button>' : '') +
      (!TREATY_STATE.showAll ? '<span>Page ' + TREATY_STATE.page + ' / ' + totalPages + '</span>' : '') +
      (!TREATY_STATE.showAll && TREATY_STATE.page < totalPages ? '<button class="lbtn sm" onclick="setTreatyPage(' + (TREATY_STATE.page + 1) + ')">Next →</button>' : '') +
      '<button class="lbtn sm p" onclick="toggleTreatyShowAll()">' + (TREATY_STATE.showAll ? 'Paginate (25/pg)' : 'Show All (' + rows.length + ')') + '</button>' +
      '</div></div>';

    body.innerHTML = html;
    buildTreatyBarChart(supCnt, twoCnt, oppCnt, unkCnt);
  }

  window.openStateModal = function (countryName) {
    var t = TREATY_MATRIX.find(function (x) { return x.country === countryName; });
    if (!t) return;
    document.getElementById('rm-header').textContent = 'UN SOVEREIGN TREATY DOSSIER · ' + t.country.toUpperCase();
    document.getElementById('rm-body').innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">' +
      '<span class="fi fi-' + esc(t.iso2 || 'un') + '" style="font-size:2.1rem;border-radius:4px;"></span>' +
      '<div><div style="font-size:1.1rem;font-weight:800;color:#fff;">' + esc(t.country) + '</div>' +
      '<div style="font-family:var(--font);font-size:0.74rem;color:#7dd3fc;">' + esc(t.unStatus) + ' · ' + esc(t.unRegion) + '</div></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">' +
      '<div><div style="font-size:0.68rem;color:#94a3b8;font-family:var(--font);">GENEVA CONVENTIONS I–IV</div><div style="margin-top:4px;">' + treatyBadge(t.gc) + '</div></div>' +
      '<div><div style="font-size:0.68rem;color:#94a3b8;font-family:var(--font);">ADD. PROTOCOL I (ART. 36 REVIEWS)</div><div style="margin-top:4px;">' + treatyBadge(t.ap1) + '</div></div>' +
      '<div><div style="font-size:0.68rem;color:#94a3b8;font-family:var(--font);">UN CCW &amp; PROTOCOLS II / V</div><div style="margin-top:4px;">' + treatyBadge(t.ccw) + ' <span style="font-size:0.75rem;color:#cbd5e1;">(P2: ' + esc(t.ccwP2) + ' · P5: ' + esc(t.ccwP5) + ')</span></div></div>' +
      '<div><div style="font-size:0.68rem;color:#94a3b8;font-family:var(--font);">ROME STATUTE (ICC)</div><div style="margin-top:4px;">' + treatyBadge(t.icc) + '</div></div>' +
      '</div>' +
      '<div style="background:rgba(15,23,42,0.85);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:12px;margin-bottom:14px;">' +
      '<div style="font-size:0.69rem;color:#94a3b8;font-family:var(--font);margin-bottom:8px;">UNGA LAWS RESOLUTION VOTING RECORD (2023–2025) &amp; US POL. DECL.</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;">' +
      '<div><div style="font-size:0.68rem;color:#94a3b8;">A/RES/78/241 (2023)</div>' + treatyBadge(t.unga78) + '</div>' +
      '<div><div style="font-size:0.68rem;color:#94a3b8;">A/RES/79/62 (2024)</div>' + treatyBadge(t.unga79) + '</div>' +
      '<div><div style="font-size:0.68rem;color:#94a3b8;">A/RES/80/57 (2025)</div>' + treatyBadge(t.unga80) + '</div>' +
      '<div><div style="font-size:0.68rem;color:#94a3b8;">US Military AI Decl.</div><div style="font-size:0.76rem;">' + esc(t.polDecl) + '</div></div>' +
      '</div></div>' +
      '<div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.28);border-radius:10px;padding:12px 14px;margin-bottom:16px;">' +
      '<div style="font-size:0.7rem;color:#7dd3fc;font-family:var(--font);margin-bottom:4px;">NATIONAL DOCTRINE &amp; ACCOUNTABILITY AUDIT (' + t.complianceScore + '/100)</div>' +
      '<div style="margin-bottom:4px;">' + treatyBadge(t.stance) + '</div>' +
      '<div style="font-size:0.84rem;color:#e2e8f0;">' + esc(t.note) + '</div></div>' +
      '<a class="lbtn p" href="' + safeUrl(t.sourceUrl) + '" target="_blank" rel="noopener">Official UNODA / ICRC Treaty Record ↗</a>';
    document.getElementById('at-record-modal').style.display = 'flex';
  };

  window.openMatrixModal = function () {
    var tb = document.getElementById('tm-tbody');
    if (tb) {
      tb.innerHTML = TREATY_MATRIX.map(function (t) {
        return '<tr style="border-bottom:1px solid rgba(255,255,255,0.07);">' +
          '<td style="padding:9px 14px;font-weight:700;"><span class="fi fi-' + esc(t.iso2 || 'un') + '" style="margin-right:6px;"></span>' + esc(t.country) + '</td>' +
          '<td style="padding:9px 14px;">' + treatyBadge(t.ccw) + '</td>' +
          '<td style="padding:9px 14px;">' + treatyBadge(t.ap1) + '</td>' +
          '<td style="padding:9px 14px;">' + treatyBadge(t.stance) + '</td>' +
          '<td style="padding:9px 14px;">' + treatyBadge(t.unga80) + '</td>' +
          '<td style="padding:9px 14px;"><a href="' + safeUrl(t.sourceUrl) + '" target="_blank" rel="noopener" style="color:#38bdf8;">UNODA/ICRC ↗</a></td></tr>';
      }).join('');
    }
    document.getElementById('treaty-modal').style.display = 'flex';
  };
  window.closeMatrixModal = function () { document.getElementById('treaty-modal').style.display = 'none'; };

  window.exportTreatyCSV = function () {
    var rows = getFilteredTreaty();
    var csv = 'Country,UNStatus,UNRegion,LAWSDoctrine,GenevaConventions,AdditionalProtocol1_Art36,UN_CCW,CCW_Prot2,CCW_Prot5,RomeStatute_ICC,UNGA_78_241,UNGA_79_62,UNGA_80_57,PolDeclaration,ComplianceScore,Notes\n' +
      rows.map(function (t) {
        return [t.country, t.unStatus, t.unRegion, t.stance, t.gc, t.ap1, t.ccw, t.ccwP2, t.ccwP5, t.icc, t.unga78, t.unga79, t.unga80, t.polDecl, t.complianceScore, t.note]
          .map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(',');
      }).join('\n');
    downloadText('un-195-states-laws-treaty-matrix-v7.csv', csv, 'text/csv');
  };

  window.exportTreatyJSON = function () {
    downloadText('un-195-states-laws-treaty-matrix-v7.json', JSON.stringify(getFilteredTreaty(), null, 2), 'application/json');
  };

  // ── Academic, Legal & Case-Law Repository ──
  window.setRepoCat = function (c, btn) {
    REPO_STATE.cat = c;
    document.querySelectorAll('#repo-cat-pills .sp-btn').forEach(function (b) { b.classList.remove('on'); });
    if (btn) btn.classList.add('on');
    renderRepo();
  };
  window.setRepoSort = function (v) { REPO_STATE.sortKey = v; renderRepo(); };

  function renderRepo() {
    var el = document.getElementById('repo-list');
    if (!el) return;
    var q = ((document.getElementById('repo-q') || {}).value || '').toLowerCase();
    var rows = REPO.filter(function (r) {
      if (REPO_STATE.cat !== 'ALL' && r.category !== REPO_STATE.cat) return false;
      if (!regionMatch(r.region) && r.region !== 'Global' && r.region !== 'Universal') return false;
      if (FILT.s !== 'ALL' && r.sev !== FILT.s) return false;
      if (q && [r.title, r.org, r.fw, r.summary, r.citation, r.category].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    rows.sort(function (a, b) {
      if (REPO_STATE.sortKey === 'year') return (b.year || 0) - (a.year || 0);
      if (REPO_STATE.sortKey === 'title') return (a.title || '').localeCompare(b.title || '');
      var ord = { CRITICAL: 3, HIGH: 2, MOD: 1 };
      return (ord[b.sev] || 0) - (ord[a.sev] || 0);
    });

    var cntLbl = document.getElementById('repo-cnt-lbl');
    var kpiRepo = document.getElementById('kpi-repo');
    if (cntLbl) cntLbl.textContent = rows.length + ' / ' + REPO.length;
    if (kpiRepo) kpiRepo.textContent = REPO.length;

    if (!rows.length) {
      el.innerHTML = '<div style="padding:20px;color:#94a3b8;text-align:center;">No legal/academic sources match active filters.</div>';
      return;
    }

    el.innerHTML = rows.map(function (r) {
      return '<div class="ri">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
        '<div style="flex:1;">' +
        '<div style="font-family:var(--font);font-size:0.66rem;color:#7dd3fc;margin-bottom:3px;">' + esc(r.category) + ' · ' + esc(r.org) + ' (' + esc(r.year) + ')</div>' +
        '<a href="' + safeUrl(r.url) + '" target="_blank" rel="noopener" style="font-weight:700;font-size:0.86rem;color:#f8fafc;text-decoration:none;">' + esc(r.title) + ' ↗</a>' +
        '<div style="font-size:0.78rem;color:#cbd5e1;margin-top:4px;line-height:1.45;">' + esc(r.summary) + '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">' +
        sevBadge(r.sev) +
        '<button class="lbtn sm" onclick="copyCitation(\'' + esc(r.id) + '\')">📋 Cite</button>' +
        '</div></div></div>';
    }).join('');
  }

  window.copyCitation = function (id) {
    var r = REPO.find(function (x) { return x.id === id; });
    if (!r) return;
    var text = r.citation + ' ' + r.url;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { showToast('Copied citation to clipboard'); });
    } else {
      showToast(text.slice(0, 60) + '...');
    }
  };

  // ── Live Ethics & Security Stream + Multi-Source Live RSS Connector ──
  function renderLiveStreams() {
    var customRss = [];
    try { customRss = JSON.parse(localStorage.getItem('sied_user_rss_v7') || localStorage.getItem('sied_rss_custom') || '[]'); } catch (e) {}
    var allItems = customRss.concat(LIVE_FEED);

    // Populate Top Breaking Intelligence Stream
    var feedBody = document.getElementById('feed-body');
    if (feedBody) {
      if (!allItems.length) {
        feedBody.innerHTML = '<div style="color:#94a3b8;font-size:0.8rem;">Loading authoritative live feeds...</div>';
      } else {
        feedBody.innerHTML = allItems.slice(0, 14).map(function (it) {
          return '<div class="fi">' +
            '<div style="display:flex;justify-content:space-between;gap:8px;font-family:var(--font);font-size:0.66rem;color:#fda4af;margin-bottom:3px;">' +
            '<span>' + esc(it.source) + ' · ' + esc(it.category || '') + '</span><span>' + esc(it.date) + '</span></div>' +
            '<a href="' + safeUrl(it.url || it.link) + '" target="_blank" rel="noopener" style="font-size:0.81rem;font-weight:700;color:#f8fafc;text-decoration:none;display:block;">' + esc(it.title) + ' ↗</a>' +
            (it.summary ? '<div style="font-size:0.74rem;color:#cbd5e1;margin-top:3px;">' + esc(it.summary.slice(0, 140)) + '</div>' : '') +
            '</div>';
        }).join('');
      }
    }

    // Populate Multi-Source Filterable RSS Tabs
    var tabsEl = document.getElementById('rss-tabs');
    if (tabsEl) {
      var cats = [
        { k: 'all', l: 'All (' + allItems.length + ')' },
        { k: 'un', l: 'UN News' },
        { k: 'icrc', l: 'ICRC IHL' },
        { k: 'lieber', l: 'Lieber Inst.' },
        { k: 'justsec', l: 'Just Security' },
        { k: 'arxiv', l: 'arXiv' },
        { k: 'nature', l: 'Nature' },
        { k: 'hrw', l: 'HRW' },
        { k: 'mit', l: 'MIT Tech' },
        { k: 'avi', l: 'Avi Perera' }
      ];
      tabsEl.innerHTML = cats.map(function (c) {
        return '<button class="rtab' + (RSS_CAT === c.k ? ' on' : '') + '" onclick="setRssCat(\'' + c.k + '\')">' + esc(c.l) + '</button>';
      }).join('');
    }

    var rssBody = document.getElementById('rss-body');
    if (rssBody) {
      var filtered = allItems.filter(function (it) { return RSS_CAT === 'all' || it.key === RSS_CAT; });
      if (!filtered.length) {
        rssBody.innerHTML = '<div style="padding:18px;text-align:center;color:#94a3b8;font-size:0.8rem;">No cached items for this feed filter. Click ↻ to refresh.</div>';
      } else {
        rssBody.innerHTML = filtered.slice(0, 24).map(function (it) {
          return '<div class="rsi-item">' +
            '<a href="' + safeUrl(it.url || it.link) + '" target="_blank" rel="noopener" style="color:#38bdf8;font-weight:700;font-size:0.82rem;text-decoration:none;display:block;margin-bottom:3px;">' + esc(it.title) + ' ↗</a>' +
            '<div style="font-family:var(--font);font-size:0.68rem;color:#94a3b8;">' + esc(it.source) + ' · ' + esc(it.date) + '</div>' +
            '</div>';
        }).join('');
      }
    }
  }

  window.setRssCat = function (c) { RSS_CAT = c; renderLiveStreams(); };
  window.forceRSSRefresh = function () {
    showToast('Refreshing live authoritative feeds...');
    fetchFeeds(true);
  };
  window.promptAddRSS = function () { document.getElementById('addrss-modal').style.display = 'flex'; };
  window.closeRSSModal = function () { document.getElementById('addrss-modal').style.display = 'none'; };
  window.submitNewRSS = function () {
    var name = (document.getElementById('new-rss-name').value || '').trim();
    var url = (document.getElementById('new-rss-url').value || '').trim();
    if (!name || !safeUrl(url)) return alert('Enter a valid feed label and https:// RSS URL.');
    fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(url))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.status !== 'ok' || !d.items) throw new Error('Could not parse RSS URL');
        var cur = JSON.parse(localStorage.getItem('sied_user_rss_v7') || '[]');
        var added = d.items.slice(0, 6).map(function (i) {
          return { title: i.title, url: i.link, date: (i.pubDate || '').slice(0, 10), source: name, key: 'custom', category: 'Custom Feed', summary: '' };
        });
        localStorage.setItem('sied_user_rss_v7', JSON.stringify(added.concat(cur)));
        closeRSSModal();
        renderLiveStreams();
        showToast('Added ' + added.length + ' items from ' + name);
      })
      .catch(function (err) { alert('RSS Connector error: ' + err.message); });
  };

  // ── NGO Alerts & Persistent Browser Log ──
  function renderAlertsQueue() {
    var el = document.getElementById('alerts-queue-list');
    var hdrCnt = document.getElementById('hdr-alert-cnt');
    if (hdrCnt) hdrCnt.textContent = ALERTS_QUEUE.length;
    if (!el) return;
    el.innerHTML = ALERTS_QUEUE.map(function (a) {
      return '<div style="background:rgba(15,23,42,0.8);border:1px solid rgba(244,63,94,0.28);border-left:3px solid #f43f5e;border-radius:10px;padding:11px 14px;margin-bottom:9px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px;">' +
        '<strong style="font-size:0.84rem;color:#fff;">' + esc(a.id) + ' · ' + esc(a.sys) + '</strong>' + sevBadge(a.sev) + '</div>' +
        '<div style="font-size:0.78rem;color:#cbd5e1;margin-bottom:4px;">' + esc(a.summary) + '</div>' +
        '<div style="font-family:var(--font);font-size:0.69rem;color:#94a3b8;">' + esc(a.date) + ' · ' + esc(a.reg) + '</div></div>';
    }).join('');
  }

  window.subscribeNGOAlert = function () {
    var email = (document.getElementById('alert-sub-email').value || '').trim();
    var org = (document.getElementById('alert-sub-org').value || 'Policy Analyst').trim();
    var tier = document.getElementById('alert-sub-tier').value || 'ALL_HIGH';
    if (!email || email.indexOf('@') < 1) return alert('Enter a valid analyst/NGO email.');
    var list = [];
    try { list = JSON.parse(localStorage.getItem('sied_ngo_subs_v7') || '[]'); } catch (e) {}
    list.push({ email: email, org: org, tier: tier, subscribedAt: new Date().toISOString() });
    localStorage.setItem('sied_ngo_subs_v7', JSON.stringify(list));
    var st = document.getElementById('alert-sub-status');
    if (st) {
      st.style.display = 'block';
      st.style.color = '#34d399';
      st.textContent = '✓ Subscribed ' + email + ' (' + org + ') [' + tier + '] · Dispatch stored.';
    }
  };

  window.exportAlertsBulletin = function () {
    var txt = 'AI ETHICS INTELLIGENCE DASHBOARD — NGO & POLICY ANALYST ALERT BULLETIN (NOV 2026)\n' +
      'Generated: ' + new Date().toISOString() + '\n\n' +
      ALERTS_QUEUE.map(function (a) {
        return '[' + a.id + '] ' + a.date + ' — ' + a.sys + ' (' + a.sev + ')\nRule: ' + a.reg + '\nDetail: ' + a.summary + '\nRef: ' + a.url + '\n';
      }).join('\n--------------------------------------------\n');
    downloadText('ngo-ai-ethics-alert-bulletin-v7.txt', txt, 'text/plain');
  };

  function renderLog() {
    var arr = getMergedFrontierModels().filter(function (x) { return String(x.id).indexOf('usr-') === 0; });
    var cnt = document.getElementById('log-cnt');
    if (cnt) cnt.textContent = arr.length;
    var con = document.getElementById('log-con');
    if (!con) return;
    if (!arr.length) {
      con.innerHTML = '<div style="font-size:0.8rem;color:#94a3b8;">No custom entries yet. Use "+ Log Model / Incident" above to add new AI models locally.</div>';
      return;
    }
    con.innerHTML = arr.map(function (r) {
      return '<div style="padding:8px 12px;border:1px solid var(--bd);border-radius:8px;margin-bottom:6px;display:flex;justify-content:space-between;">' +
        '<span><strong>' + esc(r.name) + '</strong> (' + esc(r.lab) + ') · ' + esc(r.date) + '</span>' + sevBadge(r.sev) + '</div>';
    }).join('');
  }
  window.exportLog = window.exportFrontierCSV;
  window.clearLog = function () { localStorage.removeItem('sied_user_models_v7'); renderAirtable(); renderLog(); };

  // =========================================================================
  // 3. INTERACTIVE CHART.JS VISUALIZATION SUITE
  // =========================================================================
  function killChart(id) {
    if (CH[id]) { try { CH[id].destroy(); } catch (e) {} delete CH[id]; }
  }

  function buildFrontierCharts() {
    if (typeof Chart === 'undefined' || !FRONTIER_MODELS.length) return;
    var models = getMergedFrontierModels();
    var tickCol = '#94a3b8';
    var lblCol = '#cbd5e1';
    var gCol = 'rgba(255,255,255,0.06)';

    // Chart 1: Bias vs Guardrail by Top Labs
    var c1 = document.getElementById('ch-at-labs');
    if (c1) {
      killChart('c1');
      var labMap = {};
      models.forEach(function (m) {
        var k = m.lab.indexOf('Google') >= 0 ? 'Google' :
          m.lab.indexOf('Anthropic') >= 0 ? 'Anthropic' :
          m.lab.indexOf('OpenAI') >= 0 ? 'OpenAI' :
          m.lab.indexOf('Meta') >= 0 ? 'Meta' :
          m.lab.indexOf('DeepSeek') >= 0 ? 'DeepSeek' :
          m.lab.indexOf('xAI') >= 0 ? 'xAI' : 'Other Labs';
        if (!labMap[k]) labMap[k] = { b: [], g: [] };
        labMap[k].b.push(m.biasScore || 0);
        labMap[k].g.push(m.guardrailScore || 0);
      });
      var lKeys = Object.keys(labMap);
      CH.c1 = new Chart(c1, {
        type: 'bar',
        data: {
          labels: lKeys,
          datasets: [
            { label: 'Mean Guardrail Score', data: lKeys.map(function (k) { return Math.round(labMap[k].g.reduce(function (x, y) { return x + y; }, 0) / labMap[k].g.length); }), backgroundColor: 'rgba(16,185,129,0.78)' },
            { label: 'Mean Bias Risk', data: lKeys.map(function (k) { return Math.round(labMap[k].b.reduce(function (x, y) { return x + y; }, 0) / labMap[k].b.length); }), backgroundColor: 'rgba(244,63,94,0.78)' }
          ]
        },
        options: { animation: { duration: 280 }, responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: lblCol, font: { size: 10 } } } }, scales: { x: { grid: { display: false }, ticks: { color: tickCol, font: { size: 10 } } }, y: { min: 0, max: 100, grid: { color: gCol }, ticks: { color: tickCol } } } }
      });
    }

    // Chart 2: Temporal Bias vs Guardrail Trajectory
    var c2 = document.getElementById('ch-at-timeline');
    if (c2) {
      killChart('c2');
      var years = ['2022–23', '2024', '2025', 'H1 2026', 'H2 2026'];
      function bucket(d) {
        if (!d) return 'H2 2026';
        if (d < '2024-01') return '2022–23';
        if (d < '2025-01') return '2024';
        if (d < '2026-01') return '2025';
        if (d < '2026-07') return 'H1 2026';
        return 'H2 2026';
      }
      var gAvgs = years.map(function (yr) {
        var sub = models.filter(function (m) { return bucket(m.date) === yr; });
        return sub.length ? Math.round(sub.reduce(function (a, b) { return a + (b.guardrailScore || 0); }, 0) / sub.length) : 60;
      });
      var bAvgs = years.map(function (yr) {
        var sub = models.filter(function (m) { return bucket(m.date) === yr; });
        return sub.length ? Math.round(sub.reduce(function (a, b) { return a + (b.biasScore || 0); }, 0) / sub.length) : 50;
      });
      CH.c2 = new Chart(c2, {
        type: 'line',
        data: {
          labels: years,
          datasets: [
            { label: 'Guardrail Score ↑', data: gAvgs, borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.12)', fill: true, tension: 0.35 },
            { label: 'Bias Risk Score ↓', data: bAvgs, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.35 }
          ]
        },
        options: { animation: { duration: 280 }, responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: lblCol, font: { size: 10 } } } }, scales: { x: { grid: { display: false }, ticks: { color: tickCol } }, y: { min: 0, max: 100, grid: { color: gCol }, ticks: { color: tickCol } } } }
      });
    }

    // Chart 3: Governance Regime Mix
    var c3 = document.getElementById('ch-at-reg');
    if (c3) {
      killChart('c3');
      var regCounts = { 'Enforced Hard Law': 0, 'Pre-Act Soft': 0, 'Open / Abliterated': 0, 'Frontier / Audited': 0 };
      models.forEach(function (m) {
        var e = m.regEra || '';
        if (e.indexOf('Enforced') >= 0) regCounts['Enforced Hard Law']++;
        else if (e.indexOf('Pre-Act') >= 0) regCounts['Pre-Act Soft']++;
        else if (e.indexOf('Open') >= 0) regCounts['Open / Abliterated']++;
        else regCounts['Frontier / Audited']++;
      });
      CH.c3 = new Chart(c3, {
        type: 'doughnut',
        data: {
          labels: Object.keys(regCounts),
          datasets: [{ data: Object.values(regCounts), backgroundColor: ['#10b981', '#f59e0b', '#f43f5e', '#38bdf8'], borderWidth: 0 }]
        },
        options: { animation: { duration: 280 }, responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'right', labels: { color: lblCol, font: { size: 10 }, boxWidth: 10 } } } }
      });
    }
  }

  window.setTrajMode = function (mode, btn) {
    TRAJ_MODE = mode;
    document.querySelectorAll('#traj-pills .sp-btn').forEach(function (b) { b.classList.remove('on'); });
    if (btn) btn.classList.add('on');
    buildTrajectoryChart();
  };

  function buildTrajectoryChart() {
    var c5 = document.getElementById('ch-trend');
    if (!c5 || typeof Chart === 'undefined' || !TRAJECTORY) return;
    killChart('c5');
    var tickCol = '#94a3b8';
    var lblCol = '#cbd5e1';
    var gCol = 'rgba(255,255,255,0.06)';
    var datasets = [];
    if (TRAJ_MODE === 'theaters') {
      datasets = [
        { label: 'Ukraine & EW-Immune Swarms', data: TRAJECTORY.theaters.ukraineEastEur, borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.1)', fill: true, tension: 0.32 },
        { label: 'US Border / Domestic AI Ops', data: TRAJECTORY.theaters.usBorderSurveillance, borderColor: '#f59e0b', tension: 0.32 },
        { label: 'Indo-Pacific Unmanned / Subsea', data: TRAJECTORY.theaters.indoPacificSwarm, borderColor: '#a855f7', tension: 0.32 },
        { label: 'Gaza / Levant Automated Ops', data: TRAJECTORY.theaters.gazaLevant, borderColor: '#f43f5e', tension: 0.32 }
      ];
    } else if (TRAJ_MODE === 'cyber') {
      datasets = [
        { label: 'Frontier Cyber & Agentic Exploits', data: TRAJECTORY.cyberSafety.frontierCyberExploits, borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.12)', fill: true, tension: 0.32 },
        { label: 'Hard-Law Enforcement Actions', data: TRAJECTORY.cyberSafety.hardLawEnforcementActions, borderColor: '#10b981', tension: 0.32 },
        { label: 'Biometric & Civil Litigation', data: TRAJECTORY.cyberSafety.biometricLitigation, borderColor: '#38bdf8', tension: 0.32 }
      ];
    } else {
      datasets = [
        { label: 'UNGA Pro-Treaty Votes (78->80th)', data: TRAJECTORY.diplomacySpend.ungaProTreatyVotes, borderColor: '#10b981', tension: 0.25, spanGaps: true },
        { label: 'CCW High Contracting Parties', data: TRAJECTORY.diplomacySpend.ccwStatesParties, borderColor: '#38bdf8', tension: 0.25 },
        { label: 'Global Autonomy Spend ($Bn est.)', data: TRAJECTORY.diplomacySpend.globalAwsSpendUsdBn, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.12)', fill: true, tension: 0.32 }
      ];
    }
    CH.c5 = new Chart(c5, {
      type: 'line',
      data: { labels: TRAJECTORY.years, datasets: datasets },
      options: {
        animation: { duration: 280 },
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: lblCol, font: { size: 10 } } } },
        scales: { x: { grid: { color: gCol }, ticks: { color: tickCol, font: { size: 9 } } }, y: { grid: { color: gCol }, ticks: { color: tickCol } } }
      }
    });
    var ms = document.getElementById('traj-milestones');
    if (ms && TRAJECTORY.milestones) {
      ms.innerHTML = TRAJECTORY.milestones.map(function (m) {
        return '<div class="ms-chip"><strong>' + esc(m.year) + ':</strong> ' + esc(m.label) + '</div>';
      }).join('');
    }
  }

  window.setBubbleDomain = function (dom, btn) {
    BUBBLE_DOMAIN = dom;
    document.querySelectorAll('#bubble-pills .sp-btn').forEach(function (b) { b.classList.remove('on'); });
    if (btn) btn.classList.add('on');
    buildBubbleChart();
  };

  function buildBubbleChart() {
    var c6 = document.getElementById('ch-bubble');
    if (!c6 || typeof Chart === 'undefined' || !BUBBLE_MATRIX.length) return;
    killChart('c6');
    var tickCol = '#94a3b8';
    var gCol = 'rgba(255,255,255,0.06)';
    var items = BUBBLE_MATRIX.filter(function (b) { return BUBBLE_DOMAIN === 'ALL' || b.domain === BUBBLE_DOMAIN; });
    var domColors = { 'LAWS': '#f43f5e', 'Surveillance & Border AI': '#f59e0b', 'Cyber & Agentic AI': '#38bdf8' };

    var quadrantPlugin = {
      id: 'quadrantBg',
      beforeDraw: function (chart) {
        var ctx = chart.ctx, xA = chart.scales.x, yA = chart.scales.y;
        if (!xA || !yA) return;
        var xMid = xA.getPixelForValue(75), yMid = yA.getPixelForValue(70);
        ctx.save();
        // Top-right Accountability Vacuum
        ctx.fillStyle = 'rgba(244, 63, 94, 0.08)';
        ctx.fillRect(xMid, yA.top, xA.right - xMid, yMid - yA.top);
        // Top-left Oversight Strain
        ctx.fillStyle = 'rgba(245, 158, 11, 0.06)';
        ctx.fillRect(xA.left, yA.top, xMid - xA.left, yMid - yA.top);
        // Bottom Bounded
        ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
        ctx.fillRect(xA.left, yMid, xA.right - xA.left, yA.bottom - yMid);
        // Quadrant Borders
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xMid, yA.top); ctx.lineTo(xMid, yA.bottom);
        ctx.moveTo(xA.left, yMid); ctx.lineTo(xA.right, yMid);
        ctx.stroke();
        ctx.restore();
      }
    };

    CH.c6 = new Chart(c6, {
      type: 'bubble',
      plugins: [quadrantPlugin],
      data: {
        datasets: items.map(function (d) {
          var col = domColors[d.domain] || '#38bdf8';
          var rad = d.sev === 'CRITICAL' ? 14 : (d.sev === 'HIGH' ? 10 : 7);
          return {
            label: d.name,
            data: [{ x: d.autonomy, y: d.impact, r: rad, meta: d }],
            backgroundColor: col + '88',
            borderColor: col,
            borderWidth: 1.5
          };
        })
      },
      options: {
        animation: { duration: 250 },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var m = ctx.raw && ctx.raw.meta;
                if (!m) return ctx.dataset.label;
                return [
                  m.name + ' (' + m.domain + ', ' + m.year + ')',
                  'Autonomy: ' + m.autonomy + '% | Civilian Impact: ' + m.impact + '/100',
                  'Theater: ' + m.theater,
                  'Scale: ' + m.scaleLabel
                ];
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Technical Autonomy (%) →', color: tickCol, font: { size: 10 } }, min: 52, max: 100, grid: { color: gCol }, ticks: { color: tickCol } },
          y: { title: { display: true, text: 'Civilian Harm & Impact ↑', color: tickCol, font: { size: 10 } }, min: 20, max: 102, grid: { color: gCol }, ticks: { color: tickCol } }
        }
      }
    });
  }

  function buildTreatyBarChart(sup, two, opp, unk) {
    var canvas = document.getElementById('ch-treaty-bar');
    if (!canvas || typeof Chart === 'undefined') return;
    killChart('treatyBar');
    CH.treatyBar = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Global 195-State LAWS Posture'],
        datasets: [
          { label: 'Binding Treaty (' + sup + ')', data: [sup], backgroundColor: '#10b981' },
          { label: 'Two-Tier IHL (' + two + ')', data: [two], backgroundColor: '#f59e0b' },
          { label: 'Oppose / Use-Ban (' + opp + ')', data: [opp], backgroundColor: '#f43f5e' },
          { label: 'Unknown / No Record (' + unk + ')', data: [unk], backgroundColor: '#64748b' }
        ]
      },
      options: {
        indexAxis: 'y',
        animation: { duration: 240 },
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'bottom', labels: { color: '#cbd5e1', font: { size: 10 }, boxWidth: 10, padding: 8 } } },
        scales: { x: { stacked: true, max: sup + two + opp + unk, display: false }, y: { stacked: true, display: false } }
      }
    });
  }

  function buildObservatoryCharts() {
    if (typeof Chart === 'undefined') return;
    var tickCol = '#94a3b8';
    var lblCol = '#cbd5e1';
    var gCol = 'rgba(255,255,255,0.06)';

    // Chart 4: Accountability Gap
    var c4 = document.getElementById('ch-acct');
    if (c4) {
      killChart('c4');
      CH.c4 = new Chart(c4, {
        type: 'bar',
        data: {
          labels: ['Israel IDF', 'Russia MoD', 'China PLA/MSS', 'US DoD/ICE', 'Frontier Labs', 'EU AI Office'],
          datasets: [
            { label: 'Autonomy / Tech', data: [95, 86, 89, 91, 96, 38], backgroundColor: 'rgba(244,63,94,0.82)' },
            { label: 'Binding Law / MHC', data: [4, 5, 11, 22, 46, 90], backgroundColor: 'rgba(16,185,129,0.82)' }
          ]
        },
        options: { indexAxis: 'y', animation: { duration: 280 }, responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: lblCol, font: { size: 10 } } } }, scales: { x: { min: 0, max: 100, grid: { color: gCol }, ticks: { color: tickCol } }, y: { grid: { display: false }, ticks: { color: lblCol, font: { size: 10 } } } } }
      });
    }

    buildTrajectoryChart();
    buildBubbleChart();

    // Radar & Donut
    var c7 = document.getElementById('ch-radar');
    if (c7) {
      killChart('c7');
      CH.c7 = new Chart(c7, {
        type: 'radar',
        data: {
          labels: ['Autonomy', 'Scale', 'Accountability', 'IHL Art.36', 'Audit'],
          datasets: [
            { label: 'Israel IDF', data: [95, 92, 4, 5, 3], borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.12)' },
            { label: 'US DoD', data: [91, 88, 20, 28, 22], borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.12)' },
            { label: 'EU / UK Art. 36', data: [46, 52, 82, 92, 86], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)' }
          ]
        },
        options: { animation: { duration: 280 }, responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: lblCol, font: { size: 9 }, boxWidth: 8 } } }, scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: gCol }, pointLabels: { color: lblCol, font: { size: 9 } } } } }
      });
    }

    var c8 = document.getElementById('ch-donut');
    if (c8) {
      killChart('c8');
      CH.c8 = new Chart(c8, {
        type: 'doughnut',
        data: {
          labels: ['USA', 'Israel', 'China', 'Russia / Iran', 'Ukraine / EU / UK'],
          datasets: [{ data: [28, 22, 18, 16, 16], backgroundColor: ['#f59e0b', '#f43f5e', '#a855f7', '#ec4899', '#38bdf8'], borderWidth: 0 }]
        },
        options: { animation: { duration: 280 }, responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: lblCol, font: { size: 9 }, boxWidth: 8 } } } }
      });
    }
  }

  function ensureChartsWhenChartJsLoads(attempts) {
    if (typeof Chart !== 'undefined') {
      buildFrontierCharts();
      buildObservatoryCharts();
      renderTreaty(); // builds treatyBar inside treaty module
    } else if ((attempts || 0) < 40) {
      setTimeout(function () { ensureChartsWhenChartJsLoads((attempts || 0) + 1); }, 80);
    }
  }

  function downloadText(filename, content, mime) {
    var blob = new Blob([content], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  function renderLower() {
    renderAgenticSystems();
    renderLaws();
    renderSurv();
    renderRepo();
    renderTreaty();
    renderLiveStreams();
    renderAlertsQueue();
    renderLog();
  }

  // =========================================================================
  // 4. ASYNC MODULAR CONNECTOR LOADER
  // =========================================================================
  function fetchJson(file) {
    return fetch(CFG.dataBase + file + '?v=7.0.0', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(file + ' HTTP ' + r.status); return r.json(); });
  }

  function fetchFeeds(force) {
    var target = CFG.rssApi;
    if (force && target.indexOf('admin-ajax') >= 0) target += '&refresh=1';
    else if (CFG.env === 'github') target += '?t=' + Date.now();

    return fetch(target, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('RSS HTTP ' + r.status); return r.json(); })
      .then(function (payload) {
        var data = (payload && payload.success && payload.data) ? payload.data : payload;
        if (data && Array.isArray(data.items) && data.items.length) {
          LIVE_FEED = data.items;
          LIVE_SOURCES_META = data.sources || [];
          var statusEl = document.getElementById('rss-live-meta');
          if (statusEl) {
            var liveCnt = LIVE_SOURCES_META.filter(function (s) { return s.status === 'live'; }).length;
            statusEl.textContent = (liveCnt || LIVE_SOURCES_META.length) + ' Sources Connected · ' + LIVE_FEED.length + ' Items';
          }
          renderLiveStreams();
        }
      })
      .catch(function () {
        if (CFG.rssStatic && target !== CFG.rssStatic) {
          fetch(CFG.rssStatic, { cache: 'no-cache' })
            .then(function (r) { return r.json(); })
            .then(function (d) {
              if (d && Array.isArray(d.items)) { LIVE_FEED = d.items; renderLiveStreams(); }
            });
        }
      });
  }

  function boot() {
    Promise.all([
      fetchJson('frontier-models.json'),
      fetchJson('laws-systems.json'),
      fetchJson('agentic-systems.json'),
      fetchJson('surveillance-systems.json'),
      fetchJson('bubble-matrix.json'),
      fetchJson('trajectory-data.json'),
      fetchJson('treaty-matrix.json'),
      fetchJson('research-repo.json')
    ]).then(function (res) {
      FRONTIER_MODELS = res[0] || [];
      LAWS = res[1] || [];
      AGENTIC_SYSTEMS = res[2] || [];
      SURV = res[3] || [];
      BUBBLE_MATRIX = res[4] || [];
      TRAJECTORY = res[5] || null;
      TREATY_MATRIX = res[6] || [];
      REPO = res[7] || [];

      renderAirtable();
      renderLower();
      ensureChartsWhenChartJsLoads(0);
    }).catch(function (err) {
      var st = document.getElementById('at-live-count');
      if (st) st.textContent = 'Data Connection Notice: Serve via HTTPS / Local Server';
      console.error('SIED v7.0 data load error:', err);
    });

    fetchFeeds(false);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
