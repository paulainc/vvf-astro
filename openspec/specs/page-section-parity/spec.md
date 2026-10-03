# page-section-parity Specification

## Purpose

Defines the section composition and vertical spacing rhythm each existing page type must follow to match the Figma VVF 2.0 Phase 1 file's build-ready layout.

## Requirements

### Requirement: Section composition matches Figma per page type
Each of the 10 page types the Figma file covers SHALL compose its sections in the order the corresponding Figma frame defines, using the section names in Figma as the mapping to existing or new components.

#### Scenario: Home
- **WHEN** the home page renders
- **THEN** its sections appear in this order: Navbar, Hero, Stats, Feature Cards, Dark CTA, Stories Carousel, Events, Logo Strip, Light CTA, Footer

#### Scenario: Sponsor a Child
- **WHEN** the Sponsor a Child page renders
- **THEN** its sections appear in this order: Navbar, Hero, Intro, Children Carousel, Steps, Dark Card, Reward Cards, FAQ, Light CTA, Footer

#### Scenario: Meet the Children
- **WHEN** the Meet the Children listing page renders
- **THEN** its sections appear in this order: Navbar, Children Grid, Footer

#### Scenario: Child Profile
- **WHEN** a child profile detail page renders
- **THEN** its sections appear in this order: Navbar, Breadcrumb, Child Profile Details, Light Section, Footer

#### Scenario: Team Bio
- **WHEN** a team member bio page renders
- **THEN** its sections appear in this order: Navbar, Hero (Person), Bio, Footer

#### Scenario: Privacy Policy
- **WHEN** the privacy policy page renders
- **THEN** its sections appear in this order: Navbar, Page Title, Legal Text, Footer

#### Scenario: Event Details
- **WHEN** an event details page renders
- **THEN** its sections appear in this order: Navbar, Event Hero, Fact Cards, Logo Carousel (current sponsors), Event Body, Sponsorship, Logo Carousel (past sponsors), FAQ and Contact, Footer

#### Scenario: Our Team
- **WHEN** the our-team listing page renders
- **THEN** its sections appear in this order: Navbar, Hero, Board of Directors Grid, Team Grid, Dark CTA, Footer

#### Scenario: Resources
- **WHEN** the resources (blog) listing page renders
- **THEN** its sections appear in this order: Navbar, Section Title, Featured Article Card, Blog Listing (grid and sidebar), Footer

#### Scenario: Article
- **WHEN** an article (blog post) page renders
- **THEN** its sections appear in this order: Navbar, Article Header, Article Body, Footer

### Requirement: Vertical spacing follows the Figma padding scale
Every section on a Figma-covered page SHALL use fixed side padding (64px desktop, 24px phone) plus exactly one vertical-spacing step chosen from the Figma scale (0, 64, or 120px desktop; 0, 40, or 64px phone), matching the padding the section shows in Figma. Card-style sections and carousels follow the Figma file's documented exceptions.

#### Scenario: Standard section spacing
- **WHEN** a standard content section renders on desktop
- **THEN** its side padding is 64px and its top/bottom padding is 0, 64, or 120px, matching its Figma frame

#### Scenario: Standard section spacing on phone
- **WHEN** a standard content section renders on phone
- **THEN** its side padding is 24px and its top/bottom padding is 0, 40, or 64px, matching its Figma frame

#### Scenario: Card section spacing
- **WHEN** a card-style section (a colored card inside a section) renders on desktop
- **THEN** its outer padding is 0/24/120/24 and its inner card padding is 64px

#### Scenario: Carousel section spacing
- **WHEN** a carousel section renders on desktop
- **THEN** its side padding is 20px, and 0px on phone

### Requirement: Phase 2 content is excluded
Sections the Figma file marks as belonging to a later phase SHALL NOT be built as part of this change.

#### Scenario: Meet the Children filters
- **WHEN** the Meet the Children page renders
- **THEN** it does not include the "Filters reference · Phase 2" functionality
