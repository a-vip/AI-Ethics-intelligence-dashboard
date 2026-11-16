/* =========================================================================
   SIED CHARTS v8.0 — BUILT-IN ZERO-DEPENDENCY INTERACTIVE SVG ENGINE
   Eliminates external Chart.js / canvas DPR & WordPress grid sizing issues.
   Generates sharp, responsive, hover-interactive SVGs at 100% container width.
   ========================================================================= */
(function (win) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getTip() {
    var tip = document.getElementById('sied-svg-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'sied-svg-tip';
      tip.className = 'sied-svg-tip';
      document.body.appendChild(tip);
    }
    return tip;
  }

  function showTip(ev, html) {
    var tip = getTip();
    tip.innerHTML = html;
    tip.style.display = 'block';
    var pad = 14;
    var tx = (ev.clientX || 0) + pad;
    var ty = (ev.clientY || 0) + pad;
    if (tx + 260 > win.innerWidth) tx = Math.max(8, (ev.clientX || 0) - 260);
    if (ty + 140 > win.innerHeight) ty = Math.max(8, (ev.clientY || 0) - 130);
    tip.style.left = tx + 'px';
    tip.style.top = ty + 'px';
  }

  function hideTip() {
    var tip = document.getElementById('sied-svg-tip');
    if (tip) tip.style.display = 'none';
  }

  function bindTips(container) {
    if (!container) return;
    container.querySelectorAll('[data-tip]').forEach(function (el) {
      el.addEventListener('mouseenter', function (ev) { showTip(ev, el.getAttribute('data-tip')); });
      el.addEventListener('mousemove', function (ev) { showTip(ev, el.getAttribute('data-tip')); });
      el.addEventListener('mouseleave', hideTip);
    });
  }

  // 1. LAB BIAS RISK VS. GUARDRAIL SCORE (Grouped Vertical Bar SVG)
  function renderLabBias(el, models) {
    if (!el || !models || !models.length) return;
    var labMap = {};
    models.forEach(function (m) {
      var l = m.lab || '';
      var k = l.indexOf('Google') >= 0 ? 'Google' :
        l.indexOf('Anthropic') >= 0 ? 'Anthropic' :
        l.indexOf('OpenAI') >= 0 ? 'OpenAI' :
        l.indexOf('Meta') >= 0 ? 'Meta' :
        l.indexOf('DeepSeek') >= 0 ? 'DeepSeek' :
        l.indexOf('xAI') >= 0 ? 'xAI' : 'Other Labs';
      if (!labMap[k]) labMap[k] = { b: [], g: [], n: 0 };
      labMap[k].b.push(m.biasScore || 0);
      labMap[k].g.push(m.guardrailScore || 0);
      labMap[k].n++;
    });

    var keys = Object.keys(labMap);
    var W = 500, H = 235, padL = 34, padR = 12, padT = 26, padB = 34;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var step = plotW / keys.length;
    var barW = Math.min(18, step * 0.34);

    var svg = '<div class="sied-leg-row">' +
      '<span class="sied-leg-i"><span class="sied-leg-dot" style="background:#10b981;"></span>Mean Guardrail Score</span>' +
      '<span class="sied-leg-i"><span class="sied-leg-dot" style="background:#f43f5e;"></span>Mean Bias Risk</span>' +
      '</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" class="sied-svg" role="img" aria-label="Lab Bias Risk vs Guardrail Score">';

    [0, 25, 50, 75, 100].forEach(function (val) {
      var y = padT + plotH - (val / 100) * plotH;
      svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>';
      svg += '<text x="' + (padL - 6) + '" y="' + (y + 3) + '" fill="#94a3b8" font-size="9" text-anchor="end" font-family="IBM Plex Mono,monospace">' + val + '</text>';
    });

    keys.forEach(function (k, idx) {
      var d = labMap[k];
      var gAvg = Math.round(d.g.reduce(function (a, b) { return a + b; }, 0) / d.g.length);
      var bAvg = Math.round(d.b.reduce(function (a, b) { return a + b; }, 0) / d.b.length);
      var cx = padL + step * idx + step / 2;
      var gh = (gAvg / 100) * plotH;
      var bh = (bAvg / 100) * plotH;
      var gy = padT + plotH - gh;
      var by = padT + plotH - bh;
      var tip = esc('<strong>' + k + '</strong> (' + d.n + ' models)<br/>Guardrail Score: <span style="color:#34d399;">' + gAvg + '/100</span><br/>Bias Risk Score: <span style="color:#fda4af;">' + bAvg + '/100</span>');

      svg += '<g data-tip="' + tip + '" style="cursor:pointer;">' +
        '<rect x="' + (cx - barW - 2) + '" y="' + gy + '" width="' + barW + '" height="' + Math.max(2, gh) + '" rx="3" fill="#10b981" fill-opacity="0.88"/>' +
        '<text x="' + (cx - barW / 2 - 2) + '" y="' + (gy - 4) + '" fill="#6ee7b7" font-size="8.5" text-anchor="middle" font-family="IBM Plex Mono,monospace">' + gAvg + '</text>' +
        '<rect x="' + (cx + 2) + '" y="' + by + '" width="' + barW + '" height="' + Math.max(2, bh) + '" rx="3" fill="#f43f5e" fill-opacity="0.88"/>' +
        '<text x="' + (cx + barW / 2 + 2) + '" y="' + (by - 4) + '" fill="#fda4af" font-size="8.5" text-anchor="middle" font-family="IBM Plex Mono,monospace">' + bAvg + '</text>' +
        '<text x="' + cx + '" y="' + (H - 12) + '" fill="#cbd5e1" font-size="9.5" font-weight="600" text-anchor="middle" font-family="IBM Plex Sans,sans-serif">' + esc(k) + '</text>' +
        '</g>';
    });
    svg += '</svg>';
    el.innerHTML = svg;
    bindTips(el);
  }

  // 2. SAFETY & BIAS EVOLUTION (2022–NOV 2026 Dual Area + Spline SVG)
  function renderSafetyEvolution(el, models) {
    if (!el || !models || !models.length) return;
    var eras = ['2022–23', '2024', '2025', 'H1 2026', 'H2 2026'];
    function bucket(d) {
      if (!d) return 'H2 2026';
      if (d < '2024-01') return '2022–23';
      if (d < '2025-01') return '2024';
      if (d < '2026-01') return '2025';
      if (d < '2026-07') return 'H1 2026';
      return 'H2 2026';
    }
    var pts = eras.map(function (yr) {
      var sub = models.filter(function (m) { return bucket(m.date) === yr; });
      return {
        label: yr,
        count: sub.length,
        guard: sub.length ? Math.round(sub.reduce(function (a, b) { return a + (b.guardrailScore || 0); }, 0) / sub.length) : 65,
        bias: sub.length ? Math.round(sub.reduce(function (a, b) { return a + (b.biasScore || 0); }, 0) / sub.length) : 50
      };
    });

    var W = 500, H = 235, padL = 36, padR = 24, padT = 24, padB = 34;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var xs = pts.map(function (_, i) { return padL + (i / (pts.length - 1)) * plotW; });
    var gPts = pts.map(function (p, i) { return xs[i].toFixed(1) + ',' + (padT + plotH - (p.guard / 100) * plotH).toFixed(1); });
    var bPts = pts.map(function (p, i) { return xs[i].toFixed(1) + ',' + (padT + plotH - (p.bias / 100) * plotH).toFixed(1); });

    var gArea = 'M ' + xs[0] + ',' + (padT + plotH) + ' L ' + gPts.join(' L ') + ' L ' + xs[xs.length - 1] + ',' + (padT + plotH) + ' Z';
    var bArea = 'M ' + xs[0] + ',' + (padT + plotH) + ' L ' + bPts.join(' L ') + ' L ' + xs[xs.length - 1] + ',' + (padT + plotH) + ' Z';

    var svg = '<div class="sied-leg-row">' +
      '<span class="sied-leg-i"><span class="sied-leg-dot" style="background:#38bdf8;"></span>Mean Guardrail Score ↑</span>' +
      '<span class="sied-leg-i"><span class="sied-leg-dot" style="background:#f59e0b;"></span>Mean Bias Risk ↓</span>' +
      '</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" class="sied-svg" role="img" aria-label="Safety and Bias Evolution 2022 to Nov 2026">' +
      '<defs>' +
      '<linearGradient id="sied-g-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8" stop-opacity="0.32"/><stop offset="100%" stop-color="#38bdf8" stop-opacity="0.02"/></linearGradient>' +
      '<linearGradient id="sied-b-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f59e0b" stop-opacity="0.24"/><stop offset="100%" stop-color="#f59e0b" stop-opacity="0.02"/></linearGradient>' +
      '</defs>';

    [0, 25, 50, 75, 100].forEach(function (val) {
      var y = padT + plotH - (val / 100) * plotH;
      svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="rgba(255,255,255,0.08)"/>';
      svg += '<text x="' + (padL - 6) + '" y="' + (y + 3) + '" fill="#94a3b8" font-size="9" text-anchor="end" font-family="IBM Plex Mono,monospace">' + val + '</text>';
    });

    svg += '<path d="' + gArea + '" fill="url(#sied-g-grad)"/>' +
      '<path d="' + bArea + '" fill="url(#sied-b-grad)"/>' +
      '<polyline fill="none" stroke="#38bdf8" stroke-width="2.5" points="' + gPts.join(' ') + '"/>' +
      '<polyline fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="5,3" points="' + bPts.join(' ') + '"/>';

    pts.forEach(function (p, i) {
      var x = xs[i];
      var gy = padT + plotH - (p.guard / 100) * plotH;
      var by = padT + plotH - (p.bias / 100) * plotH;
      var tip = esc('<strong>' + p.label + '</strong> (' + p.count + ' models)<br/>Guardrail Score: <span style="color:#38bdf8;">' + p.guard + '</span><br/>Bias Risk Score: <span style="color:#fbbf24;">' + p.bias + '</span>');
      svg += '<g data-tip="' + tip + '" style="cursor:pointer;">' +
        '<line x1="' + x + '" y1="' + padT + '" x2="' + x + '" y2="' + (padT + plotH) + '" stroke="rgba(255,255,255,0.05)" stroke-width="14"/>' +
        '<circle cx="' + x + '" cy="' + gy + '" r="4.5" fill="#0f172a" stroke="#38bdf8" stroke-width="2.2"/>' +
        '<text x="' + x + '" y="' + (gy - 8) + '" fill="#7dd3fc" font-size="9" font-weight="700" text-anchor="middle" font-family="IBM Plex Mono,monospace">' + p.guard + '</text>' +
        '<circle cx="' + x + '" cy="' + by + '" r="4.5" fill="#0f172a" stroke="#f59e0b" stroke-width="2.2"/>' +
        '<text x="' + x + '" y="' + (by + 14) + '" fill="#fcd34d" font-size="9" font-weight="700" text-anchor="middle" font-family="IBM Plex Mono,monospace">' + p.bias + '</text>' +
        '<text x="' + x + '" y="' + (H - 10) + '" fill="#cbd5e1" font-size="9.5" font-weight="600" text-anchor="middle" font-family="IBM Plex Mono,monospace">' + esc(p.label) + '</text>' +
        '</g>';
    });
    svg += '</svg>';
    el.innerHTML = svg;
    bindTips(el);
  }

  // 3. REGULATORY STATUS COMPOSITION (SVG Donut + Clear Breakdown)
  function renderRegComposition(el, models) {
    if (!el || !models || !models.length) return;
    var counts = [
      { label: 'Enforced Hard Law (2026)', count: 0, color: '#10b981' },
      { label: 'EU GPAI Code Transition', count: 0, color: '#38bdf8' },
      { label: 'Pre-Enforcement Era', count: 0, color: '#f59e0b' },
      { label: 'Open-Weight Exemption Risk', count: 0, color: '#f43f5e' }
    ];
    models.forEach(function (m) {
      var e = m.regEra || '';
      var isOpen = (m.weights || '').toLowerCase().indexOf('open') >= 0;
      if (isOpen) counts[3].count++;
      else if (e.indexOf('Enforced') >= 0) counts[0].count++;
      else if (e.indexOf('GPAI') >= 0) counts[1].count++;
      else counts[2].count++;
    });
    var total = models.length;
    var r = 64, cx = 86, cy = 86, circ = 2 * Math.PI * r;
    var offset = 0;

    var donutSvg = '<svg viewBox="0 0 172 172" style="width:168px;height:168px;flex-shrink:0;" role="img" aria-label="Regulatory Status Composition">';
    counts.forEach(function (c) {
      if (!c.count) return;
      var len = (c.count / total) * circ;
      var tip = esc('<strong>' + c.label + '</strong><br/>' + c.count + ' of ' + total + ' models (' + Math.round((c.count / total) * 100) + '%)');
      donutSvg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + c.color + '" stroke-width="24" ' +
        'stroke-dasharray="' + len.toFixed(2) + ' ' + circ.toFixed(2) + '" stroke-dashoffset="-' + offset.toFixed(2) + '" ' +
        'transform="rotate(-90 ' + cx + ' ' + cy + ')" data-tip="' + tip + '" style="cursor:pointer;"/>';
      offset += len;
    });
    donutSvg += '<text x="' + cx + '" y="' + (cy - 2) + '" fill="#ffffff" font-size="22" font-weight="800" text-anchor="middle" font-family="IBM Plex Mono,monospace">' + total + '</text>' +
      '<text x="' + cx + '" y="' + (cy + 14) + '" fill="#94a3b8" font-size="8.5" text-anchor="middle" font-family="IBM Plex Mono,monospace">MODELS</text></svg>';

    var legHtml = '<div style="display:flex;flex-direction:column;gap:8px;flex:1;min-width:160px;">' +
      counts.map(function (c) {
        var pct = total ? Math.round((c.count / total) * 100) : 0;
        return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;font-size:0.75rem;">' +
          '<span style="display:flex;align-items:center;gap:7px;color:#e2e8f0;"><span style="width:9px;height:9px;border-radius:50%;background:' + c.color + ';flex-shrink:0;"></span>' + esc(c.label) + '</span>' +
          '<strong style="font-family:IBM Plex Mono,monospace;color:' + c.color + ';">' + c.count + ' <span style="color:#94a3b8;font-weight:400;">(' + pct + '%)</span></strong></div>';
      }).join('') + '</div>';

    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;padding:6px 0;">' + donutSvg + legHtml + '</div>';
    bindTips(el);
  }

  // 4. ACCOUNTABILITY GAP: AUTONOMY VS BINDING LAW (Horizontal Bar SVG)
  function renderAccountabilityGap(el) {
    if (!el) return;
    var actors = [
      { name: 'Israel IDF', tech: 95, law: 4 },
      { name: 'Russia MoD', tech: 86, law: 5 },
      { name: 'China PLA/MSS', tech: 89, law: 11 },
      { name: 'US DoD/ICE', tech: 91, law: 22 },
      { name: 'Frontier Labs', tech: 96, law: 46 },
      { name: 'EU AI Office', tech: 38, law: 90 }
    ];
    var W = 560, H = 240, padL = 104, padR = 48, padT = 16, padB = 26;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var rowH = plotH / actors.length;

    var svg = '<div class="sied-leg-row">' +
      '<span class="sied-leg-i"><span class="sied-leg-dot" style="background:#f43f5e;"></span>Autonomy / Technical Speed</span>' +
      '<span class="sied-leg-i"><span class="sied-leg-dot" style="background:#10b981;"></span>Binding Law / Human Control</span>' +
      '</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" class="sied-svg" role="img" aria-label="Accountability Gap Autonomy vs Binding Law">';

    [0, 25, 50, 75, 100].forEach(function (val) {
      var x = padL + (val / 100) * plotW;
      svg += '<line x1="' + x + '" y1="' + padT + '" x2="' + x + '" y2="' + (H - padB) + '" stroke="rgba(255,255,255,0.08)"/>';
      svg += '<text x="' + x + '" y="' + (H - 8) + '" fill="#94a3b8" font-size="9" text-anchor="middle" font-family="IBM Plex Mono,monospace">' + val + '</text>';
    });

    actors.forEach(function (a, i) {
      var y0 = padT + i * rowH + 4;
      var tw = (a.tech / 100) * plotW;
      var lw = (a.law / 100) * plotW;
      var delta = a.law - a.tech;
      var dCol = delta < 0 ? '#fda4af' : '#6ee7b7';
      var tip = esc('<strong>' + a.name + '</strong><br/>Autonomy: <span style="color:#fda4af;">' + a.tech + '</span><br/>Binding Law: <span style="color:#6ee7b7;">' + a.law + '</span><br/>Net Gap: <strong>' + (delta > 0 ? '+' + delta : delta) + '</strong>');

      svg += '<g data-tip="' + tip + '" style="cursor:pointer;">' +
        '<text x="' + (padL - 8) + '" y="' + (y0 + 16) + '" fill="#e2e8f0" font-size="10.5" font-weight="600" text-anchor="end" font-family="IBM Plex Sans,sans-serif">' + esc(a.name) + '</text>' +
        '<rect x="' + padL + '" y="' + y0 + '" width="' + tw + '" height="10" rx="3" fill="#f43f5e" fill-opacity="0.86"/>' +
        '<rect x="' + padL + '" y="' + (y0 + 13) + '" width="' + Math.max(4, lw) + '" height="10" rx="3" fill="#10b981" fill-opacity="0.86"/>' +
        '<text x="' + (W - padR + 8) + '" y="' + (y0 + 16) + '" fill="' + dCol + '" font-size="9.5" font-weight="700" font-family="IBM Plex Mono,monospace">' + (delta > 0 ? '+' + delta : delta) + '</text>' +
        '</g>';
    });
    svg += '</svg>';
    el.innerHTML = svg;
    bindTips(el);
  }

  // 5. EXPANDED INCIDENT & DEPLOYMENT TRAJECTORY (2015–Nov 2026 SVG Multi-Line)
  function renderTrajectory(el, traj, mode) {
    if (!el || !traj) return;
    var series = [];
    if (mode === 'theaters') {
      series = [
        { name: 'Ukraine & EW-Immune Swarms', color: '#38bdf8', fill: true, data: traj.theaters.ukraineEastEur },
        { name: 'US Border / Domestic AI Ops', color: '#f59e0b', fill: false, data: traj.theaters.usBorderSurveillance },
        { name: 'Indo-Pacific Unmanned / Subsea', color: '#a855f7', fill: false, data: traj.theaters.indoPacificSwarm },
        { name: 'Gaza / Levant Automated Ops', color: '#f43f5e', fill: false, data: traj.theaters.gazaLevant }
      ];
    } else if (mode === 'cyber') {
      series = [
        { name: 'Frontier Cyber & Agentic Exploits', color: '#f43f5e', fill: true, data: traj.cyberSafety.frontierCyberExploits },
        { name: 'Hard-Law Enforcement Actions', color: '#10b981', fill: false, data: traj.cyberSafety.hardLawEnforcementActions },
        { name: 'Biometric & Civil Litigation', color: '#38bdf8', fill: false, data: traj.cyberSafety.biometricLitigation }
      ];
    } else {
      series = [
        { name: 'UNGA Pro-Treaty Votes (78->80th)', color: '#10b981', fill: false, data: traj.diplomacySpend.ungaProTreatyVotes },
        { name: 'CCW High Contracting Parties', color: '#38bdf8', fill: false, data: traj.diplomacySpend.ccwStatesParties },
        { name: 'Global Autonomy Spend ($Bn est.)', color: '#f59e0b', fill: true, data: traj.diplomacySpend.globalAwsSpendUsdBn }
      ];
    }

    var allVals = [];
    series.forEach(function (s) { s.data.forEach(function (v) { if (v != null) allVals.push(v); }); });
    var rawMax = Math.max.apply(null, allVals.concat([10]));
    var yMax = Math.ceil(rawMax / 20) * 20;
    var W = 560, H = 240, padL = 38, padR = 16, padT = 14, padB = 30;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var labels = traj.years;

    var legHtml = '<div class="sied-leg-row">' + series.map(function (s) {
      return '<span class="sied-leg-i"><span class="sied-leg-dot" style="background:' + s.color + ';"></span>' + esc(s.name) + '</span>';
    }).join('') + '</div>';

    var svg = legHtml + '<svg viewBox="0 0 ' + W + ' ' + H + '" class="sied-svg" role="img" aria-label="Expanded Incident and Deployment Trajectory">';
    [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
      var val = Math.round(yMax * f);
      var y = padT + plotH - f * plotH;
      svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="rgba(255,255,255,0.08)"/>';
      svg += '<text x="' + (padL - 6) + '" y="' + (y + 3) + '" fill="#94a3b8" font-size="9" text-anchor="end" font-family="IBM Plex Mono,monospace">' + val + '</text>';
    });

    series.forEach(function (s) {
      var segments = [];
      var curSeg = [];
      s.data.forEach(function (v, i) {
        if (v == null) {
          if (curSeg.length) { segments.push(curSeg); curSeg = []; }
        } else {
          var x = padL + (i / (labels.length - 1)) * plotW;
          var y = padT + plotH - (v / yMax) * plotH;
          curSeg.push({ x: x, y: y, v: v });
        }
      });
      if (curSeg.length) segments.push(curSeg);
      segments.forEach(function (seg) {
        var ptsStr = seg.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
        if (s.fill && seg.length > 1) {
          var aStr = 'M ' + seg[0].x.toFixed(1) + ',' + (padT + plotH) + ' L ' + ptsStr.replace(/ /g, ' L ') + ' L ' + seg[seg.length - 1].x.toFixed(1) + ',' + (padT + plotH) + ' Z';
          svg += '<path d="' + aStr + '" fill="' + s.color + '" fill-opacity="0.1"/>';
        }
        svg += '<polyline fill="none" stroke="' + s.color + '" stroke-width="2.2" points="' + ptsStr + '"/>';
        seg.forEach(function (p) {
          svg += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3.2" fill="#0f172a" stroke="' + s.color + '" stroke-width="1.8"/>';
        });
      });
    });

    labels.forEach(function (yr, i) {
      var x = padL + (i / (labels.length - 1)) * plotW;
      var tipLines = ['<strong>' + yr + '</strong>'].concat(series.map(function (s) {
        var v = s.data[i];
        return '<span style="color:' + s.color + ';">●</span> ' + s.name + ': <strong>' + (v == null ? '—' : v) + '</strong>';
      }));
      svg += '<line x1="' + x + '" y1="' + padT + '" x2="' + x + '" y2="' + (padT + plotH) + '" stroke="transparent" stroke-width="' + Math.max(18, plotW / labels.length) + '" data-tip="' + esc(tipLines.join('<br/>')) + '" style="cursor:crosshair;"/>';
      if (i % 2 === 0 || i === labels.length - 1) {
        svg += '<text x="' + x + '" y="' + (H - 8) + '" fill="#94a3b8" font-size="8.8" text-anchor="middle" font-family="IBM Plex Mono,monospace">' + esc(yr.replace(' (Nov)', ' Nov')) + '</text>';
      }
    });
    svg += '</svg>';
    el.innerHTML = svg;
    bindTips(el);
  }

  // 6. CIVILIAN IMPACT VS. AUTONOMY BUBBLE MATRIX (Full-Width Quadrant Plot SVG)
  function renderBubbleMatrix(el, items, onBubbleClick) {
    if (!el || !items || !items.length) return;
    var W = 640, H = 300, padL = 44, padR = 16, padT = 16, padB = 34;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var xMin = 50, xMax = 100, yMin = 20, yMax = 102;
    var domColors = { 'LAWS': '#f43f5e', 'Surveillance & Border AI': '#f59e0b', 'Cyber & Agentic AI': '#38bdf8' };

    function toX(v) { return padL + ((v - xMin) / (xMax - xMin)) * plotW; }
    function toY(v) { return padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH; }

    var xMid = toX(75), yMid = toY(70);
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="sied-svg" role="img" aria-label="Civilian Impact vs Autonomy Bubble Matrix">' +
      '<rect x="' + xMid + '" y="' + padT + '" width="' + (W - padR - xMid) + '" height="' + (yMid - padT) + '" fill="rgba(244,63,94,0.1)"/>' +
      '<rect x="' + padL + '" y="' + padT + '" width="' + (xMid - padL) + '" height="' + (yMid - padT) + '" fill="rgba(245,158,11,0.06)"/>' +
      '<rect x="' + padL + '" y="' + yMid + '" width="' + plotW + '" height="' + (padT + plotH - yMid) + '" fill="rgba(16,185,129,0.05)"/>' +
      '<line x1="' + xMid + '" y1="' + padT + '" x2="' + xMid + '" y2="' + (padT + plotH) + '" stroke="rgba(255,255,255,0.2)" stroke-dasharray="4,4"/>' +
      '<line x1="' + padL + '" y1="' + yMid + '" x2="' + (W - padR) + '" y2="' + yMid + '" stroke="rgba(255,255,255,0.2)" stroke-dasharray="4,4"/>' +
      '<text x="' + (xMid + 10) + '" y="' + (padT + 15) + '" fill="rgba(253,164,175,0.72)" font-size="9.5" font-weight="700" font-family="IBM Plex Mono,monospace">ACCOUNTABILITY VACUUM</text>' +
      '<text x="' + (padL + 10) + '" y="' + (padT + 15) + '" fill="rgba(252,211,77,0.6)" font-size="9.5" font-weight="700" font-family="IBM Plex Mono,monospace">OVERSIGHT STRAIN</text>' +
      '<text x="' + (padL + 10) + '" y="' + (padT + plotH - 10) + '" fill="rgba(110,231,183,0.6)" font-size="9.5" font-weight="700" font-family="IBM Plex Mono,monospace">BOUNDED / HUMAN-IN-THE-LOOP</text>';

    [50, 60, 70, 80, 90, 100].forEach(function (v) {
      var x = toX(v);
      svg += '<line x1="' + x + '" y1="' + padT + '" x2="' + x + '" y2="' + (padT + plotH) + '" stroke="rgba(255,255,255,0.05)"/>';
      svg += '<text x="' + x + '" y="' + (H - 14) + '" fill="#94a3b8" font-size="9" text-anchor="middle" font-family="IBM Plex Mono,monospace">' + v + '%</text>';
    });
    [20, 40, 60, 80, 100].forEach(function (v) {
      var y = toY(v);
      svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="rgba(255,255,255,0.05)"/>';
      svg += '<text x="' + (padL - 6) + '" y="' + (y + 3) + '" fill="#94a3b8" font-size="9" text-anchor="end" font-family="IBM Plex Mono,monospace">' + v + '</text>';
    });
    svg += '<text x="' + (padL + plotW / 2) + '" y="' + (H - 2) + '" fill="#cbd5e1" font-size="9.5" text-anchor="middle" font-family="IBM Plex Mono,monospace">Technical Autonomy (%) →</text>';
    svg += '<text x="12" y="' + (padT + plotH / 2) + '" fill="#cbd5e1" font-size="9.5" text-anchor="middle" font-family="IBM Plex Mono,monospace" transform="rotate(-90 12 ' + (padT + plotH / 2) + ')">Civilian Impact ↑</text>';

    items.forEach(function (d, idx) {
      var col = domColors[d.domain] || '#38bdf8';
      var r = d.sev === 'CRITICAL' ? 13 : (d.sev === 'HIGH' ? 9.5 : 6.5);
      var cx = toX(d.autonomy);
      var cy = toY(d.impact);
      var tip = esc('<strong>' + d.name + '</strong> (' + d.domain + ', ' + d.year + ')<br/>Autonomy: <strong>' + d.autonomy + '%</strong> · Impact: <strong>' + d.impact + '/100</strong><br/>Theater: ' + d.theater + '<br/>' + d.scaleLabel);
      svg += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r + '" fill="' + col + '" fill-opacity="0.52" stroke="' + col + '" stroke-width="1.8" data-bidx="' + idx + '" data-tip="' + tip + '" style="cursor:pointer;"/>';
    });

    svg += '</svg>';
    el.innerHTML = svg;
    bindTips(el);
    if (onBubbleClick) {
      el.querySelectorAll('[data-bidx]').forEach(function (c) {
        c.addEventListener('click', function () {
          var it = items[Number(c.getAttribute('data-bidx'))];
          if (it) onBubbleClick(it);
        });
      });
    }
  }

  // 7. MULTI-ACTOR IHL RADAR & DEPLOYMENT SHARE DONUT (Twin Full-Size SVGs)
  function renderRadarAndDonut(radarEl, donutEl) {
    if (radarEl) {
      var axes = ['Autonomy', 'Scale', 'Accountability', 'IHL Art.36', 'Audit'];
      var actors = [
        { name: 'Israel IDF', color: '#f43f5e', vals: [95, 92, 4, 5, 3] },
        { name: 'US DoD', color: '#f59e0b', vals: [91, 88, 20, 28, 22] },
        { name: 'EU / UK Art. 36', color: '#10b981', vals: [46, 52, 82, 92, 86] }
      ];
      var W = 300, H = 260, cx = 150, cy = 128, maxR = 84;
      function ptAt(angleIdx, val) {
        var ang = (-Math.PI / 2) + (angleIdx * 2 * Math.PI / axes.length);
        var rad = (val / 100) * maxR;
        return [cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad];
      }

      var rSvg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="sied-svg" role="img" aria-label="Multi-Actor IHL Radar">';
      [25, 50, 75, 100].forEach(function (lvl) {
        var ring = axes.map(function (_, idx) { return ptAt(idx, lvl).map(function (n) { return n.toFixed(1); }).join(','); }).join(' ');
        rSvg += '<polygon points="' + ring + '" fill="none" stroke="rgba(255,255,255,0.1)"/>';
      });
      axes.forEach(function (lbl, idx) {
        var p = ptAt(idx, 100);
        var lp = ptAt(idx, 120);
        rSvg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="rgba(255,255,255,0.12)"/>';
        rSvg += '<text x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 3).toFixed(1) + '" fill="#cbd5e1" font-size="9.5" font-weight="600" text-anchor="middle" font-family="IBM Plex Mono,monospace">' + esc(lbl) + '</text>';
      });
      actors.forEach(function (act) {
        var poly = act.vals.map(function (v, idx) { return ptAt(idx, v).map(function (n) { return n.toFixed(1); }).join(','); }).join(' ');
        var tip = esc('<strong>' + act.name + '</strong><br/>' + axes.map(function (a, i) { return a + ': ' + act.vals[i]; }).join(' · '));
        rSvg += '<polygon points="' + poly + '" fill="' + act.color + '" fill-opacity="0.16" stroke="' + act.color + '" stroke-width="2" data-tip="' + tip + '" style="cursor:pointer;"/>';
        act.vals.forEach(function (v, idx) {
          var p = ptAt(idx, v);
          rSvg += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" fill="' + act.color + '"/>';
        });
      });
      rSvg += '</svg><div class="sied-leg-row">' + actors.map(function (a) {
        return '<span class="sied-leg-i"><span class="sied-leg-dot" style="background:' + a.color + ';"></span>' + esc(a.name) + '</span>';
      }).join('') + '</div>';
      radarEl.innerHTML = rSvg;
      bindTips(radarEl);
    }

    if (donutEl) {
      var slices = [
        { name: 'USA', pct: 28, color: '#f59e0b' },
        { name: 'Israel', pct: 22, color: '#f43f5e' },
        { name: 'China', pct: 18, color: '#a855f7' },
        { name: 'Russia / Iran', pct: 16, color: '#ec4899' },
        { name: 'UKR / EU / UK', pct: 16, color: '#38bdf8' }
      ];
      var r = 68, cx = 140, cy = 112, circ = 2 * Math.PI * r, off = 0;
      var dSvg = '<svg viewBox="0 0 280 226" class="sied-svg" role="img" aria-label="Deployment Share Donut">';
      slices.forEach(function (s) {
        var len = (s.pct / 100) * circ;
        var tip = esc('<strong>' + s.name + '</strong><br/>Estimated Share: ' + s.pct + '% of Tracked Active Systems');
        dSvg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + s.color + '" stroke-width="26" ' +
          'stroke-dasharray="' + len.toFixed(2) + ' ' + circ.toFixed(2) + '" stroke-dashoffset="-' + off.toFixed(2) + '" ' +
          'transform="rotate(-90 ' + cx + ' ' + cy + ')" data-tip="' + tip + '" style="cursor:pointer;"/>';
        off += len;
      });
      dSvg += '<text x="' + cx + '" y="' + (cy - 2) + '" fill="#fff" font-size="20" font-weight="800" text-anchor="middle" font-family="IBM Plex Mono,monospace">50</text>' +
        '<text x="' + cx + '" y="' + (cy + 14) + '" fill="#94a3b8" font-size="8.5" text-anchor="middle" font-family="IBM Plex Mono,monospace">SYSTEMS</text></svg>' +
        '<div class="sied-leg-row">' + slices.map(function (s) {
          return '<span class="sied-leg-i"><span class="sied-leg-dot" style="background:' + s.color + ';"></span>' + esc(s.name) + ' (' + s.pct + '%)</span>';
        }).join('') + '</div>';
      donutEl.innerHTML = dSvg;
      bindTips(donutEl);
    }
  }

  // 8. 195-STATE TREATY BREAKDOWN FULL-WIDTH SEGMENTED BAR
  function renderTreatyBar(el, sup, two, opp, unk) {
    if (!el) return;
    var tot = Math.max(1, sup + two + opp + unk);
    var segs = [
      { label: 'Opposes / Use-Ban First', val: opp, col: '#f43f5e' },
      { label: 'Two-Tier IHL / MHC', val: two, col: '#f59e0b' },
      { label: 'Binding Treaty Supporters', val: sup, col: '#10b981' },
      { label: 'Unknown / No Recorded Position', val: unk, col: '#64748b' }
    ];
    el.innerHTML =
      '<div style="display:flex;width:100%;height:20px;border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.12);background:#0f172a;">' +
      segs.map(function (s) {
        var w = ((s.val / tot) * 100).toFixed(2);
        var tip = esc('<strong>' + s.label + '</strong>: ' + s.val + ' / ' + tot + ' UN states (' + Math.round((s.val / tot) * 100) + '%)');
        return '<div data-tip="' + tip + '" style="width:' + w + '%;background:' + s.col + ';cursor:pointer;transition:opacity 0.2s;" title="' + esc(s.label + ': ' + s.val) + '"></div>';
      }).join('') +
      '</div>' +
      '<div class="sied-leg-row" style="margin-top:8px;">' +
      segs.map(function (s) {
        var p = Math.round((s.val / tot) * 100);
        return '<span class="sied-leg-i"><span class="sied-leg-dot" style="background:' + s.col + ';"></span>' + esc(s.label) + ': <strong style="color:#fff;">' + s.val + '</strong> (' + p + '%)</span>';
      }).join('') + '</div>';
    bindTips(el);
  }

  win.SIED_CHARTS = {
    renderLabBias: renderLabBias,
    renderSafetyEvolution: renderSafetyEvolution,
    renderRegComposition: renderRegComposition,
    renderAccountabilityGap: renderAccountabilityGap,
    renderTrajectory: renderTrajectory,
    renderBubbleMatrix: renderBubbleMatrix,
    renderRadarAndDonut: renderRadarAndDonut,
    renderTreatyBar: renderTreatyBar
  };
})(window);
