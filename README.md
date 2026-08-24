<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:161b22,100:1f6feb&height=220&section=header&text=Jobly%20%E2%80%A2%20Web%20Studio&fontSize=55&fontColor=58a6ff&fontAlignY=35&animation=twinkling&desc=TanStack%20Start%20%7C%20React%2019%20%7C%203D%20Visuals%20%7C%20Live%20Interview%20IDE&descSize=16&descAlignY=55&descAlign=50" width="100%" alt="Jobly Web Header" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&size=20&pause=1000&color=58A6FF&center=true&vCenter=true&multiline=true&repeat=true&width=800&height=100&lines=%F0%9F%8E%AF+TanStack+Start+%2B+React+19+%2B+TypeScript+%2B+Vite;%F0%9F%92%BB+Monaco+Editor+%2B+Yjs+CRDT+%2B+Excalidraw+Whiteboard;%F0%9F%93%B9+LiveKit+WebRTC+Conferencing+%2B+Interactive+Terminal;%F0%9F%94%A5+React+Three+Fiber+3D+Visuals+%E2%80%A2+E2E+Playwright+Tested" alt="Typing SVG" />
</p>

<p align="center">
  <a href="https://github.com/tusharsaharan/job-recommender-web/stargazers"><img src="https://img.shields.io/github/stars/tusharsaharan/job-recommender-web?style=for-the-badge&logo=github&color=f4dbd6&logoColor=D9E0EE&labelColor=302D41" alt="Stars" /></a>
  <a href="https://github.com/tusharsaharan/job-recommender-web/network/members"><img src="https://img.shields.io/github/forks/tusharsaharan/job-recommender-web?style=for-the-badge&logo=git&color=a6da95&logoColor=D9E0EE&labelColor=302D41" alt="Forks" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=D9E0EE&labelColor=302D41" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/E2E-Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=D9E0EE&labelColor=302D41" alt="E2E" /></a>
</p>

---

## 🧬 About

> **Jobly Web** is the modern frontend for the **Jobly Platform** — an enterprise AI recruitment, deterministic ATS scoring, and live collaborative technical interview environment. Built with **TanStack Start** and **React 19**, it integrates high-performance **3D visuals** via React Three Fiber, fluid **Framer Motion** physics, and a full-featured collaborative IDE with **Monaco Editor**, **Yjs CRDT synchronization**, **LiveKit WebRTC**, and **Excalidraw**.

---

## ⚡ Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/TanStack_Start-FF4154?style=flat-square&logo=reactquery&logoColor=white" alt="TanStack Start" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/React_Three_Fiber-000000?style=flat-square&logo=threedotjs&logoColor=white" alt="R3F" />
  <img src="https://img.shields.io/badge/Monaco_Editor-1E1E1E?style=flat-square&logo=visualstudiocode&logoColor=white" alt="Monaco" />
  <img src="https://img.shields.io/badge/Yjs_CRDT-010101?style=flat-square&logo=yjs&logoColor=white" alt="Yjs" />
  <img src="https://img.shields.io/badge/LiveKit_WebRTC-20C997?style=flat-square&logo=webrtc&logoColor=white" alt="LiveKit" />
  <img src="https://img.shields.io/badge/Excalidraw-6965DB?style=flat-square&logo=excalidraw&logoColor=white" alt="Excalidraw" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white" alt="Framer Motion" />
</p>

---

## 🏗️ Architecture & Component Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER APPLICATION                             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
   [TanStack Router (SSR)]   [React Three Fiber (3D)]   [Framer Motion Engine]
            │                          │                          │
            ▼                          ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION VIEWS                              │
│  - Candidate Portal: /resume (PDF Upload & Radar), /jobs (ATS Matching)     │
│  - Recruiter Portal: /post-job (AI Gen), /applicants (Kanban & Scoring)    │
│  - Live Studio:     /interview/:roomKey (Monaco + LiveKit + Whiteboard)     │
│  - Replay & Review:  /interview/:roomKey/replay & /feedback                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
   [TanStack Query Cache]     [Yjs CRDT WebSocket]      [LiveKit WebRTC SFU]
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       ▼
                         [Jobly API Backend Server]
```

---

## ✨ Features & Route Map

<table>
  <tr>
    <td width="50%">
      <b>🤖 AI Resume & ATS Scanner (<code>/resume</code>)</b><br />
      Drag-and-drop PDF upload with instant parsing into structured skills, experience bullets, and an interactive 7-category ATS health radar.
    </td>
    <td width="50%">
      <b>💼 Job Marketplace & Match Feed (<code>/jobs</code>)</b><br />
      Semantic job search with real-time ATS match scoring badges, salary filters, and instant application submission.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <b>💻 Live Collaborative Interview Studio (<code>/interview/:roomKey</code>)</b><br />
      Multi-pane interface with Monaco Editor (Yjs sync), LiveKit WebRTC video grid, isolated code execution runner, and Excalidraw whiteboard.
    </td>
    <td width="50%">
      <b>📊 Candidate Pipeline & Funnels (<code>/applicants</code>)</b><br />
      Recruiter candidate management with ATS score sorting, stage transitions, and instant technical interview scheduling.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <b>⏱️ Time-Travel Session Replay (<code>/interview/:roomKey/replay</code>)</b><br />
      Step-by-step playback scrubber replaying candidate keystrokes, terminal outputs, and transcript milestones.
    </td>
    <td width="50%">
      <b>📋 Multi-Criteria Scorecard (<code>/interview/:roomKey/feedback</code>)</b><br />
      Bar Raiser AI rubric evaluation with category ratings, strength summaries, and final hiring recommendations.
    </td>
  </tr>
</table>

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run Vitest unit tests
npm run test:unit

# Run Playwright end-to-end test suite
npm run test:e2e

# Build production bundle
npm run build
```

---

## 📂 Directory Layout

```
jobly-web/
├── src/
│   ├── routes/              # TanStack Start file-based routing
│   │   ├── index.tsx        # Landing page with 3D hero canvas
│   │   ├── auth.tsx         # Unified authentication portal
│   │   ├── _app.tsx         # Authenticated app shell (Nav & Sidebar)
│   │   ├── _app.dashboard.tsx
│   │   ├── _app.resume.tsx
│   │   ├── _app.jobs.tsx
│   │   ├── _app.post-job.tsx
│   │   ├── _app.applicants.tsx
│   │   ├── _app.applications.tsx
│   │   ├── _app.interviews.tsx
│   │   └── _app.interview.$roomKey.tsx
│   ├── components/
│   │   ├── interview/       # Monaco IDE, LiveKit Media, Terminal, Whiteboard, AI Copilot
│   │   ├── dashboard/       # Metric cards, ATS score rings, analytics charts
│   │   ├── fx/              # 3D canvas, particles, Hero orb
│   │   └── ui/              # Accessible shadcn/ui primitives
│   ├── hooks/               # Custom hooks for Yjs, LiveKit, Terminal, Auth
│   ├── lib/                 # API client, contracts & constants
│   └── styles.css           # Tailwind CSS v4 & custom design tokens
├── e2e/                     # Playwright E2E browser tests
├── tests/                   # Vitest unit test suite
└── package.json
```

---

## 📜 License

Distributed under the **MIT License**. Built with ❤️ by **[Tushar Saharan](https://github.com/tusharsaharan)**.
