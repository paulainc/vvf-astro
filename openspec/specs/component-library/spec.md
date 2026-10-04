# component-library Specification

## Purpose

Reusable Astro components that compose every page, styled to match their live Webflow counterparts while consuming only design-system tokens.

## Requirements

### Requirement: Header component
The system SHALL expose a `Header` Astro component that renders navigation links.

#### Scenario: Header rendering
- **WHEN** the page includes `<Header />`
- **THEN** navigation links are visible.

### Requirement: Site chrome (header, announcement banner, footer)
The system SHALL provide a header with logo, primary nav (with a "Get involved" dropdown for Ways to Give / Corporate Sponsorships / Events), a "Contact Us" outline button, and a "Donate" filled button; an optional dismissible announcement banner above the header for time-sensitive campaigns (e.g. earthquake relief); and a footer with org description, tax ID/address, nav link columns, the Candid Platinum Transparency seal, social icons, and legal links (Privacy Policy always linked; Terms of Use and Donor Bill of Rights links appear only once those pages exist).

#### Scenario: Mobile nav collapses to a menu
- **WHEN** the header is viewed below the tablet breakpoint
- **THEN** the primary nav collapses into a slide-out menu reachable via a hamburger control, preserving the same link set and the Contact Us / Donate actions

#### Scenario: Announcement banner only shows when a campaign is active
- **WHEN** no active campaign banner is configured
- **THEN** the header renders without the banner and without reserving its space

### Requirement: Hero and impact sections
The system SHALL provide a hero component (background image, floating content card with heading/subtext/CTA pair) and a stat-tile row component (label + large number, 4-up desktop, 1-up mobile), and a dark full-bleed "impact" banner component (heading, body copy, bullet list, image, CTA) for narrative/connection sections.

#### Scenario: Hero renders on every top-level page
- **WHEN** a page is one of Home, Our Team, Sponsor a Child, Ways to Give, Events, Contact, or Earthquake Relief
- **THEN** it renders the hero component with page-specific image, heading, and CTA pair

### Requirement: Program and step cards
The system SHALL provide a three-color pastel card component (icon, category label, title, body, optional CTA) used for the "How we help" program set and the "Three steps to change" set, always rendered in a group of three using the design system's pastel triad.

#### Scenario: Program card without a CTA
- **WHEN** a program card is rendered for an informational (non-actionable) item
- **THEN** the CTA slot is omitted without leaving a visual gap

### Requirement: List cards (event, blog, team, child, auction, ticket)
The system SHALL provide: an event card with an "upcoming" variant (image, title, date badge, location, description, Learn More CTA) and a "past" variant (compact, image-optional, title/date/location/description, no CTA); a blog/article card (image, date, title, excerpt, Learn More); a team member card (photo, name, role, short bio, social icons) supporting board/leader/staff tiers; a child card (photo, age badge, name) for the sponsorship grid; a silent-auction item card (image, name, value, bid CTA); and a ticket/pricing card (tier name, price, feature list, buy CTA).

#### Scenario: Past event card omits the CTA
- **WHEN** an event card's variant is "past"
- **THEN** no Learn More / Register CTA is rendered, only the event's descriptive content

#### Scenario: Child card links to a detail page
- **WHEN** a child card is rendered in the "Meet the children" grid
- **THEN** clicking it navigates to that child's detail page, carrying its identifier

### Requirement: Child profile detail
The system SHALL provide a child profile layout showing photo, age, birthday, gender, and a "dream" quote, each in its own pastel info-card, alongside a donation panel for sponsoring that specific child.

#### Scenario: Child profile links back to the listing
- **WHEN** a child detail page is rendered
- **THEN** a breadcrumb links back to "Meet the children"

### Requirement: Sponsorship tier comparison table
The system SHALL provide a comparison table component listing sponsorship tiers (e.g. Trustee/Diamond/Gold or Trustee/Leader/Advisor/Friend) as columns and benefit rows (pre-event, event-day, post-event recognition; promotional items) as a checkmark/value grid, with a buy/select CTA per tier.

#### Scenario: Tier table collapses on mobile
- **WHEN** the comparison table is viewed at mobile width
- **THEN** it renders as stacked per-tier cards rather than a horizontally scrolling table body wider than the viewport

### Requirement: FAQ accordion
The system SHALL provide an accordion component where each item shows a question row that expands/collapses to reveal an answer, only one item's expand state affecting its own row.

#### Scenario: Expanding one FAQ does not close others
- **WHEN** a user expands one FAQ item
- **THEN** other already-expanded items remain expanded (independent accordion items, not single-open)

### Requirement: Carousels
The system SHALL provide a carousel component for testimonial/story cards and a logo-strip carousel for corporate partner logos, both with prev/next controls and, for the testimonial carousel, position dots.

#### Scenario: Logo carousel loops
- **WHEN** the corporate logo carousel reaches the last logo and next is pressed
- **THEN** it wraps back to the first logo

### Requirement: Forms
The system SHALL provide a newsletter signup component (email input + subscribe button + privacy microcopy) and a contact form component (name/email/phone, topic select, "how would you describe yourself" radio group, message textarea, privacy-policy checkbox, submit).

#### Scenario: Contact form blocks submit without consent
- **WHEN** the privacy-policy checkbox is unchecked
- **THEN** the submit action is disabled or rejected client-side before any network request

### Requirement: Donation amount widget
The system SHALL provide a "choose amount" donation widget component (one-time/monthly toggle, currency select, preset amount buttons, custom amount input, optional target-selection e.g. "Sponsor a Child") that hands off the selected amount and cadence to the donation-integration capability's checkout flow.

#### Scenario: Custom amount overrides preset selection
- **WHEN** a user types a custom amount after selecting a preset
- **THEN** the custom amount becomes the active selection and no preset button remains visually selected

### Requirement: Live component parity
Each project component that has a live-site counterpart SHALL match that counterpart's layout, spacing, typography, color, radius, and hover/active states at desktop and mobile widths, using design tokens only (no raw hex values or page-specific overrides). The mapping SHALL cover at least: Header ↔ `navbar`, Footer ↔ `footer_component`, Button ↔ `button` (`is-primary` and other live variants), Hero ↔ `hero_card`, EventCard ↔ `event-card_component`, TeamMemberCard ↔ `team-card_component`, ChildCard ↔ `sponsor-children_item` / `children-list_item`, PastelCard ↔ `feature-card_component`, StatTileRow ↔ `number-card_component`, LogoCarousel ↔ `logos_component`, FaqAccordion ↔ `faq-row_component`, Badge ↔ `tag_component`, Eyebrow/section heading ↔ `section-title_component`.

#### Scenario: Primary button
- **WHEN** a primary button renders
- **THEN** it has a cyan accent background and border, navy text, Nunito 18px weight 700, 12px × 24px padding, and a 100px radius, matching the live `button is-primary`

#### Scenario: No raw colors in components
- **WHEN** component source is searched for hex color literals
- **THEN** none are found outside the token definition files

#### Scenario: Stories reflect live styling
- **WHEN** a restyled component's Storybook story is viewed
- **THEN** it renders the live-matching variant(s) with migrated sample content

### Requirement: Dropdown site navigation
The header SHALL present the live navigation structure, in order: "Make a Difference" dropdown (Ways to Give, Sponsor a Child, Corporate Sponsorships), "Get Involved" dropdown (Events), "Our Team" link, "Resources" dropdown (All Resources, Stories, Financials & Transparency), plus Donate and Contact Us calls to action. Dropdowns SHALL open on hover and keyboard focus on desktop and collapse into an accessible mobile menu. The EN/ES language switch SHALL NOT be rendered while Spanish is out of scope.

#### Scenario: Keyboard navigation
- **WHEN** a keyboard user tabs to "Resources" and presses Enter or Down Arrow
- **THEN** the submenu opens, focus moves into it, and Escape closes it and returns focus to the toggle

#### Scenario: Mobile menu
- **WHEN** the header renders below the live site's mobile breakpoint
- **THEN** links collapse behind a menu button that exposes `aria-expanded`

### Requirement: Breadcrumbs
The system SHALL provide a breadcrumb component matching the live `crumbs` styling, rendered as an ordered list inside a labeled `nav`, with the current page marked `aria-current="page"`.

#### Scenario: Child detail breadcrumb
- **WHEN** a child detail page renders
- **THEN** breadcrumbs show "Sponsor a Child" (linked) followed by the child's display name (current)

### Requirement: Appeal card triad
The system SHALL provide an appeal-card group matching live `appeal_cards`: a label plus a row of three cards in sun, sky, and salmon pastels, each with a title and text.

#### Scenario: Triad colors in order
- **WHEN** an appeal-card group renders three cards
- **THEN** their backgrounds are sun, sky, and salmon, in that order (as on the live site)

### Requirement: Article card
The system SHALL provide an article card matching live `article-card_component` for resources: image, category tag, title, date, and link to the resource detail page.

#### Scenario: Resource listing card
- **WHEN** a resource appears in a listing
- **THEN** its card shows its category tag and links to `/resources/<slug>`

### Requirement: Bio card
The system SHALL provide a bio card matching live `bio_card`: photo, name, role, and a list of labeled detail items (e.g. Since, From, Based in), with the long bio below.

#### Scenario: Missing detail item
- **WHEN** a team member has no "Based in" value
- **THEN** that detail item is omitted rather than rendered empty

### Requirement: Programs CTA card
The system SHALL provide a call-to-action card matching live `programs-cta_card` with heading, text, and one or two buttons.

#### Scenario: CTA with two actions
- **WHEN** the card is given primary and secondary actions
- **THEN** both render as buttons using the live primary and secondary variants
