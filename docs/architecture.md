# Architecture

## Two repositories

| Repository | Holds | Public |
|---|---|---|
| `qmedia-by/qmedia-ads-agent` | this one: root instructions, skills, Environment configs, docs | yes |
| `qmedia-by/google-ads-mcp` | the agency's Google Ads MCP server, a fork of `googleads/google-ads-mcp` | yes |

Both are public on GitHub, which is the single hardest constraint on the design:
no secrets, no Client names, no account ids, no address of any private resource
may land in either. See [invariants.md](./invariants.md#nothing-private-in-either-repository).

A change that spans both has a fixed rollout order — see
[changing-this-repo.md](./changing-this-repo.md#changes-that-span-both-repositories).

## What the agent connects to

Three MCP endpoints, four Providers:

| Endpoint | Providers | Hosted by |
|---|---|---|
| `https://google-ads-mcp.qmedia.by/mcp` | Google Ads | the agency |
| `https://lidfly.ru/mcp/v3` | Yandex Direct, VK | LidFly |
| `https://mcp.facebook.com/ads` | Meta | Meta |

Meta is its own endpoint because there was no other option worth taking: LidFly
does not carry it, and the alternatives are the two this page already rejects.
It also validates the shape — the third vendor cost six config files and a
skill, and nothing in the middle had to be built or released.

Connections are direct, one per vendor. **There is no gateway of ours in
front of them** — building one would mean rebuilding LidFly: normalising
incompatible tool catalogues, proxying four OAuth flows, versioning a layer of
our own. It would also put us between the agent and the vendor, so a new tool
in a hosted server would reach Managers only after our release. The price is
paid at setup: the Manager passes OAuth once per server, and the agent must
keep each Provider's vocabulary straight — that is what
[providers.md](./providers.md) is for.

## The Google Ads server

Hosted centrally, one instance, streamable-http with a FastMCP OAuth proxy.
Upstream documents a local `pipx` run over stdio; we do not use it, because it
would put `GOOGLE_ADS_DEVELOPER_TOKEN` and an OAuth client secret on every
Manager's machine. Centrally hosted, the secrets stay on the server and the
Manager gets a URL plus a browser login.

It runs in Docker on the agency's own hosting, not Cloud Run: the agency cannot
make a payment to Google, so no billing account exists. Nothing about the
integration depends on this — the OAuth client is free and Google Ads API calls
are not billed through Google Cloud. Redis sits beside it; with FastMCP's
default store, Manager sessions do not survive a container restart.

The fork adds a deliberately small delta to upstream:

| Added | Why |
|---|---|
| `planning_generate_keyword_ideas` | `KeywordPlanIdeaService` is a separate RPC and is not reachable through GAQL, so upstream cannot collect semantics at all |
| `registry_find_client`, `registry_list_clients` | upstream has no notion of a Client; `list_accessible_customers` returns bare numbers |
| `ads_mcp/access_control.py` | the public endpoint runs on the agency's developer token and needs an Account allowlist |

Not `KeywordPlanService`, not `RecommendationService`: a minimal delta is the
only thing that keeps a fork maintainable. The patch sits on a pinned upstream
commit rather than a rebase onto `main` — Google publishes no tags. The pinned
commit, every environment variable, and the deployment procedure live in the
fork's `FORK.md`, which is the authority on the server; do not restate it here.

## The Registry

The Client-to-Accounts mapping is a private Google Sheet kept by hand at the
agency. The server reads it through a service account and serves it as
`registry_find_client` / `registry_list_clients`. It is never written to by
anything, and its id appears only in the server's `.env` — never in either
repository.

It is also the server's allowlist **for Google Ads**: an Account absent from the
sheet is refused. That makes connecting a Client **one operation** — a row —
instead of a row plus a hand-copied `.env` variable that drifts from it.

For every other Provider the same sheet is navigation and nothing more, because
their cabinets are on servers that are not ours and enforce nothing of ours.
The distinction is load-bearing and is set out in
[invariants.md](./invariants.md#the-registry-is-a-boundary-for-google-ads-and-navigation-for-everyone-else).

The behaviour of the sheet under failure, and the exact columns parsed, are
documented in the fork's `FORK.md`; the rules the agent must follow are in
[invariants.md](./invariants.md#what-the-registry-covers-and-what-its-silence-means).

## The skills pipeline

```text
skills-source/<skill>/SKILL.md      edited by hand — the only source
        │  node scripts/sync-skills.mjs
        ├──> .agents/skills/        Codex, Cursor, OpenClaw, VS Code
        ├──> .claude/skills/        Claude Code, Cursor (legacy path)
        └──> .gemini/skills/        Gemini CLI
```

Three target directories for five Environments, because a directory is
created only where an Environment reads no one else's — see
[environments.md](./environments.md). The generator is non-destructive: it
refuses to overwrite a copy that diverges from source and is absent from the
previous run's manifest, since that file was edited by hand and losing the edit
silently would be worse than failing.

### And how it reaches a Manager

The pipeline above ends in this repository. A Manager's copy is a clone, so a
merge into `dev` is not delivery — a `git pull` on their machine is. They do not
run one: `.codex/hooks.json` registers a `SessionStart` hook that fast-forwards
the checkout at the start of every chat and tells the agent to ask for a new
one, because instructions and skills are read once, when a chat begins.

Two properties of that hook decide its shape. Codex will not run a project hook
until the human presses **Trust** in settings — so the skill `tool-update` does
the same job on the phrase «обнови инструмент», and a Manager who skipped the
trust step is not stranded. And that trust is bound to the contents of
`hooks.json`: editing it sends the hook back for re-approval, and until someone
notices, updates stop arriving silently. Hence one immutable line in the JSON
calling `.codex/update-check.sh`, with the logic in the script, where it can
change freely.

MCP configuration is the opposite case — every Environment needs its own file,
because the schemas differ (`mcpServers` vs `servers`, `url` vs `serverUrl` vs
`httpUrl`). The addresses must match across all six, and
`scripts/check-mcp-configs.mjs` enforces that.

## Alternatives rejected

One line each. Enough to stop them being proposed again.

- **Fork `direct-mcp-ai-project`** — its root instructions are built entirely
  around one vendor's meta-layer; unpicking that would take longer than starting
  clean. Its `sync-skills.mjs` and the "edit only `skills-source/`" discipline
  were carried over deliberately.
- **A gateway of our own in front of all Providers** — see above; it is
  rebuilding LidFly and making ourselves a release bottleneck.
- **Cloud Run + IAM for access control** — no billing account, and IAM wants a
  Google identity token per request, which MCP clients cannot send.
- **`GOOGLE_ADS_ALLOWED_CUSTOMER_IDS`** — a hand-copied second list of Accounts;
  it drifted from the Registry, and the symptom was a refusal for an Account the
  Registry already had. Deleted; the Registry is the allowlist.
- **`registry.yaml` in this repository** — the repository is public, so the first
  real Client in it would publish the agency's client list. Never happened; the
  file only ever held a template.
- **A shared Google account for all Managers** — password sharing; revoking
  access for one leaver means changing it for everyone.
- **Google Workspace MCP for artefacts** — the agency has no Workspace, and a
  self-hosted community server means a second service and a second OAuth that
  expires weekly, all to save a CSV.
- **Third-party MCP servers with a keyword planner built in** (gomarble and
  similar) — reintroduces the vendor dependency the project is moving away from.
- **Generating semantics with an LLM instead of the API** — lists without demand
  figures; Managers used to Wordstat spot it immediately.
- **Unified write guardrails across all Providers** — needs a shared vocabulary
  over incompatible APIs, i.e. the gateway again.
- **Reaching Meta through LidFly** — it does not carry Meta and there is no sign
  it will; its catalogue is Yandex Direct, VK, Metrika, Avito and Wordstat.
- **A Meta application of our own** — an agency app needs Advanced Access to
  `ads_mcp_management` and App Review for it. The AI-connectors route needs
  neither, and each Manager signs in as themselves, which is what every other
  Provider here already does.
- **A percentage cap on Meta budget edits** — a number that goes stale, and one
  that invites splitting an edit in two rather than reconsidering it. The
  protection is that the Manager was shown the old and new value.
