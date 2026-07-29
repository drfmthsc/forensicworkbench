# Project brief — Forensic Medicine Workbench

Paste this whole file at the start of a new chat. It is written to be self-contained: the
assistant reading it has no access to how the site was built or any earlier conversation.

---

## What this is

A small static website that hosts medico-legal teaching resources for medical students,
interns and residents in India. Author: **Dr Harvinder Singh Chhabra** (dr.fmt.hsc@gmail.com).

The author is credited by name and email only — **no institutional or departmental affiliation
appears anywhere on the site, and none should be added.**

The site is a **register** — a catalogue landing page listing each resource as an entry. It is
designed to grow: new resources get added over time.

Content is aligned with the Bharatiya Nyaya Sanhita (BNS), Bharatiya Nagarik Suraksha Sanhita
(BNSS) and Bharatiya Sakshya Adhiniyam (BSA), 2023, in force 1 July 2024, and with the MoHFW
*Guidelines & Protocols: Medico-legal care for survivors/victims of sexual violence* (2014).

## Where it lives

- Repository: `github.com/drfmthsc/Website`
- Live site: `https://drfmthsc.github.io/Website/`
- Hosting: GitHub Pages, edited through the GitHub web interface (no local git, no build step)

## File layout

All files sit flat in the repository root. There are no folders.

```
index.html                                      the register / landing page
licence.html                                    copyright, licence, citation formats
medico-legal-care-sexual-violence-survivor.html resource FMT-01
safe-evidence-sequencer.html                    resource FMT-02
README.md
LICENSE.md
```

If a folder is ever introduced, the `href` values in `index.html` and the `path` values in
`licence.html` must be updated together, or every link breaks.

## The two resources

**FMT-01 — Medico-legal Care of the Sexual Violence Survivor.** A reference guide covering the
full pathway in six sections: Consent, History, Examination, Evidence collection, Framing the
medical opinion, Deposition in court. Includes an "Opinion Engine" that generates the verbatim
MoHFW provisional and final opinion wording.

**FMT-02 — SAFE Evidence Sequencer.** An interactive drill. The user orders the steps of a
medico-legal examination into the correct protocol sequence and sets aside anything prohibited
or not indicated. Four scenarios: adult survivor, POCSO minor, male survivor, drug-facilitated
assault. Scored, with a certificate at the end.

Both are **single self-contained HTML files** — inline CSS and JavaScript, no external
dependencies except Google Fonts. They work offline once loaded. Treat them as finished
artifacts; they predate the register and should not be restructured without good reason.

## How the site is built

Plain HTML, CSS and vanilla JavaScript. No framework, no build step, no npm, no bundler.
Every page is self-contained — there is no shared stylesheet, and the design tokens (the
`:root` CSS block) are duplicated in `index.html` and `licence.html` by design.

**Do not introduce React, a static site generator, Tailwind, or a build pipeline.** The author
edits these files through the GitHub web UI. Anything requiring a terminal or a compile step
breaks that workflow.

### Adding a new resource

`index.html` renders its entries from a JavaScript array near the bottom of the file:

```js
const MODULES = [
  {
    ref:    "FMT-01",              // catalogue number
    type:   "Reference guide",     // or "Interactive drill", etc.
    accent: "clay",                // spine colour: clay | teal | moss | slate | seal | gold
    scope:  "6 sections",
    title:  "...",
    blurb:  "...",
    chips:  ["...", "..."],        // topics covered
    href:   "filename.html",
    action: "Open the guide"       // link text
  }
];
```

Adding a resource = upload the HTML file to the repo root + append one object to `MODULES`.
The entry count updates itself.

`licence.html` has a matching `CITE_ITEMS` array that must be updated too, so the new resource
can be cited directly.

### Citations

`licence.html` generates Vancouver/NLM, APA 7 and BibTeX citations with copy buttons, built
from a `SITE_URL` constant (currently `https://drfmthsc.github.io/Website`) and the
`CITE_ITEMS` array. The access date fills in automatically from the visitor's clock.

## Design system — please preserve

The look is deliberately archival, matching the aesthetic of the two resource files.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F0EDE6` | page background |
| `--ink` | `#1A2A2E` | body text |
| `--ink-soft` | `#48595D` | secondary text |
| `--slate-deep` | `#22383D` | top bar, headings, rules |
| `--clay` | `#9C5B3B` | accent, links, FMT-01 spine |
| `--teal` | `#0E6B6B` | FMT-02 spine |
| `--seal` | `#7C2A2E` | warnings, the seal watermark |
| `--moss` | `#4A6B52` | licence panel, confirmations |
| `--line` | `#D8D2C6` | hairline borders |

Typefaces: **Newsreader** (serif) for headings, **IBM Plex Sans** for body, **IBM Plex Mono**
for labels, reference numbers and metadata. All from Google Fonts.

Signature elements worth keeping: the circular § file-stamp watermark in the masthead; the
"docket" column on each register entry (reference number, format, scope in mono); the coloured
spine down the left edge of each entry.

The site is responsive, respects `prefers-reduced-motion`, has visible keyboard focus, and
prints cleanly. Keep all four.

## Licence

Both resources are under **CC BY-NC-ND 4.0** — share and print freely with credit, no
commercial use, no altered versions redistributed. The reasoning for NoDerivatives: if someone
excerpts a resource, changes a statutory section number incorrectly, and redistributes it under
the author's name, that error could reach a real case.

If the licence is ever changed, it must be updated in `LICENSE.md`, the `.panel` block in
`licence.html`, the `.licence-line` in `index.html`, the footer notice inside each resource
file, and the `<meta name="license">` tag in every file.

## Open items

2. **`main` and `master` branches both exist** with identical content. Every edit currently has
   to be made twice or they drift. One should be deleted — check Settings → Pages first to see
   which branch is actually serving.
3. **The repo is named `Website`**, so the public URL is `drfmthsc.github.io/Website/`.
   Renaming the repo to something like `workbench` would improve it, but the URL is baked into
   `SITE_URL` for citations, so it should be settled before the site is shared widely.
4. **Copyright year is 2026** throughout. Should be the year of first publication if earlier.
5. **No back-link from the resources to the register.** Someone landing on a resource from a
   search result or a shared link has no way back to the homepage. Adding one means editing
   inside the two finished resource files.
6. **Institutional IP not checked.** Work produced in the course of university employment may
   carry an employer claim to copyright. The author's institutional policy should be checked
   before the open licence is relied on.
7. **`.nojekyll` not yet uploaded.** GitHub Pages runs Jekyll by default and silently ignores
   files and folders whose names start with an underscore. An empty `.nojekyll` file exists
   locally but has not been pushed to the repo.

## Working notes

- The site was recently broken by a path mismatch: the files were uploaded flat to the repo
  root while `index.html` still linked to a `modules/` subfolder. It is fixed — everything is
  flat now and the links match. If a folder structure is reintroduced later, **both**
  `index.html` (`href` values) and `licence.html` (`path` values in `CITE_ITEMS`) must be
  updated together.
- GitHub Pages caches aggressively. After any upload, wait a minute and hard-reload
  (Ctrl+Shift+R) before concluding something is broken.
- This is medical education material on sexual violence. Copy should stay clinical, plain and
  respectful — write for the doctor on duty, not for a marketing page.
