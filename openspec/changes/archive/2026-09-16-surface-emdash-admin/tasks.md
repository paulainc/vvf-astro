## 1. Verify existing gating

- [x] 1.1 Confirm `/_emdash/admin` redirects to `/_emdash/admin/login` when unauthenticated, in both `astro dev` and a local `astro build && astro preview` run, and record the result in the PR description
- [x] 1.2 Confirm `/_emdash/api/auth/dev-bypass` returns a non-200/error response (not a live session) against an `astro build && astro preview` output, verifying `import.meta.env.DEV` is `false` in the built output

## 2. Document staff access

- [x] 2.1 Add a "Staff: content admin" note to `README.md` (near the existing local-dev admin URL note) pointing to `/_emdash/admin`, stating it requires login and lists per-collection draft/published/scheduled status
- [x] 2.2 Verify the README renders correctly (preview locally or via `git diff`) and the note does not appear in any public-facing page (`Header.astro`/`Footer.astro` untouched)
