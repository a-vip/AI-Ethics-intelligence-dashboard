# AI Ethics Intelligence Dashboard (v7.0 — Nov 2026)

**Flagship Software Ecosystem & Sovereign Risk Observatory** live at [aviperera.com/ai-ethics-dashboard/](https://aviperera.com/ai-ethics-dashboard/).

Built on Avi Perera's three core design principles:
1. **Transparency-by-Design**: Every model, weapon platform, and treaty row links directly to model cards, UNODA/ICRC treaty records, court judgments, and peer-reviewed audits.
2. **Temporal Contextualisation**: Cross-references frontier releases and autonomous deployments against binding hard laws via the [Global AI Policy Tracker](https://aviperera.com/ai-policy-tracker/) and [Global AI Policy Timeline](https://aviperera.com/ai-policy-timeline/).
3. **Actionable Alerts**: Flags guardrail abliteration, Art. 36 IHL review vacuums, and covert demographic bias into structured analyst bulletins.

## Modular Infrastructure & Connectors (v7.0)

* **Assets**: [`assets/sied-v7.css`](assets/sied-v7.css), [`assets/sied-v7.js`](assets/sied-v7.js)
* **Automated Live Connectors**:
  * GitHub Actions cron ([`.github/workflows/refresh-feeds.yml`](.github/workflows/refresh-feeds.yml) + [`scripts/update_live_feeds.mjs`](scripts/update_live_feeds.mjs)) refreshing [`data/live-feed.json`](data/live-feed.json) every 6 hours from **arXiv**, **UN News**, **ICRC Humanitarian Law & Policy**, **West Point Lieber Institute**, **Just Security**, **Nature Machine Intelligence**, **Human Rights Watch**, **MIT Technology Review**, and **Avi Perera**.
  * WordPress Theme Server-Side Connector (`inc/ai-ethics-connectors.php`) providing 15-minute cached WP AJAX (`avi_ethics_feeds`) and REST (`/wp-json/avi-ethics/v1/feeds`) endpoints.
* **Extensible Modular Datasets (`data/`)**:
  * [`data/frontier-models.json`](data/frontier-models.json) — 36 frontier models through Nov 12, 2026 in a standalone **Airtable-style Base**.
  * [`data/laws-systems.json`](data/laws-systems.json) — 50 global Military AI & LAWS platforms with multi-column sorting, platform filters, and Art. 36 legal dossier modals.
  * [`data/treaty-matrix.json`](data/treaty-matrix.json) — Complete **195 UN Member & Observer States** (including explicit `Unknown / No Recorded Position` classifications, GC AP I Art. 36, UN CCW & Protocols II/V, ICC Rome Statute, US Political Declaration, and UNGA 78/241 -> 79/62 -> 80/57 voting histories).
  * [`data/bubble-matrix.json`](data/bubble-matrix.json) — 28 systems plotted across **Accountability Vacuum**, **Oversight Strain**, and **Bounded HITL** quadrants.
  * [`data/trajectory-data.json`](data/trajectory-data.json) — 2015–Nov 2026 multi-axis trajectories across conflict theaters, frontier cyber/hard-law actions, and SIPRI autonomy spending.
  * [`data/research-repo.json`](data/research-repo.json) — 35 high-authority treaties, ICJ/ICC/ECHR/US legal precedents, peer-reviewed studies, and Avi Perera dossiers with one-click citation copy.
  * [`data/agentic-systems.json`](data/agentic-systems.json) & [`data/surveillance-systems.json`](data/surveillance-systems.json).
