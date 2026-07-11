# Deploy Guide — Sanu Dutta Profile Site

Your site is now a small **Vercel** project: static pages + one serverless function
(`api/chat.js`) that powers the AI assistant and keeps your API key private.
It includes a **Calendly** booking section and a floating **AI assistant** on every page.

---

## What each part does
- **5 pages** (Home, Expertise, Portfolio, Experience, Contact) — your interactive résumé.
- **Downloadable CV** (`assets/Sanu_Dutta_Resume.pdf`) — linked from the header, home and
  contact pages. To update it later, replace that PDF file (keep the same name).
- **AI assistant** (bottom-right on every page) — answers recruiter questions about your
  experience and deals, captures their name / company / role, and points them to your
  Calendly. Powered by your Anthropic API key, held securely on the server.
- **Calendly booking** (Contact page → "Book a meeting") — recruiters self-schedule; the
  meeting lands in your Google Calendar with a video link and auto-confirmations.

---

## Before you deploy — 3 quick edits

### 1. Set your Calendly link (2 places)
1. Create a free account at https://calendly.com and set up a 30-min "meeting type".
2. Copy your link (e.g. `https://calendly.com/sanu-dutta/30min`).
3. Paste it into:
   - `assets/config.js` → `calendlyUrl`
   - `contact.html` → the `data-url="..."` on the `calendly-inline-widget` div
     (keep the `?...background_color=...` part for the dark theme).

### 2. Get an NVIDIA API key (free)
- Go to https://build.nvidia.com and sign in (free NVIDIA developer account).
- Pick any chat model (e.g. **Llama 3.3 70B Instruct**) → click **Get API Key** / **Generate Key**.
- Copy the key (starts with `nvapi-`). You'll paste it into Vercel later (never into the code).
- The free tier includes a monthly allowance of credits — plenty for a personal site.

### 3. (Optional) Lead notifications
- If you want the assistant's captured notes emailed to you, create a free
  webhook at https://zapier.com or https://make.com that sends yourself an email,
  and you'll set `LEAD_WEBHOOK_URL` to it in Vercel. Skip if not needed.

---

## Deploy to Vercel (recommended path)

### Option A — GitHub + Vercel (best, gives auto-updates)
1. Create a free GitHub account and a new repo (e.g. `profile-site`).
2. Upload the whole `Profile_Website` folder contents to the repo (keep folder structure).
3. Go to https://vercel.com → **Add New → Project** → import your GitHub repo.
4. Framework preset: **Other**. Root directory: leave default. Click **Deploy**.
5. After the first deploy, go to **Settings → Environment Variables** and add:
   - `NVIDIA_API_KEY` = your `nvapi-...` key
   - `NVIDIA_MODEL` = (optional) e.g. `meta/llama-3.3-70b-instruct`
   - `LEAD_WEBHOOK_URL` = (optional) your webhook
6. **Redeploy** (Deployments → ⋯ → Redeploy) so the key takes effect.
7. Your site is live at `https://your-project.vercel.app`. Test the assistant.

### Option B — Vercel CLI (no GitHub)
1. Install Node.js, then run `npm i -g vercel`.
2. In the `Profile_Website` folder run `vercel` and follow the prompts.
3. Add the env var: `vercel env add NVIDIA_API_KEY` (paste your key).
4. Run `vercel --prod` to publish.

---

## Custom domain (optional)
Buy `sanudutta.com` (~USD 10/yr, Namecheap/GoDaddy), then in Vercel →
**Settings → Domains** add it and follow the DNS instructions. Free HTTPS is automatic.

---

## Costs
- **Vercel**: free hobby tier is plenty for a personal site.
- **Calendly**: free tier covers 1 meeting type — enough for recruiter calls.
- **NVIDIA API**: free developer tier with a monthly credit allowance — no card needed
  to start, and comfortably covers a personal profile site's chat volume.

---

## Local preview
The static pages open by double-clicking `index.html`, but the **AI assistant needs the
server function**, so to test it locally run `npx vercel dev` in the folder (needs your
API key set locally in a `.env` file — copy `.env.example` to `.env` and fill it in).

---

## Note on the "take notes / schedule" workflow
- **Scheduling** is handled end-to-end by Calendly — nothing more to build.
- **Note-taking**: the assistant is instructed to collect each recruiter's name, company,
  role and email during the chat. To have those delivered to you automatically, set the
  optional `LEAD_WEBHOOK_URL`. Otherwise, review conversations by adding analytics later,
  or simply rely on recruiters booking via Calendly (which records their details).
