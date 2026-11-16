# AI Ethics Intelligence Dashboard v6.0 ⚖️🤖

**Live Observatory:** [https://aviperera.com/ai-ethics-dashboard/](https://aviperera.com/ai-ethics-dashboard/)  
**Companion Tools:** [Global AI Policy Tracker](https://aviperera.com/ai-policy-tracker/) · [AI Policy Timeline (1899–2030)](https://aviperera.com/ai-policy-timeline/) · [AI Weapons Systems Database](https://aviperera.com/systems-database/)

> *"Technological optimism must be disciplined by systematic risk assessment — demonstrating that the same engineering skill set that builds frontier LLMs and autonomous systems can build the scaffolding needed to monitor them responsibly."* — **Avi Perera**

---

## 🗂️ Airtable-Style Frontier AI Models Registry (Nov 2026)

Elevated directly into its own standalone workspace above the risk observatory grid, the **Frontier AI Models, Bias & Regulatory Registry** tracks **36 frontier models** through **November 16, 2026**, featuring:

- **Google DeepMind:** `Gemini 4 Hydrogen` (Nov 12, 2026), `Gemini 4 Carbon` (Nov 10, 2026), `Gemini 4 Argon` (Oct 13, 2026), `Gemini 3.8 Flash` (Sep 2, 2026), `Gemini 3.5 Pro & DiffusionGemma`, `Gemini 3 Pro`, `Gemini 2.5 Pro`
- **Anthropic:** `Claude Fable 5.2` & `Claude Mythos 5.2` (Nov 9, 2026), `Claude Haiku 5.5` (Oct 12, 2026), `Claude Sonnet 5.5` (Sep 28, 2026), `Claude Opus 5.5` (Sep 22, 2026), `Claude Opus 5 & Sonnet 5`, `Claude Opus 4–4.8`, `Claude 3.7 Sonnet`
- **OpenAI:** `GPT-6 Cyber` (Nov 5, 2026 — Critical Cyber Preparedness), `GPT-6.1 Terra` (Oct 26, 2026), `GPT-6.1 Sol` (Sep 29, 2026), `GPT-6 Astra / Sol / Luna / Instant` (Sep–Oct 2026), `GPT-5.3 Codex`, `GPT-5`, `o3 & o4-mini`
- **DeepSeek, Meta, xAI, Mistral, Qwen, Kimi, Zhipu, ByteDance, Cohere & Amazon:** `DeepSeek-V4 / V4.1-Flash / R1`, `Meta Muse Spark & Llama 4`, `xAI Grok 4.7 & Grok 4`, `Mistral Large 4 ("le Chonk")`, `Qwen 3.8`, `Moonshot Kimi K3.1 Pro (2.8T MoE)`, `Zhipu GLM-5.3 (744B MoE)`, `ByteDance Seed 2.1 / Seedance 2.5`, `Cohere Command A+`, `Amazon Nova 2 Omni`

Each Airtable row features sortable columns, `Group By` (`Organization`, `Severity`, `Regulatory Era`), view pills (`All`, `Late 2026 Frontier`, `Critical Risk / Cyber`, `Open-Weights`, `Under 2026 Hard Law`), row density controls, live `∑` aggregate footer metrics, a click-to-expand **Record Inspector Drawer**, CSV/JSON export, and 3 dedicated Frontier Model charts.

---

## 📁 Extensible JSON Data Architecture (`/data/`)

All core registries are exported to structured JSON schemas so new releases and systems can be added continuously without editing UI markup:

- `data/frontier-models.json` — Frontier model releases, bias studies, Preparedness/RSP tiers, and regulatory cross-references
- `data/laws-systems.json` — 32 autonomous weapon systems mapped to Article 36 IHL compliance and canonical dossiers
- `data/agentic-systems.json` — Agentic AI, computer-use, and autonomous military C2 risk profiles
