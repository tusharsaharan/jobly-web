<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0e1411,50:183a32,100:2a9d7b&height=220&section=header&text=Jobly%20%E2%80%A2%20Web%20Studio&fontSize=50&fontColor=7ee0c5&fontAlignY=35&animation=twinkling&desc=TanStack%20Start%20%7C%20React%2019%20%7C%20Three.js%203D%20%7C%20Framer%20Motion%20%7C%20Live%20Interview%20IDE&descSize=15&descAlignY=55&descAlign=50" width="100%" alt="Jobly Web Studio Header" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&size=18&pause=1000&color=2A9D7B&center=true&vCenter=true&multiline=true&repeat=true&width=800&height=100&lines=TanStack+Start+%2B+React+19+%2B+TypeScript+%2B+Vite;React+Three+Fiber+3D+Visuals+%2B+Framer+Motion+Physics;Monaco+Editor+%2B+Yjs+CRDT+%2B+Excalidraw+Whiteboard;LiveKit+WebRTC+Conferencing+%2B+Sandboxed+Execution" alt="Typing Showcase" />
</p>

<p align="center">
  <a href="https://github.com/tusharsaharan/jobly-web"><img src="https://img.shields.io/badge/Architecture-3D%20Spatial%20%2B%20SSR-2A9D7B?style=for-the-badge&logo=threedotjs&logoColor=white&labelColor=183A32" alt="3D Architecture" /></a>
  <a href="https://github.com/tusharsaharan/jobly-web"><img src="https://img.shields.io/badge/Animation-Framer%20Motion%2012-1E7058?style=for-the-badge&logo=framer&logoColor=white&labelColor=183A32" alt="Framer Motion" /></a>
  <a href="https://github.com/tusharsaharan/jobly-web"><img src="https://img.shields.io/badge/Language-TypeScript%20Strict-2A9D7B?style=for-the-badge&logo=typescript&logoColor=white&labelColor=183A32" alt="TypeScript" /></a>
  <a href="https://github.com/tusharsaharan/jobly-web"><img src="https://img.shields.io/badge/Testing-Playwright%20E2E-183A32?style=for-the-badge&logo=playwright&logoColor=white&labelColor=0F2E22" alt="Playwright" /></a>
</p>

---

## Technical Overview

**Jobly Web** is an enterprise frontend engineering platform built with **TanStack Start**, **React 19**, and **TypeScript**. It features a real-time collaborative technical interview workspace, deterministic ATS evaluation radars, a Three.js 3D spatial visualization engine, and a LinkedIn-grade encrypted messaging hub.

```
+-------------------------------------------------------------------------------+
|                               JOBLY WEB STUDIO                                |
+-------------------------------------------------------------------------------+
|  [3D Spatial Viewport]        [Framer Motion Engine]    [TanStack Start SSR]  |
|  - Three.js / R3F Canvas     - Layout Spring Physics   - Full-Route Preload   |
|  - WebGL Spatial Mesh        - Shared Element LayoutId - Type-Safe Navigation |
+-------------------------------------------------------------------------------+
|  [Collaborative IDE]          [Enterprise Messenger]    [AI Learning Lab]     |
|  - Monaco + Yjs CRDT         - Real-Time Socket.IO     - pgvector RAG Tutor   |
|  - Sandboxed PTY Stream      - Smart Reply Clustering  - System Design Canvas |
+-------------------------------------------------------------------------------+
```

---

## 3D Spatial Visuals & Animation Architecture

Jobly Web combines **Three.js** / **React Three Fiber** and **Framer Motion** for state-of-the-art visual design:

### 1. Three.js Spatial Rendering Engine
* **React Three Fiber (R3F) & Drei**: Declarative 3D scene graphs with hardware-accelerated WebGL shaders.
* **Procedural Interactive Canvases**: Dynamic perspective particle systems, 3D talent radar rings, and ambient geometric backdrops.
* **Memory & Frame-Rate Optimization**: Offscreen canvas management, dynamic Level of Detail (LOD), and requestAnimationFrame throttling during intensive coding sessions.

### 2. Framer Motion Fluid Animation Engine
* **Shared Element Transitions**: `layoutId` physics for instant, seamless state changes across tabs, filters, and modal transitions.
* **Spring-Physics Feed Entrance**: Staggered `AnimatePresence` animations for incoming chat messages, live code checkpoint diffs, and radar metrics.
* **Micro-Interaction System**: Haptic-style scale damping (`whileHover`, `whileTap`) on all controls, buttons, and smart reply suggestions.

---

## Core System Modules

### Collaborative Technical Interview OS (`/interview/:roomKey`)
* **Monaco IDE + Yjs CRDT**: Sub-millisecond peer-to-peer code synchronization with remote cursor tracking, syntax highlighting, and multi-file project trees.
* **LiveKit WebRTC Conferencing**: Low-latency video, audio, screen sharing, and speaking level detection.
* **Excalidraw Whiteboard**: Synchronized vector whiteboard for high-level system architecture sketches.
* **Containerized Execution Panel**: Multi-language code execution with real-time stdout/stderr streaming.

### Deterministic Replay Engine (`/interview/:roomKey/replay`)
* **Line-Level Diff Morphing**: Computes deterministic line diffs between snapshot checkpoints and plays them back sequentially without per-character polling artifacts.
* **Timeline Scrubber**: Interactive timeline supporting instant seek, speed control (0.5x to 4x), and checkpoint milestones.

### Real-Time Encrypted Messenger (`/messages`)
* **Full-Viewport Workspace**: Dedicated workspace with page-scroll locking and independent stream scrolling.
* **Contextual Smart Reply Engine**: LinkedIn-style candidate and recruiter predictive responses.
* **Live Socket.IO Sync**: Real-time message reception, typing indicators, and read receipts.

### ATS Ingestion & Talent Portal (`/resume`, `/applications`)
* **Deterministic Match Scoring**: Percentage-based ATS score rings with continuous green color interpolation.
* **Category Health Breakdown**: Radar diagnostics across skills, experience, education, presentation, and keyword density.

---

## Technology Stack

| Domain | Technology | Implementation |
| :--- | :--- | :--- |
| **Framework** | TanStack Start + React 19 | Full-stack type-safe SSR and file-based routing |
| **3D Graphics** | Three.js + React Three Fiber + Drei | WebGL spatial shaders and procedural scene graphs |
| **Animation** | Framer Motion 12 | Spring physics, layout animations, and gesture tracking |
| **Code Workspace**| Monaco Editor + Yjs CRDT | Real-time multi-file collaborative IDE |
| **Whiteboard** | Excalidraw | Vector architecture canvas with collaborative syncing |
| **WebRTC Media** | LiveKit Components React | Ultra low-latency multi-party video conferencing |
| **Styling** | Tailwind CSS v4 + Vanilla Tokens | Jobly signature white-to-green palette |
| **State & Cache** | TanStack Query v5 + Context | Optimistic mutations and server-state caching |
| **Testing** | Playwright E2E | Cross-browser automated regression suites |

---

## Project Structure

```
jobly-web/
|-- src/
|   |-- components/
|   |   |-- compete/            # Competitive arena and quiz interfaces
|   |   |-- interview/
|   |   |   |-- ai/             # AI interviewer telemetry and Signal HUD
|   |   |   |-- evaluation/     # Bar Raiser scorecard forms
|   |   |   |-- ide/            # Monaco editor, file explorer, execution panel
|   |   |   |-- media/          # LiveKit WebRTC video grid and prejoin lobby
|   |   |   |-- terminal/       # Sandboxed terminal streaming interface
|   |   |   |-- timeline/       # Unified chronological interview timeline
|   |   |   +-- whiteboard/     # Excalidraw vector collaboration canvas
|   |   |-- study/              # RAG tutor, LLD/HLD sheets, Codeforces widgets
|   |   +-- ui/                 # ATS score rings, badges, modal dialogs
|   |-- routes/
|   |   |-- _app.applications.tsx   # Candidate application pipeline
|   |   |-- _app.interview.$roomKey.tsx # Main Technical Interview Room
|   |   |-- _app.interview.$roomKey.replay.tsx # Session Replay Engine
|   |   |-- _app.messages.tsx       # Full-screen Real-Time Messenger
|   |   +-- _app.learn.tsx          # AI Study Hub and Problem Sets
|   +-- styles.css                  # Custom design system tokens
+-- package.json
```

---

## Getting Started

### Prerequisites
* Node.js `>= 20.0.0`
* npm `>= 10.0.0`

### Installation & Development

```bash
# Clone repository
git clone https://github.com/tusharsaharan/jobly-web.git
cd jobly-web

# Install dependencies
npm install

# Start development server
npm run dev

# Run production build
npm run build

# Run Playwright E2E test suites
npx playwright test
```

---

## Color System & Guidelines

Jobly Web enforces a cohesive white-to-green design spectrum:

* **Backgrounds**: `#FFFFFF` (Pure White), `#FAFCFB` (Mint Mist), `#0A0A0A` (Dark Studio)
* **Light Accents**: `#E9FBF2` (Mint Soft), `#8DDCBE` (Sage Tint)
* **Primary Green**: `#2A9D7B` (Jobly Green), `#238266` (Deep Emerald)
* **Dark Surfaces**: `#1E7058` (Forest Deep), `#183A32` (Pine Base)
* **Typography**: `#2F302D` (Ink Neutral), `#71717A` (Muted Gray), `#FFFFFF` (High Contrast White)
