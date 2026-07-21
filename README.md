# Quantum DNA Alignment Lab

A futuristic web dashboard demonstrating quantum-accelerated DNA sequence alignment using FRQI encoding and Grover's Search Algorithm. Built for a Quantum Computing & AI Hackathon.

**Live Demo:** https://quantum-helix-lab.lovable.app

---

## ✨ Features

- Cinematic landing page with a live rotating 3D DNA helix (React Three Fiber)
- Emerald / glassmorphism aesthetic inspired by Apple, Stripe, Vercel & Linear
- Full scientific dashboard: alignment viewer, quantum circuit simulator, analytics charts
- Smooth Framer Motion animations & scroll effects
- Fully responsive, dark-themed UI powered by Tailwind CSS v4 + shadcn/ui

---

## 🧰 Tech Stack

- **Framework:** TanStack Start v1 (React 19 + Vite 7, file-based routing, SSR)
- **Styling:** Tailwind CSS v4, shadcn/ui, tw-animate-css
- **3D / Motion:** three.js, @react-three/fiber, @react-three/drei, framer-motion
- **Data Viz:** Recharts
- **Language:** TypeScript

---

## 📋 Prerequisites

Install these once on your machine:

- **Node.js** ≥ 20 — https://nodejs.org
- **Bun** ≥ 1.1 (recommended package manager) — https://bun.sh
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
  > `npm` or `pnpm` will also work — just swap the commands below.
- **Git** — https://git-scm.com

---

## 🚀 Getting Started (Localhost)

### 1. Clone the repository

```bash
git clone <YOUR_REPO_URL>
cd <YOUR_REPO_FOLDER>
```

### 2. Install dependencies

```bash
bun install
```

<details>
<summary>Using npm or pnpm instead</summary>

```bash
npm install
# or
pnpm install
```
</details>

### 3. Run the dev server

```bash
bun run dev
```

The app will start on **http://localhost:8080** (or the next available port). Open it in your browser to see the exact same dashboard as the deployed site.

### 4. Build for production

```bash
bun run build      # production build
bun run preview    # preview the production build locally
```

---

## 📜 Available Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `bun run dev`       | Start the Vite dev server (HMR)          |
| `bun run build`     | Production build                         |
| `bun run build:dev` | Development-mode build                   |
| `bun run preview`   | Preview the production build             |
| `bun run lint`      | Run ESLint                               |
| `bun run format`    | Format the codebase with Prettier        |

---

## 📁 Project Structure

```
src/
├── components/          # Landing, Dashboard, DNAHelix, BackgroundFX, ui/
├── routes/              # File-based routes (TanStack Router)
│   ├── __root.tsx       # App shell (html/head/body)
│   ├── index.tsx        # Landing page  →  /
│   └── dashboard.tsx    # Dashboard     →  /dashboard
├── hooks/
├── lib/
├── styles.css           # Tailwind v4 theme tokens
├── router.tsx
└── server.ts
```

---

## 🧪 Routes

- `/` — Cinematic landing page with 3D DNA helix
- `/dashboard` — Quantum bioinformatics dashboard

---

## 🩺 Troubleshooting

- **Port already in use** → set a different port: `PORT=3000 bun run dev`
- **Blank page / 3D helix not rendering** → ensure your browser supports WebGL2 (`chrome://gpu`)
- **Type errors after install** → delete `node_modules` and `bun.lock`, then `bun install` again
- **Node version mismatch** → run `node -v` and upgrade to Node 20+

---

## 📄 License

MIT — built with ❤️ for the Quantum Computing & AI Hackathon.
