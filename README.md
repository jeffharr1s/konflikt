# KONFLIKT — Real-Time Conflict Intelligence Dashboard

> A live intelligence feed for the Iran / Middle East conflict. Built to answer one question: **what is happening right now, and what do I need to do?**

![Threat Level](https://img.shields.io/badge/Threat%20Level-CRITICAL-red)
![Auto Refresh](https://img.shields.io/badge/Auto%20Refresh-Every%205%20min-green)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Claude%20API-blue)

---

## What It Does

KONFLIKT scans live news sources every 5 minutes using the Claude AI API with web search, then builds a structured, human-readable intelligence briefing — automatically. The goal is to give anyone, regardless of background knowledge, a complete picture of what's happening in under 60 seconds of reading.

It was designed as a **life-safety awareness tool**: if you're in or near a conflict zone, or you have family there, this tells you what's happening, what's at risk, where to go, and what comes next.

---

## Features

### ⚡ Live Brief
The first thing you see after a scan. Designed for maximum speed of comprehension:
- **3 breaking facts** — the most urgent things happening right now, no fluff
- **Immediate Danger** — one sentence on the biggest physical threat at this moment
- **Recommended Action** — one sentence on what to do or avoid
- **Full Situation Narrative** — 4 paragraphs written for someone with zero background: what caused this, what happened in the last 48 hours, what's happening right now, and what civilians need to know
- **Top Prediction** — the single most likely next event with probability percentage

### ◉ Events
A live event log of everything that has happened, ranked by severity (CRITICAL → LOW). Each event is expandable with a full 2-3 sentence explanation. Categorized by type: STRIKE, DIPLOMATIC, MOVEMENT, STATEMENT, ECONOMIC.

### ⚔ Alliances
**Who is on whose side — updated with every scan.**
- Side-by-side scoreboard: US Coalition vs Iran Axis vs Neutral
- Every country/group tracked individually with:
  - Current alignment (US_COALITION / IRAN_AXIS / NEUTRAL / SHIFTING)
  - Their specific role (Active combatant, Arms supplier, Airspace access, Proxy force, Mediator, etc.)
  - Status: ACTIVE, SUPPORTING, WATCHING, or SHIFTING
  - One-sentence note on what they are doing *right now*
- Purple alert banner when any country's alliance is in flux
- Filter by side to focus on one coalition

### ◎ Zones
Every location in the conflict zone rated:
- 🔴 **DANGER** — active strikes, fighting, or direct threat
- 🟠 **CAUTION** — elevated risk, possible target
- 🟡 **WATCH** — monitoring, situation developing
- 🟢 **SAFE** — currently stable

Sorted by threat level, with a plain-language reason for each rating.

### ⚠ Threats
What is at risk right now and how likely it is:
- Targets: infrastructure, personnel, economic, diplomatic
- Likelihood: HIGH / MEDIUM / LOW
- Sorted by urgency

### ◈ Predictions
A live probability model of what comes next. Each scenario shows:
- Probability percentage (0–100%)
- Timeframe (24h / 48h / 1 week)
- Trend arrow (▲ increasing / ▼ decreasing / ● stable)
- Reasoning based on current events

Probabilities shift with every scan as new intelligence comes in.

### ◷ Timeline
**The complete history of how we got here — from 1953 to today.**

29 fully written historical entries covering every major turning point:
- 1953 CIA coup that started the US-Iran rift
- 1979 Islamic Revolution and hostage crisis
- 2003 Iraq invasion that accidentally empowered Iran
- 2010 Stuxnet cyberattack
- 2015 nuclear deal → 2018 Trump withdrawal
- 2020 Soleimani assassination
- 2024 first-ever direct Iran → Israel missile attacks
- 2024 Nasrallah killed, Assad regime collapses
- 2025–2026 current war escalation

Filter by category: ☢ Nuclear · ⚔ Military · 🏛 Political · 💰 Economic · 🕸 Proxy War

Each entry is expandable with a full explanation of what happened and **why it matters** — written so anyone can understand the chain of cause and effect. Timeline ends with a pulsing **"YOU ARE HERE"** marker.

### ◷ Context
- Historical background paragraph
- Iranian civilian sentiment vs. the regime
- Key players directory (who they are and what role they play)

---

## Auto-Refresh

Once initialized, the app automatically re-scans every **5 minutes**. A green countdown bar in the header shows time until the next refresh. You can also hit **REFRESH NOW** at any time to force an immediate update.

Every refresh updates:
- Threat level
- Breaking facts
- Full narrative
- Events log
- Alliance map
- Zone statuses
- Threat assessments
- Prediction probabilities

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (single `.jsx` file) |
| AI / Web Search | Anthropic Claude API (`claude-sonnet-4-20250514`) with `web_search_20250305` tool |
| Styling | Inline CSS + Google Fonts (Share Tech Mono, Oswald) |
| Hosting | Runs as a Claude.ai artifact, or any React environment |
| Data | 100% live — no database, no backend, no static data (except the historical timeline) |

---

## How It Works

```
User clicks "Initialize Scan"
        ↓
POST to Anthropic /v1/messages
  - Model: claude-sonnet-4-20250514
  - Tool: web_search (searches live news)
  - System prompt: structured JSON schema
        ↓
Claude searches: "Iran military news", "Israel Iran conflict",
                 "Middle East war", "US military Middle East",
                 "Hezbollah Houthis latest"
        ↓
Returns single JSON object with all sections
        ↓
React renders all 7 tabs from that one response
        ↓
Timer fires every 5 minutes → repeat
```

---

## Running It

### As a Claude.ai Artifact
1. Open [claude.ai](https://claude.ai)
2. Paste the full `.jsx` file as a prompt asking to render it as a React artifact
3. Click Initialize Scan

### As a Standalone React App
```bash
npx create-react-app konflikt
cd konflikt
# Replace src/App.js with the contents of conflict-tracker.jsx
npm start
```

> **Note:** The Anthropic API key is handled automatically inside Claude.ai artifacts. For standalone deployment you will need to add your own API key to the fetch headers and set up a backend proxy (never expose API keys in frontend code).

---

## Project Structure

```
conflict-tracker.jsx        # Entire app — single file
README.md                   # This file
```

The entire application is intentionally a **single file**. No build step required inside Claude.ai. For production deployment, splitting into components is recommended.

---

## Prompt to Regenerate

If you want to rebuild this from scratch using Claude, use this prompt:

```
Build a single-file React JSX app called KONFLIKT — a real-time conflict intelligence 
dashboard for the Iran/Middle East war.

The app calls the Anthropic API at https://api.anthropic.com/v1/messages using 
model claude-sonnet-4-20250514 with the web_search_20250305 tool enabled. 
No streaming — standard POST fetch only. No API key in headers (handled externally).

The API call returns a single JSON object with these fields:
threat_level, headline, breaking (array of 3), immediate_danger, safe_direction,
narrative (4 paragraphs), events (array), zones (array), threats (array), 
predictions (array with probability 0-100 and trend), background, 
iranian_sentiment, key_players (array), alliances (array with side/role/status/note).

The app has 7 tabs:
1. TIMELINE — hardcoded historical events 1953–2026, filterable by category 
   (nuclear/military/political/economic/proxy), vertical timeline layout, expandable cards
2. LIVE BRIEF — breaking facts, danger/safe boxes, 4-paragraph narrative, top prediction
3. EVENTS — expandable event log sorted by severity with category icons
4. ALLIANCES — US COALITION vs IRAN AXIS scoreboard, country cards showing 
   side/role/status/note, SHIFTING alert banner, filterable by side
5. ZONES — grid of locations rated DANGER/CAUTION/WATCH/SAFE
6. THREATS — cards sorted by HIGH/MEDIUM/LOW likelihood  
7. PREDICTIONS — probability bars with trend arrows, sorted by probability

Auto-refreshes every 5 minutes with a countdown bar in the header.
Shows threat level badge, breaking headline ticker, and last-updated timestamp.

Design: dark war-room aesthetic, #080808 background, Share Tech Mono + Oswald fonts,
color coding: red=#ff3300 (critical/Iran), blue=#3399ff (US coalition), 
green=#00dd66 (safe/low), white text for all headings and primary content.
```

---

## Intended Use

This tool is for **awareness and safety**. It is designed to:
- Help people near conflict zones understand the situation quickly
- Track which areas are dangerous and which are safer
- Show where alliances stand so you know which countries are safe to travel to or through
- Give a prediction of what comes next so you can prepare

It is **not** a classified intelligence tool. All data comes from open-source news via web search. Treat predictions as informed estimates, not certainties.

---

## Disclaimer

This application uses AI-generated analysis of open-source news. It is not affiliated with any government, military, or intelligence agency. Predictions and threat assessments are probabilistic estimates based on publicly available information — not guarantees. Always consult official government travel advisories and emergency services in life-threatening situations.

---

## License

MIT — use freely, modify freely, deploy freely.

---

*Built with Claude by Anthropic · KONFLIKT Intel Feed · Open Source Intelligence · Not Classified*
