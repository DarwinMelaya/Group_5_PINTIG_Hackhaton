# Daluyan · Marinduque mosaic design system

Implemented in `src/design-system.css`, loaded after the existing structural CSS by `src/main.tsx`. The React markup in `src/features/Home.tsx`, `src/components/Layout.tsx` and `src/components/common.tsx` is the HTML structure; `src/components/CulturalArt.tsx` supplies original inline SVG motifs.

The supplied campaign image guided visual color matching. Its original JPG bytes were not available for pixel sampling, so these are reference-matched design tokens, not a claim of exact extracted brand values. The illustration is original Marinduque-inspired artwork, not the campaign logo or an official festival emblem.

## Color and contrast

All ratios below use WCAG relative luminance for solid sRGB colors. Normal text requires 4.5:1. Navy is `#20215b`; cream is `#fff8e8`.

| Surface token | Color   | Text  | Contrast |
| ------------- | ------- | ----- | -------- |
| cream         | #fff8e8 | navy  | 13.88:1  |
| paper         | #fffdf5 | navy  | 14.42:1  |
| ocean         | #07549b | cream | 7.21:1   |
| indigo        | #303080 | cream | 10.67:1  |
| green         | #90c63e | navy  | 7.23:1   |
| cyan          | #00b4de | navy  | 6.00:1   |
| aqua          | #70dfcc | navy  | 9.17:1   |
| sun           | #ffce32 | navy  | 9.88:1   |
| orange        | #f56b22 | navy  | 4.90:1   |
| terracotta    | #b43d2d | cream | 5.44:1   |

`--red: #ee2634` and `--tropical: #008947` are decorative accents. Do not put normal-sized navy or cream text directly over these colors. Bright red marks notification edges; brick red carries the readable counter. Hero tile captions have opaque cream backplates. Feed blocks use navy on pale aqua, green and sand. Footer texture uses a low-opacity cream grid over terracotta.

## Components and responsive structure

```html
<!-- JSX components render this structure; classes are reusable CSS utilities. -->
<section class="hero">
  <div class="hero-content"><!-- kicker, h1, description, CTA --></div>
  <div class="island-mosaic" aria-hidden="true"><!-- four SVG tiles --></div>
</section>
<svg class="wave-divider" aria-hidden="true">
  <!-- asymmetric aqua/cyan paths -->
</svg>
<div class="story-mosaic" aria-label="Island community stories">
  <article class="card post-card">
    <!-- existing functional post controls -->
  </article>
</div>
<ul class="butterfly-list">
  <li>Choose local.</li>
  <li>Respect culture.</li>
</ul>
```

The hero is split between a green title panel and four geometric cultural tiles. On screens up to 760px, the art becomes a four-tile strip below the title, stories become one column, and discovery cards become compact horizontal rows. The first desktop story spans both columns; subsequent stories retain DOM reading order. Below 1200px the supplementary panels move below the feed rather than disappearing. Existing navigation becomes a keyboard-accessible drawer on mobile.

Moriones masks replace default avatar initials, empty-state icons and the loading indicator. Account names remain accessible labels; decorative SVGs are hidden from assistive technology. Uploaded profile images are preserved. The wave component separates major sections. Terracotta brickwork lives in the footer; the drawer uses a terracotta edge and invitation panel. Butterfly silhouettes mark the responsible-tourism list. Buttons emit a small decorative upward butterfly on hover; success toasts carry a butterfly. All animation and smooth scrolling respect `prefers-reduced-motion`.

Fredoka 600 provides chunky headings; DM Sans 400/600 provides body text. Fonts are self-hosted, require no external font service, and include SIL Open Font License files under `public/fonts`.

## Validation

Run `npm test`, `npm run build`, `npm run test:e2e`, and `DALUYAN_TEST_PRODUCTION=1 npm run test:e2e` from the nested app directory. The browser suite checks the original guest workflows and the new grid at widths 320, 390, 768, 1024 and 1440; it also checks overflow, filter state, Moriones empty states, focus restoration and reduced motion. Third-party weather and tile requests are intentionally mocked.

An isolated axe-core audit covers WCAG 2 A/AA and 2.1 AA rules on Home, Map, Hub, RINI, Settings, Auth and Notifications at 390px and 1440px. Automated checks do not establish complete accessibility conformance or hosted Supabase behavior; manual assistive-technology review and authenticated hosted workflows remain outside the guest preview validation.
