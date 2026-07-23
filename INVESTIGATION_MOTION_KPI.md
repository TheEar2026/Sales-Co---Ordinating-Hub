# Motion A / Motion B KPI discrepancy — investigation summary

**Date:** 2026-07-20
**Status:** Investigation only — nothing has been changed in code or the database.
**Live app checked:** https://ear-academy-sales.vercel.app (logged in as RN)

## The numbers

CSV source-of-truth: `motion = 'A'` → 154 rows, `motion = 'B'` → 195 rows.
Dashboard currently shows: Motion A tile/tab = **139**, Motion B tile/tab = **34**.

No direct SQL access to the live DB was available in this session (no `.env`, no Supabase CLI session) — everything below comes from reading the app's source and cross-checking against the live UI.

## 1. Where each number comes from (there are two independent query pairs)

**Header KPI tiles** (`src/components/layout/ScoreStrip.tsx:51-56`), reading a Postgres view called `scorecard`:

```sql
-- Motion A tile  (supabase_schema.sql:494)
select count(*) from leads
where motion = 'A' and status not in ('won','lost','declined','blocked','parked')

-- Motion B tile  (supabase_schema.sql:495)
select count(*) from leads
where motion = 'B' and status = 'untouched'
```

**Tab badges** (`src/pages/Dashboard.tsx:95-96`, `src/components/layout/TabBar.tsx`), reading two other views:

```sql
-- motion_a_daily  (supabase_schema.sql:444-461)
select * from leads
where owner = 'rus'
  and status not in ('won','lost','declined','blocked','parked')

-- motion_b_daily, current version  (supabase_schema_patch_4.sql:27-45)
select * from leads
where motion = 'B' and owner = 'coordinator'
  and status in ('untouched','t1-sent','t2-sent','reply-received')
  and (status in ('untouched','reply-received') or next_touch_date <= current_date)
```

On the live app, both pairs currently render the **same** numbers (139/139, 34/34), so for this dataset they agree — but they are genuinely different queries and could diverge on future data.

## 2. Motion B tile — CONFIRMED mislabel, not a filter bug

The tile literally shows only leads where `status = 'untouched'` (34) — and the UI itself labels it "untouched" (`ScoreStrip.tsx:56`). It was never trying to be a total-Motion-B count; it's a distinct KPI ("how many are still untouched") that reads, at a glance, like the Motion B total. Whether the tile should show the true `motion='B'` total instead (or in addition) is a product decision, not a bug fix.

## 3. Motion A tile (139) — original theory does not match the code

Original theory: 154 − (10 won + 5 reply-received) = 139. The code doesn't support this — `reply-received` is **not** in the exclusion list (`won, lost, declined, blocked, parked` only), and is in fact given the **2nd-highest priority** in the sort order (`supabase_schema.sql:450`), right after `close`. So reply-received leads should appear near the top of the 139-list, not be excluded from it.

The 5 leads named in the original ask (Russell Sharp, Ojay Langeveldt, Megan/Teneo Education, Connie Freidmann, Lynda Eagle) were checked in the live "All Leads" tab and all five have identical fields:

> `status = reply-received`, `motion = A`, `owner = rus`, `tier = ACTIVE`

Given the WHERE clause above, they satisfy `motion_a_daily`'s filter and should be counted in the 139. **Not yet 100% confirmed** — the last step (pending) is to open the Motion A tab and Cmd+F search for each name to prove they're physically in that rendered list (the list has no virtualization/pagination — `LeadList.tsx:23` renders all 139 rows directly, so Cmd+F is a valid test).

**Most likely real explanation for 154 → 139:** the 15-lead gap is simply `won + lost + declined + blocked + parked` leads summing to 15, unrelated to reply-received. The "10 won + 5 reply-received = 15" match was probably coincidental.

## 4. Open/decision items (not yet acted on)

- **`parked` is currently excluded from the Motion A active queue** (`supabase_schema.sql:460` and the scorecard's `motion_a_pipeline`, `supabase_schema.sql:494`). This conflicts with the stated intent that "parked and already-touched leads should not be hidden" — worth a explicit decision on whether `parked` should be visible somewhere (e.g. its own filter/tab) even if not in the daily priority list.
- **Motion B header tile** conflates "untouched" with "Motion B total." Decide whether to relabel it, add a second true-total metric, or leave as-is now that it's understood.
- **Two independent queries per motion** (scorecard view vs. daily-list view) currently agree by coincidence on this dataset but aren't guaranteed to stay in sync — e.g. `motion_a_daily` filters on `owner='rus'` while `scorecard.motion_a_pipeline` has no owner filter at all. Worth deciding if that's intentional.

## 5. Still to verify

- [ ] Cmd+F the 5 named leads inside the live Motion A tab list to prove they're counted in the 139 (not excluded).
- [ ] Run `select motion, status, owner, count(*) from leads group by motion, status, owner order by motion, status;` against the live Supabase project to get the real breakdown and settle the 154→139 gap definitively (needs DB credentials or the user to run it and share results).

## Where things live (for reference)

| Thing | File |
|---|---|
| Header KPI tiles | `src/components/layout/ScoreStrip.tsx` |
| Tab badges | `src/components/layout/TabBar.tsx`, `src/pages/Dashboard.tsx` |
| `scorecard` view SQL | `supabase_schema.sql:490-505`, patched in `supabase_schema_patch_2.sql:67-80` |
| `motion_a_daily` view SQL | `supabase_schema.sql:443-463` |
| `motion_b_daily` view SQL | `supabase_schema.sql:466-487`, replaced in `supabase_schema_patch_4.sql` |
| All Leads (unfiltered browse view) | `src/hooks/useLeads.ts` (`useAllLeads`), `src/components/allLeads/*` |
| Tier badge values (incl. "ACTIVE") | `src/components/shared/TierBadge.tsx`, `supabase_schema.sql:95` |
