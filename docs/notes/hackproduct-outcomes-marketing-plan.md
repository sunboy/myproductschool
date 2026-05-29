# HackProduct Marketing Plan: Outcomes-First Practice Gym

## Summary

Position HackProduct as the AI-native practice gym for career-changing product and technical judgment. FLOW is the training system, Hatch is the coach, and disciplines are the training tracks. But the marketing should lead with the end value users actually buy: interview prep, job performance, role transitions, promotion readiness, and salary leverage.

The product story becomes: "Train structured thinking with FLOW so you perform better in the moments that change your career."

## Core Positioning

- Main promise: "Train for the career moments where judgment gets tested."
- Supporting message: "HackProduct helps you prepare for interviews, transition roles, uplevel on the job, and negotiate from stronger evidence by practicing product sense, systems, data, SQL, coding, and AI-native workflows with Hatch."
- Product mechanism: "Every rep is scored through FLOW: Frame, List, Optimize, Win."
- Moat: "Courses explain. HackProduct trains. Hatch gives you the reps, feedback, and next drill."

## Outcome-Led CTAs

Primary CTAs across marketing:

- Prepare for interviews
- Get promotion-ready
- Transition into product
- Practice for staff-level judgment
- Build salary negotiation proof
- Start a free rep

Homepage CTA routing:

- Hero primary: `Start a free rep`
- Hero secondary: `Choose your career goal`
- Outcome cards:
  - Interview prep -> `/study-plans/interview-prep` or filtered `/practice`
  - Uplevel on the job -> `/study-plans/staff-engineer-product-strategy`
  - Role transition -> `/study-plans/engineer-to-product`
  - Salary negotiation -> new public page or module around "prove your operating level"
  - AI-native skill growth -> future `/skills/ai-native-workflows`

## Landing Page Structure

- Hero: Premium shader-inspired animated surface with live HackProduct console, Hatch coaching, FLOW rail, and outcome headline.
- Career Goals: Four large shadcn cards:
  - Ace product and technical interviews
  - Move from engineer to product-minded builder
  - Operate at senior/staff level
  - Negotiate with proof, not hope
- Practice Gym: Explain the product mechanism: pick rep -> answer -> Hatch follows up -> FLOW scores -> next drill.
- FLOW Across Disciplines: Show Product Sense, System Design, Data Modeling, SQL, Coding, and future AI-native tracks.
- Sneak Peek Catalog: Maven-like public previews by discipline and goal.
- Hatch Coach: Mascot states integrated into coaching moments, not decorative clutter.
- Proof of Progress: Show Learner DNA, weak-move tracking, receipts, and career-ready artifacts.
- Final CTA: "Start training for your next career move."

## Design Direction

Hero should feel premium and high-agency:

- Original pixel-beam shader-inspired background.
- shadcn `Card`, `Tabs`, `Badge`, `Button`, and `Progress` for foreground UI.
- Motion-based staggered timeline, springs, hover/tap gestures, and reduced-motion support.

Hatch should work like a restrained Duolingo-style coach:

- Hero Hatch: welcoming / confident.
- Feedback Hatch: reviewing.
- Challenge Hatch: pushing the user.
- Success Hatch: celebrating progress.
- Guide Hatch: explaining FLOW or next steps.

Mobile-first requirements:

- Headline and CTA visible immediately.
- Product preview simplified to one compact console.
- Hatch appears once per viewport max.
- Shader animation reduced in contrast and motion.

## Public Page Strategy

- `/skills`: discipline catalog plus outcome filters.
- `/skills/[slug]`: discipline sneak peek with FLOW mapping, sample reps, Hatch feedback, and career outcomes.
- `/practice`: rep catalog filterable by discipline, FLOW move, and career goal.
- `/practice/[slug]`: public rep preview with prompt, rubric preview, Hatch nudge, and locked full workspace.
- `/flow`: flagship framework page showing how FLOW adapts across disciplines.
- New or revised outcome pages:
  - `/interview-prep`
  - `/role-transitions`
  - `/uplevel`
  - `/salary-negotiation`

These pages should sell the career value first, then route users into relevant reps and disciplines.

## Test Plan

- Run `npm run lint` and `npm run build`.
- Verify `/`, `/flow`, `/skills`, `/practice`, and all outcome routes.
- Mobile check at 390px, 430px, 768px, and desktop.
- Confirm:
  - Outcome CTAs are visible above the fold.
  - FLOW is clearly explained.
  - Hatch supports the story without overwhelming it.
  - Public sneak peeks are useful but do not replace logged-in practice.
  - Reduced-motion mode works.

## Assumptions

- Practice gym remains the product metaphor, but career outcomes become the sales frame.
- Interview prep is the strongest near-term CTA.
- Upleveling, role transitions, and salary negotiation should become first-class marketing paths.
- Salary negotiation should be framed around evidence of operating level, not guaranteed compensation outcomes.

## Implementation Status

Implemented in the current marketing pass:

- Outcome-first homepage positioning and CTAs.
- Public pages for `/flow`, `/skills`, `/practice`, `/interview-prep`, `/role-transitions`, `/uplevel`, and `/salary-negotiation`.
- AI-native workflows discipline preview at `/skills/ai-native-workflows`.
- Public practice filters by discipline, FLOW move, and career goal.
- Exact `/interview-prep` redirect removed so the marketing page can render publicly.

Verification completed:

- `npm run lint` passed with existing warnings only.
- `npm run build` passed.
- Production route and viewport sweep passed at desktop and 390px, 430px, and 768px widths.
