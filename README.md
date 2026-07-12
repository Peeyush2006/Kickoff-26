# Kickoff'26 — GenAI Stadium Intelligence Platform

A zero-build, self-contained web app that uses **Generative AI** to enhance
stadium operations and the fan experience for the **FIFA World Cup 2026**.

## What it does

| Module | GenAI value |
|---|---|
| **Command Center** | AI ranks live operational risks (entry, heat, transport) and writes a duty-manager shift briefing on demand. Real-time decision support. |
| **AI Concierge** | Multilingual conversational guide (8 languages) grounded in live venue data — seats, gates, food, transport, accessibility. |
| **Wayfinding** | Interactive stadium map + AI turn-by-turn routes (incl. step-free) that adapt to live crowding. |
| **Crowd Flow** | Gate-by-gate throughput, predictive congestion, and one-tap AI mitigation + multilingual fan broadcast. |
| **Transport** | AI-ranked options by time / crowd / carbon, plus a smart post-match egress plan. |
| **Accessibility** | Step-free routing, sensory/hearing/vision support, and AI-personalised assistance plans. |
| **Sustainability** | Live footprint tracking with AI action plans for the highest-impact wins. |

## Generative AI

- **Live mode** — add an Anthropic API key in **Settings & AI**. The app calls the
  Claude Messages API directly from the browser, grounded with live venue context
  (a lightweight RAG pattern). Choose Haiku / Sonnet / Opus.
- **Offline mode** — with no key, a grounded, intent-aware assistant answers from the
  domain data so every feature is fully demoable. Nothing is required to run it.

The API key is stored only in your browser's `localStorage`; requests go straight to Anthropic.

## Run it

No build step. Either open `index.html` directly, or serve it (recommended):

```bash
cd kickoff26
python -m http.server 8080
# open http://localhost:8080
```

## Tech

Vanilla HTML/CSS/JS — no framework, no dependencies, no bundler. Responsive,
dark/RTL-aware, keyboard-navigable.

> Prototype for a hackathon. Not affiliated with or endorsed by FIFA. All venue data is illustrative.
