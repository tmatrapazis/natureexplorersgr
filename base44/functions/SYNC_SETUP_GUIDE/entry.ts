# syncOrganizerEvents — Setup Guide

## What this function does

`syncOrganizerEvents.ts` is a Base44 backend function that automatically scrapes hiking events from organizer websites and keeps your `HikingTrip` entity up to date using **upsert logic** (update or insert).

Every time it runs it will:
1. Read all **Organizer** records that have a `website` field set
2. Scrape each organizer's events listing page using AI to find all event URLs
3. Fetch each individual event page and extract structured data with AI
4. **If the event already exists** (matched by `external_link` URL) → compare every syncable field and **update** only the ones that changed
5. **If the event is new** → **create** a new `HikingTrip` record
6. **If nothing changed** → skip silently

---

## Step 1 — Deploy the function in Base44

The file is already in your project at:
```
functions/syncOrganizerEvents.ts
```
Base44 deploys it automatically when you save.

---

## Step 2 — Set the `website` field on your Organizer records

The `website` field should point to the **events listing page** for each organizer — not just their homepage.

| Organizer  | `website` value to set               |
|------------|--------------------------------------|
| Trekkers   | `https://trekkers.gr/programma/`     |
| (next org) | `https://example.gr/events/`         |

> Organizers without a `website` value are automatically skipped.

---

## Step 3 — Create a Scheduled Automation in Base44

1. Go to **Automations** in the Base44 sidebar
2. Click **+ New Automation**
3. Set the trigger to **Schedule**
4. Choose your preferred frequency (recommended: **Weekly on Monday at 08:00**)
5. Set the action to **Call Backend Function → syncOrganizerEvents**
6. Save and enable the automation

---

## Step 4 — Run manually for the first time

To do the initial import:
1. Go to **Functions** in Base44 → find `syncOrganizerEvents` → click **Run**
2. Check the function logs. You will see one of these outcomes per event:

| Log symbol | Meaning |
|---|---|
| `✅ Created:` | New event added to the database |
| `🔄 Updated:` | Existing event changed — the log lists the changed fields |
| `✔  No changes:` | Event already exists and is identical — skipped |
| `⏭️  Skip` | Skipped (title-based dedup guard) |
| `❌` | Error fetching or processing this event |

**Example log output:**
```
── Organizer: Trekkers (TREKKERS) ──
   Events page: https://trekkers.gr/programma/
   Found 18 event URL(s)
   ✅ Created: "Zagori 360° Adventure" (2026-05-01)
   🔄 Updated: "Lost in the Woods" — changed: [price, pricing_options, status]
   ✔  No changes: "Forest to Falls"
   ...
🏁 Sync complete — ✅ Created: 3 | 🔄 Updated: 2 | ✔ Unchanged: 13 | ❌ Errors: 0
```

---

## Optional: Run for a single organizer only

Useful for testing or re-syncing one organizer without touching others:
```
POST /syncOrganizerEvents?organizer_code=TREKKERS
```

---

## How upsert logic works

### Matching existing events
Events are matched **by URL** (`external_link` field). If the same URL is found in both the website and your database, the function treats it as an existing event and runs a diff.

### Change detection
The function compares each syncable field using **deep equality** that handles:
- Primitive values (strings, numbers) — with whitespace trimming and numeric tolerance
- Arrays (tags, departure_from, requirements) — order-independent comparison
- Object arrays (pricing_options) — serialisation-based comparison

Only fields that have actually changed are included in the update call — no unnecessary writes.

### What gets updated vs. what stays protected

| Field | Sync behaviour |
|---|---|
| `title` | ✅ Updated if changed on website |
| `description` | ✅ Updated if changed |
| `start_date` / `end_date` | ✅ Updated if changed |
| `location` | ✅ Updated if changed |
| `difficulty` | ✅ Updated if changed |
| `distance_km` / `elevation_gain_m` | ✅ Updated if changed |
| `image_url` | ✅ Updated if changed |
| `pricing_options` / `price` | ✅ Updated if changed |
| `departure_from` | ✅ Updated if changed |
| `requirements` | ✅ Updated if changed |
| `tags` | ✅ Updated if changed |
| `external_link` / `event_url` | ✅ Updated if changed |
| `status` | ⚠️ Only updated to `"cancelled"` if the website shows Sold Out. Never reset by sync. |
| `guide_id` | 🔒 Never touched — admin assigns this |
| `is_promoted` | 🔒 Never touched — admin sets this |
| `total_slots` | 🔒 Never touched — admin sets this |
| `cancel_policy` | 🔒 Never touched — admin writes this |
| `view_count` / `booked_clicks` | 🔒 Never touched — system tracked |

---

## How deduplication works for new events

When an event URL is **not** already in the database, the function checks the **title** (case-insensitive) before creating. This prevents creating duplicate trips in edge cases where an organizer has re-published an event under a new URL.

---

## Field mapping reference

| trekkers.gr field | HikingTrip field | Notes |
|---|---|---|
| Event title | `title` | Translated to English by AI |
| Start date | `start_date` | Converted from Greek to ISO format |
| End date | `end_date` | Same as start_date for single-day events |
| Location / region | `location` | Translated to English |
| Difficulty (1/5–5/5) | `difficulty` | 1–2→easy, 3→moderate, 4→challenging, 5→difficult |
| `organizer_code` | `organizer_code` | Taken from the Organizer entity |
| Prices | `pricing_options` + `price` | All pricing tiers extracted; `price` set to first option |
| Distance | `distance_km` | In kilometres |
| Elevation gain | `elevation_gain_m` | In metres |
| Banner image | `image_url` | Absolute URL |
| Departure cities | `departure_from` | Translated to English |
| Equipment list | `requirements` | Translated to English |
| Activity tags | `tags` | Mapped to allowed enum values |
| Event page URL | `external_link` + `event_url` | Both fields set — used as the match key |
| Sold out status | `status` | Set to `"cancelled"` if sold out |

---

## Adding more organizers

1. Create the Organizer record in Base44 with a unique `organizer_code`
2. Set their `website` field to their events listing page URL
3. The next sync run will automatically pick them up — no code changes needed

---

## Troubleshooting

| Problem | Likely cause & fix |
|---|---|
| No events created or updated | Check the `website` field points to the events *listing* page, not just the homepage |
| Dates are wrong or missing | The AI parses Greek dates automatically. Check the raw event page — if dates are in an unusual format, they may be missed |
| Event updated on every run | A field varies between scrapes (e.g. the AI translates a description slightly differently). You can remove `description` from `SYNCABLE_FIELDS` in the code to freeze it after first import |
| Function times out | Reduce `MAX_EVENTS_PER_ORGANIZER` at the top of the file |
| Price shows as 0 | The organizer may not have published prices yet — check the event page manually |
