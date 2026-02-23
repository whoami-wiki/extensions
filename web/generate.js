const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "dist");

// ---------------------------------------------------------------------------
// Sources — each entry becomes a page
// ---------------------------------------------------------------------------

const pages = [
  {
    slug: "index",
    title: "Overview",
    source: path.join(ROOT, "plugins/whoami/CLAUDE.md"),
  },
  {
    slug: "editorial-guide",
    title: "Editorial Guide",
    source: path.join(
      ROOT,
      "plugins/whoami/skills/editorial-guide/SKILL.md"
    ),
  },
  {
    slug: "editor",
    title: "Editor Agent",
    source: path.join(ROOT, "plugins/whoami/agents/editor.md"),
  },
  {
    slug: "words-to-watch",
    title: "Words to Watch",
    source: path.join(
      ROOT,
      "plugins/whoami/skills/editorial-guide/words-to-watch.md"
    ),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip YAML frontmatter (--- ... ---) from markdown. */
function stripFrontmatter(md) {
  return md.replace(/^---[\s\S]*?---\n*/, "");
}

/** Build the sidebar HTML. `activeSlug` gets the active class. */
function sidebar(activeSlug) {
  const links = pages
    .map((p) => {
      const href = p.slug === "index" ? "index.html" : `${p.slug}.html`;
      const cls = p.slug === activeSlug ? ' class="active"' : "";
      return `      <a href="${href}"${cls}>${p.title}</a>`;
    })
    .join("\n");

  return `  <aside class="sidebar">
    <div class="sidebar-title"><a href="index.html">whoami.wiki</a></div>
    <nav>
${links}
    </nav>
  </aside>`;
}

/** Wrap body HTML in the full page shell. */
function html(title, bodyHtml, activeSlug) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — whoami.wiki docs</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="layout">
${sidebar(activeSlug)}
  <main class="content">
${bodyHtml}
  </main>
</div>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

fs.mkdirSync(OUT, { recursive: true });

// Copy styles.css into dist
fs.copyFileSync(
  path.join(__dirname, "styles.css"),
  path.join(OUT, "styles.css")
);

for (const page of pages) {
  const raw = fs.readFileSync(page.source, "utf-8");
  const md = stripFrontmatter(raw);
  const body = marked.parse(md);
  const out = html(page.title, body, page.slug);
  const dest = path.join(OUT, `${page.slug}.html`);
  fs.writeFileSync(dest, out);
  console.log(`  ${page.slug}.html`);
}

console.log(`\nDone — ${pages.length} pages written to ${path.relative(ROOT, OUT)}/`);
