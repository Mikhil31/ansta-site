# ANSTA — Advanced Nursing Skill Training Academy (static site)

Static, no build step. Runs on GitHub Pages / any static host.

## Files
- `index.html` — entry point (redirects to Home)
- `Home.dc.html`, `About.dc.html`, `Courses.dc.html`, `Contact.dc.html` — the pages
- `support.js` — runtime that renders the pages
- `_ds/` — Modernist design-system stylesheet + bundle
- `assets/` — logo

## Edit
Each `*.dc.html` holds its markup (template) and a `<script data-dc-script>` logic block.
Colors live at the top of each file's `<style>`: `--teal`, `--navy`, `--gold`, `--color-accent`.

## Before going live
- Contact form: in `Contact.dc.html`, replace `YOUR_FORM_ID` in the `<form action>` with your free Formspree ID.
- Photos: the grey boxes are placeholders — drop images in `assets/` and swap them in.

## Deploy to GitHub Pages
1. Create a repo, add these files, push to `main`.
2. Repo → Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / root.
3. Your site: `https://<user>.github.io/<repo>/`
