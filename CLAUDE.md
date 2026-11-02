# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Kevin Vanthuyne's personal portfolio site (kevinvt.com). Plain static HTML/CSS/JS: no build step, no package manager, no tests, no linter. Open `index.html` in a browser to preview; all paths are relative, so it works from `file://`.

## Structure

- `index.html` — single-page home: hero, about/skills, the projects grid (`#projects`) and contact. Holds all the page's inline JS (mobile navbar toggle, Rellax parallax, VanillaTilt, fitty, and a media query that disables parallax/tilt below 768px).
- `projects/<name>.html` — one standalone page per project. Each repeats the full `<head>`, the "K" nav with a `/ Projects / <Name>` breadcrumb, and a "<< Back" link. They only load AOS and LazyLoad from `../js/`.
- `css/style.css` — all custom styling. `css/bootstrap4.min.css` and `css/style-old.css` are not referenced by any page.
- `js/` — vendored, minified third-party libraries (AOS, Rellax, VanillaTilt, fitty, LazyLoad, SmoothScroll). Do not edit them.
- `projects/template.html` is gitignored: a local-only starting point that may not exist in a given checkout. Copy an existing project page such as `projects/agon.html` instead.

## Conventions

- **Bootstrap 3.3.7** (`css/bootstrap.min.css`), so use BS3 grid classes: `col-xs-*`, `col-sm-offset-*`, `img-responsive`. BS4 names like `mt-5`, `mb-2`, `mt-sm-20` are not Bootstrap here; they are custom utilities defined in `css/style.css`. Add any new utility there.
- **Images are lazy-loaded**: `src` points to a small thumbnail, `data-src` to the full image, plus class `lazy`. Newer projects keep both in `img/projects/<name>/` (`foo-thumb.jpg` + `foo.jpg`); older ones use `img/thumbnails/<name>-thumbnail.jpg` + `img/<name>.jpg`.
- Content blocks fade in with `data-aos="fade-up"`.
- Headings start with an accent underscore: `<h2><span class="secondary-color">_</span>Title</h2>`. In-text links use `class="red-link"`; external links add `target="_blank" rel="noopener noreferrer"`.

## Adding or removing a project

A project needs two edits:

1. Create `projects/<name>.html` (title `<Name> - Kevin Vanthuyne`, breadcrumb, `project-date`, description, lazy images).
2. Add a card to the grid in `index.html#projects`: `<a href="projects/<name>.html">` wrapping `div.project.hvr-reveal` with the thumbnail and a `div.project-info` (`<h4>` name, `<p>` one-line tagline). The grid is split into columns of cards; keep them roughly balanced.

Removing a card from `index.html` hides a project without deleting its page (`game-pi.html` and `speaker.html` are unlinked this way).
