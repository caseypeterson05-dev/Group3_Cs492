# Upgrade from the original backend v2.1.3

**Bundle:** v2.5.0 team handoff (documentation-focused)  
**Node package:** v2.2.0 (unchanged)  
**Live demo:** `http://127.0.0.1:3000/team-demo.html` (requires a local running server)

This release extends the original backend; it does not replace it. All 51
original files are present. Of those, 45 are byte-for-byte unchanged
relative to v2.1.3, and six contain intentional updates.

## What carries forward

The Express routing architecture, restaurant/menu/promotions APIs, gallery,
delivery validation, payment scaffold, seed data, SQL starter files,
OpenAPI contract, original landing page, photos, Windows launch scripts,
and original tests are all retained.

## Six updated original files

| File | Change |
| --- | --- |
| `src/services/cartService.js` | Cart validation, line limits, safer serialized snapshots |
| `package.json` | Version 2.2.0 and all-test discovery |
| `package-lock.json` | Matching package version metadata |
| `run-tests.cmd` | Runs the complete automated test suite |
| `README.md` | Current handoff guide; original retained in history |
| `CHANGELOG.md` | Original history plus subsequent versions |

## New features

- Sprint 7.1 reusable shopping cart interface, with active `team-demo.html`
- Sprint 7.2 validation upgrades and focused tests
- Space-themed sample site, changeable styles and artwork
- Centered promo window beside the cart and **estimated** discounted totals
- Human-readable Notepad files and team merge instructions

The promo input belongs to a separate sprint task (9.1). The discount is
only a frontend estimate, and carts remain in memory.

## Preserve the original documentation

The original long-form README is preserved **unchanged** at:

`docs/history/README_BACKEND_v2.1.3.md`

Notepad users can read `docs/history/README_BACKEND_v2.1.3.txt`. The
original changelog is preserved alongside these files.

## How to merge safely

1. Work on a review branch; do not overwrite teammates' newer code.
2. Compare the changed cart service with the current team's service.
3. Merge the new frontend files and additional tests selectively.
4. Review package/test script changes together.
5. Run `npm.cmd ci`, `npm.cmd test`, `npm.cmd start`.
6. Verify menu loading, customization, cart updates, and the `PIZZA20`
   preview beside the visible cart.
7. Approve code integration and the final visual design separately.

For the complete Notepad-friendly comparison, see `UPGRADE_FROM_v2.1.3.txt`.
