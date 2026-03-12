/**
 * syncOrganizerEvents.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Nature Explorers — Multi-organizer automated event scraper (upsert mode)
 *
 * How it works:
 *  1. Reads every Organizer record that has a `website` field set
 *  2. Auto-discovers the events listing page from the organizer homepage
 *  3. Extracts individual event URLs from the listing page using AI
 *  4. For each event URL, fetches the detail page and extracts structured data
 *  5. Existing event check: matches by `event_url` OR `external_link` (both checked)
 *       → If found and data changed: updates only the changed fields
 *       → If found and nothing changed: skips
 *  6. New event: deduplicates by title, then creates a new HikingTrip record
 *
 * Data conventions (from the real HikingTrip export):
 *  - `event_url`     = the event/product detail page URL (also used for booking on
 *                      organizers like Trekkers whose site handles bookings directly)
 *  - `external_link` = same as event_url for organizer-hosted booking, or the
 *                      event page URL when booking redirects to an external platform
 *  - `description`   = rich HTML (Greek), preserved as-is from source
 *  - `location`      = Greek place name (e.g. "Μαίναλο", "Ζαγόρι")
 *  - `organizer_code`= integer, read from the Organizer entity
 *  - `pricing_options` labels = kept in Greek (e.g. "Μονόκλινο", "Δίκλινο")
 *
 * Fields NEVER overwritten by sync (admin-managed):
 *   guide_id, is_promoted, total_slots, cancel_policy, view_count, booked_clicks
 *   status — only updated to "cancelled" when website shows Sold Out
 *
 * Setup:
 *  - Set the `website` field on each Organizer to their website homepage
 *    (e.g. "https://trekkers.gr/"). The function will auto-discover where
 *    their events listing page is.
 *  - Organizers without a `website` value are skipped automatically.
 *
 * Recommended schedule: Daily or weekly via Base44 Automations.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/** Milliseconds between HTTP requests — ~1 req/sec is polite for public sites. */
const REQUEST_DELAY_MS = 1_200;

/** Max individual event pages to process per organizer per run. */
const MAX_EVENTS_PER_ORGANIZER = 50;

/**
 * Fields the sync may update on existing records.
 * Admin-only fields (guide_id, is_promoted, total_slots, cancel_policy,
 * view_count, booked_clicks) are intentionally excluded.
 */
const SYNCABLE_FIELDS = [
  "title", "description", "start_date", "end_date", "location", "difficulty",
  "distance_km", "elevation_gain_m", "image_url", "pricing_options", "price",
  "departure_from", "requirements", "tags", "event_url", "external_link",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; NatureExplorersBot/1.0; +https://natureexplorers.gr)",
      "Accept-Language": "el,en;q=0.9",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
  return response.text();
}

/**
 * Normalises a URL for comparison — removes trailing slashes and lowercases
 * so that "https://example.gr/product/foo/" and "https://example.gr/product/foo"
 * are treated as the same event.
 */
function normaliseUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, "");
}

/**
 * Deep-equality check for primitives, arrays, and plain objects.
 * Used to detect changed fields between syncs.
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    if (a.every(x => typeof x !== "object")) {
      return [...a].sort().join("||") === [...b].sort().join("||");
    }
    return JSON.stringify(a) === JSON.stringify(b);
  }

  if (typeof a === "object") {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.join() !== keysB.join()) return false;
    return keysA.every(k => deepEqual(a[k], b[k]));
  }

  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) < 0.001;
  }

  return String(a).trim() === String(b).trim();
}

/**
 * Builds the HikingTrip data object from AI-extracted event data.
 * Only includes fields that the AI successfully returned.
 */
function buildTripData(
  extracted: Record<string, any>,
  organizerCode: number | string,
  eventUrl: string,
  isSoldOut: boolean
): Record<string, any> {
  const data: Record<string, any> = {
    title:          extracted.title,
    start_date:     extracted.start_date,
    location:       extracted.location,
    difficulty:     extracted.difficulty,
    organizer_code: organizerCode,
    // Both URL fields set to the event detail page URL.
    // For organizers whose booking happens on their own site (e.g. Trekkers),
    // event_url = external_link = the product page URL.
    event_url:      eventUrl,
    external_link:  eventUrl,
  };

  if (extracted.end_date)                             data.end_date          = extracted.end_date;
  if (extracted.description)                          data.description       = extracted.description;
  if (typeof extracted.distance_km === "number")      data.distance_km       = extracted.distance_km;
  if (typeof extracted.elevation_gain_m === "number") data.elevation_gain_m  = extracted.elevation_gain_m;
  if (extracted.image_url?.startsWith("http"))        data.image_url         = extracted.image_url;
  if (extracted.pricing_options?.length) {
    data.pricing_options = extracted.pricing_options;
    // Populate legacy price field from the first (lowest) pricing option
    const prices = extracted.pricing_options.map((o: any) => o.price).filter(Number.isFinite);
    if (prices.length) data.price = Math.min(...prices);
  }
  if (extracted.departure_from?.length)               data.departure_from    = extracted.departure_from;
  if (extracted.requirements?.length)                 data.requirements      = extracted.requirements;
  if (extracted.tags?.length)                         data.tags              = extracted.tags;

  // Status: only force to "cancelled" if sold out; never revert automatically
  if (isSoldOut) data.status = "cancelled";

  return data;
}

/**
 * Compares fresh scraped data against an existing HikingTrip record.
 * Returns an object with ONLY the changed fields, or null if nothing changed.
 * Admin-managed fields are excluded from the comparison entirely.
 */
function computeDiff(
  existing: Record<string, any>,
  fresh: Record<string, any>,
  isSoldOut: boolean
): Record<string, any> | null {
  const diff: Record<string, any> = {};

  for (const field of SYNCABLE_FIELDS) {
    const freshVal = fresh[field];
    if (freshVal === undefined || freshVal === null) continue; // AI didn't extract → don't overwrite

    if (!deepEqual(existing[field], freshVal)) {
      diff[field] = freshVal;
    }
  }

  // Status: only push to "cancelled" when sold out
  if (isSoldOut && existing.status !== "cancelled") {
    diff.status = "cancelled";
  }

  return Object.keys(diff).length > 0 ? diff : null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP A: Discover the events listing page and extract event URLs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given an organizer's website URL (which is typically their homepage),
 * this function first tries to extract event URLs directly from that page.
 * If none are found, it asks the AI to locate the events/program listing page,
 * then extracts URLs from there.
 * This handles both cases: website = homepage, or website = events page.
 */
async function discoverEventUrls(
  base44: any,
  websiteUrl: string
): Promise<string[]> {
  const html = await fetchPage(websiteUrl);
  const domain = new URL(websiteUrl).hostname;

  const discovery = await base44.integrations.Core.InvokeLLM({
    prompt: `You are analyzing a Greek hiking/outdoor activity organizer's website.
Website URL: ${websiteUrl}

Your task — two in one:
1. If this page directly LISTS hiking events/trips (product cards, event items), extract all individual event URLs.
2. If this page is a homepage or other non-listing page, find the URL that leads to the events or program listing page.
   Events listing pages are typically at paths like: /programma/, /events/, /ekdromees/, /trips/, /activities/, /schedule/

Rules for event URLs:
- They must be absolute URLs starting with https://
- They must belong to the domain: ${domain}
- They must point to specific events (not category pages or the homepage)
- Common patterns: /product/..., /event/..., /trip/..., /ekdromh/..., /listing/...

If you find event URLs directly on this page, return them in event_urls.
If this is a homepage and you can see a link to the events listing page, return it in events_listing_url.
If neither, return empty arrays/null.

HTML content (first 50,000 chars):
${html.substring(0, 50_000)}`,
    response_json_schema: {
      type: "object",
      properties: {
        event_urls: {
          type: "array",
          items: { type: "string" },
          description: "Absolute event detail page URLs found directly on this page",
        },
        events_listing_url: {
          type: "string",
          description: "URL of the events/program listing page (if this is a homepage). Null if not found or if this IS the listing page.",
        },
      },
      required: ["event_urls"],
    },
    add_context_from_internet: false,
  });

  // Filter discovered event URLs to the same domain
  let eventUrls: string[] = (discovery.event_urls || []).filter(
    (url: string) =>
      typeof url === "string" &&
      url.startsWith("https://") &&
      url.includes(domain)
  );

  // If we got event URLs directly from this page, we're done
  if (eventUrls.length > 0) {
    return eventUrls;
  }

  // Otherwise, try to navigate to the events listing page first
  const listingUrl = discovery.events_listing_url;
  if (typeof listingUrl === "string" && listingUrl.startsWith("http")) {
    console.log(`   → Navigating to events listing: ${listingUrl}`);
    await sleep(REQUEST_DELAY_MS);

    const listingHtml = await fetchPage(listingUrl);
    const listingDomain = new URL(listingUrl).hostname;

    const listingResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract all individual event/product page URLs from this hiking events listing page.

Rules:
- Return only URLs pointing to specific events (common paths: /product/, /event/, /trip/, /listing/, /ekdromh/)
- Return absolute URLs starting with https://
- Only include URLs from the domain: ${listingDomain}
- No duplicates, no navigation links, no category pages

HTML content (first 50,000 chars):
${listingHtml.substring(0, 50_000)}`,
      response_json_schema: {
        type: "object",
        properties: {
          event_urls: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["event_urls"],
      },
      add_context_from_internet: false,
    });

    return (listingResult.event_urls || []).filter(
      (url: string) =>
        typeof url === "string" &&
        url.startsWith("https://") &&
        url.includes(listingDomain)
    );
  }

  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP B: Extract structured HikingTrip data from an event detail page
// ─────────────────────────────────────────────────────────────────────────────

async function extractEventData(
  base44: any,
  eventUrl: string,
  organizerName: string
): Promise<Record<string, any>> {
  const html = await fetchPage(eventUrl);

  return await base44.integrations.Core.InvokeLLM({
    prompt: `You are extracting hiking trip data from a Greek website for an event marketplace called Nature Explorers.
The organizer is: ${organizerName}
The event URL is: ${eventUrl}

Extract all available fields from this page. Follow these rules carefully:

━━━ LANGUAGE ━━━
Keep ALL text in its original language (Greek). Do NOT translate anything.
The marketplace is Greek-first: titles, descriptions, locations, and pricing labels
must remain exactly as they appear on the source page.

━━━ DESCRIPTION ━━━
Extract the main event description as CLEAN HTML.
- Use <p>, <h2>, <h3>, <ul>, <li>, <strong>, <em>, <br> tags only
- Remove navigation, booking forms, header, footer, sidebars, cookie banners
- Keep emojis and special characters as-is (they are part of the Greek content)
- Keep the structure (headings, lists, paragraphs) from the original page
- This must be rich, informative HTML — not a summary

━━━ DATES ━━━
Convert all dates to ISO format YYYY-MM-DD.
Greek month names: Ιανουάριος/ΙΑΝ=01, Φεβρουάριος/ΦΕΒ=02, Μάρτιος/ΜΑΡ=03,
Απρίλιος/ΑΠΡ=04, Μάιος/ΜΑΙ=05, Ιούνιος/ΙΟΥ=06, Ιούλιος/ΙΟΥΛ=07,
Αύγουστος/ΑΥΓ=08, Σεπτέμβριος/ΣΕΠ=09, Οκτώβριος/ΟΚΤ=10,
Νοέμβριος/ΝΟΕ=11, Δεκέμβριος/ΔΕΚ=12.
For single-day events set end_date = start_date. Default year = 2026.

━━━ DIFFICULTY ━━━
Map to the enum:
- Difficulty 1/5 or 2/5 or "Εύκολο" → "easy"
- Difficulty 3/5 or "Μέτριο" → "moderate"
- Difficulty 4/5 or "Δύσκολο" → "challenging"
- Difficulty 5/5 or "Πολύ Δύσκολο" → "difficult"

━━━ PRICES ━━━
Convert Greek comma-decimal (e.g. "195,00 €") to a plain number (195.00).
Keep labels EXACTLY as on the source page — in Greek (e.g. "Μονόκλινο", "Δίκλινο",
"Τρίκλινο", "Τιμή Α", "Παιδί" etc.). Do NOT translate them.
Create one pricing_options entry per price tier. If only one price, label = "Τιμή συμμετοχής".

━━━ LOCATION ━━━
Extract the mountain, region, or place name in Greek exactly as it appears
(e.g. "Μαίναλο", "Ζαγόρι", "Πήλιο", "Σμόλικας", "Καλάβρυτα").

━━━ DEPARTURE POINTS ━━━
Extract city names from the pickup / departure section ("Σημεία Επιβίβασης" or similar).
Keep in Greek (e.g. "Αθήνα", "Θεσσαλονίκη", "Πάτρα").

━━━ REQUIREMENTS ━━━
Extract gear/equipment items from the "Εξοπλισμός" section.
Keep in Greek as listed.

━━━ IMAGE ━━━
Extract the primary banner/header image URL. Must be an absolute https:// URL.

━━━ TAGS ━━━
Only use values from this EXACT list:
"beginner-friendly", "sunrise-hike", "sunset-hike", "pet-friendly", "family-friendly",
"challenging", "camping", "multi-day", "guided", "photography", "wildlife", "waterfall",
"summit", "coastal", "forest", "bus", "organized-carpooling"

Auto-tag rules:
- More than 1 day → "multi-day"
- Guide/leader mentioned → "guided"
- Mountain summit as destination → "summit"
- Camping overnight → "camping"
- Bus/coach (πούλμαν/λεωφορείο) transport → "bus"
- Carpooling / car sharing → "organized-carpooling"
- Waterfalls in itinerary → "waterfall"
- Coastal or sea route → "coastal"
- Forest route → "forest"
- Easy / suitable for beginners → "beginner-friendly"

━━━ SOLD OUT ━━━
Set is_sold_out: true if you see "Sold Out", "Εξαντλήθηκαν", or a disabled booking button.

HTML content (first 60,000 chars):
${html.substring(0, 60_000)}`,
    response_json_schema: {
      type: "object",
      properties: {
        title:            { type: "string",  description: "Event title — original language, do not translate" },
        description:      { type: "string",  description: "Main event description as clean HTML in Greek" },
        start_date:       { type: "string",  description: "ISO date YYYY-MM-DD" },
        end_date:         { type: "string",  description: "ISO date YYYY-MM-DD" },
        location:         { type: "string",  description: "Greek place/region name" },
        difficulty: {
          type: "string",
          enum: ["easy", "moderate", "challenging", "difficult"],
        },
        distance_km:      { type: "number" },
        elevation_gain_m: { type: "number" },
        image_url:        { type: "string",  description: "Absolute https:// URL of the primary banner image" },
        pricing_options: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label:       { type: "string", description: "Keep in Greek as on source page" },
              price:       { type: "number" },
              description: { type: "string" },
            },
            required: ["label", "price"],
          },
        },
        departure_from: {
          type: "array",
          items: { type: "string" },
          description: "Greek city names",
        },
        requirements: {
          type: "array",
          items: { type: "string" },
          description: "Equipment items in Greek",
        },
        tags: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "beginner-friendly", "sunrise-hike", "sunset-hike", "pet-friendly",
              "family-friendly", "challenging", "camping", "multi-day", "guided",
              "photography", "wildlife", "waterfall", "summit", "coastal",
              "forest", "bus", "organized-carpooling",
            ],
          },
        },
        is_sold_out: { type: "boolean" },
      },
      required: ["title", "start_date", "location", "difficulty"],
    },
    add_context_from_internet: false,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP C: Process a single organizer — discover, scrape, upsert
// ─────────────────────────────────────────────────────────────────────────────

async function processOrganizer(
  base44: any,
  organizer: {
    organizer_code: number | string;
    full_name: string;
    website: string;
  },
  /** URL → existing HikingTrip record, keyed by event_url */
  existingByEventUrl: Map<string, Record<string, any>>,
  /** URL → existing HikingTrip record, keyed by external_link */
  existingByExternalLink: Map<string, Record<string, any>>,
  /** Lowercased titles already in the database — for new-event dedup */
  existingByTitle: Set<string>
): Promise<{
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  details: string[];
}> {
  const result = { created: 0, updated: 0, skipped: 0, errors: 0, details: [] as string[] };
  const { organizer_code, full_name, website } = organizer;

  console.log(`\n── Organizer: ${full_name} (code: ${organizer_code}) ──`);
  console.log(`   Website: ${website}`);

  // Discover event URLs (auto-navigates from homepage → listing if needed)
  let eventUrls: string[];
  try {
    eventUrls = await discoverEventUrls(base44, website);
    eventUrls = eventUrls.slice(0, MAX_EVENTS_PER_ORGANIZER);
    console.log(`   Found ${eventUrls.length} event URL(s)`);
  } catch (e: any) {
    console.error(`   ❌ URL discovery failed: ${e.message}`);
    result.errors++;
    result.details.push(`URL discovery failed for ${full_name}: ${e.message}`);
    return result;
  }

  if (eventUrls.length === 0) {
    console.warn(`   ⚠️  No event URLs found — check that the website lists events`);
    result.details.push(`No events found on ${website}`);
    return result;
  }

  for (const eventUrl of eventUrls) {
    try {
      const normUrl = normaliseUrl(eventUrl);

      // ── Lookup existing record by event_url OR external_link ──────────────
      // We check both because the convention is inconsistent across organizers:
      // some records store the event page as event_url, some as external_link.
      const existingTrip =
        existingByEventUrl.get(normUrl) ??
        existingByExternalLink.get(normUrl);

      await sleep(REQUEST_DELAY_MS);

      // ── Extract structured data from the event page ───────────────────────
      let extracted: Record<string, any>;
      try {
        extracted = await extractEventData(base44, eventUrl, full_name);
      } catch (e: any) {
        console.error(`   ❌ Extract error: ${eventUrl} — ${e.message}`);
        result.errors++;
        result.details.push(`Extract error (${eventUrl}): ${e.message}`);
        continue;
      }

      if (!extracted?.title || !extracted?.start_date) {
        console.warn(`   ⚠️  Incomplete data, skipping: ${eventUrl}`);
        result.skipped++;
        continue;
      }

      const isSoldOut = Boolean(extracted.is_sold_out);
      const freshData = buildTripData(extracted, organizer_code, eventUrl, isSoldOut);

      // ── UPDATE path: event already exists in the database ─────────────────
      if (existingTrip) {
        const diff = computeDiff(existingTrip, freshData, isSoldOut);

        if (!diff) {
          console.log(`   ✔  No changes: "${existingTrip.title}"`);
          result.skipped++;
          continue;
        }

        const changedFields = Object.keys(diff).join(", ");
        await base44.asServiceRole.entities.HikingTrip.update(existingTrip.id, diff);

        console.log(`   🔄 Updated: "${existingTrip.title}" — changed: [${changedFields}]`);
        result.updated++;
        result.details.push(`[${full_name}] Updated: ${existingTrip.title} — [${changedFields}]`);
        continue;
      }

      // ── CREATE path: new event ────────────────────────────────────────────

      // Title-based dedup guard: catches events re-published under a new URL
      const normTitle = extracted.title.toLowerCase().trim();
      if (existingByTitle.has(normTitle)) {
        console.log(`   ⏭️  Skip (title exists): "${extracted.title}"`);
        result.skipped++;
        continue;
      }

      // Default status for new events
      if (!isSoldOut) freshData.status = "upcoming";

      await base44.asServiceRole.entities.HikingTrip.create(freshData);

      // Update in-memory sets so we don't create duplicates within this run
      existingByEventUrl.set(normUrl, { ...freshData, id: "__new__" });
      existingByExternalLink.set(normUrl, { ...freshData, id: "__new__" });
      existingByTitle.add(normTitle);

      console.log(`   ✅ Created: "${extracted.title}" (${extracted.start_date})`);
      result.created++;
      result.details.push(`[${full_name}] Created: ${extracted.title}`);

    } catch (err: any) {
      console.error(`   ❌ Unexpected error for ${eventUrl}: ${err.message}`);
      result.errors++;
      result.details.push(`[${full_name}] Error (${eventUrl}): ${err.message}`);
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Optional: scope to one organizer for testing.
    // Accepted via URL query param OR request body:
    //   URL:  POST /syncOrganizerEvents?organizer_code=1
    //   Body: {"organizer_code": "1"}
    const url = new URL(req.url);
    let filterCode = url.searchParams.get("organizer_code") || null;
    if (!filterCode) {
      try {
        const body = await req.json();
        if (body?.organizer_code) filterCode = String(body.organizer_code);
      } catch { /* body is empty or not JSON — that's fine */ }
    }

    console.log("🚀 Nature Explorers — syncOrganizerEvents starting...");
    if (filterCode) console.log(`   Scoped to organizer_code: ${filterCode}`);

    // ── 1. Load organizers that have a website ────────────────────────────────
    const allOrganizers = await base44.asServiceRole.entities.Organizer.filter({});
    const organizers = allOrganizers.filter((o: any) => {
      if (!o.website || typeof o.website !== "string") return false;
      const site = o.website.trim();
      if (!site || !site.includes(".")) return false; // skip empty or non-URL values
      if (filterCode && String(o.organizer_code) !== String(filterCode)) return false;
      return true;
    });

    // Ensure website URLs are properly formatted (add https:// if missing)
    for (const o of organizers) {
      if (!o.website.startsWith("http")) {
        o.website = "https://" + o.website.trim().replace(/^\/+/, "");
      }
      o.website = o.website.trim().replace(/\/+$/, "") + "/"; // ensure trailing slash
    }

    const skippedOrgs = allOrganizers.length - organizers.length;
    console.log(
      `📋 ${organizers.length} organizer(s) to process` +
      (skippedOrgs > 0 ? ` (${skippedOrgs} skipped — no website)` : "")
    );

    if (organizers.length === 0) {
      return Response.json({
        success: true,
        message: "No organizers with a website found. Set the `website` field on Organizer records.",
        created: 0, updated: 0, skipped: 0, errors: 0,
      });
    }

    // ── 2. Load ALL HikingTrip records for global deduplication ──────────────
    //
    // We build TWO URL maps — one keyed by event_url, one by external_link —
    // because the real data shows both fields are used inconsistently:
    //   • Trekkers:    event_url = product URL, external_link = empty or same
    //   • SWEN:        event_url = Eventbrite URL, external_link = SWEN listing page
    //   • Exploroloco: event_url = external_link = product URL
    // Checking both ensures we never create a duplicate regardless of convention.
    //
    const allTrips = await base44.asServiceRole.entities.HikingTrip.filter({});

    const existingByEventUrl    = new Map<string, Record<string, any>>();
    const existingByExternalLink = new Map<string, Record<string, any>>();
    const existingByTitle        = new Set<string>();

    for (const t of allTrips) {
      if (t.event_url)     existingByEventUrl.set(normaliseUrl(t.event_url), t);
      if (t.external_link) existingByExternalLink.set(normaliseUrl(t.external_link), t);
      if (t.title)         existingByTitle.add(t.title.toLowerCase().trim());
    }

    console.log(`📦 ${allTrips.length} existing HikingTrip(s) loaded for deduplication`);

    // ── 3. Process each organizer sequentially ────────────────────────────────
    const totals = { created: 0, updated: 0, skipped: 0, errors: 0, details: [] as string[] };

    for (let i = 0; i < organizers.length; i++) {
      const r = await processOrganizer(
        base44,
        organizers[i],
        existingByEventUrl,
        existingByExternalLink,
        existingByTitle
      );
      totals.created  += r.created;
      totals.updated  += r.updated;
      totals.skipped  += r.skipped;
      totals.errors   += r.errors;
      totals.details.push(...r.details);

      if (i < organizers.length - 1) await sleep(2_000);
    }

    // ── 4. Summary ────────────────────────────────────────────────────────────
    const summary =
      `Sync complete — ✅ Created: ${totals.created} | 🔄 Updated: ${totals.updated} | ✔ Unchanged: ${totals.skipped} | ❌ Errors: ${totals.errors}`;
    console.log(`\n🏁 ${summary}`);

    return Response.json({
      success: true,
      summary,
      organizers_processed: organizers.length,
      created:  totals.created,
      updated:  totals.updated,
      skipped:  totals.skipped,
      errors:   totals.errors,
      details:  totals.details,
    });

  } catch (error: any) {
    console.error("💥 Fatal error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
