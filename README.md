# Forensic Medicine Workbench

*Medico-legal practice, step by step*

Static site. No build step, no dependencies. Open `index.html` in a browser to view it.

```
site/
├── index.html                                       the register (landing page)
├── licence.html                                     copyright, licence, citation formats
├── medico-legal-care-sexual-violence-survivor.html  FMT-01
├── safe-evidence-sequencer.html                     FMT-02
├── LICENSE.md
├── README.md
└── .nojekyll

All files sit flat — no folders. This matches the live repo. If you ever introduce a
folder, update the `href` values in index.html AND the `path` values in licence.html
together, or the links break.
```

## Adding a new resource

1. Put the `.html` file in the repo root. Use a lowercase, hyphenated filename.
2. Open `index.html`, scroll to the `<script>` block near the bottom, and add one entry
   to the `MODULES` list:

```js
{
  ref:    "FMT-03",              // catalogue number in the docket column
  type:   "Interactive drill",   // what kind of resource it is
  accent: "moss",                // spine colour: clay | teal | moss | slate | seal | gold
  scope:  "5 scenarios",         // small line under the format
  title:  "Title of the resource",
  blurb:  "One or two sentences on what it does.",
  chips:  ["Topic", "Topic", "Topic"],   // or [] for none
  href:   "your-file.html",
  action: "Start the drill"      // link text, written as an action
}
```

The entry count updates on its own. Nothing else needs changing.

Keep the placeholder slot at the bottom of the register (`FMT-03` in the markup) pointing
at the *next* unwritten number, or delete that block if you would rather not show it.

## Before you publish

Two things to set:

1. **`licence.html`** — `SITE_URL` is set to `https://drfmthsc.github.io/Website`. Update it
   if you rename the repo. Set `YEAR` too if the year of publication is not the current year.
2. Decide whether the two resources should share one licence — FMT-01 is CC BY-NC-ND 4.0
   and FMT-02 is CC BY-NC 4.0. See `LICENSE.md`.

## Publishing

Any static host works, since there is no server-side code:

- **GitHub Pages** — push the contents of `site/` to a repo, then Settings → Pages → deploy
  from the `main` branch, root folder.
- **Netlify / Cloudflare Pages** — drag the `site/` folder onto the dashboard.
- **Institutional web server** — copy `site/` into the web root.

Fonts load from Google Fonts, so the first view needs a connection. Everything else, including
the drill's scoring and certificate, runs offline in the browser.

## Notes

- The module files are unchanged from the originals except for their `<title>` tags, which now
  end in `· Forensic Medicine Workbench` so tabs and bookmarks read consistently. Each file still
  carries its own manifest and home-screen name; say the word if you want those aligned too.
- The site is responsive, respects `prefers-reduced-motion`, and prints cleanly.
- Section references in the resources follow BNS / BNSS / BSA, 2023. If the statute changes,
  the module files are the place to update, not the register.
- Citation formats are generated from `CITE_ITEMS` in `licence.html`. When you add a module
  to the register, add it there too so people can cite it directly.
- Design tokens (the `:root` block) are duplicated in `index.html` and `licence.html`. Each
  page is self-contained, like the modules. Change a colour in one, change it in both.
