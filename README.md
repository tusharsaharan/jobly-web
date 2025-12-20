<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:161b22,100:1f6feb&height=220&section=header&text=Jobly%20%E2%80%A2%20Web&fontSize=60&fontColor=58a6ff&fontAlignY=35&animation=twinkling&desc=AI-Powered%20Recruitment%20Frontend&descSize=18&descAlignY=55&descAlign=50" width="100%" alt="Jobly Web Header" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&size=22&pause=1000&color=58A6FF&center=true&vCenter=true&multiline=true&repeat=true&width=750&height=100&lines=%F0%9F%8E%AF+TanStack+Start+%2B+React+19+%2B+TypeScript;%F0%9F%8C%90+3D+Visuals+%E2%80%A2+AI+Workflows+%E2%80%A2+E2E+Tested;%F0%9F%94%97+Companion+to+JobMatch+API+Backend" alt="Typing SVG" />
</p>

<p align="center">
  <a href="https://github.com/tusharsaharan/job-recommender-web/stargazers"><img src="https://img.shields.io/github/stars/tusharsaharan/job-recommender-web?style=for-the-badge&logo=github&color=f4dbd6&logoColor=D9E0EE&labelColor=302D41" alt="Stars" /></a>
  <a href="https://github.com/tusharsaharan/job-recommender-web/network/members"><img src="https://img.shields.io/github/forks/tusharsaharan/job-recommender-web?style=for-the-badge&logo=git&color=a6da95&logoColor=D9E0EE&labelColor=302D41" alt="Forks" /></a>
  <a href="https://github.com/tusharsaharan/job-recommender-web/issues"><img src="https://img.shields.io/github/issues/tusharsaharan/job-recommender-web?style=for-the-badge&logo=gitbook&color=eed49f&logoColor=D9E0EE&labelColor=302D41" alt="Issues" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=D9E0EE&labelColor=302D41" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/E2E-Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=D9E0EE&labelColor=302D41" alt="E2E" /></a>
</p>

<br />

---

## 🧬 About

> **Jobly Web** is the modern, server-rendered frontend for the [**JobMatch API**](https://github.com/tusharsaharan/job-recommender-api) — an AI-powered recruitment platform. Built with **TanStack Start** and **React 19**, it features immersive **3D visuals** via React Three Fiber, fluid **Framer Motion** animations, and pixel-perfect **shadcn/ui** components. Seekers upload resumes for AI parsing, browse ATS-scored job feeds, and track applications. Recruiters generate job postings with natural language AI and manage applicant pipelines — all within a role-based, fully tested application.

<br />

## ⚡ Tech Stack

<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=react,typescript,tailwind,vite,threejs&theme=dark&perline=8" alt="Core" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TanStack_Start-FF4154?style=flat-square&logo=reactquery&logoColor=white" alt="TanStack Start" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/React_Three_Fiber-000000?style=flat-square&logo=threedotjs&logoColor=white" alt="R3F" />
  <img src="https://img.shields.io/badge/shadcn/ui-000000?style=flat-square&logo=shadcnui&logoColor=white" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/Radix_UI-161618?style=flat-square&logo=radixui&logoColor=white" alt="Radix" />
  <img src="https://img.shields.io/badge/Recharts-22B5BF?style=flat-square&logo=chart.js&logoColor=white" alt="Recharts" />
  <img src="https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat-square&logo=reacthookform&logoColor=white" alt="RHF" />
  <img src="https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
</p>

<br />

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER CLIENT                              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
   │  TanStack   │ │   React     │ │   Framer     │
   │   Router    │ │ Three Fiber │ │   Motion     │
   │  (SSR +     │ │ (3D Scenes, │ │ (Page Trans, │
   │  File-Based)│ │  Particles) │ │  Micro-Anim) │
   └──────┬──────┘ └─────────────┘ └──────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────────┐
   │              COMPONENT LAYER                     │
   │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
   │  │ shadcn/  │ │ Recharts │ │  React Hook Form │ │
   │  │ Radix UI │ │ Analytics│ │  + Zod Schemas   │ │
   │  └──────────┘ └──────────┘ └──────────────────┘ │
   └──────────────────────────┬──────────────────────┘
                              │
                              ▼
   ┌─────────────────────────────────────────────────┐
   │           TanStack Query (Data Layer)            │
   │   Mutations │ Queries │ Cache │ Optimistic UI    │
   └──────────────────────────┬──────────────────────┘
                              │
                              ▼
   ┌─────────────────────────────────────────────────┐
   │          JobMatch API (Express + Gemini)          │
   │          github.com/tusharsaharan/               │
   │            job-recommender-api                    │
   └─────────────────────────────────────────────────┘
```

<br />

---

## ✨ Key Features

<table>
  <tr>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/48/artificial-intelligence.png" width="36" alt="AI" /><br />
      <b>AI Resume Upload</b><br />
      <sub>Drag-and-drop PDF upload → real-time structured parsing via Gemini AI backend</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/48/3d-select-face.png" width="36" alt="3D" /><br />
      <b>3D Visuals</b><br />
      <sub>Interactive Three.js scenes with React Three Fiber & Drei for immersive landing pages</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/48/dashboard-layout.png" width="36" alt="Dashboard" /><br />
      <b>Analytics Dashboard</b><br />
      <sub>Recharts-powered interactive analytics with ATS scores, match breakdowns & trends</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/48/test-passed.png" width="36" alt="Tests" /><br />
      <b>Full Test Coverage</b><br />
      <sub>Vitest unit tests + Playwright E2E testing across all critical user flows</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/48/conference-call.png" width="36" alt="Roles" /><br />
      <b>Role-Based Workflows</b><br />
      <sub>Separate seeker & recruiter dashboards with protected routes and role guards</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/48/chat.png" width="36" alt="AI Chat" /><br />
      <b>AI Job Description Gen</b><br />
      <sub>Natural language chatbox for recruiters → AI auto-generates structured job postings</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/48/animation.png" width="36" alt="Animations" /><br />
      <b>Fluid Animations</b><br />
      <sub>Framer Motion page transitions, micro-interactions, and stagger-animated lists</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/48/form.png" width="36" alt="Forms" /><br />
      <b>Type-Safe Forms</b><br />
      <sub>React Hook Form + Zod schema validation for bulletproof user input handling</sub>
    </td>
  </tr>
</table>

<br />

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/tusharsaharan/job-recommender-web.git
cd job-recommender-web

# Install
npm install

# Run Development Server
npm run dev

# Run Tests
npm run test:unit       # Vitest unit tests
npm run test:e2e        # Playwright E2E tests

# Build for Production
npm run build
```

> **Note:** This frontend connects to the [**JobMatch API Backend**](https://github.com/tusharsaharan/job-recommender-api). Make sure the API server is running locally or configure the API URL in your environment.

<br />

---

## 📂 Project Structure

```
job-recommender-web/
├── src/
│   ├── components/        # Reusable UI components (shadcn/ui + custom)
│   ├── routes/            # TanStack file-based routes
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities, API client, constants
│   ├── styles/            # Global styles, Tailwind config
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── e2e/                   # Playwright E2E test specs
├── tests/                 # Vitest unit tests
├── playwright.config.ts   # Playwright configuration
├── vitest.config.ts       # Vitest configuration
├── vite.config.ts         # Vite + TanStack Start config
├── tsconfig.json          # TypeScript configuration
└── package.json
```

<br />

---

## 🔗 Related Repositories

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/tusharsaharan/job-recommender-api">
        <img src="https://img.shields.io/badge/Backend_API-JobMatch_API-58a6ff?style=for-the-badge&logo=express&logoColor=white" alt="API" />
      </a>
      <br />
      <sub>Node.js + Express + MongoDB + Google Gemini</sub>
    </td>
  </tr>
</table>

<br />

---

## 🤝 Contributing

```bash
# 1. Fork the repo
# 2. Create your feature branch
git checkout -b feature/amazing-feature

# 3. Commit your changes
git commit -m 'feat: add amazing feature'

# 4. Push & open a Pull Request
git push origin feature/amazing-feature
```

<br />

---

## 📜 License

Distributed under the **MIT License**.

<br />

---

<p align="center">
  <b>Built with ❤️ by <a href="https://github.com/tusharsaharan">Tushar Saharan</a></b>
</p>

<p align="center">
  <a href="https://github.com/tusharsaharan"><img src="https://img.shields.io/badge/GitHub-tusharsaharan-181717?style=for-the-badge&logo=github" alt="GitHub" /></a>
  <a href="https://linkedin.com/in/tusharsaharan"><img src="https://img.shields.io/badge/LinkedIn-tusharsaharan-0A66C2?style=for-the-badge&logo=linkedin" alt="LinkedIn" /></a>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:161b22,100:1f6feb&height=120&section=footer" width="100%" alt="Footer" />
</p>
