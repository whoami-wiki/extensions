# whoami-wiki

This is a personal encyclopedia documenting the wiki owner's life through
wiki pages. The wiki owner's details can be found in the [[Me]] page — read it to learn their name and use it when referring to them instead of saying "the wiki owner" or similar.

All wiki operations use the `wai` CLI. If the `wai` command is not available, install it first:

```
curl -fsSL https://whoami.wiki/cli/install.sh | bash
```

## Sources
Sources can be listed with `wai source list`, which returns all
pages in the wiki's source namespace. Source pages have information about different primary sources of data available that can be used for editorial purposes. Each source page has a unique snapshot id in the infobox that can be used to look up their info in the vault

Source pages contain a **Querying** section with instructions for programmatic access to the vault (located in Application Support/whoami/vault) — SQL queries for databases, JSON parsing for exports, file lookup via snapshot hashes. Always read the relevant source page before attempting to extract data.

Use `wai snapshot <dir>` to snapshot a directory. It hashes files into `vault/objects/`, writes a manifest to `vault/snapshots/`, and creates a `Source:` wiki page. The vault is located at `~/Library/Application Support/whoami/vault` (configurable via `WAI_VAULT_PATH`).

Structure of the vault:
- objects/
  - 00/
    - 00b9da...350b19
  - 01/
  - ...
- snapshots/
  - 8af96b7a06247676.json

Structure of snapshot.json:

```
{
  "files": [
    {
      "path": "18455129814@s.whatsapp.net/0/0/00b35087-9f6e-4b37-8fd3-74caeece3ee7.jpg",
      "hash": "9b980e25709b348676c2f32b261135b141568d1c45e7dc5a9fd78e17679ea0da"
    },
    ...
  ],
}
```

## Tasks

Tasks are first-class wiki pages in the `Task:` namespace. Each task page has an `{{Infobox Task}}` template with metadata (id, status, source, timestamps) and a description body. Tasks are categorized by status: `[[Category:Pending tasks]]`, `[[Category:In-progress tasks]]`, `[[Category:Done tasks]]`, `[[Category:Failed tasks]]`.

**Lifecycle**: pending → in-progress → done/failed. Failed tasks can be requeued back to pending.

When working from the task queue:
1. `wai task list` to see pending tasks
2. `wai task read <id>` to understand what's needed
3. `wai task claim <id>` to mark it in-progress before starting
4. Do the work (follow the normal workflow below)
5. `wai task complete <id> -m "summary of what was done"` on success
6. `wai task fail <id> -m "reason"` if the task can't be completed — e.g. missing sources, ambiguous scope, blocked by unanswered questions

Tasks may reference a source via the `source` field (e.g. `Source:WhatsApp Alice`). Always read the linked source page before starting work.

## Architecture
- MediaWiki instance at localhost:8080
- `wai` CLI provides read/write access (see `wai --help`)
- Pages are written in wikitext

## CLI Quick Reference
```bash
wai source list                   # list all sources
wai read "Page Name"              # read a page
wai search "query"                # full-text search
wai create "Page" -c "content"    # create new page
wai edit "Page" --old "x" --new "y"  # find-and-replace
wai edit "Page" --old "x" --new "y" --dry-run  # preview changes
wai edit "Page" --old "x" --new "y" --replace-all  # replace all occurrences
wai write "Page" -f draft.wiki    # overwrite page
wai upload photo.jpg              # upload a file
wai section list "Page"           # list sections
wai section read "Page" 3         # read a specific section
wai section update "Page" 3 -c "content"  # update a section
wai talk read "Page"              # read talk page
wai talk read "Page" --thread "Subject"   # read a specific thread
wai talk create "Page" -s "Subject" -c "content"
wai link "Page"                   # show links in/out
wai category                      # list all categories
wai changes                       # recent changes
wai place "query"                 # look up a place (Google Places)
wai snapshot <dir>                # snapshot a directory into the vault
wai snapshot <dir> --name "Name"  # snapshot with custom source page name
wai snapshot <dir> --dry-run      # preview without writing
wai task list                     # list pending tasks
wai task list --status done       # list tasks by status
wai task read 0001                # read a task
wai task create -m "description"  # create a new task
wai task create -m "msg" --source "Source:X"  # create with source ref
wai task claim 0001               # claim a pending task
wai task complete 0001 -m "output"  # complete a task
wai task fail 0001 -m "reason"    # fail a task
wai task requeue 0001             # requeue a failed task
```

## Workflow
1. User directs agent to write about a topic
2. Agent explores relevant sources
3. Agent drafts page, posts questions to talk page
4. User answers questions
5. Agent refines and publishes

## Conventions
- Use third person ("Jeremy visited..." not "I visited...")
- Link to people, places, events with [[wikilinks]]
- Pages use a lead paragraph followed by thematic/chronological sections
- Do NOT use {{Gap}} inline — post unknowns as individual talk page threads with {{Open}}/{{Closed}} status
- Use {{Blockquote}} for preserving authentic voice from sources
- **Source identifiers**: Person identifiers (WhatsApp JIDs, chat session Z_PKs, Facebook thread paths) go in `{{Cite source}}` entries in the `== Sources ==` section. Include snapshot ID, date range, and identifiers in the `note` field so future research can retrace queries. See the Vishhvak Srinivasan page for the canonical example.

## When working on a page
- Check Talk:PageName for any existing context or locks
- Post your intent before starting: "Working on chronology section"
- Post questions as you encounter gaps
- Remove your lock when done

## Editor workflow

When writing or updating pages, follow these phases:

### Phase 0: Task intake

If you're working from the task queue rather than a direct user request:

1. **Claim the task** before starting: `wai task claim <id>` — this sets the status to in-progress so other agents don't pick it up
2. **Read the task page** for the full description: `wai task read <id>`
3. If the task references a source (e.g. `Source:WhatsApp Alice`), read that source page first — it contains querying instructions
4. Proceed with Phases 1–4 below as normal
5. **When done**, complete or fail the task:
   - `wai task complete <id> -m "Created page [[Coorg Trip (2012)]], posted 3 gaps to talk page"` — summarize what was produced
   - `wai task fail <id> -m "Source vault not accessible"` — if you can't proceed, explain why so the task can be triaged and requeued later

### Phase 1: Context gathering

1. **Search the wiki** for existing pages on the topic: `wai search "query"`
2. **Check the talk page** for prior context or locks: `wai talk read "Page"`
3. **Post your intent** to the talk page before starting: `wai talk create "Page" -s "Working on page" -c "Starting research for ..."`

### Phase 2: Source research

1. **List available sources**: `wai source list`
2. **Read relevant source pages** — these contain querying instructions for programmatic access to the vault. For example, the WhatsApp source page explains how to query ChatStorage.sqlite, and the Facebook source page explains the JSON message format.
3. **Follow the querying recipes** in source pages to extract data. This means running SQL queries against databases, reading JSON files via snapshot hashes, etc.
4. **Check existing person pages** for source identifiers: `wai read "Person Name"` — look at their `{{Cite vault}}` entries for JIDs, session PKs, thread paths, and other cross-references that help locate data.

### Phase 3: Drafting

Follow the editorial guide below for page type conventions, editorial standards, and citation templates.

**Determine page type**:
- **Person page** (`Jane Doe`) — encyclopedic hub, documentary voice. Lead paragraph: identity first, relationship in one sentence, arc in one more. Link out to episode pages for detailed stories.
- **Episode page** (`Jane and the Tempelhof Disaster`) — self-contained narrative. Create when 3+ voice notes tell a connected story or the event needs more than two paragraphs.

**Structure**:
- Lead paragraph with key identifying information
- Thematic or chronological sections with `== Section ==` headers
- `== References ==` section with `<references />`
- `== Bibliography ==` section with `{{Cite vault}}` entries

**Inline citations** — use `<ref>` tags with the appropriate template:
- `{{Cite message|snapshot=...|date=...|thread=...|note=...}}` for text messages
- `{{Cite voice note|number=...|date=...|speaker=...|snapshot=...|note=...}}` for voice notes
- `{{Cite photo|file=...|hash=...|date=...|snapshot=...|note=...}}` for photos
- `{{Cite video|file=...|date=...|snapshot=...|note=...}}` for video
- Include identifiers (JIDs, Z_PKs, thread paths) in `note` so future research can retrace your steps. Use named refs (`<ref name="...">`) for reuse.

**Other conventions**:
- Do NOT use `{{Gap}}` inline — post each unknown as a talk page thread (see Phase 4)
- `{{Blockquote|Quote text|Attribution, date}}` — only for extended passages; integrate short quotes grammatically
- Use wikitables for statistics and structured data
- Link to people, places, events with `[[wikilinks]]`
- Add categories: `[[Category:People]]`, `[[Category:Trips]]`, etc.

### Phase 4: Publishing

1. **Create or update the page**: `wai create "Page" -c "content"` or `wai write "Page" -f draft.wiki`
2. **Post each gap as its own talk page thread** (in the Active gaps section) with a descriptive subject: `wai talk create "Page" -s "Who attended the dinner on Nov 12?" -c "{{Open}}\nThe photos show 5 people but only 3 are identified..."` — prefix thread content with `{{Open}}` (or `{{Closed}}` once resolved)
3. **Log your work** on the talk page under Agent log: task ID, date, what changed, link to task page
4. **Remove your talk page lock** when done

---

## Editorial guide

### Page types

#### Person pages

**Namespace**: Main (e.g. `Jane Doe`)

Encyclopedic article about a person. Documentary voice: third person, past tense, factual. The person page is a hub that links out to episode pages.

**Lead paragraph**: Biographical identity first, relationship to wiki owner in one sentence, arc in one more. No statistics in the lead — save those for a dedicated section. No emotional framing.

> Jane Doe (born 3 May 1997) is a Berlin-based photographer and former classmate. She and the wiki owner exchanged 6,200 Instagram DMs between March 2021 and May 2022, the largest one-on-one thread in the archive. They connected over film photography, collaborated on a zine, and met in person in Berlin in November 2021. The conversation faded after Jane moved to Tokyo in early 2022.

**What belongs**: Biographical details, chronological arc (summarized not exhaustive), key statistics, links to episode pages, media embeds, source citations.

**What doesn't belong**: Full voice note transcriptions, raw research notes, detailed retellings of specific episodes (those get their own episode pages).

**Blockquote discipline**: Only quote when exact words matter more than the information — confessions, turning points, self-descriptions that can't be paraphrased without losing the voice. Let paraphrasing carry the rest.

**Episode references**: When the chronological arc mentions a story with its own episode page, summarize in one sentence and link out:

```wikitext
On 14 August, Jane described a disastrous shoot at Tempelhof
in a series of five voice notes (see [[Jane and the Tempelhof Disaster]]).
```

#### Episode pages

**Naming**: `{Person} and the {Episode Title}` (e.g. `Jane and the Tempelhof Disaster`)

Self-contained page for a specific story, event, or extended narrative. More narrative latitude than person pages, but still third-person and factual. The storytelling comes from sequencing, detail, and well-chosen quotes — not from the writer's adjectives.

**Create when**: 3+ voice notes telling a connected story, or a sustained back-and-forth that would take more than two paragraphs to tell properly.

**What belongs**: Full contextual setup, the story with detail, all relevant voice note transcriptions inline, audio/video embeds, surrounding messages, links back to person page and related episodes.

**What it should feel like**: Reading one should feel like being shown a specific memory. Beginning, middle, end.

### Editorial standards

#### Core principles

1. **One canonical home** — every piece of content lives in one place. Other pages link to it; they don't duplicate it.
2. **Prefer splitting to growing** — a story that takes more than two paragraphs deserves its own page.
3. **Documentary voice on person pages** — third person, past tense, factual. Like Wikipedia.
4. **Episode pages allow storytelling** — still third-person and factual, but more narrative.

#### Don't interpret for the reader

- **Don't editorialize**: Replace adjectives with specifics. "They exchanged 1,800 messages in five days, averaging 360 per day" — not "The conversation density was staggering."
- **Don't inflate significance**: Cut "marking a pivotal turning point" and "reflecting a broader shift." If something is significant, facts demonstrate it without a caption.
- **Don't use promotional language**: No "vibrant," "rich," "renowned," "groundbreaking," "nestled," "showcases."
- **Don't attribute vaguely**: No "observers have noted" or "friends describe her as." Cite specific sources.

#### Prose quality

- **Say "is" when you mean "is"**: Not "stands as" or "serves as."
- **Keep sentences short**: Split anything over ~40 words.
- **Vary rhythm**: Mix short and long sentences. Avoid the "rule of three" tic.
- **Use punctuation precisely**: Don't overuse em dashes as a Swiss Army knife.
- **Don't cycle through synonyms**: If you said "conversation," say "conversation" again.
- **Avoid formulaic transitions**: Cut "moreover," "furthermore," "notably," "additionally."
- **Don't frame by negation**: State what something is, not what it isn't.
- **Don't end sections with summaries**: No "In summary," "Overall," "In conclusion."

#### Words to watch

Certain words and phrases appear so frequently in low-quality encyclopedic prose that they've become red flags during editing. This is not a banned word list — context matters. But when these appear, pause to ask whether the sentence is actually saying something, or just performing the act of saying something.

**Significance words**: pivotal, crucial, vital, key (as adjective), fundamental, instrumental, transformative, groundbreaking, indelible, enduring, profound, testament

**Promotional words**: vibrant, rich (figurative), renowned, nestled, boasts, showcases, exemplifies, stunning, breathtaking, remarkable, extraordinary, spectacular, masterful

**Empty intensifiers**: genuine/genuinely, truly, deeply, incredibly, remarkably, undeniable, unmistakable

**Vague framing**: it's important to note, it is worth noting, no discussion would be complete without, what began as X evolved into Y, reflecting a broader trend

**Inflated verbs**: stands as, serves as (when "is" will do), marks/represents (a turning point), underscores, highlights (as verb), fosters, garners, encompasses, cultivates

**Superficial connectors**: moreover, furthermore, notably, additionally (sentence-initial), on the other hand, in terms of

**The fix**: Delete the word or phrase and see if the sentence still works. It almost always does. If the sentence collapses without the filler, that's a sign the sentence had nothing to say.

#### Quoting conventions

Use direct quotes when:
- The exact words matter (confessions, self-descriptions, turning points)
- The phrasing is distinctive and can't be paraphrased without losing character
- The quote is short (under ~30 words)

Don't quote:
- Routine factual statements that can be paraphrased
- Three quotes in a row saying similar things
- To show off the archive

Integrate quotes grammatically into sentences. Save `{{Blockquote}}` for extended passages (2+ sentences) that need to stand alone.

### Talk page structure

Talk pages use these sections as needed, in this order. Omit any with no content.

1. **Active gaps** — open editorial questions marked `{{Open}}`
2. **Resolved** — closed questions marked `{{Closed}}`, corrected ones `{{Superseded}}`
3. **Editorial decisions** — choices about structure, scope, voice, what to include/exclude
4. **Infrastructure** — technical issues and their resolutions
5. **Agent log** — one entry per task: ID, date, what changed, link to task page
6. **Research notes** — index of raw research materials (what exists, where it is, which pages consumed it)
7. **Voice note transcriptions** — complete chronological index with inline audio embeds

#### Active gaps

```wikitext
=== Birth year unknown ===
{{Open}}
Likely 1996-1998 based on contextual clues. Never stated directly in DMs.
Would require external source to confirm.
```

#### Resolved

```wikitext
=== Did they meet in person? ===
{{Superseded}}
Previously resolved as one meeting (dinner, Nov 12).

{{Closed}}
Three meetings confirmed via WhatsApp thread (snapshot 3f0390a3...):
dinner (Nov 12), gallery opening (Nov 13), darkroom session (Nov 14).
```

#### Agent log

```wikitext
=== Task:0008 — Initial page creation ===
2026-02-15. Created page from Instagram DM research (6,200 messages).
Posted 3 open gaps. See [[Task:0008]].
```

#### What does NOT belong on talk pages

- Reader-facing content (goes on person/episode pages)
- Duplicate research indexes

### Citation system

Inline citations use `<ref>` tags rendered via `<references />` in a `== References ==` section. This is standard MediaWiki.

#### Inline citation templates

**Cite message** — for text messages (DMs, chats):
```wikitext
<ref name="ig-2021-04-15">{{Cite message|snapshot=a1b2c3d4e5f6
|date=2021-04-15|thread=janedoe_12345|note=Family background exchange}}</ref>
```

**Cite voice note** — for voice note content:
```wikitext
<ref>{{Cite voice note|number=7|date=2021-06-03|speaker=Jane
|snapshot=a1b2c3d4e5f6|note=Darkroom discovery story}}</ref>
```

**Cite photo** — for facts derived from photos:
```wikitext
<ref>{{Cite photo|file=IMG_2847.jpg|hash=...|date=2021-05-20
|snapshot=a1b2c3d4e5f6|note=University ID confirming enrollment}}</ref>
```

**Cite video** — for video content:
```wikitext
<ref>{{Cite video|file=berlin_gallery_opening.mp4|date=2021-11-12
|snapshot=a1b2c3d4e5f6|note=Gallery opening footage}}</ref>
```

All templates include: **snapshot** (vault hash), **date**, **note** (human-readable description).

#### Bibliography template

**Cite vault** — for the Bibliography section, describes full vault snapshots consulted:
```wikitext
{{Cite vault|type=messages|snapshot=a1b2c3d4e5f6
|timestamp=2021-03-01/2022-05-15|note=Instagram DM thread with Jane Doe}}
```

Additional fields: **type** (messages, photos, video, etc.), **timestamp** (date range).

#### When to cite

**Always cite**: Biographical facts, direct quotes, specific event dates, statistics, claims corrected or disputed on the talk page.

**Don't need citations**: Broadly sourced observations, information already attributed inline with a date, episode page content drawn from a defined set of voice notes listed at the top.

#### Named refs for reuse

```wikitext
Jane's mother is from Munich.<ref name="ig-2021-04-15" />
Her father works in Zurich.<ref name="ig-2021-05-02">
{{Cite message|snapshot=a1b2c3d4e5f6|date=2021-05-02
|thread=janedoe_12345|note=Family details, father in Zurich}}</ref>
She has a younger brother named Max.<ref name="ig-2021-04-15" />
```

#### Page structure

Every person and episode page ends with:

```wikitext
== References ==
<references />

== Bibliography ==
{{Cite vault|type=messages|snapshot=a1b2c3d4e5f6
|timestamp=2021-03-01/2022-05-15|note=Instagram DM thread with Jane Doe}}
{{Cite vault|type=voice_notes|snapshot=b2c3d4e5f6a1
|timestamp=2021-04-12/2021-06-03|note=47 voice notes, Jane and wiki owner}}
```

**References** = inline citations tracing specific claims to specific moments in the vault.

**Bibliography** = full vault snapshots consulted for the page overall.

### Namespaces

| Namespace | Prefix | ID | Purpose |
|-----------|--------|----|---------|
| Main | (none) | 0 | Person and episode pages |
| Talk | `Talk:` | 1 | Editorial process and research notes |
| Source | `Source:` | 100 | Data source documentation |
| Task | `Task:` | 102 | Agent work logs |
