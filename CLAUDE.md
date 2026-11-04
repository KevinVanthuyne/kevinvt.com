# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Kevin Vanthuyne's personal portfolio site (kevinvt.com). Plain static HTML/CSS/JS: no build step, no package manager, no tests, no linter. Open `index.html` in a browser to preview; all paths are relative, so it works from `file://`.

## Structure

- `index.html` — single-page home: hero, about/skills, the projects grid (`#projects`) and contact. Holds the page's inline JS (mobile navbar toggle, Rellax parallax, VanillaTilt, fitty, a media query that disables parallax/tilt below 768px, and the project filter).
- `projects/<name>.html` — one standalone page per project. Each repeats the full `<head>`, the "K" nav with a `/ Projects / <Name>` breadcrumb, and a "<< Back" link. They load AOS, LazyLoad and `terminal.js` from `../js/`.
- `css/style.css` — all custom styling. `css/aos.css` (every page) and `css/vivify.min.css` (`index.html` only) are vendored. `css/bootstrap4.min.css` and `css/style-old.css` are not referenced by any page.
- `.github/workflows/deploy.yml` — deploys the site to the VPS. See Deployment below.
- `js/` — vendored, minified third-party libraries (AOS, Rellax, VanillaTilt, fitty, LazyLoad, SmoothScroll). Do not edit them. The exception is `js/terminal.js`, our own script for the terminal effects. On every page: typed headings and the `[####----]  40%` scroll progress bar. On the homepage only: the typed subtitle and the `>` marker on the active nav item. On project pages the `$ cd ~/projects/<name>` line types first, then the heading. On pages with a mouse, a dot grid shows in a soft circle around the cursor (`.spotlight`). Behind it sit faint static dot fields on the same grid, pure CSS: `#home` and `#contact` on the homepage, the top and bottom of `main.project-page` on project pages (fainter on touch screens via `--section-dot-alpha`).
- Every page's `<head>` has `<meta name="theme-color" content="#dfd9d0">` (the `.navbar-container` color, tints the phone's status and address bars) and the favicon links: `favicon.ico` in the root plus `img/icons/favicon-32.png` and `img/icons/apple-touch-icon.png`, made from the GitHub avatar. If the navbar color changes, change `theme-color` on all pages too.
- `projects/template.html` is gitignored: a local-only starting point that may not exist in a given checkout. Copy an existing project page such as `projects/agon.html` instead.

## Deployment

Every push to `master` (and a manual run of the `Deploy` workflow) publishes the site, so merging to `master` makes it live. The workflow SSHes to the VPS with a key that is locked to a forced command. That command checks out the pushed commit (it must be on `master`) and prints the commit the site checkout ended up on. The job fails if that commit differs from `GITHUB_SHA`. The connection details are GitHub secrets (`SSH_KEY`, `SSH_KNOWN_HOSTS`, `SSH_HOST`, `SSH_PORT`, `SSH_USER`). Pushes to other branches deploy nothing.

## Conventions

- **Bootstrap 3.3.7** (`css/bootstrap.min.css`), so use BS3 grid classes: `col-xs-*`, `col-sm-offset-*`, `img-responsive`. BS4 names like `mt-5`, `mb-2`, `mt-sm-20` are not Bootstrap here; they are custom utilities defined in `css/style.css`. Add any new utility there.
- **Images are lazy-loaded**: `src` points to a small thumbnail, `data-src` to the full image, plus class `lazy`. Newer projects keep both in `img/projects/<name>/` (`foo-thumb.jpg` + `foo.jpg`); older ones use `img/thumbnails/<name>-thumbnail.jpg` + `img/<name>.jpg`.
- Content blocks fade in with `data-aos="fade-up"`.
- The skills section has faint tech logos behind it (`.skill-logos`), only the main skills, each a `rellax` image. Speeds are mixed (-4 to 3) and some logos sit above (negative `top`) or below (over 100%) the section, so they show up in About and Projects too. Keep negative speeds at -4 or slower: a faster one outruns the scroll on short viewports and the page grows without end. Each has its own horizontal lane (`left` in steps of 10%) so none overlap; use a free lane. They are from Simple Icons (CC0), saved in `img/icons/skills/<slug>.svg`. Simple Icons 16 has no AWS, Azure, C# or Java logo; `java.svg` comes from simple-icons@5.0.0. On phones parallax is off, so logos stand still at their `top`/`left`; only the few without `hidden-xs` show there, very faint. Give a new logo `hidden-xs` unless it fits inside the section and the screen width.
- Section headings look like a terminal prompt: a command line above them (`<p class="command"><span class="secondary-color">$</span> cat about.txt</p>`), then `<h2><span class="secondary-color">&gt;</span> Title<span class="secondary-color cursor">_</span></h2>`, which `js/terminal.js` types out on scroll. On project pages the command is `$ cd ~/projects/<name>`. In-text links use `class="red-link"`; external links add `target="_blank" rel="noopener noreferrer"`.

## Adding or removing a project

A project needs two edits:

1. Create `projects/<name>.html` (title `<Name> - Kevin Vanthuyne`, breadcrumb, the `cd ~/projects/<name>` command line and heading, `project-date`, description, lazy images, and `<script src="../js/terminal.js">`).
2. Add a card to the grid in `index.html#projects`: `<a href="projects/<name>.html" data-category="...">` wrapping `div.project.hvr-reveal` with the thumbnail and a `div.project-info` (`<h4>` name, `<p>` one-line tagline).

Grid rules:

- **Order**: curated, not purely chronological: Kevin's strongest and most impressive projects first, then the rest roughly newest first. Cards are read row by row (top-left, across the three columns, then the next row): card 1 is the first card of column 1, card 2 the first of column 2, card 3 the first of column 3, card 4 the second of column 1, and so on. Inserting a card shifts every later card one column to the right. The inline script reads the cards back in that order and deals them out again on load and on every filter change (into one column on phones), so a card in the wrong slot shows up in the wrong place.
- **Phones**: one column, with the images almost edge to edge (the text keeps its margins). Only the first 12 cards in the curated order show; a `show N more` button with a V (`.projects-more-row`) reveals the rest, so the top 12 should be the strongest projects. `phoneCardLimit` in the inline script sets the number.
- **Categories** (`data-category`, exactly one): `software` (purely software), `websites` (purely websites), `electronics` (physical builds with electronics, mixed hardware and software included), `various` (anything else). They match the filter buttons in `.project-filter`; a new category needs a new button there.

Removing a card from `index.html` hides a project without deleting its page (`game-pi.html` and `speaker.html` are unlinked this way).
