# component-visual-parity Specification

## Purpose

Defines which shared components must visually match their Figma VVF 2.0 Phase 1 counterpart, and which new components this redesign requires that don't exist in the library yet.

## Requirements

### Requirement: Shared chrome matches its Figma reference
The Header, Footer, and Hero components SHALL render using `design-tokens` and match the corresponding "Navbar", "Footer", and "Hero" frames in the Figma file's component-reference section, across the Desktop and Phone variants defined there (and Tablet, where the Figma file defines one).

#### Scenario: Header matches Navbar reference
- **WHEN** the Header component renders at desktop or phone width
- **THEN** its layout and styling match the Figma "Navbar" Desktop/Phone variants

#### Scenario: Footer matches Footer reference
- **WHEN** the Footer component renders at desktop, tablet, or phone width
- **THEN** its layout and styling match the Figma "Footer" Desktop/Tablet/Phone variants

#### Scenario: Hero matches Hero reference
- **WHEN** the Hero component renders at desktop or phone width
- **THEN** its layout and styling match the Figma "Hero" Desktop/Phone variants

### Requirement: Existing component library uses updated tokens
Every component in the existing 28-component library SHALL render using `design-tokens` in place of the previously approximated values, and SHALL match its corresponding Figma instance where the Figma file includes one.

#### Scenario: Card-style components match their Figma instance
- **WHEN** `ChildCard`, `EventCard`, `TeamMemberCard`, or `BlogCard` renders
- **THEN** its colors, typography, and corner radius match the corresponding card instance in the Figma file

#### Scenario: Components without a direct Figma instance still use current tokens
- **WHEN** a component with no direct Figma counterpart (e.g. `DonationAmountWidget`) renders
- **THEN** it uses `design-tokens` values instead of the previously approximated ones, without a required layout change

### Requirement: New molecules required by the redesign exist in the library
The component library SHALL include a "Steps" component, a "Fact Cards" component, and a "Breadcrumb" component, matching their respective Figma instances ("Sponsor a Child · Steps · How it works", "Event Details · Fact Cards · What When Where", "Child Profile · Breadcrumb"), each following the project's existing component conventions (flat file in `src/components/`, atomic-design Storybook tier).

#### Scenario: Steps component
- **WHEN** the Sponsor a Child page renders its "How it works" section
- **THEN** it uses a Steps component matching the Figma instance

#### Scenario: Fact Cards component
- **WHEN** the Event Details page renders its "What When Where" section
- **THEN** it uses a Fact Cards component matching the Figma instance

#### Scenario: Breadcrumb component
- **WHEN** the Child Profile page renders below the Navbar
- **THEN** it uses a Breadcrumb component matching the Figma instance
