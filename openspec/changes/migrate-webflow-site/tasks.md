## 1. Preconditions and scaffolding

- [ ] 1.1 Commit or stash the current uncommitted token/component edits on `main` as the baseline, then branch `migrate-webflow-site`; verify `git status` is clean on the new branch
- [ ] 1.2 Record in `scripts/migrate/README.md` that `victoriavenezuelafoundation.org` (Webflow `vvfstaging`) is the source and that, because the repo is public, child snapshot/media/seed entries are gitignored; add the `.gitignore` entries and verify `git check-ignore` matches them
- [ ] 1.3 Obtain a Webflow site API token with CMS + Assets read scope, add `WEBFLOW_API_TOKEN` and `WEBFLOW_SITE_ID` to `.env` and `.env.example` (placeholder only); verify a `GET /v2/sites/:id/collections` call returns 200 (or record that the scrape fallback will be used)
- [ ] 1.4 Create `scripts/migrate/` (extract, harvest, transform, mappers, snapshot, report) and npm scripts `migrate:extract`, `migrate:harvest`, `migrate:transform`, `migrate` (all three); verify `npm run migrate -- --help` lists the steps

## 2. Extraction

- [ ] 2.1 Implement API extraction of primary-locale published items for team members, children, events, resources, FAQs, sponsors, sponsorship packages, and auction items into `scripts/migrate/snapshot/<collection>.json`; verify snapshot item counts match the EN sitemap counts (17 team, ~45 children, 2 events, 12 resources)
- [ ] 2.2 Implement the sitemap HTML scrape fallback (EN URLs only, parse by live class names) producing the same snapshot shape; verify with a unit test on saved fixture HTML for a team member, child, event, and resource page, and verify no `/es` URL is fetched
- [ ] 2.3 Extract static page copy and section structure for the 12 static pages into `snapshot/pages/<page>.json` (headings, body copy, CTAs, image URLs, SEO title/description/OG image); verify each file lists sections in live order
- [ ] 2.4 Write extraction findings into `scripts/migrate/report.md` (source used, counts, unmapped fields); verify the report is generated on each run

## 3. Asset harvesting

- [ ] 3.1 Implement harvest: collect every `website-files.com` image/PDF URL from snapshots, download to `seed/media/<collection>/` and site-chrome assets to `public/images/`, writing `seed/media/manifest.json` (source URL → path, alt, hash); verify a second run downloads nothing
- [ ] 3.2 Log failed downloads to the report with source URL and referencing item; verify with a unit test that a 404 is reported and the run continues
- [ ] 3.3 Harvest logo, favicons (incl. apple-touch), and social share image into `public/`; verify `Layout.astro` can reference them and `public/favicon.svg` is replaced or kept intentionally
- [ ] 3.4 Verify EmDash's `$media` seed reference works with a local file (or a locally served URL per design D4) by seeding one test item and confirming the image is stored in `uploads/` and served from `/_emdash/api/media/file/...`

## 4. Design tokens

- [ ] 4.1 Rebuild `tailwind.config.cjs` colors, fonts, font sizes, line heights, radii, spacing, and containers from the live CSS variables (design-system spec values), with a comment per token naming its live variable and temporary aliases for existing class names; verify `npm run build` succeeds
- [ ] 4.2 Mirror the tokens as CSS custom properties in `src/index.css`, set body to Nunito / navy text / `#f2f2f2` background and focus-blue focus ring; load only Nunito (used weights) from Google Fonts; verify in the browser that computed `h1` is Nunito 4rem/800/1.1 on desktop
- [ ] 4.3 Read the live breakpoints and responsive heading sizes from the live CSS and encode them as Tailwind screens/responsive type; verify `h1` size at 390px matches live
- [ ] 4.4 Add a token mapping table (project token ↔ live variable ↔ value) to the docs site; verify it lists every token in `tailwind.config.cjs`

## 5. Restyle existing components

- [ ] 5.1 Restyle Button to live `button` variants (primary, secondary/outline, any others found); verify Storybook story and computed styles (cyan bg, navy text, 18px/700, 12×24 padding, 100px radius)
- [ ] 5.2 Rebuild Header to the live navbar with Make a Difference / Get Involved / Resources dropdowns, Donate + Contact Us CTAs, no language switch, keyboard and mobile behavior; update the `primary` menu in the seed to the live structure; verify with an e2e test for keyboard open/Escape-close and `aria-expanded` on mobile
- [ ] 5.3 Restyle Footer to live `footer_component` (link lists, social links, email, credits); verify Storybook and parity screenshot
- [ ] 5.4 Restyle Hero, Eyebrow/section title, and Badge to `hero_card`, `section-title_component`, `tag_component`; verify stories
- [ ] 5.5 Restyle EventCard, TeamMemberCard, ChildCard, PastelCard, StatTileRow to `event-card`, `team-card`, `sponsor-children_item`/`children-list_item`, `feature-card`, `number-card`; verify stories at desktop and mobile
- [ ] 5.6 Restyle LogoCarousel, FaqAccordion, SponsorshipTierTable, TicketCard, AuctionItemCard, ContactForm/TextField/TextArea, NewsletterSignup, AnnouncementBanner, ChildProfile, ImpactBanner to their live counterparts (or to token-consistent styling where no counterpart exists); verify stories

## 6. New components

- [ ] 6.1 Add Breadcrumbs (labeled `nav`, ordered list, `aria-current`) with story; verify with a unit/e2e assertion on the child detail page
- [ ] 6.2 Add AppealCards (label + sun/salmon/sky triad) with story; verify color order
- [ ] 6.3 Add ArticleCard (image, category tag, title, date, link) with story
- [ ] 6.4 Add BioCard (photo, name, role, labeled detail items omitted when empty, long bio) with story; verify a member without "Based in" renders no empty item
- [ ] 6.5 Add ProgramsCta card (heading, text, one or two buttons) with story
- [ ] 6.6 Verify no hex color literals remain in `src/components` and `src/pages` (`grep -rE '#[0-9a-fA-F]{3,6}\b' src/components src/pages` returns nothing), then remove the temporary token aliases and verify `npm run build` and Storybook still render

## 7. CMS schema and content adapter

- [ ] 7.1 Add the `resources` collection (fields per cms-collections spec) and the `children.about` field to `seed/seed.json`; verify `npm run seed` on a fresh DB succeeds
- [ ] 7.2 Add `ResourceItem` type and `getResources`, `getResourcesByCategory`, `getResource`, plus `about` on `ChildItem`, in `src/lib/content/{types,index}.ts`; verify new unit tests in `src/lib/content/index.test.ts` pass

## 8. Transform and seed

- [ ] 8.1 Implement per-collection mappers (team, children, events incl. packages/auction/sponsors, FAQs, resources) from snapshot to EmDash seed entries with preserved slugs, `$media` references from the manifest, and empty `private_full_name`; verify mapper unit tests with snapshot fixtures
- [ ] 8.2 Sanitize Webflow rich text (strip `w-*` classes/embeds, keep headings/lists/links/images) and report dropped content; verify with a unit test on a resource body fixture
- [ ] 8.3 Write the transform output into `seed/seed.json` content (replacing placeholder entries for live collections, keeping project-only collections like posts and campaign data), report unmapped fields; verify `rm -f data.db* && npm run seed` succeeds and per-collection counts equal snapshot counts
- [ ] 8.4 Decide and implement handling of the `join-our-board` team item (CTA vs. excluded) and record it in the report; verify the Our Team page shows no empty person card

## 9. Pages

- [ ] 9.1 Recompose Home to live section order/copy using library components and CMS data; verify against the live page in the parity check
- [ ] 9.2 Recompose Ways to Give, Sponsor a Child, children listing, and child detail (breadcrumbs, about section); verify `e2e/sponsor-a-child.spec.ts` updated and passing
- [ ] 9.3 Recompose Corporate Sponsorships, Events listing, and event detail (appeal cards, includes/program lists, special opportunities, sponsors, FAQ); verify `e2e/events.spec.ts` updated and passing
- [ ] 9.4 Recompose Our Team and team member detail (BioCard); verify `e2e/our-team.spec.ts` updated and passing
- [ ] 9.5 Recompose Contact, Earthquake Relief, and Privacy Policy; verify `e2e/contact-form.spec.ts` passing and copy matches the snapshot
- [ ] 9.6 Add `/resources`, `/resources/category/[category]`, `/resources/[slug]` (breadcrumbs, last updated, authors, body, PDF download, 404 for unknown slug); verify a new `e2e/resources.spec.ts`
- [ ] 9.7 Output per-page title, meta description, canonical, and OG image from page snapshots / CMS SEO fields in `Layout.astro`; verify with an e2e assertion on one static page and one resource
- [ ] 9.8 Verify no rendered page contains `website-files.com`, `webflow.com`, or "Missing SEO fields" via an e2e crawl of all routes

## 10. Redirects and URL coverage

- [ ] 10.1 Add 301 redirects in `astro.config.mjs` for every legacy path in the front-end spec; verify with e2e requests (`/team-members/randy-lander` → 301 `/our-team/randy-lander`, `/venezuela-earthquake-relief` → 301 `/earthquake-relief`)
- [ ] 10.2 Add a script/test that requests every EN URL from the saved live sitemap against the local build and asserts 200 or a single 301 to a 200; verify it passes

## 11. Parity check and wrap-up

- [ ] 11.1 Add the opt-in Playwright parity project (`e2e/parity/`, `LIVE_BASE_URL`) capturing live vs local at 1440px and 390px with diff images to `test-results/parity/`, plus an npm script `test:parity`; verify it produces images for every migrated page
- [ ] 11.2 Review parity output, fix remaining token/component gaps, and record accepted differences in `scripts/migrate/report.md`
- [ ] 11.3 Run `npm run test:unit`, `npm run test:e2e`, and `npm run build`; verify all pass
- [ ] 11.4 Document the re-run procedure (token, `npm run migrate`, reseed, parity) in `scripts/migrate/README.md` and the docs site
