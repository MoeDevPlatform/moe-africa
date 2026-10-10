# MOE Africa UI Quality Audit

## Commands

```bash
npm run test:ui      # UI audit (routes, positioning, layout)
npm run test:visual  # visual regression
npm run test:a11y    # accessibility (axe)
npm run test:all     # full Playwright suite
npm run test:report  # open HTML report
```

Feature specs (variations, body-type, artisan-products, custom-orders) live alongside and run with `npm run test:playwright` / `test:all`.

## Updating visual baselines

```bash
npx playwright test tests/playwright/visual-regression.spec.ts --update-snapshots
```

Only do this when a visual change is intentional. Do not auto-update in CI.

## Viewports

| Project | Size |
|---------|------|
| desktop | 1280×800 |
| tablet  | 768×1024 |
| mobile  | 390×844 |

`chromium` is an alias of desktop for existing scripts.

## Fixture env (variation / custom-order specs)

Set in local `.env` after seeding:

- `PLAYWRIGHT_VARIATION_PRICE_PRODUCT_ID`
- `PLAYWRIGHT_NO_VARIATION_PRODUCT_ID`
- `PLAYWRIGHT_PRODUCT_WITH_VARIATIONS_ID`
- `PLAYWRIGHT_SOLD_OUT_OPTION_PRODUCT_ID`
- `PLAYWRIGHT_TAILORING_BODY_TYPE_PRODUCT_ID`
- `PLAYWRIGHT_ELIGIBLE_ARTISAN_ID`
- `PLAYWRIGHT_INELIGIBLE_ARTISAN_ID`
- `PLAYWRIGHT_ADMIN_TOGGLE_ARTISAN_ID`

## What each file covers

| File | Coverage |
|------|----------|
| `variations.spec.ts` | Price overrides, no-variation cart, sold-out options |
| `body-type.spec.ts` | Body type selector |
| `artisan-products.spec.ts` | Artisan enable/configure/disable variations |
| `custom-orders.spec.ts` | Eligibility button + admin toggle |
| `ui-audit.spec.ts` | Routes, clickability, overflow, CTA size |
| `visual-regression.spec.ts` | Screenshot baselines |
| `accessibility.spec.ts` | axe WCAG A/AA + img alt |
| `design-system.md` | Colour / type / layout reference |

## When tests fail

Reports include route, viewport (via project name), selector, reason, and screenshots/video on failure.
