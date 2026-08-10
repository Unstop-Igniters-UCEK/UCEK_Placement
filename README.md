# UCEK — Unstop Igniters Club Placement Platform

A full-stack monorepo for the UCEK placement prep platform.

---

## 📁 Project Structure

```
UCEK/
├── frontend/          # React + TypeScript + Vite frontend app
│   ├── src/           # App source code (components, pages, context)
│   ├── public/        # Static assets
│   ├── index.html     # HTML entry point
│   ├── package.json   # Frontend dependencies
│   ├── vite.config.ts # Vite configuration
│   └── tsconfig*.json # TypeScript configuration
│
├── backend/           # (Coming soon) Node.js / API backend
│
├── .agents/           # AI agent skills & configuration
├── .git/              # Git repository
├── .gitignore         # Gitignore rules
├── mcp.json           # MCP server configuration (21st.dev, annnimate)
├── skills-lock.json   # Installed skills lockfile
├── PRODUCT.md         # Product specification
└── README.md          # This file
```

---

## 🚀 Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build
```

### Backend *(coming soon)*

```bash
cd backend
# setup instructions TBD
```

---

## 🛠 Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite 8 (build tool)
- Tailwind CSS v4
- Framer Motion (animations)
- Lenis (smooth scroll)
- OGL / WebGL (Grainient shader backgrounds)

**AI Agent Tooling**
- `.agents/skills/` — Custom skill definitions (ui-ux-pro-max, animate, design, etc.)
- `mcp.json` — MCP servers (21st.dev UI components, annnimate motion)

  ## contributors
  -Karthik S
  -Theertha S Nair
  -Amarnath Sujith
  -Nimish M Biju
  
