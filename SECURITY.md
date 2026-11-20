# Security Policy

## Supported versions

The `main` branch and the latest release are supported.

## Scope and threat model

Pocket Grove is a static client-side app. It has no server, accounts, API keys, cookies, or remote data collection. All state is in `localStorage` and all assets are generated at runtime. The realistic risks are:

- A malicious or corrupted `pocket-grove-v1` localStorage value.
- Dependency vulnerabilities in React/Three/Vite/Tailwind.
- XSS if user-controlled strings are ever rendered as HTML (they currently render as React text).
- Supply-chain risk from adding new packages.
- Secret leakage if a token is accidentally committed or embedded in a remote URL.

## Current mitigations

- Persisted state is sanitized by `mergePersisted()`: unknown items, malformed tasks, duplicate/out-of-range cells, and invalid counts are dropped.
- Task titles render as text, never `dangerouslySetInnerHTML`.
- No `eval`, dynamic script injection, or remote HTML.
- No secrets are required to run the app.
- CI runs typecheck, lint, tests, and build on pushes/PRs.
- Dependencies are pinned with caret ranges and lockfile.

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Contact the maintainer privately via the GitHub profile associated with the repo (`yx0128`) and include:

- A description of the issue.
- Steps to reproduce.
- Impact and any suggested fix.
- Whether the issue is already public.

You can expect an acknowledgement within a few days. Please give reasonable time for a fix before disclosure.

## Secrets

Never commit `.env`, access tokens, `~/.git-credentials`, or tokens embedded in a git remote. The publishing workflow in [AGENTS.md](AGENTS.md#10-publishing-to-github-without-repeated-keychain-prompts) uses a transient token via a credential helper and does not write it to `.git/config`.

If you believe a secret was exposed, revoke it immediately, rotate it, and remove it from history.
