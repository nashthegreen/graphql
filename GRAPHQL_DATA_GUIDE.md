# GraphQL Data Guide — Where to Find Each Value

A quick map of **which GraphQL table + filter** gives you each piece of information
shown on the site. Every query below already exists in
[`web/assets/js/queries.js`](web/assets/js/queries.js) — line numbers point straight to it.

## The big picture: only 4 tables do all the work

The whole dashboard is built from just a handful of top-level tables:

| Table | What lives in it |
|-------|------------------|
| `user` | Identity + pre-computed audit totals (login, name, email, `auditRatio`, `totalUp`, `totalDown`) |
| `transaction` | The event log. **The `type` field decides what a row means:** `xp`, `up`, `down`, `level`, `skill_*` |
| `result` | Grades for submitted projects (`grade`, `isLast`, `path`) |
| `progress` | Whether a piece of work is started/done (`isDone`, `grade`, `path`) |

Anything with an aggregate (`transaction_aggregate`, `result_aggregate`,
`progress_aggregate`) is just the same table wrapped for counts/sums.

The trick most people miss: **`transaction.type` is the discriminator.** XP, audit
up/down, level, and every skill all come from the *same* `transaction` table —
you filter by `type` to pick which one.

---

## Value-by-value lookup

### XP
- **Table:** `transaction` where `type = "xp"`
- **Query:** `xpSummary` → [queries.js:48](web/assets/js/queries.js#L48)
- **Total XP:** `transaction_aggregate { aggregate { sum { amount } } }`
- **⚠️ Gotcha:** to match the site's XP number you must filter the path:
  `path _like "/bahrain/bh-module/%"` **AND** exclude `/bahrain/bh-module/piscine-js/%`.
  Including the JS piscine inflates XP above what the platform UI shows.

### Audit ratio & audit up/down totals
- **Table:** `user` (these are pre-computed, no math needed)
- **Query:** `currentUser` → [queries.js:5](web/assets/js/queries.js#L5)
- **Fields:** `auditRatio`, `totalUp`, `totalDown`, `totalUpBonus`, `auditsAssigned`

### Individual audit transactions (the up/down history)
- **Table:** `transaction` where `type _in ["up", "down"]`
- **Query:** `auditEntries` → [queries.js:27](web/assets/js/queries.js#L27)
- **Fields:** `type`, `amount`, `path`, `isBonus`, `createdAt`, `objectId`, `userLogin`

### Level & rank
- **Table:** `transaction` where `type = "level"`, newest first, `limit: 1`
- **Query:** `ranksOverview` → [queries.js:242](web/assets/js/queries.js#L242)
  (also inside `myStatus` → [queries.js:257](web/assets/js/queries.js#L257))
- **Note:** rank is *derived from the latest level `amount`* — there's no separate
  "rank" field; the app maps level number → rank name in code.

### Skills (per-skill amounts)
- **Table:** `transaction` where `type = "skill_<name>"` (e.g. `skill_go`, `skill_js`,
  `skill_prog`, `skill_front-end`…), ordered by `amount desc`, `limit: 1`
- **Query:** `skillsOverview` → [queries.js:216](web/assets/js/queries.js#L216)
- **For "top skills" / recent skills:** `type _like "skill_%"` in
  `myStatus` → [queries.js:279](web/assets/js/queries.js#L279)

### Results (pass / fail counts + recent grades)
- **Table:** `result` (+ `result_aggregate` for counts)
- **Query:** `resultsSummary` → [queries.js:119](web/assets/js/queries.js#L119)
- **Pass:** `isLast = true` AND `grade _gte 1`
- **Fail:** `isLast = true` AND (`grade _lt 1` OR `grade _is_null`)
- **Always filter `isLast = true`** to avoid counting old attempts.

### Progress (coverage: started vs done)
- **Table:** `progress` (+ `progress_aggregate`)
- **Query:** `progressSummary` → [queries.js:156](web/assets/js/queries.js#L156)
- **Done:** `isDone = true`

### Checkpoints
- **Table:** `result` where `path _like "/bahrain/bh-module/checkpoint/%"`, `isLast = true`
- **Query:** `checkpointOverview` → [queries.js:168](web/assets/js/queries.js#L168)
- Latest checkpoint score is the single `result` at `path = "/bahrain/bh-module/checkpoint"`.

### Pass/grade enrichment for specific XP objects
- **Tables:** `result` + `progress`, filtered by `objectId _in [...]`
- **Query:** `xpEntryStatus` → [queries.js:93](web/assets/js/queries.js#L93)
- **Why:** the recent `result` list can miss some XP `objectId`s, so this fetches them
  explicitly and falls back to `progress` when a result is missing.

### Identity (name, login, email, avatar, campus)
- **Table:** `user`
- **Query:** `currentUser` → [queries.js:5](web/assets/js/queries.js#L5)

---

## Cheat sheet

| You want… | Table | Filter |
|-----------|-------|--------|
| Total XP | `transaction_aggregate` | `type=xp` + bh-module path, exclude piscine-js |
| Audit ratio | `user` | field `auditRatio` |
| Audit history | `transaction` | `type _in [up, down]` |
| Level / rank | `transaction` | `type=level`, latest 1 |
| A skill | `transaction` | `type=skill_<name>`, max amount |
| Pass/fail | `result_aggregate` | `isLast=true`, `grade _gte 1` / `_lt 1` |
| Progress done | `progress_aggregate` | `isDone=true` |
| Checkpoint | `result` | `path _like .../checkpoint/%`, `isLast=true` |
| Profile info | `user` | — |

## Exploring the full schema yourself
The complete introspection dump (all ~50 tables like `event`, `group`, `object`,
`label`, `record`, etc.) is in
[`Documentation/graphql_full_data.log`](Documentation/graphql_full_data.log).
For the dashboard, though, you only ever need the four tables above.
