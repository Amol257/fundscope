# FundScope AI Assistant — System Prompt & Setup Guide

This document specifies the "FundBot" assistant: a data-grounded chat widget that helps users navigate FundScope, understand mutual fund concepts, and get fund recommendations backed by the app's actual scoring data (not generic financial advice). It follows the same Claude API pattern already used in the Product Review Sentiment project's `ReviewBot` component.

---

## 1. Design Decisions (read before implementing)

**Grounded, not generic.** FundScope's entire pitch is the proprietary 1-100 scoring engine. A bot that talks about mutual funds in the abstract, without referencing real fund names, grades, and CAGRs from `compact-data.json`, undercuts that pitch. So the bot is given a *relevant slice* of fund data per request, injected into the system prompt, rather than just chatting from general training knowledge.

**Slice, don't dump.** Never inject the full `compact-data.json` (~2.3MB) into every request. That's slow, expensive, and mostly irrelevant per-query. Instead, do a lightweight pre-filter in your own code (category match, name match, top-N by score, etc.) based on the user's message, and inject only the relevant 5-20 funds as JSON into the system prompt.

**No financial advice framing.** This bot explains scores, surfaces funds matching stated criteria, and explains methodology and tax rules already documented elsewhere in the app. It must not present itself as a licensed advisor or tell a user "you should invest in X." Frame everything as "based on your criteria, here's what scores well" not "you should buy this."

**Deep-link everything.** Whenever the bot references a specific fund, category page, or tool, it should output a markdown link to the relevant in-app route (`/fund/[id]`, `/compare?ids=...`, `/tax`, `/sip`, `/goals`) so the frontend can render it as a clickable navigation element, not just plain text.

---

## 2. The System Prompt

This is the prompt to send as the `system` parameter on every API call. The `{{FUND_DATA_SLICE}}` and `{{PAGE_CONTEXT}}` placeholders get filled in dynamically by your backend/route handler before each request (see Section 4).

```
You are FundBot, the AI assistant embedded in FundScope, a mutual fund analytics platform for Indian investors. You help users understand mutual fund data, navigate the app, and find funds matching their stated criteria using FundScope's own proprietary scoring engine.

## What FundScope is
FundScope scores Indian mutual funds 1-100 (Grades S, A, B, C, D) based on weighted CAGR (1Y/3Y/5Y), volatility, Sharpe/Sortino ratio, and consistency. Full methodology is documented at /methodology. The platform covers fund screening, peer comparison, SIP and goal-based calculators, tax tools, and benchmark/alpha analysis.

## What you have access to
Below is a relevant slice of live fund data already filtered for this conversation. Treat this as ground truth — these are real funds, real scores, real numbers from FundScope's database as of the last data refresh. Never invent a fund name, score, CAGR, or any other figure that is not present in this data.

{{FUND_DATA_SLICE}}

## Current page context
{{PAGE_CONTEXT}}

## How to behave
- Answer using only the fund data provided above. If a user asks about a fund not in this slice, say you don't have that fund loaded right now and suggest they search it on /screener, rather than guessing at its numbers.
- When recommending funds, always state which underlying numbers drove the suggestion (e.g. "this fund has a 5Y CAGR of 14.2% and an S grade, with volatility on the lower end for its category") rather than just naming it.
- You are not a licensed financial advisor and must not phrase responses as personal investment advice ("you should buy this"). Phrase it as data surfacing ("based on your stated risk tolerance and horizon, these funds rank highest on FundScope's scoring model").
- For tax questions, only state rules consistent with FY 2025-26 law as documented on /tax: equity STCG 20% (under 12 months), equity LTCG 12.5% above ₹1.25L exemption (12+ months), debt funds bought on or after April 2023 taxed at slab rate regardless of holding period. Do not state outdated indexation-based debt fund rules as current.
- When you reference a specific fund, format it as a markdown link in the form [Fund Name](/fund/FUND_ID) using the id field from the data above.
- When relevant, point users to the right in-app tool instead of doing the calculation yourself in prose: SIP projections → link to /sip, goal-based planning → link to /goals, tax estimates → link to /tax, side-by-side comparison of 2+ funds → link to /compare?ids=ID1,ID2.
- Keep responses concise. This is a chat widget, not a report. Default to 3-6 sentences unless the user asks for a detailed breakdown or a list of multiple funds.
- If a user asks something with no connection to mutual funds, investing, or the FundScope app itself, politely redirect rather than answering as a general-purpose assistant.
- Never fabricate certainty about future returns. Past CAGR is historical performance, not a guarantee, and you should say so when a user seems to be treating a score or past return as a promise.
```

---

## 3. Example Request/Response Shape

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: buildSystemPrompt(fundDataSlice, pageContext), // see Section 4
    messages: conversationHistory // full back-and-forth, since the API is stateless
  })
});

const data = await response.json();
const reply = data.content
  .filter(block => block.type === "text")
  .map(block => block.text)
  .join("\n");
```

Remember: the Claude API has no memory between calls. Every request must include the full conversation history plus the freshly rebuilt system prompt (the fund data slice should be recomputed per-turn since the user's intent may shift mid-conversation, e.g. from "show me large cap funds" to "now compare those with small cap").

---

## 4. Step-by-Step Setup

### Step 1 — Build the fund data slicer
Before you can fill `{{FUND_DATA_SLICE}}`, write a small function that takes the user's latest message and returns a relevant subset of `compact-data.json`. Keep this cheap and rule-based, not another AI call:

- If the message names a category ("small cap", "ELSS", "debt fund") → filter `compact-data.json` by category/sub-category, take the top 10-15 by score.
- If the message names a specific fund → fuzzy-match against fund names, return that fund plus 2-3 peers in the same category for context.
- If the message is generic ("help me pick a fund", "what's a good fund for me") → fall back to the global top 10-15 by score across all categories.
- Always strip out `nav_history` and any other heavy fields — you only need id, name, category, sub-category, grade, score, CAGR (1Y/3Y/5Y), volatility, expense ratio, alpha, beta, benchmark name. This keeps the injected JSON small and fast.

```javascript
function getFundSlice(userMessage, allFunds) {
  // your filtering logic here, returns an array of ~10-15 lightweight fund objects
}
```

### Step 2 — Build the page context string
Pass in which page the user is currently on, so the bot can tailor tone (e.g. if they're on `/tax`, lean into tax framing; if on `/sip`, lean into SIP framing).

```javascript
function buildPageContext(currentRoute) {
  const contextMap = {
    "/tax": "User is currently on the Tax Corner page, looking at LTCG/STCG calculators and ELSS funds.",
    "/sip": "User is currently on the SIP/Wealth Projector page.",
    "/screener": "User is currently browsing the Fund Screener.",
    // add the rest of your routes
  };
  return contextMap[currentRoute] || "User is on the FundScope homepage.";
}
```

### Step 3 — Assemble the system prompt
Combine the static prompt text from Section 2 with the dynamic slice and context:

```javascript
function buildSystemPrompt(fundDataSlice, pageContext) {
  return STATIC_SYSTEM_PROMPT
    .replace("{{FUND_DATA_SLICE}}", JSON.stringify(fundDataSlice, null, 2))
    .replace("{{PAGE_CONTEXT}}", pageContext);
}
```

### Step 4 — Create the API route (backend, not client-side)
This must run server-side (Next.js Route Handler) so your API key never reaches the browser.

`app/api/fundbot/route.ts`:
```javascript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, currentRoute } = await req.json();
  const lastUserMessage = messages[messages.length - 1]?.content || "";

  const allFunds = await loadCompactData(); // your existing data loader
  const fundSlice = getFundSlice(lastUserMessage, allFunds);
  const pageContext = buildPageContext(currentRoute);
  const systemPrompt = buildSystemPrompt(fundSlice, pageContext);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages
    })
  });

  const data = await response.json();
  const reply = data.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  return NextResponse.json({ reply });
}
```

### Step 5 — Set the environment variable
Add your Anthropic API key to `.env.local` (never commit this file):
```
ANTHROPIC_API_KEY=sk-ant-...
```
Get a key from the Claude Console if you don't already have one from the ReviewBot project; the same key works across both.

### Step 6 — Build the chat widget component
This follows the same shape as your existing `ReviewBot` React component. Key pieces:

- Floating chat button, fixed position, consistent with the dark-mode/serif-italic aesthetic already established across the app.
- Local state for message history (`useState`), POSTing to `/api/fundbot` on each send.
- Pass `window.location.pathname` (or your router's current path) as `currentRoute` in the request body so the backend can build page context.
- Render fund links from the bot's response as actual Next.js `<Link>` components rather than raw markdown, so clicking a fund name in chat navigates to `/fund/[id]` without a full page reload. A simple regex pass over the bot's reply to detect the `[Fund Name](/fund/ID)` pattern and convert it to `<Link>` elements works well here.

```jsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FundBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  async function sendMessage() {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/fundbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, currentRoute: pathname })
    });
    const data = await res.json();
    setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    setLoading(false);
  }

  // render chat UI, parse [text](/fund/id) links into <Link> components
}
```

### Step 7 — Test grounding before polishing the UI
Before investing time in animations/styling, verify the bot actually stays grounded:
- Ask it about a fund that doesn't exist in your dataset and confirm it says it doesn't have that fund loaded, rather than inventing numbers.
- Ask a tax question and confirm it states the current FY 2025-26 rates (20% equity STCG, 12.5% LTCG above ₹1.25L, debt at slab rate) rather than older indexation-based rules.
- Ask something unrelated to investing ("write me a poem") and confirm it redirects rather than complying as a general assistant.

### Step 8 — Add it to the layout
Mount the `FundBot` component once in your root layout (`app/layout.tsx`) so it persists as a floating widget across every page, rather than re-instantiating per route.

### Step 9 — Rate-limit and cost-control (optional but recommended before shipping)
Since this is a portfolio project, you likely don't want unbounded API spend if shared publicly. Consider a simple per-session message cap (e.g. 20 messages) enforced client-side, or a basic IP-based rate limit on the route handler, before deploying to a public URL.

---

## 5. Where this slots into PAGES.md

This bot is a cross-cutting feature, not a single page, so it doesn't get its own row in the page directory. Add a short addendum to PAGES.md under a new "Cross-Page Components" heading alongside the Navbar, documenting that FundBot is mounted globally in `app/layout.tsx`, calls `app/api/fundbot/route.ts` server-side, and draws its data exclusively from `compact-data.json` (same as the rest of the lightweight pages), so it never triggers a full `data.json` load.
