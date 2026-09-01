<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
<div align="center">

[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

</div>

<!-- PROJECT BANNER & LOGO -->
<div align="center">
  <br />
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0e1411,50:183a32,100:2a9d7b&height=220&section=header&text=Jobly%20%E2%80%A2%20Web%20Studio&fontSize=50&fontColor=7ee0c5&fontAlignY=35&animation=twinkling&desc=TanStack%20Start%20%7C%20React%2019%20%7C%20Three.js%203D%20%7C%20Framer%20Motion%20%7C%20Live%20IDE&descSize=15&descAlignY=55&descAlign=50" width="100%" alt="Jobly Web Studio Banner" />

  <h1 align="center">Jobly Web Studio</h1>

  <p align="center">
    Enterprise AI recruitment, deterministic ATS evaluation, 3D spatial visualization, and real-time collaborative technical interview workspace.
    <br />
    <a href="https://github.com/tusharsaharan/jobly-web"><strong>Explore the documentation »</strong></a>
    <br />
    <br />
    <a href="https://github.com/tusharsaharan/jobly-web">View Demo</a>
    &middot;
    <a href="https://github.com/tusharsaharan/jobly-web/issues">Report Bug</a>
    &middot;
    <a href="https://github.com/tusharsaharan/jobly-web/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary><strong>Table of Contents</strong></summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#3d-spatial-rendering-engine">3D Spatial Rendering Engine</a></li>
        <li><a href="#framer-motion-fluid-physics">Framer Motion Fluid Physics</a></li>
        <li><a href="#collaborative-technical-interview-os">Collaborative Technical Interview OS</a></li>
        <li><a href="#deterministic-replay-engine">Deterministic Replay Engine</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage-and-workflows">Usage and Workflows</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

---

## About The Project

**Jobly Web Studio** is the next-generation web client for the Jobly platform, engineered using **TanStack Start**, **React 19**, and **TypeScript**. It combines cutting-edge **Three.js WebGL graphics**, high-performance **Framer Motion spring animations**, a multi-file **Monaco + Yjs CRDT IDE**, **LiveKit WebRTC audio/video**, an **Excalidraw whiteboard**, and an encrypted **Socket.IO messenger**.

```
+---------------------------------------------------------------------------------------+
|                                  JOBLY WEB ARCHITECTURE                               |
+---------------------------------------------------------------------------------------+
|  [3D WebGL Layer]               [Motion Physics Layer]       [TanStack Fullstack SSR] |
|  - Three.js / React Three Fiber - Framer Motion 12 Springs   - File-Based Routing     |
|  - WebGL Spatial Shaders        - layoutId Morphing Physics  - Type-Safe Route Loader |
+---------------------------------------------------------------------------------------+
|  [Real-Time Collaborative IDE]  [Encrypted Real-Time Chat]   [AI RAG Learning Lab]    |
|  - Monaco Editor + Yjs CRDT     - Socket.IO Multi-Room Sync  - Vector Question RAG    |
|  - Containerized PTY Execution  - Contextual Smart Replies   - HLD/LLD Problem Sets   |
+---------------------------------------------------------------------------------------+
```

### 3D Spatial Rendering Engine

* **React Three Fiber (R3F) & Drei**: Declarative 3D scene graphs with hardware-accelerated WebGL shaders for spatial depth and interactive talent rings.
* **Procedural Interactive Canvases**: Dynamic perspective particle systems, 3D radar rings, and ambient geometric backdrops.
* **GPU Memory Optimization**: Offscreen canvas management, dynamic Level of Detail (LOD), and requestAnimationFrame throttling during intensive coding runs.

### Framer Motion Fluid Physics

* **Shared Element LayoutId Transitions**: Fluid morphing animations for navigation pills, conversation selections, and modal transitions.
* **Spring-Damped Message Bubbles**: Real-time staggered animations on incoming and outgoing chat messages.
* **Micro-Interactions**: Haptic scale transitions (`whileHover`, `whileTap`) across all interactive surfaces.

### Collaborative Technical Interview OS

* **Monaco IDE + Yjs CRDT**: Sub-millisecond peer-to-peer code synchronization with remote cursor tracking, syntax highlighting, and multi-file project trees.
* **LiveKit WebRTC Conferencing**: Low-latency video, audio, screen sharing, and speaking level detection.
* **Excalidraw Whiteboard**: Synchronized vector whiteboard for high-level system architecture sketches.
* **Containerized Execution Panel**: Multi-language code execution with real-time stdout/stderr streaming.

### Deterministic Replay Engine

* **Line-Level Diff Morphing**: Computes deterministic line diffs between snapshot checkpoints and plays them back sequentially without per-character polling artifacts.
* **Timeline Scrubber**: Interactive timeline supporting instant seek, speed control (0.5x to 4x), and checkpoint milestones.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

### Built With

* [![TanStack Start][TanStack-badge]][TanStack-url]
* [![React 19][React-badge]][React-url]
* [![TypeScript][TypeScript-badge]][TypeScript-url]
* [![Three.js][Threejs-badge]][Threejs-url]
* [![Framer Motion][Framer-badge]][Framer-url]
* [![Monaco Editor][Monaco-badge]][Monaco-url]
* [![Yjs CRDT][Yjs-badge]][Yjs-url]
* [![LiveKit][LiveKit-badge]][LiveKit-url]
* [![TailwindCSS][Tailwind-badge]][Tailwind-url]
* [![Vite][Vite-badge]][Vite-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Getting Started

### Prerequisites

* Node.js `>= 20.0.0`
* npm `>= 10.0.0`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tusharsaharan/jobly-web.git
   cd jobly-web
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:8080`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Usage and Workflows

### Candidate Flow
1. **Resume Ingestion**: Upload a resume PDF at `/resume` to receive instant ATS scoring and category health radar breakdown.
2. **Job Search & Matching**: Explore open positions at `/jobs` with real-time match percentages.
3. **Application Tracking**: Monitor status at `/applications` and launch technical interview rooms.
4. **Messenger**: Converse with recruiters in the full-screen real-time messenger at `/messages`.

### Recruiter Flow
1. **Role Posting**: Post engineering positions at `/post-job`.
2. **Candidate Review**: Triage applicants on `/applicants` with automated ATS fit analysis.
3. **Technical Interview Studio**: Host live sessions on `/interview/:roomKey` with Monaco IDE, LiveKit WebRTC, and Bar Raiser scorecards.
4. **Session Replay**: Review chronological timeline playback on `/interview/:roomKey/replay`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Roadmap

- [x] TanStack Start SSR & React 19 core architecture
- [x] Monaco Editor + Yjs real-time collaborative coding workspace
- [x] LiveKit WebRTC audio/video integration
- [x] Three.js WebGL spatial visualization engine
- [x] Framer Motion 12 spring animations & gesture tracking
- [x] Real-time LinkedIn-grade Smart Reply encrypted messaging
- [x] Deterministic line-level code replay engine
- [ ] Multi-region edge deployment via Cloudflare Workers
- [ ] AI-driven voice transcription copilot

See the [open issues](https://github.com/tusharsaharan/jobly-web/issues) for a full list of proposed features.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Contact

Tushar Saharan - [@tusharsaharan](https://github.com/tusharsaharan)

Project Link: [https://github.com/tusharsaharan/jobly-web](https://github.com/tusharsaharan/jobly-web)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Acknowledgments

* [TanStack Start & TanStack Router](https://tanstack.com/)
* [React Three Fiber & Three.js](https://threejs.org/)
* [Framer Motion](https://www.framer.com/motion/)
* [LiveKit WebRTC](https://livekit.io/)
* [Yjs CRDT Real-Time Framework](https://yjs.dev/)
* [Monaco Editor](https://microsoft.github.io/monaco-editor/)
* [Excalidraw](https://excalidraw.com/)
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[forks-shield]: https://img.shields.io/github/forks/tusharsaharan/jobly-web.svg?style=for-the-badge&color=2A9D7B&labelColor=183A32
[forks-url]: https://github.com/tusharsaharan/jobly-web/network/members
[stars-shield]: https://img.shields.io/github/stars/tusharsaharan/jobly-web.svg?style=for-the-badge&color=2A9D7B&labelColor=183A32
[stars-url]: https://github.com/tusharsaharan/jobly-web/stargazers
[issues-shield]: https://img.shields.io/github/issues/tusharsaharan/jobly-web.svg?style=for-the-badge&color=2A9D7B&labelColor=183A32
[issues-url]: https://github.com/tusharsaharan/jobly-web/issues
[license-shield]: https://img.shields.io/badge/License-MIT-2A9D7B.svg?style=for-the-badge&labelColor=183A32
[license-url]: https://github.com/tusharsaharan/jobly-web/blob/main/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-2A9D7B.svg?style=for-the-badge&logo=linkedin&labelColor=183A32
[linkedin-url]: https://linkedin.com/in/tushar-saharan

[TanStack-badge]: https://img.shields.io/badge/TanStack_Start-2A9D7B?style=for-the-badge&logo=reactquery&logoColor=white
[TanStack-url]: https://tanstack.com/
[React-badge]: https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[TypeScript-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Threejs-badge]: https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white
[Threejs-url]: https://threejs.org/
[Framer-badge]: https://img.shields.io/badge/Framer_Motion_12-0055FF?style=for-the-badge&logo=framer&logoColor=white
[Framer-url]: https://www.framer.com/motion/
[Monaco-badge]: https://img.shields.io/badge/Monaco_Editor-1E1E1E?style=for-the-badge&logo=visualstudiocode&logoColor=white
[Monaco-url]: https://microsoft.github.io/monaco-editor/
[Yjs-badge]: https://img.shields.io/badge/Yjs_CRDT-5A2475?style=for-the-badge&logo=yjs&logoColor=white
[Yjs-url]: https://yjs.dev/
[LiveKit-badge]: https://img.shields.io/badge/LiveKit_WebRTC-002B36?style=for-the-badge&logo=webrtc&logoColor=white
[LiveKit-url]: https://livekit.io/
[Tailwind-badge]: https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Vite-badge]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vitejs.dev/
