## Purpose

Defines the shared visual tokens (color, type, shape, spacing, layout) every component draws from, sourced from the live Webflow site's CSS custom properties.

## ADDED Requirements

### Requirement: Live-site token source of truth
Design tokens SHALL be derived from the live Webflow site's CSS custom properties. Where a live value conflicts with an existing project token, the live value SHALL win. Every token SHALL be documented with the live variable it came from.

#### Scenario: Token traces to live variable
- **WHEN** a reviewer inspects any color, font, radius, or spacing token
- **THEN** a comment or mapping table names the live variable (e.g. `--base-color-branding--brand-primary`) it mirrors

### Requirement: Live color palette
The system SHALL expose tokens for: brand primary navy `#02335e`, brand accent cyan `#00abf9`, page background `#f2f2f2`, gray background `#f9f9f9`, neutral light gray `#e7e7e7`, neutral-100 `#f8f9fa`, white, link/focus blue `#1e73be`, pastels sun `#f9eac6` / salmon `#ffd7d7` / sky `#c1e7f5`, and system status pairs (success `#cef5ca`/`#114e0b`, warning `#fcf8d8`/`#5e5515`, error `#f8e4e4`/`#3b0b0b`).

#### Scenario: Default body colors
- **WHEN** any page renders body text with no section override
- **THEN** text uses the navy primary and the page background uses `#f2f2f2`

#### Scenario: Focus state
- **WHEN** a keyboard user focuses a link, button, or field
- **THEN** a visible focus indicator uses the focus-blue token

### Requirement: Live typography
The system SHALL use Nunito for both headings and body text, with the live heading scale (h1 4rem / weight 800 / line-height 1.1; h2 48px; h4 32px; h5 24px; h6 20px), text-medium 18px, and the live line-height scale (tight 1.1, snug 1.25, normal 1.4, relaxed 1.6). Fonts not used by migrated components SHALL NOT be loaded.

#### Scenario: Heading font
- **WHEN** an `h1` renders on desktop
- **THEN** it uses Nunito at 4rem, weight 800, line-height 1.1

#### Scenario: Responsive heading step-down
- **WHEN** the same `h1` renders at mobile width
- **THEN** it uses the size the live site uses at that breakpoint

### Requirement: Live shape, spacing, and container scales
The system SHALL expose the live radius scale (sm .25rem, md .5rem, lg .75rem, xl 1rem, 2xl 2.5rem, full 9999px; buttons 100px pill), the spacing scale (.25rem through 6rem), section paddings (sm 3rem, md 5rem, lg 6.25rem), global horizontal padding 1.25rem, and containers (medium 75rem, large 83.75rem, small 480px, card max-width 417px).

#### Scenario: Section rhythm
- **WHEN** a standard content section renders
- **THEN** its vertical padding equals one of the three section-padding tokens and its content is constrained by a container token
