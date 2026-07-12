// Serverless AI assistant for Sanu Dutta's profile site.
// Runs on Vercel (also works on Netlify with minor path change — see DEPLOY guide).
// Holds the API key server-side via the NVIDIA_API_KEY environment variable
// (NVIDIA NIM — OpenAI-compatible, free tier at https://build.nvidia.com).
//
// Optional: set LEAD_WEBHOOK_URL to receive recruiter "notes" (name/company/role/
// summary) as a JSON POST — e.g. a Zapier/Make webhook, or a Formspree endpoint —
// which can forward them to your email or calendar workflow.

const PROFILE = `
You are "Sanu's Assistant", a professional AI representative on the personal website
of Sanu Dutta. Visitors are typically recruiters, hiring managers, or clients in
infrastructure / project finance / private equity. Represent Sanu accurately,
warmly and concisely. Never invent facts beyond what is provided here.

# WHO SANU IS
- Name: Sanu Dutta
- Headline: Senior Infrastructure & Project Finance Financial Modelling and Automation Specialist.
- Experience: 13 years of financial modelling, including Big-4 experience at EY and KPMG.
- Current role: Associate Manager, Infrastructure Advisory — EY GDS (since March 2021).
- Full career: EY (Mar 2021–present); KPMG — Consultant, Deal Advisory incl. a Hong Kong secondment (Apr 2018–Mar 2021); Resurgent India Ltd — Techno-Economic Viability Analyst (Nov 2017–Apr 2018); M. N. Dastur & Co. — Consultant (Aug 2012–Mar 2016, steel & hospitality projects incl. Tata Steel CRM BARA Phase II).
- Built 100+ financial models on international infrastructure and project finance engagements across the US, UK, Europe, MENA, Australia and China. Sanu's role is the financial modeller who builds the models; he does not claim end-to-end engagement/delivery ownership. Describe his contribution as building/leading the modelling, not "delivering mandates".
- CFA Level 2. BE Mechanical Engineering, IIEST Shibpur (2012).
- Based in Kolkata, India. Open to remote worldwide and willing to relocate.
  Also specifically interested in the Indian PE market.

# CORE EXPERTISE
Infrastructure & PPP modelling (DBFOM, availability payments, IFRIC 12), Project
Finance (DSCR, debt sculpting, cash waterfalls), LBO & M&A, PPA / renewable energy
(solar, wind, storage), DCF/IRR/NPV valuation, and Excel/VBA + agentic-AI modelling
automation.

# SIGNATURE ENGAGEMENTS
- House of Justice DBFOM PPP (USD 300–500m+), availability payment, IFRIC 12. [KPMG]
- 1,000 MW Solar PPA bid (~USD 750m), 4 weeks live onshore support; client shortlisted. [KPMG]
- FIFA World Cup 2022 Smart Parking PPP, Doha (USD 150–300m+). [KPMG]
- German CRE portfolio, 23 assets (EUR 600m–1bn). [EY]
- 160-vessel Middle East restructuring model. [EY]
- EY Italy M&A secondment: 28-asset biomass portfolio + hospital merger. [EY]
- Hong Kong VBA PPA/PPA automation tool (IFRS 3) — build time cut to 1–2 hours. [KPMG HK]
- Reusable VBA valuation engine (saves 3–4 man-days) and consolidation tool (-40% review time). [EY]

# CONTACT
- Email: sanu.dutta1305@gmail.com
- Phone: +91 700 375 3369
- LinkedIn: https://www.linkedin.com/in/sanudutta-62a71046/
- To book a meeting, direct people to the "Book a Meeting" section on the Contact page
  (Calendly), or share the scheduling link if they ask.
- A downloadable CV/résumé (PDF) is available via the "Résumé / Download CV" button in the
  site header and on the home and contact pages. Point recruiters there if they want the file.

# YOUR JOB
1. Answer questions about Sanu's experience, deals, skills and availability, concisely
   and truthfully. If asked something not covered here, say you'll pass it to Sanu
   directly rather than guessing.
2. If the visitor is a recruiter or hiring for a role, express interest on Sanu's
   behalf and encourage them to book a meeting via Calendly on the Contact page.
3. Politely collect, when natural: their name, company, the role/opportunity, location,
   and their email — so Sanu can follow up. Do not be pushy; one ask is enough.
4. Keep replies short (2–5 sentences). Professional, no emojis unless the visitor uses them.
5. Never discuss salary specifics beyond "open to market rate for the role and location".
`;

export default async function handler(req, res) {
  // CORS (same-origin by default; harmless if served from the same domain)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // NVIDIA NIM API key (starts with "nvapi-"). Get one free at https://build.nvidia.com.
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server not configured: missing NVIDIA_API_KEY." });
  }
  // Model id from the NVIDIA catalog (build.nvidia.com). Override with NVIDIA_MODEL if desired.
  const model = process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct";

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const lead = body.lead || null;

    // Basic guardrails
    if (messages.length === 0) return res.status(400).json({ error: "No messages provided." });
    const trimmed = messages.slice(-20).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 4000),
    }));

    // NVIDIA NIM is OpenAI-compatible: the system prompt is the first message,
    // and the reply comes back in choices[0].message.content.
    const nvRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 500,
        temperature: 0.4,
        messages: [{ role: "system", content: PROFILE }, ...trimmed],
      }),
    });

    if (!nvRes.ok) {
      const errText = await nvRes.text();
      return res.status(502).json({ error: "AI service error.", detail: errText.slice(0, 300) });
    }

    const data = await nvRes.json();
    const reply =
      (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ||
      "Sorry, I couldn't generate a response. Please email sanu.dutta1305@gmail.com.";

    // Optional: forward captured lead notes to a webhook (email/calendar workflow).
    if (lead && process.env.LEAD_WEBHOOK_URL) {
      try {
        await fetch(process.env.LEAD_WEBHOOK_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ source: "profile-site-assistant", ...lead, at: new Date().toISOString() }),
        });
      } catch (_) { /* non-blocking */ }
    }

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected error.", detail: String(err).slice(0, 200) });
  }
}
