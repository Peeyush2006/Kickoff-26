# Kickoff'26 — GenAI Stadium Intelligence & Operations Platform

A zero-build, self-contained web application that leverages **Generative AI** to enhance stadium operations, decision-making, and the fan experience during the **FIFA World Cup 2026**.

---

## 🏟️ Chosen Challenge Vertical & Persona
- **Vertical**: Stadium Operations & Intelligence Platform (FIFA World Cup 2026).
- **Target Persona**:
  - **Duty Managers & Venue Staff**: Making real-time, data-driven decisions regarding crowd flow, transport, safety, and sustainability.
  - **Fans & Visitors**: Seeking multilingual wayfinding, accessibility support, and journey assistance.

---

## 🛠️ Key Features & Modules

| Module | GenAI Value & Integration |
|---|---|
| **Command Center** | AI analyzes and ranks live operational risks (entry gate bottlenecks, heat exposure, transport load) and compiles a duty-manager shift briefing on demand. |
| **AI Concierge** | A multilingual conversational assistant (supporting 8 languages) grounded in active venue state (seat zones, gate queues, concessions, and accessibility features). |
| **Wayfinding** | Interactive schematic stadium map rendering live stand occupancy + AI turn-by-turn routes (including step-free paths) adjusting dynamically to crowd conditions. |
| **Crowd Flow** | A real-time particle simulation showing gate entry throughput, queue wait times, and one-tap AI mitigation workflows to draft fan rerouting broadcasts. |
| **Transport Hub** | AI ranks transport choices based on ETA, passenger loads, and carbon footprint, generating post-match egress strategies. |
| **Accessibility** | Generates tailored step-free paths, sensory calm room maps, and volunteer assistance triggers. |
| **Sustainability** | Tracks environmental metrics (landfill diversion, renewable energy usage) and drafts actions to optimize carbon savings. |

---

## 🧠 Architectural Approach & AI Logic

### 1. Grounded Context (Retrieval-Augmented Generation / RAG)
The application compiles active venue data (`DB.GATES`, `DB.TRANSPORT`, `DB.ALERTS`, `DB.SUSTAIN`) into structured text context. This context is injected directly into prompt payloads:
- **Live Mode**: Calls the Anthropic Messages API securely from the browser using a user-provided key. System prompts enforce strict containment limits to mitigate jailbreak/prompt injection attempts.
- **Offline / Simulated Mode**: Features an intent-aware classification engine that dynamically queries the active state database. If queues alter, the simulated response updates dynamically to reflect real-world values.

### 2. Security Boundaries & Escaping
- **Content Security Policy (CSP)**: Restricts scripts, styles, connections, and font loading to verified assets. Connection policies allow calls only to the Anthropic API endpoint.
- **Input Sanitization**: Automatically strips HTML tags from user inputs in Concierge, Wayfinding, Transport, and Accessibility inputs.
- **Controller-level Escaping**: Sanitizes select fields, labels, and match chip data prior to DOM insertion to prevent injection vectors.
- **API Key Handling**: API keys are stored locally in the browser's `localStorage` and never transmitted to external servers except direct, secure SSL calls to Anthropic.

### 3. Accessibility & WCAG Compliance
- **Screen Reader Navigation**: Synthesizes the active language selection into the document root `lang` attribute to ensure proper pronunciation. Emojis are hidden with `aria-hidden="true"`, and filter controls include `aria-label` labels.
- **Visual Design**: Complies with WCAG AA standards (maintaining text contrast ratios > 4.5:1 on panel backgrounds) and features prominent `:focus-visible` focus rings.

---

## 📝 Key Assumptions Made
1. **API Key Security**: Storing keys in `localStorage` is assumed to be appropriate for a standalone, serverless demonstration platform. No backend database stores sensitive data.
2. **Deterministic Tick Rates**: The live feed simulates queue changes on a 1.5-second interval. It is assumed that actual integrations would connect to local venue sensors/IoT APIs.
3. **No Build Phase**: The architecture assumes a vanilla HTML5/CSS3/ES6 stack to guarantee portability and run instantly in any standard browser environment without pre-compilation.

---

## 🚀 How to Run and Verify

### 1. Serve Locally
Run a local HTTP server:
```bash
python -m http.server 8080
# Open http://localhost:8080
```

### 2. Run Test Suite
Execute the Jest unit tests to verify system dynamics and context building:
```bash
npm install
npm test
```
