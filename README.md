# Agentis Hub - Multi-Agent Workflow Management Dashboard

A modern React/TypeScript dashboard for orchestrating AI agent pipelines.

## Getting Started

```bash
npm install
npm run dev
```

## Features

- **Sidebar Navigation** — Collapsible navigation with real-time agent status, workflow history, and quick actions
- **Agent Status Panel** — Live-updating agent status indicators with polling
- **Workflow History** — Searchable, filterable, virtualized workflow list
- **Responsive Design** — Adapts from mobile overlay to collapsed rail to full sidebar
- **Accessible** — Full ARIA support, keyboard navigation, screen reader compatible

## Architecture

```
src/
├── components/
│   ├── layout/          # AppShell layout container
│   └── sidebar/         # Sidebar navigation feature
│       ├── __tests__/   # Unit & integration tests
│       └── ...          # Component modules
├── hooks/               # Shared custom hooks
├── styles/              # Global CSS tokens
└── test/                # Test setup
```

## Tech Stack

- **React 18** + TypeScript
- **Vite** — Build tool
- **TanStack Query** — Server state management
- **React Window** — List virtualization
- **Lucide React** — Icons
- **Vitest** + React Testing Library — Testing

## Design System

Uses the Agentis Hub dark-first brand system with CSS custom properties.
See `src/styles/tokens.css` for the full token set.

## Testing

```bash
npm test              # Run tests in watch mode
npm run test:coverage # Run with coverage report
```

## Bundle Size Budget

- Sidebar feature total: < 15KB gzipped
- Virtualization (react-window): ~3KB
- Core components: ~11KB
