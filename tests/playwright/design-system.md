# MOE Africa design system (audit reference)

Recorded from `src/index.css` and shared UI conventions.

## Colour

| Token | Approx hex | Notes |
|-------|------------|-------|
| Primary (forest green) | `#014421` | HSL `150 100% 13%` |
| Background (cream) | ≈ `#F5F0E8` | HSL `45 60% 93%` |
| Secondary (clay) | `#d96f32` | |
| Accent (gold) | `#f2c94c` | |

Sprint prompt referenced `#1A4D2E` as MOE green — live tokens use deep forest `#014421`. Prefer CSS variables (`--primary`) over hard-coded hex in new UI.

## Typography

- Display / headings: project font-display utility where used
- Body: theme `sans` stack from Tailwind / shadcn defaults

## Layout

- Card border radius: Tailwind `rounded-lg` / shadcn Card
- Primary CTA height: prefer ≥ 44px touch targets (`size="lg"` buttons)
- Spacing: Tailwind scale (4, 6, 8)

## Variation UI

- Selected chips / body-type cards: `border-primary` + `selected` class
- Sold-out options: `.variation-option--sold-out` (opacity + hatch overlay)
