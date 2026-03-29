# GreenKube — Documentation Website

[![Built with Astro Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

This is the source for the **[greenkube.cloud](https://greenkube.cloud)** documentation website, built with [Astro Starlight](https://starlight.astro.build).

## 🌿 About GreenKube

GreenKube is an open-source **FinGreenOps platform** for Kubernetes. It measures, reports (CSRD/ESRS E1), and optimises carbon emissions and cloud costs — giving engineering teams full visibility into the environmental and financial impact of their infrastructure.

## 🚀 Project Structure

```
.
├── public/                  # Static assets (favicon, logo)
├── src/
│   ├── assets/              # Images used in docs
│   ├── components/          # Custom Astro components (Header, Footer, diagrams)
│   ├── content/
│   │   └── docs/            # All documentation pages (.md / .mdx)
│   ├── styles/
│   │   └── custom.css       # GreenKube brand overrides
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## 🧞 Commands

All commands are run from this directory (`greenkube-website/`):

| Command             | Action                                        |
| :------------------ | :-------------------------------------------- |
| `npm install`       | Install dependencies                          |
| `npm run dev`       | Start local dev server at `localhost:4321`    |
| `npm run build`     | Build the production site to `./dist/`        |
| `npm run preview`   | Preview the production build locally          |

## ✍️ Contributing to Docs

Documentation pages live in `src/content/docs/`. Each `.md` or `.mdx` file maps directly to a URL route.

- **Getting Started** → `src/content/docs/getting-started/`
- **Features** → `src/content/docs/features/`
- **Architecture** → `src/content/docs/architecture/`
- **Guide (CLI / Dashboard)** → `src/content/docs/guide/`

Brand colours and layout overrides are in `src/styles/custom.css`.

## 🔗 Links

- Main repository: [github.com/GreenKubeCloud/GreenKube](https://github.com/GreenKubeCloud/GreenKube)
- Website: [greenkube.cloud](https://greenkube.cloud)
- Contact: [contact@greenkube.cloud](mailto:contact@greenkube.cloud)
