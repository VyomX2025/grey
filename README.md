# GREY.

**Hackathon prototype** — explainable clinical decision-support interface using **synthetic patients only**.

> **DEMO ENVIRONMENT — SYNTHETIC PATIENTS — DECISION SUPPORT ONLY — NOT FOR CLINICAL USE**

Demonstration rules are **illustrative and unvalidated**. They are **not** clinically equivalent to NEWS2 or any scoring system, and this application is **not** suitable for actual patient care.

## What it demonstrates

1. **Patient timeline** — synthetic vital signs over time with charts and missing-value handling  
2. **Explainable reassessment alerts** — deterministic TypeScript rules (not an LLM)  
3. **Historical Assembly** — predefined synthetic records matched with relevance explanations  
4. **Clinician confirm / override** — mandatory rationale on override + audit log  

## Automatic demonstration feed

The dashboard advances the next available deterministic scripted observation every 4 seconds. The feed pauses when the browser tab is hidden, can be paused from the compact toolbar, and stops when every scripted sequence is exhausted. It does not generate random observations. Configure the interval with `NEXT_PUBLIC_GREY_FEED_INTERVAL_MS` (bounded to 3–10 seconds). Manual simulation on a patient detail page uses the same server-side cursor, so a scripted observation cannot be consumed twice.

The automatic feed, summary, board, alerts, and event list share the in-memory store. As with other demo mutations, state is local to the running Node process and resets on process restart or Reset Demo.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript  
- Tailwind CSS + Recharts + Lucide React  
- Zod validation  
- Vitest unit tests  
- In-memory demo store (compatible with local Node; see limitations)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other commands

```bash
npm test          # unit tests
npm run typecheck # TypeScript
npm run build     # production build
npm start         # run production build
```

## Two-minute demo script

1. Open the Emergency Department board — compact GREY. toolbar and twelve deterministic synthetic Indian patients.  
2. Note **P002 Ananya Patel** is GREEN / STABLE (no false alert from seeded observations).  
3. Open **P001 Aarav Sharma** — initial vitals RR 14, BP 130/82; ESI 3 is a separate synthetic demonstration value.  
4. Review the observation timeline / chart.  
5. Click **Simulate Next Observation**.  
6. Show updated vitals (RR 24, BP 98/66) and the explainable alert (exact previous/current values).  
7. Return to the board — P001 must show **CRITICAL REVIEW**, not STABLE. Counters update.  
8. Use search / filters (Critical, Missing data).  
9. Under Historical Assembly, open the **beta-blocker** record → **View source**.  
10. Click **Confirm alert** — workflow becomes acknowledged, ESI remains 3, observations unchanged.  
11. Click **Reset Demo** (confirm).  
12. Repeat simulate on P001, then **Override** with a nonempty rationale.  
13. Show override audit entry; confirm ESI and original observations are unchanged.  
14. Open **P004 Meera Iyer** to show missing SpO₂ / temperature, or **P011 Sana Khan** to show the awaiting-observation state.

The initial department state includes two active critical-review alerts, one active urgent-review alert, three acknowledged/overridden priority-review alerts, four stable patients, one incomplete patient, and one awaiting-observation patient. Alert records are derived by running the configured demonstration rules against the seeded consecutive observation pairs. All counts and priorities are calculated from the store.

Patient detail includes separate chronological trajectories for HR, RR, systolic/diastolic BP, SpO₂, and temperature. Alert markers are attached to the triggering observation timestamps; null measurements remain gaps.

## Demonstration rules (illustrative only)

Configured in `src/lib/rules-config.ts`:

| Rule ID | Condition |
| --- | --- |
| `rr_increase_8` | Respiratory rate **increase** ≥ 8 breaths/min between consecutive observations |
| `sbp_decrease_25` | Systolic BP **decrease** ≥ 25 mmHg between consecutive observations |

Missing measurements are **skipped** (never treated as normal values). Alerts do **not** change ESI or observations.

Board colours (RED / AMBER / YELLOW / GREEN / GREY) are **illustrative UI categories**, not an official Indian triage protocol. They are derived separately from the patient's initial synthetic ESI value.

After a clinician confirms or overrides an alert, the board shows an acknowledged/overridden review state. It does **not** silently relabel deteriorated observations as STABLE.

### Alert statuses

| Status | Meaning |
| --- | --- |
| `active` | Triggered; awaiting clinician decision |
| `confirmed` | Clinician acknowledged the demonstration alert |
| `overridden` | Clinician dismissed with mandatory rationale |

## API

| Method | Path |
| --- | --- |
| GET | `/api/health` |
| GET | `/api/patients` |
| GET | `/api/patients/[patientId]` |
| GET | `/api/patients/[patientId]/review` |
| GET | `/api/patients/[patientId]/observations` |
| GET | `/api/patients/[patientId]/alerts` |
| GET | `/api/patients/[patientId]/history` |
| GET | `/api/patients/[patientId]/sources/[sourceId]` |
| POST | `/api/patients/[patientId]/simulate-next` |
| POST | `/api/patients/[patientId]/alerts/[alertId]/confirm` |
| POST | `/api/patients/[patientId]/alerts/[alertId]/override` |
| POST | `/api/demo/reset` |
| POST | `/api/demo/tick` |

Override body: `{ "rationale": "…", "actor": "Demo Clinician" }` (rationale required).

## Persistence & limitations

- Demo mutation state lives in an **in-memory store** for the running Node process (`next dev` / `next start`).  
- **Reset Demo** restores deterministic seed data.  
- On **Vercel serverless**, cold starts may reset in-memory state — use Reset Demo before presenting.  
- This is **not** a production database. Browser storage is not shared across devices.  
- No authentication — actor is labeled **Demo Clinician**.  
- No real patients, no LLM medical decisions, no automatic triage changes.

## Deploy to Vercel

1. Push this repo to GitHub (or import the folder in the Vercel dashboard).  
2. Create a new Vercel project → Framework: **Next.js**.  
3. Deploy (no environment variables required for the core demo).  
4. Open the deployment URL and run the demo script above.  
5. If state looks stale after idle time, click **Reset Demo**.

```bash
npx vercel
```

## Safety

- All patients and records have `synthetic: true`.  
- Compact disclosure in the application footer: “Synthetic data · Illustrative decision support · Not for clinical use”.  
- Do not use with real patient data.  
- Do not represent this prototype as clinically validated.
