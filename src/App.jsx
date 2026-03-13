import { useState, useCallback, useEffect, useRef } from "react";

const AUTO_REFRESH_SECONDS = 300;

const THREAT_CONFIG = {
  CRITICAL: { color:"#ff3300", dim:"#1a0400" },
  HIGH:     { color:"#ff6600", dim:"#1a0c00" },
  ELEVATED: { color:"#ffaa00", dim:"#1a1200" },
  MODERATE: { color:"#ffdd00", dim:"#141200" },
  LOW:      { color:"#00dd66", dim:"#001a0a" },
};
const ZONE_COLORS   = { DANGER:"#ff3300", CAUTION:"#ff8800", WATCH:"#ffcc00", SAFE:"#00dd66" };
const SEV_COLORS    = { CRITICAL:"#ff3300", HIGH:"#ff6600", MEDIUM:"#ffbb00", LOW:"#888" };
const CAT_ICONS     = { STRIKE:"💥", DIPLOMATIC:"🤝", MOVEMENT:"🚁", STATEMENT:"📢", ECONOMIC:"💰", OTHER:"📌" };
const SIDE_CONFIG   = {
  US_COALITION: { color:"#3399ff", bg:"#001a33", label:"US COALITION", icon:"🇺🇸" },
  IRAN_AXIS:    { color:"#ff3300", bg:"#1a0400", label:"IRAN AXIS",    icon:"🇮🇷" },
  NEUTRAL:      { color:"#888888", bg:"#111111", label:"NEUTRAL",      icon:"⚪" },
  UNKNOWN:      { color:"#555555", bg:"#0d0d0d", label:"UNKNOWN",      icon:"❓" },
};
const STATUS_COLORS = { ACTIVE:"#ff3300", SUPPORTING:"#ff8800", WATCHING:"#ffcc00", SHIFTING:"#cc44ff" };

// ── Historical Timeline ───────────────────────────────────────────────────────
const TIMELINE_CATS = {
  all:      { label:"All",       icon:"◎", color:"#aaa" },
  nuclear:  { label:"Nuclear",   icon:"☢", color:"#ff4400" },
  military: { label:"Military",  icon:"⚔", color:"#ff6600" },
  political:{ label:"Political", icon:"🏛", color:"#aaaaff" },
  economic: { label:"Economic",  icon:"💰", color:"#ffcc00" },
  proxy:    { label:"Proxy War", icon:"🕸", color:"#cc44ff" },
};
const TIMELINE = [
  { year:1953, date:"1953-08-19", cat:"political", severity:"CRITICAL", title:"CIA/MI6 Coup Overthrows Iran's Elected Government", countries:["USA","UK","Iran"], summary:"Operation AJAX: The CIA and British MI6 orchestrate a coup deposing democratically elected PM Mohammad Mosaddegh, who had nationalized Iran's oil industry. Shah Mohammad Reza Pahlavi is reinstalled. This is considered the original wound in US-Iran relations — Iranians call it a national humiliation that justified the 1979 revolution 26 years later." },
  { year:1979, date:"1979-02-11", cat:"political", severity:"CRITICAL", title:"Islamic Revolution — Shah Overthrown, Khomeini Returns", countries:["Iran","Ayatollah Khomeini"], summary:"After mass protests, Shah Pahlavi flees. Ayatollah Khomeini returns from exile and establishes the Islamic Republic — the world's first theocratic state. 'Death to America' and 'Death to Israel' become official state ideology embedded in the constitution." },
  { year:1979, date:"1979-11-04", cat:"political", severity:"CRITICAL", title:"US Embassy Hostage Crisis — 444 Days", countries:["Iran","USA"], summary:"Iranian students storm the US Embassy, taking 52 Americans hostage for 444 days. Diplomatic relations are severed and never formally restored. The crisis defines American public opinion of Iran for generations." },
  { year:1980, date:"1980-09-22", cat:"military", severity:"HIGH", title:"Iran-Iraq War Begins — US Secretly Backs Saddam", countries:["Iraq","Iran","USA"], summary:"Saddam Hussein invades Iran, starting an 8-year war killing over a million people. The US quietly backs Iraq with intelligence and diplomatic cover — even after Saddam uses chemical weapons on Iranians. Iran emerges battered but undefeated." },
  { year:1988, date:"1988-07-03", cat:"military", severity:"CRITICAL", title:"USS Vincennes Shoots Down Iran Air 655 — 290 Civilians Killed", countries:["USA","Iran"], summary:"A US Navy warship shoots down an Iranian civilian airliner, killing all 290 aboard including 66 children. The US never formally apologizes. The incident hardens Iran's pursuit of military self-sufficiency and shapes IRGC strategy for decades." },
  { year:2002, date:"2002-01-29", cat:"political", severity:"HIGH", title:"Bush 'Axis of Evil' Speech — Iran Named Enemy", countries:["USA","Iran","Iraq","North Korea"], summary:"President Bush names Iran in the 'Axis of Evil' after Iran had just cooperated with the US on post-9/11 Afghanistan. Iranian reformists advocating Western engagement were undercut overnight. Hardliners were vindicated." },
  { year:2003, date:"2003-03-20", cat:"military", severity:"CRITICAL", title:"US Invades Iraq — Accidentally Gifts Iran Regional Power", countries:["USA","Iraq","Iran"], summary:"The US invasion removes Saddam Hussein — Iran's primary regional enemy — and hands political power to Iraq's Shia majority with strong ties to Tehran. Iran goes from being contained to gaining a land bridge to Syria and Lebanon through friendly Iraq." },
  { year:2006, date:"2006-07-12", cat:"proxy", severity:"HIGH", title:"Hezbollah-Israel War — Iran's Proxy Proves Its Worth", countries:["Hezbollah","Israel","Iran","Lebanon"], summary:"Hezbollah fights Israel to a standstill in a 34-day war, launching thousands of rockets into northern Israel. Iran-supplied weapons prove Iran's proxy strategy works: inflict costs on Israel without direct confrontation." },
  { year:2010, date:"2010-09-01", cat:"nuclear", severity:"CRITICAL", title:"Stuxnet: US & Israel Destroy 1,000 Iranian Centrifuges via Cyberattack", countries:["USA","Israel","Iran"], summary:"The Stuxnet worm — jointly developed by US and Israel — physically destroys ~1,000 Iranian centrifuges at Natanz. The first cyberweapon to cause physical damage. Sets back Iran's nuclear program 1-2 years. Iran massively expands its own cyber capabilities in response." },
  { year:2015, date:"2015-07-14", cat:"nuclear", severity:"CRITICAL", title:"JCPOA Signed — The Iran Nuclear Deal", countries:["Iran","USA","UK","France","Germany","Russia","China"], summary:"Iran caps uranium enrichment at 3.67%, reduces centrifuge count by two-thirds, submits to IAEA inspections. In return, over $100 billion in frozen assets are released and oil sanctions lifted. The deal has a 10-15 year sunset clause — a fatal flaw." },
  { year:2018, date:"2018-05-08", cat:"political", severity:"CRITICAL", title:"Trump Withdraws from JCPOA — 'Maximum Pressure' Begins", countries:["USA","Iran"], summary:"Trump exits the nuclear deal and reimpose sweeping sanctions. Iran's currency loses 60% of its value. Designed to force Iran back to the table, the 'maximum pressure' campaign instead causes Iran to accelerate its nuclear program." },
  { year:2019, date:"2019-09-14", cat:"military", severity:"HIGH", title:"Attack on Saudi Aramco — Largest Oil Supply Shock in History", countries:["Iran","Houthis","Saudi Arabia","USA"], summary:"Drone and missile strikes knock out 5% of global oil supply overnight. Despite the scale, no military retaliation follows — establishing a dangerous precedent that Iran can strike critical infrastructure without consequences." },
  { year:2020, date:"2020-01-03", cat:"military", severity:"CRITICAL", title:"US Kills Gen. Qasem Soleimani", countries:["USA","Iran","Iraq"], summary:"A US drone strike kills IRGC Quds Force commander Soleimani — the architect of Iran's entire regional proxy network. Iran launches ballistic missiles at US bases in Iraq — the first direct Iranian attack on US forces. The US does not respond militarily." },
  { year:2021, date:"2021-04-10", cat:"nuclear", severity:"CRITICAL", title:"Iran Begins 60% Uranium Enrichment — No Civilian Justification", countries:["Iran","IAEA"], summary:"Iran enriches to 60% purity — far beyond the 3.67% JCPOA limit. Weapons-grade is 90%. Iran is now the only non-nuclear state ever to enrich above 20%. The IAEA estimates Iran has enough material for several nuclear devices if further enriched." },
  { year:2022, date:"2022-09-16", cat:"political", severity:"HIGH", title:"Mahsa Amini Protests — 'Woman, Life, Freedom'", countries:["Iran","Iranian civil society"], summary:"22-year-old Mahsa Amini dies in morality police custody. Her death triggers the largest domestic uprising since 1979, led by young women removing headscarves. The regime kills 500+ protesters but the protests reveal deep fractures in the Islamic Republic." },
  { year:2023, date:"2023-03-10", cat:"political", severity:"HIGH", title:"Saudi Arabia and Iran Restore Diplomatic Relations — China Brokers Deal", countries:["Saudi Arabia","Iran","China"], summary:"China brokers restoration of Saudi-Iran diplomatic ties. China's first major Middle East diplomatic achievement and a direct challenge to US influence. Iran breaks out of diplomatic isolation." },
  { year:2023, date:"2023-10-07", cat:"proxy", severity:"CRITICAL", title:"Hamas Attacks Israel — 1,200 Killed. Gaza War Begins.", countries:["Hamas","Israel","Iran","Gaza"], summary:"Hamas launches the deadliest attack on Jews since the Holocaust: 1,200 killed, 251 taken hostage. Israel declares war. Iran is Hamas's primary weapons supplier. The war provides cover for Iran's continued nuclear advances." },
  { year:2024, date:"2024-04-01", cat:"military", severity:"HIGH", title:"Israel Strikes Iranian Consulate in Damascus — Kills IRGC Generals", countries:["Israel","Iran","Syria"], summary:"Israeli airstrikes destroy the Iranian consulate in Damascus, killing seven IRGC officers including two senior generals. First confirmed Israeli strike on Iranian diplomatic premises. Iran vows retaliation." },
  { year:2024, date:"2024-04-13", cat:"military", severity:"CRITICAL", title:"Iran Directly Attacks Israel for the First Time — 300+ Drones & Missiles", countries:["Iran","Israel","USA","UK"], summary:"Iran launches 300+ drones, cruise missiles, and ballistic missiles at Israel — the first direct Iranian attack on Israeli territory in history. US, UK, France, and Jordan intercept 99%. The new normal of direct Iran-Israel warfare is established." },
  { year:2024, date:"2024-09-27", cat:"military", severity:"CRITICAL", title:"Israel Kills Hezbollah Chief Hassan Nasrallah", countries:["Israel","Hezbollah","Iran"], summary:"Israeli airstrikes kill Nasrallah, Hezbollah's Secretary-General for 30+ years. Israel follows with a ground invasion of southern Lebanon. Iran's most powerful proxy is effectively leaderless. A catastrophic blow to Iran's regional deterrence." },
  { year:2024, date:"2024-10-01", cat:"military", severity:"CRITICAL", title:"Iran's Second Direct Attack — 180 Ballistic Missiles at Israel", countries:["Iran","Israel","USA"], summary:"Iran fires ~180 ballistic missiles at Israel — the largest ballistic missile attack against any country in history. Most intercepted. Iran calls it retaliation for Nasrallah's killing. The conflict is now in direct-warfare phase." },
  { year:2024, date:"2024-10-26", cat:"military", severity:"CRITICAL", title:"Israel Strikes Iran Directly — Air Defense and Missile Sites Destroyed", countries:["Israel","Iran"], summary:"Israel strikes Iranian air defense systems and missile production infrastructure. Iran's radar systems are destroyed — leaving it blind to future air attack. Israel demonstrates it can penetrate Iranian airspace at will." },
  { year:2024, date:"2024-12-08", cat:"proxy", severity:"CRITICAL", title:"Assad Regime Collapses in Syria — Iran Loses Its Land Bridge", countries:["Syria","Iran","Hezbollah","Israel","Turkey"], summary:"In a stunning 12-day offensive, rebel forces topple Assad — ending 54 years of Assad rule. Iran loses its primary land corridor for supplying Hezbollah. The 'Axis of Resistance' linking Tehran to Beirut is severed. Iran's regional architecture collapses in two weeks." },
  { year:2025, date:"2025-01-20", cat:"political", severity:"CRITICAL", title:"Trump Returns — 'Maximum Pressure 2.0' and Nuclear Ultimatum", countries:["USA","Iran"], summary:"Trump returns and expands maximum pressure sanctions, issuing Iran a 60-day ultimatum: negotiate or face military action. Iran, with Hezbollah decimated and Assad gone, is weaker than any point since 1979. But still refuses to negotiate under threat." },
  { year:2026, date:"2026-02-28", cat:"military", severity:"CRITICAL", title:"US-Israel Joint Strikes Kill Supreme Leader Khamenei — All-Out War Begins", countries:["USA","Israel","Iran"], summary:"Coordinated US-Israeli strikes kill Supreme Leader Khamenei and senior IRGC commanders. Iran launches massive retaliatory strikes across the region. Iranian proxies activate everywhere. Gulf states close airspace. The region enters its most dangerous phase since World War II." },
];

// ── Two-phase fetch ───────────────────────────────────────────────────────────
// Phase 1: Fast — no web search, just breaking snapshot from model knowledge
const PHASE1_SYSTEM = `You are a conflict intelligence analyst. Focus ONLY on what happened in the LAST HOUR. Not background. Not history. Only breaking developments from the past 60 minutes.
Return ONLY raw JSON, start with { end with }, no other text:
{"threat_level":"CRITICAL or HIGH or ELEVATED or MODERATE or LOW","headline":"The single most critical thing that happened in the LAST HOUR","breaking":["What happened in last 60 min #1 — include approximate time e.g. 20 min ago","What happened in last 60 min #2","What happened in last 60 min #3"],"immediate_danger":"The most immediate physical threat RIGHT NOW to people in the region or US","safe_direction":"What should people do or avoid RIGHT NOW based on last hour"}`;

// Phase 2: Full — web search, complete briefing
const PHASE2_SYSTEM = `You are a real-time conflict intelligence analyst. Search the web for LATEST news from the last few hours on Iran, Israel, Middle East.

CRITICAL RULES:
- Return ONLY raw JSON. Start with { end with }. Zero text before or after.
- Every array must have real populated items — NO empty arrays
- events: minimum 5 real news events from TODAY with actual timestamps
- threats: minimum 4 CONFIRMED active threats (not predictions) — things actually happening
- predictions: minimum 4 scenarios ranked by probability of causing maximum damage to US/Western interests
- alliances: all 16 countries listed below — every single one

JSON schema (fill every field with real data):
{
  "threat_level": "CRITICAL|HIGH|ELEVATED|MODERATE|LOW",
  "headline": "Most critical thing from last 2 hours — specific: who, what, where, when",
  "last_hour": [
    "~Xm ago: [specific event with location and actors]",
    "~Xm ago: [specific event]",
    "~Xm ago: [specific event]",
    "~Xm ago: [specific event]"
  ],
  "immediate_danger": "Most immediate physical threat RIGHT NOW — specific location and type",
  "safe_direction": "Exactly what people should do or avoid RIGHT NOW",
  "why_it_matters": "2 sentences: why this matters and what it leads to in 24h",
  "narrative": "Para1: last 48hrs context. Para2: RIGHT NOW. Para3: next 24hrs. Para4: civilian safety today.",
  "events": [
    {"timestamp": "~Xh ago or HH:MM UTC", "title": "Specific event title", "description": "2-3 sentence detail", "severity": "CRITICAL|HIGH|MEDIUM|LOW", "category": "STRIKE|DIPLOMATIC|MOVEMENT|STATEMENT|ECONOMIC|OTHER"},
    {"timestamp": "", "title": "", "description": "", "severity": "", "category": ""},
    {"timestamp": "", "title": "", "description": "", "severity": "", "category": ""},
    {"timestamp": "", "title": "", "description": "", "severity": "", "category": ""},
    {"timestamp": "", "title": "", "description": "", "severity": "", "category": ""}
  ],
  "zones": [
    {"name": "City/region name", "country": "Country", "status": "DANGER|CAUTION|WATCH|SAFE", "reason": "Specific reason"},
    {"name": "", "country": "", "status": "", "reason": ""},
    {"name": "", "country": "", "status": "", "reason": ""},
    {"name": "", "country": "", "status": "", "reason": ""},
    {"name": "", "country": "", "status": "", "reason": ""},
    {"name": "", "country": "", "status": "", "reason": ""}
  ],
  "threats": [
    {"target": "Specific target e.g. US Navy 5th Fleet", "type": "Missile|Drone|Cyber|Proxy|Terror|Naval", "confirmed": true, "status": "ACTIVE|IMMINENT|ONGOING", "likelihood": "HIGH|MEDIUM|LOW", "source": "Iran|Hezbollah|Houthis|Hamas|Russia|China|Domestic", "description": "What is confirmed happening RIGHT NOW — not a prediction"},
    {"target": "", "type": "", "confirmed": true, "status": "ACTIVE", "likelihood": "HIGH", "source": "", "description": ""},
    {"target": "", "type": "", "confirmed": true, "status": "ACTIVE", "likelihood": "HIGH", "source": "", "description": ""},
    {"target": "", "type": "", "confirmed": false, "status": "IMMINENT", "likelihood": "MEDIUM", "source": "", "description": ""}
  ],
  "predictions": [
    {"scenario": "Most damaging possible next move against US/Western interests", "probability": 75, "damage_level": "CATASTROPHIC|SEVERE|HIGH|MODERATE", "timeframe": "24h|48h|1week", "reasoning": "Why this is likely based on current events", "trend": "INCREASING|STABLE|DECREASING", "targets_us": true},
    {"scenario": "Second most damaging scenario", "probability": 55, "damage_level": "SEVERE", "timeframe": "48h", "reasoning": "", "trend": "INCREASING", "targets_us": false},
    {"scenario": "", "probability": 35, "damage_level": "HIGH", "timeframe": "1week", "reasoning": "", "trend": "STABLE", "targets_us": false},
    {"scenario": "", "probability": 20, "damage_level": "CATASTROPHIC", "timeframe": "1week", "reasoning": "", "trend": "INCREASING", "targets_us": true}
  ],
  "background": "2-3 sentences of essential historical context only",
  "iranian_sentiment": "What ordinary Iranians think vs the regime right now",
  "key_players": [
    {"name": "Name", "role": "Title and current action"},
    {"name": "", "role": ""},
    {"name": "", "role": ""},
    {"name": "", "role": ""},
    {"name": "", "role": ""}
  ],
  "alliances": [
    {"country": "USA", "side": "US_COALITION", "role": "Leading coalition", "status": "ACTIVE", "note": "What USA is doing right now"},
    {"country": "Israel", "side": "US_COALITION", "role": "", "status": "ACTIVE", "note": ""},
    {"country": "UK", "side": "US_COALITION", "role": "", "status": "SUPPORTING", "note": ""},
    {"country": "France", "side": "US_COALITION", "role": "", "status": "SUPPORTING", "note": ""},
    {"country": "Jordan", "side": "US_COALITION", "role": "", "status": "WATCHING", "note": ""},
    {"country": "Saudi Arabia", "side": "NEUTRAL", "role": "", "status": "WATCHING", "note": ""},
    {"country": "UAE", "side": "NEUTRAL", "role": "", "status": "WATCHING", "note": ""},
    {"country": "Qatar", "side": "NEUTRAL", "role": "", "status": "WATCHING", "note": ""},
    {"country": "Iran", "side": "IRAN_AXIS", "role": "Leading axis", "status": "ACTIVE", "note": ""},
    {"country": "Russia", "side": "IRAN_AXIS", "role": "", "status": "SUPPORTING", "note": ""},
    {"country": "China", "side": "NEUTRAL", "role": "", "status": "WATCHING", "note": ""},
    {"country": "Iraq", "side": "NEUTRAL", "role": "", "status": "WATCHING", "note": ""},
    {"country": "Hezbollah", "side": "IRAN_AXIS", "role": "Proxy force", "status": "ACTIVE", "note": ""},
    {"country": "Houthis Yemen", "side": "IRAN_AXIS", "role": "Proxy force", "status": "ACTIVE", "note": ""},
    {"country": "Hamas", "side": "IRAN_AXIS", "role": "Proxy force", "status": "ACTIVE", "note": ""},
    {"country": "Turkey", "side": "NEUTRAL", "role": "", "status": "WATCHING", "note": ""}
  ],
  "homeland": {
    "threat_level": "CRITICAL|HIGH|ELEVATED|MODERATE|LOW",
    "california_score": 7,
    "summary": "2-3 sentence overview of current US homeland threat especially California",
    "fbi_alerts": ["Copy any active FBI/DHS alert text verbatim if found in search results"],
    "targets": [
      {"location": "Port of Long Beach", "type": "infrastructure", "threat": "Drone/cyber attack", "source": "Iran", "likelihood": "HIGH", "detail": "Specific reason this facility is at risk right now"},
      {"location": "Vandenberg SFB", "type": "military", "threat": "", "source": "Iran", "likelihood": "HIGH", "detail": ""},
      {"location": "Naval Base San Diego", "type": "military", "threat": "", "source": "Iran", "likelihood": "MEDIUM", "detail": ""},
      {"location": "Silicon Valley tech infrastructure", "type": "infrastructure", "threat": "Cyber", "source": "Iran|China", "likelihood": "MEDIUM", "detail": ""},
      {"location": "Golden Gate Bridge / Bay Area", "type": "symbolic", "threat": "", "source": "Unknown", "likelihood": "LOW", "detail": ""}
    ],
    "california_specific": "Specific paragraph on California threat — name cities and facilities",
    "northern_california": {
      "threat_level": "ELEVATED",
      "cities": ["San Francisco", "Oakland", "San Jose", "Sacramento"],
      "detail": "Specific NorCal threat picture with named facilities and reasons"
    },
    "southern_california": {
      "threat_level": "HIGH",
      "cities": ["Los Angeles", "Long Beach", "San Diego", "Riverside"],
      "detail": "Specific SoCal threat picture with named facilities and reasons"
    },
    "watchlist": ["Port of Long Beach", "Vandenberg SFB", "Naval Base San Diego", "Golden Gate Bridge", "LAX Airport", "Diablo Canyon Nuclear Plant"],
    "recommended_actions": [
      "Be aware of suspicious activity near military installations and ports",
      "Report unidentified drones near sensitive facilities to local law enforcement",
      "Stay informed via FEMA alerts and local emergency broadcasts"
    ]
  }
}
Search specifically for: Iran drone California FBI alert, US military Middle East today, Israel Iran strikes latest, Hezbollah attacks today, Houthi attacks today, DHS homeland security alerts. california_score: 1=no threat, 10=imminent confirmed attack. Set based on actual current intelligence found.`;

function extractJSON(text) {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a === -1 || b === -1) return null;
  try { return JSON.parse(text.slice(a, b + 1)); } catch { return null; }
}

async function callAPI(system, useSearch) {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: useSearch ? 12000 : 800,
    system,
    messages: [{ role:"user", content:"Search for: Iran attack news today, Middle East war latest, FBI California threat, US military Middle East, Israel strikes today. Then return ONLY the JSON object starting with {. No other text. No markdown." }],
  };
  if (useSearch) body.tools = [{ type:"web_search_20250305", name:"web_search" }];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt.slice(0,300)}`);
  }
  const data = await res.json();
  const block = data.content?.find(b => b.type === "text");
  if (!block?.text) throw new Error(`No text block. Types: ${data.content?.map(b=>b.type).join(", ")}`);
  const parsed = extractJSON(block.text);
  if (!parsed) throw new Error(`JSON parse failed. Got: ${block.text.slice(0,200)}`);
  return parsed;
}

// ── UI Components ─────────────────────────────────────────────────────────────
function ProbBar({ value, trend }) {
  const c = value > 70 ? "#ff3300" : value > 40 ? "#ff8800" : "#00cc55";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:10 }}>
      <div style={{ flex:1, height:5, background:"#1a1a1a", borderRadius:3, overflow:"hidden" }}>
        <div style={{ width:`${value}%`, height:"100%", background:c, boxShadow:`0 0 8px ${c}66` }} />
      </div>
      <span style={{ fontSize:13, color:c, minWidth:40, fontFamily:"monospace", fontWeight:"bold" }}>{value}%</span>
      <span style={{ fontSize:12, color: trend==="INCREASING"?"#ff6600":trend==="DECREASING"?"#00cc55":"#888" }}>
        {trend==="INCREASING"?"▲":trend==="DECREASING"?"▼":"●"}
      </span>
    </div>
  );
}

function CountdownBar({ seconds, total }) {
  return (
    <div style={{ height:2, background:"#111" }}>
      <div style={{ width:`${(seconds/total)*100}%`, height:"100%", background:"#00cc5555", transition:"width 1s linear" }} />
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{ fontSize:11, color:"#aaa", letterSpacing:4, padding:"10px 0", borderBottom:"1px solid #1a1a1a", marginBottom:18, fontWeight:"bold" }}>
      {children}
    </div>
  );
}

// ── Timeline Tab ──────────────────────────────────────────────────────────────
function TimelineTab() {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState({});
  const filtered = filter === "all" ? TIMELINE : TIMELINE.filter(e => e.cat === filter);
  const years = [...new Set(filtered.map(e => e.year))];
  const toggle = id => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div style={{ paddingTop:28 }}>
      <SectionHead>◷ THE FULL PICTURE — 1953 TO NOW</SectionHead>
      <div style={{ fontSize:12, color:"#666", marginBottom:20, lineHeight:1.8 }}>
        Every turning point that led to where we are today. Click any event to expand.
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:28 }}>
        {Object.entries(TIMELINE_CATS).map(([k,v]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            cursor:"pointer", border:"none", fontFamily:"'Share Tech Mono',monospace",
            fontSize:11, letterSpacing:2, padding:"7px 16px",
            background: filter===k ? v.color+"22" : "#0d0d0d",
            color: filter===k ? v.color : "#555",
            outline: filter===k ? `1px solid ${v.color}55` : "1px solid #1a1a1a",
          }}>{v.icon} {v.label}</button>
        ))}
        <span style={{ marginLeft:"auto", fontSize:10, color:"#444", alignSelf:"center" }}>{filtered.length} EVENTS</span>
      </div>

      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute", left:52, top:0, bottom:0, width:1, background:"linear-gradient(to bottom,#1a1a1a,#2a2a2a 50%,#1a1a1a)", zIndex:0 }} />
        {years.map(year => {
          const evs = filtered.filter(e => e.year === year);
          return (
            <div key={year} style={{ marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", marginBottom:12 }}>
                <div style={{ width:106, textAlign:"right", paddingRight:24, fontFamily:"'Oswald',sans-serif", fontSize:22, color:"#fff", fontWeight:700, letterSpacing:2 }}>{year}</div>
                <div style={{ width:14, height:14, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #333", flexShrink:0, zIndex:1 }} />
              </div>
              {evs.map((ev, i) => {
                const cfg = TIMELINE_CATS[ev.cat];
                const sevColor = ev.severity==="CRITICAL" ? "#ff3300" : ev.severity==="HIGH" ? "#ff6600" : "#ffcc00";
                const isOpen = expanded[`${year}-${i}`];
                return (
                  <div key={i} style={{ display:"flex", marginBottom:10 }}>
                    <div style={{ width:106, flexShrink:0 }} />
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:14, flexShrink:0, zIndex:1 }}>
                      <div style={{ marginTop:16, width:10, height:10, borderRadius:"50%", background:cfg.color, boxShadow:`0 0 8px ${cfg.color}88`, flexShrink:0 }} />
                    </div>
                    <div style={{ flex:1, marginLeft:16, background:"#0d0d0d", border:`1px solid ${isOpen?cfg.color+"44":"#1a1a1a"}`, borderLeft:`3px solid ${sevColor}` }}>
                      <div onClick={() => toggle(`${year}-${i}`)} style={{ cursor:"pointer", padding:"14px 18px", display:"flex", alignItems:"flex-start", gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7, flexWrap:"wrap" }}>
                            <span style={{ fontSize:10, color:"#555" }}>{ev.date}</span>
                            <span style={{ fontSize:10, color:cfg.color }}>{cfg.icon} {cfg.label.toUpperCase()}</span>
                            {ev.severity==="CRITICAL" && <span style={{ fontSize:10, color:sevColor, fontWeight:"bold" }}>★ CRITICAL</span>}
                          </div>
                          <div style={{ fontSize:14, color:"#fff", fontWeight:"bold", lineHeight:1.4, marginBottom:8 }}>{ev.title}</div>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            {ev.countries.map((c,ci) => <span key={ci} style={{ fontSize:9, color:"#888", padding:"2px 8px", background:"#141414", border:"1px solid #222" }}>{c}</span>)}
                          </div>
                        </div>
                        <span style={{ color:"#444", fontSize:11, flexShrink:0, marginTop:2, transform:isOpen?"rotate(90deg)":"none", display:"inline-block", transition:"transform 0.2s" }}>▶</span>
                      </div>
                      {isOpen && <div style={{ padding:"0 18px 18px", borderTop:"1px solid #1a1a1a", paddingTop:14, fontSize:13, color:"#b8c8b8", lineHeight:1.9 }}>{ev.summary}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        <div style={{ display:"flex", alignItems:"center", marginTop:8 }}>
          <div style={{ width:106, textAlign:"right", paddingRight:24, fontSize:10, color:"#ff3300", letterSpacing:3 }}>NOW</div>
          <div style={{ width:14, height:14, borderRadius:"50%", background:"#ff3300", boxShadow:"0 0 12px #ff330088", flexShrink:0 }} />
          <div style={{ marginLeft:16, fontSize:11, color:"#ff3300", letterSpacing:2 }}>YOU ARE HERE</div>
        </div>
      </div>
    </div>
  );
}

// ── Alliances Tab ─────────────────────────────────────────────────────────────
function AlliancesTab({ alliances }) {
  const [filter, setFilter] = useState("all");
  if (!alliances?.length) return <div style={{ paddingTop:60, textAlign:"center", color:"#444", fontSize:12, letterSpacing:3 }}>RUN A SCAN TO LOAD ALLIANCE DATA</div>;

  const grouped = {
    US_COALITION: alliances.filter(a => a.side==="US_COALITION"),
    IRAN_AXIS:    alliances.filter(a => a.side==="IRAN_AXIS"),
    NEUTRAL:      alliances.filter(a => a.side==="NEUTRAL"),
    UNKNOWN:      alliances.filter(a => a.side==="UNKNOWN"),
  };
  const filtered = filter==="all" ? alliances : alliances.filter(a => a.side===filter);

  return (
    <div style={{ paddingTop:28 }}>
      <SectionHead>⚔ ALLIANCE MAP — WHO IS ON WHOSE SIDE</SectionHead>
      <div style={{ fontSize:12, color:"#666", marginBottom:20 }}>Updated every 5 minutes. If a country switches sides, it appears here immediately.</div>

      {/* Scoreboard */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", marginBottom:24 }}>
        <div style={{ background:"#00111f", border:"1px solid #3399ff33", padding:"16px 20px" }}>
          <div style={{ fontSize:10, color:"#3399ff", letterSpacing:4, marginBottom:12, fontWeight:"bold" }}>🇺🇸 US COALITION — {grouped.US_COALITION.length}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {grouped.US_COALITION.map((a,i) => <div key={i} style={{ padding:"4px 12px", background:"#003366", border:"1px solid #3399ff44", fontSize:11, color:"#7bbfff" }}>{a.country}</div>)}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"0 20px", background:"#0a0a0a", borderTop:"1px solid #1a1a1a", borderBottom:"1px solid #1a1a1a" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:22, color:"#333", letterSpacing:4 }}>VS</div>
            <div style={{ fontSize:9, color:"#333", marginTop:4, letterSpacing:2 }}>NEUTRAL: {grouped.NEUTRAL.length}</div>
          </div>
        </div>
        <div style={{ background:"#1a0400", border:"1px solid #ff330033", padding:"16px 20px" }}>
          <div style={{ fontSize:10, color:"#ff5533", letterSpacing:4, marginBottom:12, fontWeight:"bold" }}>🇮🇷 IRAN AXIS — {grouped.IRAN_AXIS.length}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {grouped.IRAN_AXIS.map((a,i) => <div key={i} style={{ padding:"4px 12px", background:"#330a00", border:"1px solid #ff330044", fontSize:11, color:"#ff8866" }}>{a.country}</div>)}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {["all","US_COALITION","IRAN_AXIS","NEUTRAL","UNKNOWN"].map(s => {
          const cfg = s==="all" ? { color:"#aaa", label:"All" } : SIDE_CONFIG[s];
          const count = s==="all" ? alliances.length : (grouped[s]?.length||0);
          return (
            <button key={s} onClick={() => setFilter(s)} style={{
              cursor:"pointer", border:"none", fontFamily:"'Share Tech Mono',monospace",
              fontSize:10, letterSpacing:2, padding:"7px 14px",
              background: filter===s ? (SIDE_CONFIG[s]?.bg||"#1a1a1a") : "#0d0d0d",
              color: filter===s ? cfg.color : "#555",
              outline: filter===s ? `1px solid ${cfg.color}55` : "1px solid #1a1a1a",
            }}>{s==="all" ? "◎ ALL" : SIDE_CONFIG[s].icon+" "+SIDE_CONFIG[s].label} ({count})</button>
          );
        })}
      </div>

      {/* Cards */}
      {filter === "all" ? (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
          {/* US COALITION — LEFT */}
          <div>
            <div style={{ fontSize:10, color:"#3399ff", letterSpacing:3, fontWeight:"bold", marginBottom:10, paddingBottom:6, borderBottom:"1px solid #3399ff33" }}>🇺🇸 US COALITION</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {grouped.US_COALITION.map((a,i) => {
                const cfg = SIDE_CONFIG.US_COALITION;
                const sc = STATUS_COLORS[a.status]||"#888";
                return (
                  <div key={i} style={{ padding:"14px 16px", background:"#0d0d0d", border:`1px solid ${cfg.color}22`, borderLeft:`4px solid ${cfg.color}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:16 }}>{cfg.icon}</span>
                        <div>
                          <div style={{ fontSize:13, color:"#fff", fontWeight:"bold" }}>{a.country}</div>
                          <div style={{ fontSize:9, color:cfg.color, letterSpacing:2, marginTop:2 }}>{cfg.label}</div>
                        </div>
                      </div>
                      <span style={{ fontSize:9, color:sc, letterSpacing:1, fontWeight:"bold", padding:"2px 8px", border:`1px solid ${sc}44`, background:`${sc}11` }}>{a.status}</span>
                    </div>
                    {a.role && <div style={{ fontSize:10, color:"#666", marginBottom:4 }}>ROLE: <span style={{ color:"#999" }}>{a.role}</span></div>}
                    {a.note && <div style={{ fontSize:11, color:"#b0b8b0", lineHeight:1.7 }}>{a.note}</div>}
                  </div>
                );
              })}
            </div>
          </div>
          {/* NEUTRAL — MIDDLE */}
          <div>
            <div style={{ fontSize:10, color:"#888", letterSpacing:3, fontWeight:"bold", marginBottom:10, paddingBottom:6, borderBottom:"1px solid #33333388" }}>⚪ NEUTRAL / UNKNOWN</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[...grouped.NEUTRAL, ...grouped.UNKNOWN].map((a,i) => {
                const cfg = SIDE_CONFIG[a.side]||SIDE_CONFIG.UNKNOWN;
                const sc = STATUS_COLORS[a.status]||"#888";
                return (
                  <div key={i} style={{ padding:"14px 16px", background:"#0d0d0d", border:`1px solid ${cfg.color}22`, borderLeft:`4px solid ${cfg.color}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:16 }}>{cfg.icon}</span>
                        <div>
                          <div style={{ fontSize:13, color:"#fff", fontWeight:"bold" }}>{a.country}</div>
                          <div style={{ fontSize:9, color:cfg.color, letterSpacing:2, marginTop:2 }}>{cfg.label}</div>
                        </div>
                      </div>
                      <span style={{ fontSize:9, color:sc, letterSpacing:1, fontWeight:"bold", padding:"2px 8px", border:`1px solid ${sc}44`, background:`${sc}11` }}>{a.status}</span>
                    </div>
                    {a.role && <div style={{ fontSize:10, color:"#666", marginBottom:4 }}>ROLE: <span style={{ color:"#999" }}>{a.role}</span></div>}
                    {a.note && <div style={{ fontSize:11, color:"#b0b8b0", lineHeight:1.7 }}>{a.note}</div>}
                  </div>
                );
              })}
            </div>
          </div>
          {/* IRAN AXIS — RIGHT */}
          <div>
            <div style={{ fontSize:10, color:"#ff5533", letterSpacing:3, fontWeight:"bold", marginBottom:10, paddingBottom:6, borderBottom:"1px solid #ff330033" }}>🇮🇷 IRAN AXIS</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {grouped.IRAN_AXIS.map((a,i) => {
                const cfg = SIDE_CONFIG.IRAN_AXIS;
                const sc = STATUS_COLORS[a.status]||"#888";
                return (
                  <div key={i} style={{ padding:"14px 16px", background:"#0d0d0d", border:`1px solid ${cfg.color}22`, borderLeft:`4px solid ${cfg.color}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:16 }}>{cfg.icon}</span>
                        <div>
                          <div style={{ fontSize:13, color:"#fff", fontWeight:"bold" }}>{a.country}</div>
                          <div style={{ fontSize:9, color:cfg.color, letterSpacing:2, marginTop:2 }}>{cfg.label}</div>
                        </div>
                      </div>
                      <span style={{ fontSize:9, color:sc, letterSpacing:1, fontWeight:"bold", padding:"2px 8px", border:`1px solid ${sc}44`, background:`${sc}11` }}>{a.status}</span>
                    </div>
                    {a.role && <div style={{ fontSize:10, color:"#666", marginBottom:4 }}>ROLE: <span style={{ color:"#999" }}>{a.role}</span></div>}
                    {a.note && <div style={{ fontSize:11, color:"#b0b8b0", lineHeight:1.7 }}>{a.note}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {filtered.map((a,i) => {
            const cfg = SIDE_CONFIG[a.side]||SIDE_CONFIG.UNKNOWN;
            const sc = STATUS_COLORS[a.status]||"#888";
            return (
              <div key={i} style={{ padding:"16px 20px", background:"#0d0d0d", border:`1px solid ${cfg.color}22`, borderLeft:`4px solid ${cfg.color}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:18 }}>{cfg.icon}</span>
                    <div>
                      <div style={{ fontSize:14, color:"#fff", fontWeight:"bold" }}>{a.country}</div>
                      <div style={{ fontSize:9, color:cfg.color, letterSpacing:2, marginTop:2 }}>{cfg.label}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:9, color:sc, letterSpacing:1, fontWeight:"bold", padding:"2px 8px", border:`1px solid ${sc}44`, background:`${sc}11` }}>{a.status}</span>
                </div>
                {a.role && <div style={{ fontSize:10, color:"#666", marginBottom:6 }}>ROLE: <span style={{ color:"#999" }}>{a.role}</span></div>}
                {a.note && <div style={{ fontSize:12, color:"#b0b8b0", lineHeight:1.7 }}>{a.note}</div>}
              </div>
            );
          })}
        </div>
      )}

      {alliances.some(a => a.status==="SHIFTING") && (
        <div style={{ marginTop:20, padding:"12px 18px", background:"#1a0a22", border:"1px solid #cc44ff44", display:"flex", gap:12 }}>
          <span style={{ color:"#cc44ff", fontSize:16 }}>⚠</span>
          <div>
            <div style={{ fontSize:10, color:"#cc44ff", letterSpacing:3, marginBottom:6, fontWeight:"bold" }}>ALLIANCE SHIFTS DETECTED</div>
            <div style={{ fontSize:12, color:"#cc88ff", lineHeight:1.7 }}>
              {alliances.filter(a => a.status==="SHIFTING").map(a => a.country).join(", ")} — alignment in flux.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────


// ── CALIFORNIA THREAT METER ───────────────────────────────────────────────────
function CAThreatMeter({ score, onClick }) {
  // score: 1-10
  const s = score || 0;
  const getColor = (n) => {
    if (n <= 3) return "#00dd66";
    if (n <= 5) return "#ffcc00";
    if (n <= 7) return "#ff8800";
    if (n <= 9) return "#ff4400";
    return "#ff0000";
  };
  const getLabel = (n) => {
    if (!n) return "NO DATA";
    if (n <= 2) return "MINIMAL";
    if (n <= 4) return "ELEVATED";
    if (n <= 6) return "HIGH";
    if (n <= 8) return "SEVERE";
    return "CRITICAL";
  };
  const color = getColor(s);
  const pulseStyle = s >= 8 ? { animation:"pulse 0.6s infinite" } : {};

  return (
    <button onClick={onClick} style={{
      cursor:"pointer", border:"none", padding:"6px 14px",
      display:"flex", alignItems:"center", gap:10,
      outline:`1px solid ${s ? color+"55" : "#1a1a1a"}`,
      background: s ? color+"11" : "#080808",
      transition:"all 0.3s",
    }} title="Click for California threat details">
      {/* Pip row */}
      <div style={{ display:"flex", gap:3, alignItems:"center" }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <div key={n} style={{
            width: n === s ? 10 : 7,
            height: n === s ? 18 : 14,
            borderRadius:2,
            background: n <= s ? getColor(n) : "#1c1c1c",
            boxShadow: n === s && s > 0 ? `0 0 8px ${getColor(n)}` : "none",
            transition:"all 0.3s",
            ...( n === s && s >= 8 ? pulseStyle : {}),
          }} />
        ))}
      </div>
      {/* Label */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", minWidth:80 }}>
        <div style={{ fontSize:9, color:"#666", letterSpacing:2, lineHeight:1 }}>🇺🇸 CA THREAT</div>
        <div style={{ fontSize:11, color: s ? color : "#444", fontWeight:"bold", letterSpacing:1, marginTop:2 }}>
          {s ? `${s}/10 ${getLabel(s)}` : "SCAN TO ACTIVATE"}
        </div>
      </div>
    </button>
  );
}


// ── MIDDLE EAST SVG MAP ───────────────────────────────────────────────────────
// Simplified country paths in a custom coordinate space (viewBox 0 0 800 600)
const ME_COUNTRIES = [
  { id:"Turkey",       path:"M 120,60 L 280,55 L 310,75 L 290,95 L 260,100 L 230,90 L 200,100 L 170,95 L 140,100 L 110,85 Z",           cx:210, cy:78  },
  { id:"Syria",        path:"M 260,100 L 310,95 L 320,120 L 300,140 L 270,145 L 250,130 L 245,110 Z",                                    cx:283, cy:123 },
  { id:"Lebanon",      path:"M 250,130 L 265,128 L 268,148 L 252,150 Z",                                                                  cx:259, cy:139 },
  { id:"Israel",       path:"M 248,150 L 262,148 L 265,168 L 255,185 L 245,170 L 242,158 Z",                                              cx:254, cy:165 },
  { id:"Gaza",         path:"M 242,170 L 250,168 L 249,180 L 241,180 Z",                                                                  cx:246, cy:174 },
  { id:"Jordan",       path:"M 262,148 L 290,145 L 295,175 L 285,200 L 260,200 L 250,185 L 255,168 Z",                                    cx:273, cy:174 },
  { id:"Iraq",         path:"M 310,95 L 370,90 L 390,110 L 395,160 L 375,190 L 340,195 L 300,175 L 295,150 L 320,140 L 310,120 Z",        cx:348, cy:143 },
  { id:"Iran",         path:"M 370,60 L 470,55 L 510,80 L 520,120 L 510,160 L 480,185 L 440,190 L 400,180 L 390,155 L 395,120 L 390,100 L 370,90 Z", cx:445, cy:123 },
  { id:"Kuwait",       path:"M 370,185 L 390,180 L 395,200 L 375,205 Z",                                                                  cx:382, cy:193 },
  { id:"Saudi Arabia", path:"M 260,200 L 290,195 L 340,195 L 375,205 L 390,200 L 420,240 L 430,310 L 380,360 L 320,370 L 270,340 L 245,290 L 250,240 Z", cx:340, cy:280 },
  { id:"Yemen",        path:"M 320,370 L 380,360 L 430,310 L 450,330 L 440,380 L 390,420 L 320,410 L 295,390 Z",                          cx:375, cy:385 },
  { id:"Oman",         path:"M 430,240 L 480,220 L 530,240 L 545,290 L 510,340 L 460,360 L 440,330 L 430,310 Z",                          cx:487, cy:290 },
  { id:"UAE",          path:"M 430,220 L 470,210 L 480,230 L 450,240 L 430,240 Z",                                                        cx:455, cy:228 },
  { id:"Qatar",        path:"M 400,215 L 415,210 L 418,230 L 403,232 Z",                                                                  cx:409, cy:221 },
  { id:"Bahrain",      path:"M 392,208 L 400,206 L 401,215 L 393,216 Z",                                                                  cx:396, cy:211 },
  { id:"Egypt",        path:"M 150,150 L 245,145 L 248,200 L 245,255 L 200,265 L 150,260 L 130,220 L 135,180 Z",                          cx:193, cy:207 },
  { id:"Libya",        path:"M 50,100 L 150,95 L 150,150 L 135,180 L 130,220 L 80,230 L 40,200 L 30,150 Z",                               cx:95,  cy:162 },
  { id:"Sudan",        path:"M 150,260 L 200,265 L 245,255 L 260,300 L 250,360 L 200,380 L 155,370 L 140,320 L 145,280 Z",                cx:196, cy:318 },
  { id:"Houthis/Yemen",path:"M 295,390 L 320,410 L 310,430 L 288,420 Z",                                                                  cx:303, cy:412 },
];

function MiddleEastMap({ zones }) {
  const [hovered, setHovered]   = useState(null);
  const [selected, setSelected] = useState(null);
  const [tooltip, setTooltip]   = useState({ x:0, y:0 });

  // Build a lookup from country name → zone data
  const zoneMap = {};
  if (zones) {
    zones.forEach(z => {
      // Try to match zone name/country to map country id
      ME_COUNTRIES.forEach(c => {
        if (z.name?.toLowerCase().includes(c.id.toLowerCase()) ||
            c.id.toLowerCase().includes(z.name?.toLowerCase()) ||
            z.country?.toLowerCase().includes(c.id.toLowerCase()) ||
            c.id.toLowerCase().includes(z.country?.toLowerCase())) {
          zoneMap[c.id] = z;
        }
      });
    });
  }

  const getCountryColor = (id) => {
    const z = zoneMap[id];
    if (!z) return "#1a1a1a";
    return { DANGER:"#ff3300", CAUTION:"#ff8800", WATCH:"#ffcc00", SAFE:"#00dd66" }[z.status] || "#1a1a1a";
  };

  const getCountryOpacity = (id) => {
    if (hovered === id || selected === id) return 0.85;
    return zoneMap[id] ? 0.45 : 0.2;
  };

  const handleClick = (country, e) => {
    const svg = e.currentTarget.closest("svg");
    const rect = svg.getBoundingClientRect();
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setSelected(selected === country.id ? null : country.id);
  };

  const selectedZone = selected ? zoneMap[selected] : null;
  const selectedCountry = selected ? ME_COUNTRIES.find(c => c.id === selected) : null;

  return (
    <div style={{ position:"relative" }}>
      <SectionHead>🗺 MIDDLE EAST THREAT MAP — CLICK ANY COUNTRY</SectionHead>
      <div style={{ fontSize:11, color:"#555", marginBottom:16, letterSpacing:2 }}>
        Colored by threat level from live scan. Click a country for details.
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:20, marginBottom:16, flexWrap:"wrap" }}>
        {Object.entries({ DANGER:"#ff3300", CAUTION:"#ff8800", WATCH:"#ffcc00", SAFE:"#00dd66" }).map(([s,c]) => (
          <div key={s} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:12, height:12, background:c, opacity:0.7 }} />
            <span style={{ fontSize:10, color:"#888", letterSpacing:2 }}>{s}</span>
          </div>
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:12, height:12, background:"#1a1a1a", border:"1px solid #333" }} />
          <span style={{ fontSize:10, color:"#555", letterSpacing:2 }}>NO DATA</span>
        </div>
      </div>

      <div style={{ position:"relative", background:"#080808", border:"1px solid #1a1a1a", overflow:"hidden" }}>
        <svg viewBox="0 0 800 500" width="100%" style={{ display:"block" }}>
          {/* Background ocean */}
          <rect x="0" y="0" width="800" height="500" fill="#050d14" />
          {/* Grid lines */}
          {[100,200,300,400,500,600,700].map(x => <line key={x} x1={x} y1="0" x2={x} y2="500" stroke="#0a1a22" strokeWidth="0.5"/>)}
          {[100,200,300,400].map(y => <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#0a1a22" strokeWidth="0.5"/>)}

          {/* Countries */}
          {ME_COUNTRIES.map(country => {
            const color   = getCountryColor(country.id);
            const opacity = getCountryOpacity(country.id);
            const isActive = zoneMap[country.id];
            const isSelected = selected === country.id;
            return (
              <g key={country.id}
                onClick={e => handleClick(country, e)}
                onMouseEnter={() => setHovered(country.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor:"pointer" }}
              >
                <path
                  d={country.path}
                  fill={color}
                  fillOpacity={opacity}
                  stroke={isSelected ? "#fff" : isActive ? color : "#333"}
                  strokeWidth={isSelected ? 2 : isActive ? 1 : 0.5}
                  strokeOpacity={isSelected ? 1 : 0.6}
                />
                {/* Glow for active */}
                {isActive && (
                  <path d={country.path} fill="none" stroke={color} strokeWidth="3" strokeOpacity="0.15" />
                )}
                {/* Country label */}
                <text
                  x={country.cx} y={country.cy}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={country.id.length > 8 ? "7" : "8"}
                  fill={isActive ? "#fff" : "#555"}
                  fillOpacity={hovered === country.id ? 1 : 0.8}
                  fontFamily="Share Tech Mono, monospace"
                  style={{ pointerEvents:"none", userSelect:"none" }}
                >
                  {country.id === "Saudi Arabia" ? "SAUDI" : country.id === "Houthis/Yemen" ? "HOUTHIS" : country.id.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Active event pulse dots */}
          {ME_COUNTRIES.filter(c => zoneMap[c.id]?.status === "DANGER").map(c => (
            <circle key={c.id+"pulse"} cx={c.cx} cy={c.cy-14} r="3" fill="#ff3300">
              <animate attributeName="r" values="3;7;3" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          ))}
        </svg>

        {/* Selected country popup */}
        {selected && (
          <div style={{
            position:"absolute",
            left: tooltip.x > 500 ? "auto" : tooltip.x + 10,
            right: tooltip.x > 500 ? 10 : "auto",
            top: Math.min(tooltip.y + 10, 320),
            width:260, background:"#0d0d0d",
            border:`1px solid ${getCountryColor(selected)}66`,
            borderLeft:`4px solid ${getCountryColor(selected)}`,
            padding:"14px 16px", zIndex:10,
            boxShadow:`0 0 24px ${getCountryColor(selected)}22`,
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:"#fff" }}>{selected}</div>
              <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:14 }}>✕</button>
            </div>
            {selectedZone ? (
              <>
                <div style={{ fontSize:10, color:getCountryColor(selected), letterSpacing:2, marginBottom:8, fontWeight:"bold" }}>
                  ● {selectedZone.status}
                </div>
                <div style={{ fontSize:12, color:"#b0b8b0", lineHeight:1.8 }}>{selectedZone.reason}</div>
              </>
            ) : (
              <div style={{ fontSize:12, color:"#555", lineHeight:1.8 }}>No active threat data for this country in current scan.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── HOMELAND TAB ──────────────────────────────────────────────────────────────
const THREAT_BG = { CRITICAL:"#1a0400", HIGH:"#1a0a00", ELEVATED:"#1a1400", MODERATE:"#0f0f0f", LOW:"#030f05" };
const SOURCE_COLORS = { Iran:"#ff3300", China:"#ff6600", Russia:"#cc44ff", Domestic:"#ffcc00", Unknown:"#888" };

function HomelandTab({ homeland, threatLevel }) {
  if (!homeland) return (
    <div style={{ paddingTop:60, textAlign:"center", color:"#444", fontSize:12, letterSpacing:3 }}>
      RUN A SCAN TO LOAD HOMELAND THREAT DATA
    </div>
  );

  const tlColor = (THREAT_CONFIG[homeland.threat_level]||THREAT_CONFIG.MODERATE).color;
  const tlBg    = (THREAT_CONFIG[homeland.threat_level]||THREAT_CONFIG.MODERATE).dim;

  return (
    <div style={{ paddingTop:28 }}>
      <SectionHead>🇺🇸 US HOMELAND THREAT ASSESSMENT — LIVE INTELLIGENCE</SectionHead>

      {/* Big threat level banner */}
      <div style={{ padding:"20px 28px", background:tlBg, border:`1px solid ${tlColor}66`, borderLeft:`6px solid ${tlColor}`, marginBottom:24, display:"flex", alignItems:"center", gap:24 }}>
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:32, color:tlColor, fontWeight:700, letterSpacing:4 }}>{homeland.threat_level}</div>
          <div style={{ fontSize:9, color:tlColor, letterSpacing:3, marginTop:4 }}>HOMELAND THREAT</div>
        </div>
        <div style={{ flex:1, fontSize:14, color:"#e0e8e0", lineHeight:1.85, borderLeft:`1px solid ${tlColor}33`, paddingLeft:24 }}>
          {homeland.summary}
        </div>
      </div>

      {/* FBI / DHS Alerts */}
      {homeland.fbi_alerts?.length > 0 && (
        <div style={{ marginBottom:24, padding:"16px 20px", background:"#0f0808", border:"1px solid #ff330044" }}>
          <div style={{ fontSize:10, color:"#ff4400", letterSpacing:4, fontWeight:"bold", marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ animation:"pulse 1s infinite", display:"inline-block" }}>🔴</span> ACTIVE FBI / DHS ALERTS
          </div>
          {homeland.fbi_alerts.map((alert, i) => (
            <div key={i} style={{ display:"flex", gap:14, padding:"10px 0", borderBottom:"1px solid #1a0a0a" }}>
              <span style={{ color:"#ff4400", flexShrink:0, fontSize:12, marginTop:2 }}>▶</span>
              <span style={{ fontSize:13, color:"#ffcccc", lineHeight:1.75 }}>{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* California Specific */}
      {homeland.california_specific && (
        <div style={{ marginBottom:24 }}>
          <SectionHead>📍 CALIFORNIA — SPECIFIC THREAT PICTURE</SectionHead>
          <div style={{ padding:"16px 20px", background:"#0a0d0a", border:"1px solid #336633", borderLeft:"4px solid #66aa66", fontSize:14, color:"#c8d8c8", lineHeight:1.9, marginBottom:12 }}>
            {homeland.california_specific}
          </div>
          {/* NorCal / SoCal split */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {homeland.northern_california && (() => {
              const c = (THREAT_CONFIG[homeland.northern_california.threat_level]||THREAT_CONFIG.MODERATE).color;
              return (
                <div style={{ padding:"16px 20px", background:"#0d0d0d", border:`1px solid ${c}33`, borderTop:`3px solid ${c}` }}>
                  <div style={{ fontSize:10, color:c, letterSpacing:3, marginBottom:8, fontWeight:"bold" }}>🔺 NORTHERN CALIFORNIA — {homeland.northern_california.threat_level}</div>
                  {homeland.northern_california.cities?.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                      {homeland.northern_california.cities.map((city,i) => (
                        <span key={i} style={{ fontSize:10, color:"#ffcc88", padding:"2px 10px", background:"#1a1200", border:"1px solid #33220033" }}>📍 {city}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize:12, color:"#b0b8b0", lineHeight:1.8 }}>{homeland.northern_california.detail}</div>
                </div>
              );
            })()}
            {homeland.southern_california && (() => {
              const c = (THREAT_CONFIG[homeland.southern_california.threat_level]||THREAT_CONFIG.MODERATE).color;
              return (
                <div style={{ padding:"16px 20px", background:"#0d0d0d", border:`1px solid ${c}33`, borderTop:`3px solid ${c}` }}>
                  <div style={{ fontSize:10, color:c, letterSpacing:3, marginBottom:8, fontWeight:"bold" }}>🔻 SOUTHERN CALIFORNIA — {homeland.southern_california.threat_level}</div>
                  {homeland.southern_california.cities?.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                      {homeland.southern_california.cities.map((city,i) => (
                        <span key={i} style={{ fontSize:10, color:"#ffcc88", padding:"2px 10px", background:"#1a1200", border:"1px solid #33220033" }}>📍 {city}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize:12, color:"#b0b8b0", lineHeight:1.8 }}>{homeland.southern_california.detail}</div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Target cards */}
      {homeland.targets?.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <SectionHead>🎯 IDENTIFIED US TARGETS — {homeland.targets.length} ACTIVE</SectionHead>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[...homeland.targets].sort((a,b) => ({HIGH:0,MEDIUM:1,LOW:2}[a.likelihood]||1) - ({HIGH:0,MEDIUM:1,LOW:2}[b.likelihood]||1))
              .map((t, i) => {
                const lColor = {HIGH:"#ff3300",MEDIUM:"#ff8800",LOW:"#888"}[t.likelihood]||"#888";
                const sColor = SOURCE_COLORS[t.source]||"#888";
                return (
                  <div key={i} style={{ padding:"16px 20px", background:"#0d0d0d", border:`1px solid ${lColor}22`, borderLeft:`4px solid ${lColor}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div style={{ fontSize:15, color:"#fff", fontWeight:"bold", flex:1, paddingRight:12 }}>{t.location}</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                        <span style={{ fontSize:9, color:lColor, fontWeight:"bold", padding:"2px 8px", border:`1px solid ${lColor}44`, background:`${lColor}11` }}>{t.likelihood}</span>
                        <span style={{ fontSize:9, color:sColor, padding:"2px 8px", border:`1px solid ${sColor}33` }}>{t.source}</span>
                      </div>
                    </div>
                    <div style={{ fontSize:10, color:"#777", letterSpacing:1, marginBottom:8 }}>
                      TYPE: <span style={{ color:"#999" }}>{t.type?.toUpperCase()}</span>
                      {t.threat && <span style={{ marginLeft:16 }}>THREAT: <span style={{ color:"#999" }}>{t.threat}</span></span>}
                    </div>
                    {t.detail && <div style={{ fontSize:12, color:"#b0b8b0", lineHeight:1.75 }}>{t.detail}</div>}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Watchlist */}
      {homeland.watchlist?.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <SectionHead>👁 LOCATIONS UNDER ELEVATED MONITORING</SectionHead>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {homeland.watchlist.map((loc, i) => (
              <div key={i} style={{ padding:"8px 18px", background:"#0f0a00", border:"1px solid #ffaa0033", fontSize:12, color:"#ffcc88", letterSpacing:1 }}>
                📍 {loc}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended actions */}
      {homeland.recommended_actions?.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <SectionHead>✅ WHAT CIVILIANS SHOULD KNOW</SectionHead>
          <div style={{ padding:"16px 20px", background:"#030f05", border:"1px solid #00cc4433" }}>
            {homeland.recommended_actions.map((action, i) => (
              <div key={i} style={{ display:"flex", gap:14, padding:"8px 0", borderBottom:i < homeland.recommended_actions.length-1 ? "1px solid #0a1a0a" : "none" }}>
                <span style={{ color:"#00cc55", flexShrink:0, fontSize:12, marginTop:2 }}>✓</span>
                <span style={{ fontSize:13, color:"#ccffdd", lineHeight:1.75 }}>{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize:10, color:"#444", letterSpacing:2, marginTop:20, paddingTop:16, borderTop:"1px solid #141414" }}>
        SOURCE: Open-source intelligence aggregated from FBI alerts, DHS advisories, and public news. Not classified. Auto-refreshes every 5 minutes.
      </div>
    </div>
  );
}

export default function KonfliktApp() {
  const [data, setData]           = useState(null);
  const [phase1, setPhase1]       = useState(null);   // fast snapshot
  const [loading, setLoading]     = useState(false);
  const [phase, setPhase]         = useState("");      // "fast" | "deep" | ""
  const [error, setError]         = useState(null);
  const [tab, setTab]             = useState("timeline");
  const [scanNum, setScanNum]     = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);
  const timerRef     = useRef(null);
  const countdownRef = useRef(null);

  const runScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    clearInterval(countdownRef.current);

    // ── Phase 1: instant snapshot (no web search, ~2-3 sec) ──
    setPhase("fast");
    try {
      const quick = await callAPI(PHASE1_SYSTEM, false);
      setPhase1(quick);
      // Merge into data immediately so screen shows something
      setData(prev => prev ? { ...prev, ...quick } : quick);
      if (tab === "timeline") setTab("live");
    } catch(e) {
      // Phase 1 failed — non-fatal, continue to phase 2
    }

    // ── Phase 2: full web-search briefing (~25-30 sec) ──
    setPhase("deep");
    try {
      const full = await callAPI(PHASE2_SYSTEM, true);
      setData(full);          // replace with full data — keeps screen populated throughout
      setPhase1(null);
      setScanNum(n => n + 1);
      setLastUpdate(new Date());
      setTab(t => t === "timeline" ? "live" : t); // switch to live only if on timeline

      // Start countdown
      setCountdown(AUTO_REFRESH_SECONDS);
      countdownRef.current = setInterval(() => {
        setCountdown(c => { if (c <= 1) { clearInterval(countdownRef.current); return 0; } return c - 1; });
      }, 1000);
    } catch(e) {
      setError(e.message);
    }

    setPhase("");
    setLoading(false);
  }, [tab]);

  // Auto-refresh
  useEffect(() => {
    if (scanNum === 0) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runScan(), AUTO_REFRESH_SECONDS * 1000);
    return () => clearTimeout(timerRef.current);
  }, [scanNum, runScan]);

  useEffect(() => () => { clearInterval(countdownRef.current); clearTimeout(timerRef.current); }, []);

  const tcfg = THREAT_CONFIG[data?.threat_level] || THREAT_CONFIG.MODERATE;
  const fmtCountdown = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  const TABS = [
    { id:"timeline",  label:"◷  TIMELINE",    always:true  },
    { id:"map",       label:"🗺  MAP",         always:false },
    { id:"live",      label:"⚡  LIVE BRIEF",  always:false },
    { id:"events",    label:"◉  EVENTS",      always:false },
    { id:"homeland",  label:"🇺🇸  HOMELAND",   always:false },
    { id:"alliances", label:"⚔  ALLIANCES",   always:false },
    { id:"zones",     label:"◎  ZONES",       always:false },
    { id:"threats",   label:"⚠  THREATS",     always:false },
    { id:"predict",   label:"◈  PREDICT",     always:false },
    { id:"context",   label:"◷  CONTEXT",     always:false },
  ].filter(t => t.always || data);

  // What to show in the loading bar
  const statusMsg = phase==="fast" ? "⚡ GETTING BREAKING INTEL..." : phase==="deep" ? "◈ SEARCHING LIVE SOURCES FOR FULL BRIEFING..." : "";

  return (
    <div style={{ minHeight:"100vh", background:"#080808", color:"#e0e8e0", fontFamily:"'Share Tech Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Oswald:wght@400;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#222; }
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fu    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sweep { 0%{left:-40%} 100%{left:110%} }
        .fu   { animation: fu 0.4s ease both; }
        .card { background:#0f0f0f; border:1px solid #202020; padding:18px 22px; margin-bottom:10px; }
        .tab-btn { background:none; border:none; cursor:pointer; font-family:'Share Tech Mono',monospace; font-size:11px; letter-spacing:2px; padding:11px 16px; transition:color 0.2s; }
        .tab-btn:hover { color:#fff; }
        details > summary { list-style:none; cursor:pointer; }
        details > summary::-webkit-details-marker { display:none; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ position:"sticky", top:0, zIndex:100, background:"#060606", borderBottom:"1px solid #1a1a1a" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 24px", position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", gap:18 }}>
            <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:22, letterSpacing:7, color:"#fff", fontWeight:700 }}>KONFLIKT</span>
            <span style={{ fontSize:10, color:"#444", letterSpacing:4 }}>LIVE INTEL</span>
            {data && !loading && <span style={{ fontSize:10, color:"#00cc55", letterSpacing:2 }}>● LIVE</span>}
            {loading && <span style={{ fontSize:10, color:"#ffaa00", letterSpacing:2, animation:"pulse 0.8s infinite" }}>◈ {phase==="fast"?"CONNECTING...":"UPDATING..."}</span>}
          </div>
          {/* CA Threat Meter — center */}
          <div style={{ position:"absolute", left:"50%", transform:"translateX(-50%)" }}>
            <CAThreatMeter score={data?.homeland?.california_score} onClick={() => setTab("homeland")} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            {data && !loading && countdown > 0 && <span style={{ fontSize:10, color:"#555", letterSpacing:2 }}>REFRESH IN {fmtCountdown(countdown)}</span>}
            {data && <div style={{ padding:"6px 16px", background:tcfg.dim, border:`1px solid ${tcfg.color}66`, fontSize:11, color:tcfg.color, letterSpacing:3, fontWeight:"bold" }}>⚡ {data.threat_level}</div>}
            <button onClick={runScan} disabled={loading} style={{
              cursor:loading?"default":"pointer", border:"none",
              fontFamily:"'Share Tech Mono',monospace", letterSpacing:2, padding:"10px 22px", fontSize:11,
              background:loading?"#0a0a0a":"#071a08",
              color:loading?"#444":"#00ff55",
              outline:`1px solid ${loading?"#181818":"#00ff5544"}`,
            }}>
              {loading ? <span style={{ animation:"pulse 0.6s infinite" }}>◈ SCANNING...</span> : `◈ ${scanNum===0?"INITIALIZE SCAN":"REFRESH NOW"}`}
            </button>
          </div>
        </div>

        {/* Status bar — shows during scan */}
        {statusMsg && (
          <div onClick={() => data && setTab("threats")} style={{ padding:"5px 24px", background:"#060606", borderTop:"1px solid #111", fontSize:9, color:"#ffaa00", letterSpacing:3, position:"relative", overflow:"hidden", cursor: data ? "pointer" : "default" }}>
            {statusMsg} {data && <span style={{color:"#ffaa0066"}}>— CLICK TO VIEW THREATS</span>}
            <div style={{ position:"absolute", top:0, left:0, bottom:0, width:"30%", background:"linear-gradient(90deg,transparent,#ffaa0010,transparent)", animation:"sweep 1.5s infinite" }} />
          </div>
        )}

        {data && !loading && <CountdownBar seconds={countdown} total={AUTO_REFRESH_SECONDS} />}

        {data?.headline && (
          <div style={{ padding:"8px 24px", background:tcfg.dim, borderTop:`1px solid ${tcfg.color}33`, fontSize:12, color:"#fff", letterSpacing:1, display:"flex", gap:16, alignItems:"center" }}>
            <span style={{ fontSize:10, letterSpacing:4, color:tcfg.color, flexShrink:0, fontWeight:"bold" }}>BREAKING</span>
            {data.headline}
          </div>
        )}

        {lastUpdate && (
          <div style={{ padding:"4px 24px", background:"#050505", borderTop:"1px solid #111", fontSize:10, color:"#555", letterSpacing:2 }}>
            LAST FULL UPDATE: {lastUpdate.toLocaleTimeString()} · AUTO-REFRESHES EVERY 5 MIN
          </div>
        )}

        <div style={{ display:"flex", borderTop:"1px solid #141414", background:"#070707" }}>
          {TABS.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)} style={{
              color: tab===t.id ? "#fff" : "#666",
              borderBottom: tab===t.id ? "2px solid #00ff55" : "2px solid transparent",
              fontWeight: tab===t.id ? "bold" : "normal",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px 80px" }}>

        {/* Timeline always works */}
        {tab==="timeline" && <TimelineTab />}

        {/* No data + not loading: idle prompt */}
        {tab!=="timeline" && !data && !loading && !error && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"72vh", gap:32, textAlign:"center" }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:40, letterSpacing:10, color:"#fff" }}>KONFLIKT</div>
            <div style={{ fontSize:11, color:"#444", letterSpacing:5 }}>REAL-TIME CONFLICT INTELLIGENCE · MIDDLE EAST / IRAN</div>
            <div style={{ fontSize:12, color:"#333", lineHeight:2.2 }}>Browse the Timeline tab for full history — or initialize a scan for live intel.</div>
            <button onClick={runScan} style={{ cursor:"pointer", border:"none", fontFamily:"'Share Tech Mono',monospace", letterSpacing:4, padding:"16px 52px", background:"#071a08", color:"#00ff55", outline:"1px solid #00ff5544", fontSize:13 }}>◈ INITIALIZE SCAN</button>
          </div>
        )}

        {/* Initial loading with no data yet */}
        {tab!=="timeline" && !data && loading && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:20 }}>
            <div style={{ width:44, height:44, border:"2px solid #1a1a1a", borderTop:"2px solid #00ff55", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
            <div style={{ fontSize:12, color:"#777", letterSpacing:4 }}>{phase==="fast" ? "GETTING BREAKING INTEL..." : "SEARCHING LIVE SOURCES..."}</div>
            <div style={{ fontSize:11, color:"#444" }}>Critical facts appear first · Full briefing builds in ~25 sec</div>
          </div>
        )}

        {/* Error */}
        {error && !loading && tab!=="timeline" && (
          <div style={{ marginTop:40, padding:24, background:"#100404", border:"1px solid #ff220033" }}>
            <div style={{ fontSize:12, color:"#ff6666", letterSpacing:3, marginBottom:10 }}>⚠ FEED ERROR — DEBUG INFO:</div>
            <div style={{ fontSize:11, color:"#aa5555", lineHeight:1.8, wordBreak:"break-all", fontFamily:"monospace" }}>{error}</div>
            <button onClick={runScan} style={{ marginTop:16, cursor:"pointer", border:"1px solid #ff333333", fontFamily:"'Share Tech Mono',monospace", letterSpacing:3, padding:"9px 22px", background:"#180505", color:"#ff6666", fontSize:11 }}>↺ RETRY</button>
          </div>
        )}

        {/* MAP TAB */}
        {data && tab==="map" && (
          <div className="fu" style={{ paddingTop:28 }}>
            <MiddleEastMap zones={data.zones} />
          </div>
        )}

        {/* ── LIVE TAB ── */}
        {data && tab==="live" && (
          <div className="fu" style={{ paddingTop:28 }}>
            {loading && <div style={{ padding:"10px 16px", background:"#0a0a06", border:"1px solid #ffaa0022", marginBottom:20, fontSize:10, color:"#ffaa00", letterSpacing:3, animation:"pulse 1s infinite" }}>◈ REFRESHING INTEL IN BACKGROUND — CURRENT DATA SHOWN BELOW</div>}

            {/* ── LAST HOUR — top priority block ── */}
            <div style={{ marginBottom:28 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:tcfg.color, boxShadow:`0 0 10px ${tcfg.color}`, animation:"pulse 0.8s infinite" }} />
                <span style={{ fontSize:11, color:tcfg.color, letterSpacing:5, fontWeight:"bold" }}>LAST 60 MINUTES — WHAT YOU NEED TO KNOW</span>
                <div style={{ flex:1, height:1, background:`linear-gradient(to right, ${tcfg.color}44, transparent)` }} />
              </div>

              {/* Urgent facts from last hour */}
              <div style={{ background:"#0d0d0d", border:`1px solid ${tcfg.color}33`, borderLeft:`4px solid ${tcfg.color}`, marginBottom:12 }}>
                {(data.last_hour || data.breaking || []).map((fact, i) => (
                  <div key={i} style={{
                    display:"flex", gap:14, padding:"14px 18px",
                    borderBottom: i < (data.last_hour||data.breaking||[]).length-1 ? "1px solid #141414" : "none",
                    background: i===0 ? `${tcfg.color}08` : "transparent",
                  }}>
                    <span style={{ color: i===0 ? tcfg.color : "#555", fontSize:i===0?14:12, flexShrink:0, marginTop:2, fontWeight:"bold" }}>{i===0?"▶":"›"}</span>
                    <span style={{ fontSize: i===0?15:13, color: i===0?"#ffffff":"#c0c8c0", lineHeight:1.75, fontWeight:i===0?"bold":"normal" }}>{fact}</span>
                  </div>
                ))}
              </div>

              {/* Why it matters */}
              {data.why_it_matters && (
                <div style={{ padding:"12px 16px", background:"#0a0d14", border:"1px solid #3333aa44", borderLeft:"3px solid #6666cc", fontSize:13, color:"#aaaaee", lineHeight:1.8, fontStyle:"italic" }}>
                  💡 {data.why_it_matters}
                </div>
              )}
            </div>

            {/* ── Danger / Action cards ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:28 }}>
              {data.immediate_danger && (
                <div style={{ padding:"16px 20px", background:"#110404", border:`1px solid ${tcfg.color}44`, display:"flex", gap:14 }}>
                  <span style={{ color:"#ff4400", fontSize:20, flexShrink:0 }}>⚠</span>
                  <div>
                    <div style={{ fontSize:10, color:"#ff6644", letterSpacing:3, marginBottom:6, fontWeight:"bold" }}>IMMEDIATE DANGER</div>
                    <div style={{ fontSize:13, color:"#ffcccc", lineHeight:1.75 }}>{data.immediate_danger}</div>
                  </div>
                </div>
              )}
              {data.safe_direction && (
                <div style={{ padding:"16px 20px", background:"#030f05", border:"1px solid #00cc4455", display:"flex", gap:14 }}>
                  <span style={{ color:"#00dd55", fontSize:20, flexShrink:0 }}>✓</span>
                  <div>
                    <div style={{ fontSize:10, color:"#00cc55", letterSpacing:3, marginBottom:6, fontWeight:"bold" }}>RECOMMENDED ACTION</div>
                    <div style={{ fontSize:13, color:"#ccffdd", lineHeight:1.75 }}>{data.safe_direction}</div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Full narrative ── */}
            {data.narrative && (
              <>
                <SectionHead>◉ FULL SITUATION — LAST 48 HOURS → NOW → NEXT 24H</SectionHead>
                {data.narrative.split("\n").filter(p=>p.trim()).map((para,i) => (
                  <p key={i} style={{ fontSize:14, color:i===0?"#e8e8e8":"#c0c8c0", lineHeight:1.95, marginBottom:18, paddingLeft:18, borderLeft:`3px solid ${i===0?tcfg.color:i===1?"#ff8800":i===2?"#aaaaff":"#336633"}` }}>{para}</p>
                ))}
              </>
            )}

            {/* ── Top prediction ── */}
            {data.predictions?.[0] && (
              <div className="card" style={{ marginTop:10, borderLeft:"3px solid #7777ff" }}>
                <div style={{ fontSize:10, color:"#8888cc", letterSpacing:3, marginBottom:10, fontWeight:"bold" }}>◈ MOST LIKELY NEXT EVENT</div>
                <div style={{ fontSize:15, color:"#fff", marginBottom:4 }}>{data.predictions[0].scenario}</div>
                <ProbBar value={data.predictions[0].probability} trend={data.predictions[0].trend} />
                <div style={{ fontSize:12, color:"#9999aa", marginTop:12, lineHeight:1.75 }}>{data.predictions[0].reasoning}</div>
              </div>
            )}
          </div>
        )}

        {/* EVENTS */}
        {data && tab==="events" && (
          <div className="fu" style={{ paddingTop:28 }}>
            <SectionHead>⚡ EVENT LOG — {data.events?.length||0} CONFIRMED EVENTS FROM LIVE SCAN</SectionHead>
            {(!data.events || data.events.length === 0) && (
              <div style={{ padding:"40px 24px", textAlign:"center", color:"#444", fontSize:12, letterSpacing:3, border:"1px solid #1a1a1a" }}>
                NO EVENTS LOADED — HIT REFRESH NOW TO PULL LATEST NEWS
              </div>
            )}
            {(data.events||[]).map((ev,i) => {
              const sevColor = SEV_COLORS[ev.severity] || "#555";
              return (
                <details key={i} style={{ marginBottom:8 }}>
                  <summary style={{ padding:"15px 18px", background:"#0d0d0d", border:`1px solid ${sevColor}22`, borderLeft:`4px solid ${sevColor}`, display:"flex", alignItems:"center", gap:14, listStyle:"none" }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>{CAT_ICONS[ev.category]||"📌"}</span>
                    <span style={{ flex:1, fontSize:13, color:"#fff", lineHeight:1.4 }}>{ev.title}</span>
                    <span style={{ fontSize:10, color:"#666", marginRight:8, flexShrink:0 }}>{ev.timestamp}</span>
                    <span style={{ padding:"3px 10px", fontSize:9, color:sevColor, border:`1px solid ${sevColor}44`, fontWeight:"bold", flexShrink:0, letterSpacing:1 }}>{ev.severity}</span>
                    <span style={{ color:"#444", fontSize:10, flexShrink:0 }}>▶</span>
                  </summary>
                  <div style={{ padding:"14px 18px", background:"#090909", border:`1px solid ${sevColor}11`, borderTop:"none", fontSize:13, color:"#b0b8b0", lineHeight:1.85 }}>{ev.description}</div>
                </details>
              );
            })}
          </div>
        )}

        {/* HOMELAND */}
        {tab==="homeland" && (
          <div className="fu">
            <HomelandTab homeland={data?.homeland} threatLevel={data?.threat_level} />
          </div>
        )}

        {/* ALLIANCES */}
        {tab==="alliances" && <div className="fu"><AlliancesTab alliances={data?.alliances} /></div>}

        {/* ZONES */}
        {data && tab==="zones" && (
          <div className="fu" style={{ paddingTop:28 }}>
            <SectionHead>◎ ZONE STATUS — {data.zones?.length||0} LOCATIONS</SectionHead>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[...(data.zones||[])].sort((a,b)=>({DANGER:0,CAUTION:1,WATCH:2,SAFE:3}[a.status]||0)-({DANGER:0,CAUTION:1,WATCH:2,SAFE:3}[b.status]||0))
                .map((z,i) => (
                  <div key={i} style={{ padding:"20px 22px", background:"#0d0d0d", border:`1px solid ${ZONE_COLORS[z.status]||"#333"}22`, borderTop:`4px solid ${ZONE_COLORS[z.status]||"#333"}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                      <div>
                        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:17, color:"#fff" }}>{z.name}</div>
                        <div style={{ fontSize:10, color:"#777", marginTop:2 }}>{z.country}</div>
                      </div>
                      <span style={{ padding:"4px 12px", fontSize:10, letterSpacing:2, fontWeight:"bold", alignSelf:"flex-start", color:ZONE_COLORS[z.status], border:`1px solid ${ZONE_COLORS[z.status]||"#333"}66`, background:`${ZONE_COLORS[z.status]||"#333"}15` }}>{z.status}</span>
                    </div>
                    <div style={{ fontSize:12, color:"#aaa", lineHeight:1.75 }}>{z.reason}</div>
                  </div>
                ))}
            </div>
            <div style={{ display:"flex", gap:24, marginTop:20, paddingTop:16, borderTop:"1px solid #141414" }}>
              {Object.entries(ZONE_COLORS).map(([s,c]) => (
                <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:10, height:10, background:c, borderRadius:2 }} />
                  <span style={{ fontSize:10, color:"#888", letterSpacing:2 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* THREATS */}
        {data && tab==="threats" && (
          <div className="fu" style={{ paddingTop:28 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <SectionHead>⚠ ACTIVE & CONFIRMED THREATS — {data.threats?.length||0} IDENTIFIED</SectionHead>
            </div>
            <div style={{ padding:"10px 16px", background:"#0f0a00", border:"1px solid #ff880022", marginBottom:20, fontSize:11, color:"#888", lineHeight:1.8 }}>
              Confirmed = intelligence confirms threat is real and active. Imminent = assessed as likely to occur within 24-48h.
            </div>
            {(!data.threats || data.threats.length === 0) && (
              <div style={{ padding:"40px 24px", textAlign:"center", color:"#444", fontSize:12, letterSpacing:3, border:"1px solid #1a1a1a" }}>
                NO THREAT DATA — HIT REFRESH NOW TO PULL LATEST INTEL
              </div>
            )}
            {[...(data.threats||[])].sort((a,b)=>({HIGH:0,MEDIUM:1,LOW:2}[a.likelihood]||1)-({HIGH:0,MEDIUM:1,LOW:2}[b.likelihood]||1))
              .map((t,i) => {
                const lc = {HIGH:"#ff3300",MEDIUM:"#ff8800",LOW:"#888"}[t.likelihood]||"#888";
                const statusColor = t.status==="ACTIVE"?"#ff3300":t.status==="ONGOING"?"#ff6600":"#ffaa00";
                const confirmed = t.confirmed !== false;
                return (
                  <div key={i} className="card" style={{ borderLeft:`4px solid ${lc}`, marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div style={{ flex:1, paddingRight:12 }}>
                        <div style={{ fontSize:15, color:"#fff", fontWeight:"bold", marginBottom:4 }}>🎯 {t.target}</div>
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                          {t.type && <span style={{ fontSize:9, color:"#888", padding:"2px 8px", border:"1px solid #222", letterSpacing:1 }}>{t.type?.toUpperCase()}</span>}
                          {t.source && <span style={{ fontSize:9, color:"#cc6600", padding:"2px 8px", border:"1px solid #33220022", background:"#1a0e00" }}>FROM: {t.source}</span>}
                          <span style={{ fontSize:9, color: confirmed?"#ff4400":"#ffaa00", padding:"2px 8px", border:`1px solid ${confirmed?"#ff440033":"#ffaa0033"}`, fontWeight:"bold" }}>
                            {confirmed ? "✓ CONFIRMED" : "⚠ ASSESSED"}
                          </span>
                          {t.status && <span style={{ fontSize:9, color:statusColor, padding:"2px 8px", border:`1px solid ${statusColor}33`, fontWeight:"bold", animation:t.status==="ACTIVE"?"pulse 1s infinite":"none" }}>{t.status}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize:11, color:lc, fontWeight:"bold", padding:"4px 12px", border:`1px solid ${lc}44`, background:`${lc}11`, flexShrink:0 }}>{t.likelihood}</span>
                    </div>
                    <div style={{ fontSize:13, color:"#c0c8c0", lineHeight:1.8 }}>{t.description}</div>
                  </div>
                );
              })}
          </div>
        )}

        {/* PREDICTIONS */}
        {data && tab==="predict" && (
          <div className="fu" style={{ paddingTop:28 }}>
            <SectionHead>◈ THREAT PREDICTIONS — RANKED BY DAMAGE POTENTIAL</SectionHead>
            <div style={{ padding:"10px 16px", background:"#0c0a14", border:"1px solid #3333aa33", marginBottom:20, fontSize:11, color:"#888", lineHeight:1.9 }}>
              Scenarios ranked by likelihood AND damage potential. 🇺🇸 = directly targets US or US interests. Auto-updates every 5 min.
            </div>
            {(!data.predictions || data.predictions.length === 0) && (
              <div style={{ padding:"40px 24px", textAlign:"center", color:"#444", fontSize:12, letterSpacing:3, border:"1px solid #1a1a1a" }}>
                NO PREDICTION DATA — HIT REFRESH NOW
              </div>
            )}
            {[...(data.predictions||[])].sort((a,b)=>{
              const dmgOrder = {CATASTROPHIC:0,SEVERE:1,HIGH:2,MODERATE:3};
              const dmgA = dmgOrder[a.damage_level]??2;
              const dmgB = dmgOrder[b.damage_level]??2;
              return (dmgA - dmgB) || (b.probability - a.probability);
            }).map((p,i) => {
              const dmgColor = {CATASTROPHIC:"#ff0000",SEVERE:"#ff3300",HIGH:"#ff8800",MODERATE:"#ffcc00"}[p.damage_level]||"#8888cc";
              const probColor = p.probability > 70 ? "#ff3300" : p.probability > 40 ? "#ff8800" : "#00cc55";
              return (
                <div key={i} className="card" style={{ borderLeft:`3px solid ${dmgColor}`, marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:"#fff", flex:1, paddingRight:16, lineHeight:1.3 }}>
                      {p.targets_us && <span style={{ marginRight:8 }}>🇺🇸</span>}{p.scenario}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end", flexShrink:0 }}>
                      <span style={{ fontSize:9, color:dmgColor, padding:"2px 8px", border:`1px solid ${dmgColor}44`, fontWeight:"bold", letterSpacing:1 }}>{p.damage_level||"UNKNOWN"}</span>
                      <span style={{ fontSize:9, color:"#777", letterSpacing:1 }}>{p.timeframe}</span>
                    </div>
                  </div>
                  <ProbBar value={p.probability} trend={p.trend} />
                  <div style={{ fontSize:12, color:"#9999aa", lineHeight:1.8, marginTop:10 }}>{p.reasoning}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* CONTEXT */}
        {data && tab==="context" && (
          <div className="fu" style={{ paddingTop:28 }}>
            {data.background && <><SectionHead>◷ HISTORICAL BACKGROUND</SectionHead><p style={{ fontSize:14, color:"#c8d0c8", lineHeight:2, marginBottom:28 }}>{data.background}</p></>}
            {data.iranian_sentiment && <><SectionHead>◷ IRANIAN CIVILIAN SENTIMENT</SectionHead><p style={{ fontSize:14, color:"#c8d0c8", lineHeight:2, marginBottom:28 }}>{data.iranian_sentiment}</p></>}
            {data.key_players?.length>0 && (
              <>
                <SectionHead>◷ KEY PLAYERS</SectionHead>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {data.key_players.map((p,i) => (
                    <div key={i} className="card">
                      <div style={{ fontSize:13, color:"#fff", marginBottom:6 }}>{p.name}</div>
                      <div style={{ fontSize:11, color:"#aaa", lineHeight:1.6 }}>{p.role}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"6px 24px", background:"#040404", borderTop:"1px solid #111", display:"flex", justifyContent:"space-between", fontSize:9, color:"#444", letterSpacing:2 }}>
        <span>KONFLIKT INTEL · OPEN SOURCE INTELLIGENCE · NOT CLASSIFIED</span>
        <span>{new Date().toUTCString()}</span>
      </div>
    </div>
  );
}
