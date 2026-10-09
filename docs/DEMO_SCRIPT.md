# 2-minute demo script

**Before recording:** open the live URL in a fresh window, click **Demo mode → Reset demo data**, and keep the window at desktop width.

| Time | Screen | Say / do |
|---|---|---|
| **0:00** | Landing hero | "Brands want to hire AI filmmakers and designers, but portfolios don't show which models were used, how a piece was made, or whether it's safe for ads. Lumora fixes that." |
| **0:15** | Scroll the landing page | Point at the tool marquee, the bento ("portfolios with workflows, structured briefs, matching, verification") and the brief-builder teaser. |
| **0:30** | **Discover** | Pick **Tools → Kling**, **Content type → Video**, and toggle **Verified only**. "Filters combine, counts update, and the URL keeps the state." Switch to **Works** to show the masonry. |
| **0:55** | Click **Aarav Mehta**, then open *Monsoon Riders* | Show the **How it was made** stepper, the prompt example (copy it), and the generations and hours. Close it, then click the **Trust score** ring to show the four signals. |
| **1:15** | **Post a brief** | Click the first example prompt, then **Build my brief**. Fields fill in with AI-suggested tags, and completeness hits 100%. Tweak one field, then **Publish**. |
| **1:35** | Brief → **Matches** | "Ranked with reasons: matched, missing, over budget." Click **Invite** on the top match. |
| **1:50** | `/engagements/creator` | Open the card and click **Accept**, then **Start work**. Use **Invite a collaborator** to add a sound designer at 20%, then **Submit for review**. Click **Switch to Brand** (`/engagements/brand`) and **Approve & mark delivered**. |
| **2:00** | Close | "Profiles with proof, briefs with rights, and matching that explains itself. Free stack, live on Vercel." |

## 5-slide outline

1. **Problem.** AI creators are a new profession, but marketplaces can't show AI skill, process, or commercial safety. Briefs are vague, so the back-and-forth kills timelines.
2. **Solution.** Lumora has AI-native profiles (tools, workflows, terms), structured briefs with an AI Brief Builder, explainable matching, verification signals, and an end-to-end engagement pipeline.
3. **Product tour.** Screenshots: Discover filters, profile workflow lightbox, brief builder, matches, engagement board.
4. **Tech & data model.** Next.js 16, Tailwind 4, shadcn, Zustand, Zod, and Gemini with a deterministic fallback. Pure tested logic (108 tests, ~99% lib coverage) and the ER diagram from `DATA_MODEL.md`.
5. **Roadmap.** Real proof uploads and C2PA credentials, auth with Postgres, messaging and escrow payments, creator analytics, and tool-license verification.
