# GitHub Submission Guide — Pizza Pie Parlor Combined Baseline

This package contains the **agreed combined application**: Jon's backend, 7.1/7.2 cart work and technical demo, together with Kelly/SteelThistle's themed frontend. It was prepared for the Group3_Cs492 team repository without changing the application source code.

## What is included

- `server.js`, `src/`, `data/`, `database/`: Express backend, sample JSON data, SQL schema, and seed scripts.
- `public/home/`: Kelly's integrated customer-facing homepage, CSS, JavaScript, and locally bundled fonts.
- `public/cart-demo/`, `public/team-demo.html`, and other original public files: existing reusable demo and cart code.
- `tests/`, `scripts/`, `docs/`, `README.md`, `package.json`, `package-lock.json`: tests, documentation, and installation manifest.
- `.env.example`: placeholder configuration with **no private credentials**.

## Removed or excluded from the original shared ZIP

- `node_modules/`: install with `npm ci` instead of committing third-party dependencies.
- `__MACOSX/`, `.DS_Store`, `._*`: Mac metadata with no source-code purpose.
- No application JavaScript, HTML, CSS, SQL, images, bundled fonts, test files, or handoff documentation was removed.

The root `.gitignore` now excludes environment secrets, certificate/private-key files, generated database files, and dependencies, while **allowing `.env.example`**.

## Run locally (Node.js 20 or newer)

At the root of the extracted folder (where `package.json` is located):

```sh
npm ci
npm test
npm start
```

PowerShell can use `npm.cmd ci`, `npm.cmd test`, and `npm.cmd start` if necessary. Then open:

- Integrated homepage: `http://127.0.0.1:3000/home/`
- Original development demo: `http://127.0.0.1:3000/team-demo.html`
- API status: `http://127.0.0.1:3000/api/health`

A pre-upload check ran the existing automated tests successfully (**28/28 passing**). Browser interaction, final acceptance, live payments, and persistent SQLite integration **have not been verified or completed** by this cleanup.

## Add the source to the team's GitHub repository

**Do not upload this ZIP as one binary file if the goal is to establish a source-code repository.** Extract the ZIP and add the **contents** (including `.gitignore` and `.env.example`) to the root of a local clone of the team repository. Avoid creating a nested `pizzapieparlor-team-project/` folder inside the repository.

Suggested workflow for a collaborator with repository access:

1. Clone `Group3_Cs492` and create a branch such as `integration/combined-baseline`.
2. Copy the **contents** of this ZIP to the repository root. Keep any existing team-specific README content that should be retained; reconcile it rather than blindly replacing it.
3. Review `git status`, `git diff`, and all staged files. Confirm no `.env`, private keys, credentials, databases, `node_modules`, or macOS metadata are staged.
4. From the repo root, run `npm ci`, `npm test`, and manually open `/home/` to try menu selection, customization, cart operations, and promo previews.
5. Commit the source with a message such as `Add agreed Pizza Pie Parlor combined baseline` and open a pull request so Jon and Kelly can review the merge before `main` changes.
6. After acceptance, Clarence can add his SQLite database integration on a separate branch without replacing the frontend or backend.

## Pending work / known boundaries

- Source-code integration and 28 existing automated tests are confirmed. A full visual click-through and mobile test remains for the team.
- The cart uses in-memory state; SQL scripts are a starting point, **not a completed SQLite persistence layer**.
- The payment route is only a safe scaffold. There is **no Stripe live/test payment integration yet**.
- Local HTTPS requires developers to provide their own trusted development certificate; public hosting needs an appropriately managed TLS setup.
- The homepage calculates its displayed opening status using the visitor's device time zone. A real deployment should use the restaurant's configured time zone.
- The current theme and imagery are examples for class use; review branding and third-party asset licensing before public commercial deployment.

Prepared as a packaging-only submission cleanup. The original ZIP remains unchanged.
