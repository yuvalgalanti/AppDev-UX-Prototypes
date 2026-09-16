# AppDev UX Prototypes

A collection of UX prototypes for Red Hat AppDev products (RHDH, MTA, Podman Desktop, TAS, TPA, Konflux, Tekton, OpenShift Pipelines, and more), plus reusable AI agent skills. Most prototypes are hosted externally (GitLab Pages, GitHub PRs, etc.) and simply link out from the launcher; a couple — like MTA — are built and deployed directly from this repo via GitHub Pages.

**Live site:** [https://yuvalgalanti.github.io/AppDev-UX-Prototypes/](https://yuvalgalanti.github.io/AppDev-UX-Prototypes/)

## Prototypes

The launcher's cards are the source of truth for what's currently available — each product has its own registry file under `prototypes/{name}/prototypes.ts`, all combined in [`launcher/src/prototypes.ts`](launcher/src/prototypes.ts). As of now:

| Product | Prototypes | Registry |
|---------|:----------:|----------|
| RHDH (Developer Hub) | 15+ | `prototypes/rhdh/` |
| Podman Desktop | 5+ | `prototypes/podman-desktop/` |
| MTA (Konveyor) | 2 | `prototypes/mta/` (hosted here) + entry in `launcher/src/prototypes.ts` |
| AI skill | 7+ | `prototypes/appdev-ai-skills/` |
| Dev Spaces | 2 | `prototypes/dev-spaces/` |
| TAS, TPA, Konflux, Tekton, OpenShift Pipelines | 1 each | `prototypes/{tas,tpa,konflux,tekton,openshift-pipelines}/` |

Don't keep this list updated by hand — check the live site or `launcher/src/prototypes.ts` for the current, exact set.

## Repo Structure

```
├── launcher/               # Landing page (React + PatternFly) — cards linking to every prototype
├── prototypes/
│   ├── mta/                # Konveyor MTA — full hosted app (Vite + React + PF v6), built & deployed from this repo
│   ├── _template/          # Starter template for new hosted prototypes
│   └── {product}/          # One folder per other product (rhdh, podman-desktop, tas, tpa, konflux, tekton,
│                            # openshift-pipelines, dev-spaces, appdev-ai-skills, ...) — each exports a
│                            # prototypes.ts registry of cards, mostly pointing to externally hosted prototypes
├── .github/workflows/      # GitHub Pages build + deploy
└── .cursor/rules/          # Cursor rules for consistency
```

## Adding a New Prototype

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full step-by-step guide. In short:

- **External prototype** (hosted elsewhere, e.g. GitLab Pages or a GitHub PR): add an entry with an `externalUrl` to an existing or new `prototypes/{name}/prototypes.ts`, and register it in `launcher/src/prototypes.ts`.
- **Hosted prototype** (built and deployed from this repo): copy `prototypes/_template/`, update the Vite/router base paths, build it out, register it in `launcher/src/prototypes.ts`, and wire up build/deploy steps in `package.json` and `.github/workflows/deploy.yml`.

## Development

```bash
# Install all dependencies
npm run install:all

# Build everything
npm run build

# Dev server for a specific prototype
cd prototypes/mta && npm run dev
```

## MTA prototype docs

For details on the MTA dashboard meta component (provider pattern, exports, and how to integrate it into [konveyor/tackle2-ui](https://github.com/konveyor/tackle2-ui)), see [`prototypes/mta/README.md`](prototypes/mta/README.md).
