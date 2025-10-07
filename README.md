# Firefox Workspaces

This repository contains the source code for the Firefox Workspaces extension.

repo url: https://github.com/baendlorel/firefox-workspaces

## Source code and build instructions

The following section describes how to reproduce the extension build from the source code in this repository. Include this information with the source archive when submitting to Mozilla so reviewers can reproduce the build.

System and environment

- Operating system: Ubuntu 24.04.1 LTS
- Node.js: v22.18.0
- tsx: v4.20.4
- pnpm: v10.17.1

Required global tools

- pnpm (package manager). Install with:

  npm install -g pnpm@10.17.1

- (Optional) tsx for running TypeScript scripts used by the build. Install with:

  pnpm add -g tsx@4.20.4

Repository build steps

1. Clone the repository and change into its directory.

2. Install dependencies using pnpm:

   pnpm install

3. Run the build command:

   pnpm build

What the build script does

- The `pnpm build` command runs `tsx .scripts/prebuild.ts && tsc && vite build`. compiles TypeScript with `tsc`, and then runs `vite build` to produce the `dist/` output used by the extension package.

Build script and automation

- The repository includes a small script at `.scripts/tar.ts` that can create a source archive for submission. It produces `web-ext-artifacts/source-code.tar` and `web-ext-artifacts/source-code.zip` containing the files and folders required for source submission.

Files included in the source archive

- \_locales
- .scripts
- .vscode
- pages
- public
- src
- .gitignore
- .oxlintrc.json
- LICENSE
- manifest.json
- package.json
- pnpm-lock.yaml
- README.md
- tsconfig.build.json
- tsconfig.json
- vite.config.js
- vitest.config.ts

Troubleshooting

- If a command fails due to a missing global tool, ensure the exact versions above are installed or use npx/pnpm to run local binaries.
- If `pnpm build` reports TypeScript errors, run `pnpm run check` (which runs `tsc --noEmit`) to see errors. Fix TypeScript issues or report them to the reviewer.

Notes for reviewers

- The source archive contains the full source tree and a `package.json` with the exact dependencies. Reproducing the build on Ubuntu 24.04.1 LTS with the specified Node and pnpm versions should produce the same `dist/` output as the packaged extension.

If you need additional build artifacts or a step-by-step log of a reproducible build run, I can provide a shell script that installs the required tool versions and performs a clean build.
