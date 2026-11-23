# GreenKube — Documentation Website

[![Built with Astro Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

This is the source for the **[docs.greenkube.cloud](https://docs.greenkube.cloud)** documentation website, built with [Astro Starlight](https://starlight.astro.build).

## 🌿 About GreenKube

GreenKube is an open-source **optimization loop for Kubernetes clusters run with GitOps**: it turns measured usage into rightsizing recommendations, opens one reviewable pull request for Argo CD or Flux, verifies the sync, and measures realized savings (money, CO₂e and released capacity) against a counterfactual in an append-only, keyed hash-chained ledger.

## 🚀 Project Structure

```
.
├── public/                  # Static assets (favicon, logo)
├── src/
│   ├── assets/              # Images used in docs
│   ├── components/          # Custom Astro components (Header, Footer)
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
- **Concepts** → `src/content/docs/concepts/`
- **Sources** → `src/content/docs/sources/`
- **Methodology** → `src/content/docs/methodology/`
- **Operations** → `src/content/docs/operations/`
- **Reference (Web UI, Footprint, API, CLI, Prometheus & Grafana)** → `src/content/docs/guide/`
- **Architecture** → `src/content/docs/architecture/`

Removed pages keep a redirect in `astro.config.mjs` (`redirects`).

Brand colours and layout overrides are in `src/styles/custom.css`.

## 🔗 Links

- Main repository: [github.com/GreenKubeCloud/GreenKube](https://github.com/GreenKubeCloud/GreenKube)
- Website: [greenkube.cloud](https://greenkube.cloud)
- Contact: [contact@greenkube.cloud](mailto:contact@greenkube.cloud)
