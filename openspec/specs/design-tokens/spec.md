# design-tokens Specification

## Purpose

Defines the canonical color, typography, spacing, radius, and container values the site's Tailwind theme must expose, sourced from the Figma "Victoria Venezuela Foundation" file's VVF 2.0 Phase 1 variables, replacing today's approximated values.

## Requirements

### Requirement: Brand and accent color tokens match Figma variables
The theme SHALL expose color tokens whose resolved hex values match the Figma VVF 2.0 Phase 1 published variables: a dark brand color, a primary accent color, a primary green color, three pastel background colors, a light neutral gray, a lightest neutral, and white.

#### Scenario: Dark brand color
- **WHEN** a component renders using the dark brand color token
- **THEN** the rendered color resolves to `#02335E`

#### Scenario: Primary accent color
- **WHEN** a component renders using the primary accent color token
- **THEN** the rendered color resolves to `#00ABF9`

#### Scenario: Primary green color
- **WHEN** a component renders using the primary green color token
- **THEN** the rendered color resolves to `#48D4A5`

#### Scenario: Pastel background colors
- **WHEN** a component renders using a pastel background token
- **THEN** the rendered color resolves to one of `#F9EAC6` (sun), `#FFD7D7` (salmon), or `#C1E7F5` (sky)

#### Scenario: Neutral colors
- **WHEN** a component renders using a neutral gray token
- **THEN** the rendered color resolves to `#E7E7E7` (light gray) or `#EEEEEE` (lightest)

### Requirement: Typography tokens match Figma variables
The theme SHALL expose a display/heading font family of Nunito and a body font family of Open Sans, with a type scale whose size, weight, line-height, and letter-spacing match the Figma VVF 2.0 Phase 1 text-style variables.

#### Scenario: Heading 1
- **WHEN** a component renders using the Heading 1 text style
- **THEN** it renders Nunito ExtraBold, 56px, line-height 1.16, letter-spacing -1px

#### Scenario: Heading 2
- **WHEN** a component renders using the Heading 2 text style
- **THEN** it renders Nunito ExtraBold, 48px, line-height 1.1

#### Scenario: Heading 4
- **WHEN** a component renders using the Heading 4 text style
- **THEN** it renders Nunito Bold, 32px, line-height 1.2

#### Scenario: Heading 6
- **WHEN** a component renders using the Heading 6 text style
- **THEN** it renders Nunito ExtraBold, 20px, line-height 1.4

#### Scenario: Body text
- **WHEN** a component renders using the Body text style
- **THEN** it renders Open Sans Regular, 18px, line-height 1.5

#### Scenario: Button text
- **WHEN** a component renders using the Button text style
- **THEN** it renders Nunito Bold, 18px, line-height 1.5

### Requirement: Spacing, radius, and container tokens match Figma variables
The theme SHALL expose a container max-width, two content max-widths, a border/divider width, and a corner-radius step whose values match the Figma VVF 2.0 Phase 1 variables.

#### Scenario: Container width
- **WHEN** a page-width container renders
- **THEN** its max-width resolves to 1280px

#### Scenario: Content column widths
- **WHEN** a long-form content column (e.g. article body, legal text) renders
- **THEN** its max-width resolves to 768px, or 400px for narrower content columns

#### Scenario: Border and divider width
- **WHEN** a component renders a border or divider using the stroke token
- **THEN** its width resolves to 1px

### Requirement: Token documentation reflects the Figma source
The project's design-token documentation SHALL state that values come from the Figma VVF 2.0 Phase 1 file rather than an approximated PDF export.

#### Scenario: Styling reference is current
- **WHEN** a developer reads the styling documentation
- **THEN** it lists the token values in this capability and no longer describes them as approximated
