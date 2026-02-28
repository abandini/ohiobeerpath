# BreweryTrip.com – Must‑Have App Expansion Package

This document is designed to be **directly consumable by Claude‑Code**.
It contains:

1. Product framing & identity
2. Feature prioritization matrix
3. Brewery Day Optimizer – UX & logic
4. Data model (Cloudflare D1 schema)
5. Workers AI integration points
6. Ohio MVP differentiation plan
7. Claude‑Code master system prompt

---

## 1️⃣ Product Identity & Framing

**What BreweryTrip Is**
> *A travel‑first brewery companion that helps people plan great brewery days, anywhere.*

**What It Is Not**
- Not a Yelp clone
- Not Untappd ratings soup
- Not a social network

**Core Promise**
> *“I will help you make better brewery decisions than Google Maps.”*

This promise guides all feature decisions.

---

## 2️⃣ Feature Prioritization Matrix

### MUST (Ohio MVP)

| Feature | Why It Matters |
|------|---------------|
| Brewery Day Optimizer | Differentiator, habit‑forming |
| Distance / time / steps filters | Travel‑first advantage |
| Beer style + food + dog filters | Decision‑grade filters |
| Trip builder & route ordering | Core UX upgrade |
| Offline city packs | Travel reliability |
| Personal Brewery Passport (light) | Identity & memory |

### SHOULD (Post‑Ohio)

| Feature | Why |
|------|----|
| Events (food trucks, music) | Real‑time context |
| Fresh taps indicators | Ephemeral value |
| Shareable trip cards | Organic growth |
| Crowd level estimation | Decision confidence |

### LATER

| Feature | Reason to Delay |
|------|----------------|
| Deep social feeds | Noise risk |
| Full beer ratings | Commodity space |
| Loyalty / rewards | Brewery ops complexity |

---

## 3️⃣ Brewery Day Optimizer – UX & Logic

### User Inputs

- Time window: 1–2 hrs / Half‑day / Full day
- Travel mode: Walk / Drive / Mixed
- Beer preferences (weighted): IPA, lager, stout, sour, saison, etc.
- Food priority: Required / Optional / Skip
- Environment: Dog‑friendly / Patio / Indoor
- Pace preference: Chill / Balanced / Efficient

### Optimizer Output

- Ordered brewery list
- Estimated dwell time per stop
- Route map
- Safety & quality hints:
  - “Heavy ABV early may shorten day”
  - “Kitchen closes at 8pm”

### Core Logic (High‑Level)

```
Score = (
  beer_match_weight * style_overlap
+ food_match_weight * food_score
+ distance_penalty
+ crowd_penalty
+ open_hours_bonus
)
```

Route optimization uses **greedy + constraint pruning**, not perfect TSP.
Fast > perfect.

---

## 4️⃣ Cloudflare D1 Data Model (Initial)

### breweries
```sql
CREATE TABLE breweries (
  id TEXT PRIMARY KEY,
  name TEXT,
  city TEXT,
  state TEXT,
  lat REAL,
  lon REAL,
  has_food INTEGER,
  dog_friendly INTEGER,
  price_range INTEGER,
  description TEXT
);
```

### brewery_styles
```sql
CREATE TABLE brewery_styles (
  brewery_id TEXT,
  style TEXT,
  FOREIGN KEY (brewery_id) REFERENCES breweries(id)
);
```

### trips
```sql
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  city TEXT,
  created_at TEXT
);
```

### trip_stops
```sql
CREATE TABLE trip_stops (
  trip_id TEXT,
  brewery_id TEXT,
  stop_order INTEGER,
  estimated_minutes INTEGER
);
```

### user_passport
```sql
CREATE TABLE user_passport (
  user_id TEXT,
  brewery_id TEXT,
  visited_at TEXT,
  note TEXT
);
```

---

## 5️⃣ Workers AI Integration Points

### AI Roles

1. **Trip Optimizer Agent**
   - Input: user constraints
   - Output: ranked brewery candidates

2. **Micro‑Story Generator**
   - Input: brewery metadata
   - Output: 2–3 sentence local‑tone blurb

3. **Crowd Estimator (Later)**
   - Signals: time of day, events, reviews velocity

### Example Invocation

```ts
const result = await env.AI.run(
  "@cf/meta/llama-3.1-8b-instruct",
  { prompt: optimizerPrompt }
);
```

---

## 6️⃣ Ohio MVP Differentiation Plan

### Ohio‑Only Superpowers

- Pre‑built brewery day templates:
  - Cleveland East Side
  - Cleveland West Side
  - Columbus Short North
  - Cincinnati Over‑the‑Rhine

- Local voice micro‑stories
- Highlight Ohio‑only styles (e.g., Midwest IPA, lagers)

### Launch Angle

> *“Ohio is the easiest state in the country to do great brewery days — if you know how.”*

---

## 7️⃣ Claude‑Code Master System Prompt

```md
You are Claude‑Code, acting as a senior product engineer and systems designer.

Project: BreweryTrip.com

Mission:
Build a travel‑first Progressive Web App that helps users plan optimized brewery days.

Tech Stack:
- Cloudflare Workers (not Pages)
- D1 for relational data
- KV for session & preference caching
- R2 for static city packs
- Workers AI for optimization and micro‑copy
- GitHub as single source of truth

Guiding Principles:
- Fast > perfect
- Decision support over raw listings
- Light social, zero noise
- Mobile‑first, offline‑capable

Primary Build Targets:
1. Brewery Day Optimizer (core)
2. Trip builder UX
3. Personal Brewery Passport
4. Ohio MVP launch

Do not:
- Build social feeds
- Recreate Untappd
- Over‑engineer routing

Output Expectations:
- Production‑ready TypeScript
- SQL migrations for D1
- Clear separation of concerns
- Minimal UI, maximum clarity

When uncertain:
Ask for constraints instead of guessing.
```

---

## 8️⃣ Success Metric

If a user says:
> *“I open BreweryTrip before every brewery outing.”*

This project has succeeded.

---

**End of document**

