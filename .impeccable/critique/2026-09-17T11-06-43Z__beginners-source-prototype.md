---
target: beginners/source/prototype/
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
timestamp: 2026-09-17T11-06-43Z
slug: beginners-source-prototype
---
# Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2/4 | Filter state is visible, but form saving has no progress and submit feedback is weak and partly obscured by the tabbar. |
| 2 | Match System / Real World | 3/4 | Natural Ukrainian and concrete housing facts; the unexplained “92% match” does not map to a trustworthy real-world concept. |
| 3 | User Control and Freedom | 2/4 | Back, close, and reset exist; no draft, cancel/skip, or safe recovery from leaving a form. |
| 4 | Consistency and Standards | 2/4 | 7,500 UAH in the listing versus 8,500 UAH in the application; flow steps are presented as global tabs. |
| 5 | Error Prevention | 1/4 | Answers and identity copy are prefilled, canonical data diverges, and a user can submit canned information. |
| 6 | Recognition Rather Than Recall | 3/4 | Context is repeated and controls are labelled, but the compatibility form omits resident preferences needed for comparison. |
| 7 | Flexibility and Efficiency | 1/4 | One long rigid path, without draft/resume or a shortcut for an already-complete profile. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Calm and clean, but card soup, repeated radio cards, and dual navigation dilute focus. |
| 9 | Error Recovery | 1/4 | The prototype says the request was not sent but offers no prominent recovery action or result state. |
| 10 | Help and Documentation | 2/4 | Useful privacy hints exist; match score, proof semantics, and choice consequences are unexplained. |
| **Total** | | **20/40** | **Acceptable — significant improvement required** |

# Design Specificity Verdict

The content is authored, while the composition is only moderately specific to Kutok. Kyiv districts, real residents, dated verification, safe contact, and household compatibility create credibility. The dominant visual axis is still a conventional property marketplace: large room photo, price, district, then small chips. People and trust—the stated product advantage—are reduced to a 24px avatar and uniform green pills. The largest opportunity is to make the household and evidence of trust a co-primary visual subject beside the room.

# Overall Impression

The prototype has a credible warm “Green Courtyard” foundation and unusually concrete trust copy. Its main weakness is not decoration but product hierarchy and system integrity: room imagery outranks people, design tokens are split between current and legacy namespaces, typography lacks semantic roles, and the high-stakes application ends with inconsistent data and a weak not-sent message.

# What’s Working

- Strong local specificity: Kyiv, move-in dates, utilities, actual domestic habits, and natural Ukrainian.
- A promising trust model: video call, document, phone, lease, and report date are stronger than a generic verified badge.
- Calm mobile-first composition, generally generous 44–50px controls, labelled form fields, focus styling, and semantic HTML.

# Cognitive Load

High by the checklist: 4/8 failures. Single focus fails because persistent prototype tabs compete with form completion. Chunking and grouping pass because each fieldset contains three choices. Local hierarchy passes. One-thing-at-a-time fails because seven sections are exposed as one long page. Minimal choices passes inside product decision points. Working memory fails because listing and resident preferences are not visible during compatibility decisions and the application recap is wrong. Progressive disclosure fails because there is no step structure, progress, save, or resume.

# Emotional Journey

The journey opens well with real rooms, people, and concrete proof. The dated trust section is reassuring but sits below the fold. The long compatibility form becomes an emotional valley because it is repetitive and has no progress or link between the answers and the household’s needs. “92% match” creates a confidence peak without evidence. The end state breaks the peak-end rule: a green submit button is followed by a small grey message saying nothing was sent, partly competing with the fixed tabbar.

# Priority Issues

## P1 — Product value is inverted in the hierarchy

Room photography and price dominate; future roommates and proof quality are secondary metadata. Raise the household block, verified-at date, and one or two meaningful compatibility facts in listing cards, and place a compact trust summary directly after the listing hero. Separate evidence from self-reported claims.

## P1 — Flow truth is broken

The listing shows 7,500 UAH while the application shows 8,500 UAH; some avatar assets do not match displayed names; “Send application” ends in a subtle “not sent” note. Use one canonical static fixture for room, residents, price, and dates. For the prototype, either rename the action honestly or show an unmistakable prototype result with clear next actions.

## P1 — The design-system contract is fractured

Shared components consume `--primitive-*` and `--color-*`, while `_base.css` still consumes undefined `--kit-*`. In the live filter sheet, body padding and drawer/close radii compute to zero, and the intended display title falls back to body typography. Canvas has three values across DESIGN, semantic tokens, and the prototype. Elevation is documented, removed in components, suppressed with `!important`, then reintroduced inline in the kit. Migrate the prototype layer to current semantic roles and establish one authority for canvas and elevation.

## P1 — Typography has no semantic layer

Typography primitives exist, but components use raw length primitives directly; the same 16px token represents type, padding, and radius. Bottom-nav labels are 11px, high-stakes labels and hints are 13px, listing title implementation disagrees with DESIGN, and the kit, token page, course chrome, and prototype use separate hard-coded scales. Introduce role-based typography tokens and consume them everywhere.

## P2 — Long-form and responsive shell friction

Compatibility is roughly 2,000px long with no progress/draft/resume; defaults and canned identity copy risk accidental misrepresentation. At 320px a classic scrollbar gutter exposes horizontal scrolling because `html` is fixed to a 320px minimum. The bottom bar competes with status/CTA, while desktop device scrolling is hidden and not discoverable. Use a three-step form with progress and local draft, neutral defaults, safe bottom spacing, and resilient 320px reflow.

# Persona Red Flags

- **Jordan (first-timer):** “Apply” unexpectedly leads to another form, 92% is unexplained, and the final green action does not produce the expected confirmation.
- **Sam (keyboard/low vision):** the filter focus trap can leak on Shift+Tab, the toolbar expanded state can become stale, core navigation uses 11px labels, and 320px classic-scrollbar environments expose horizontal scrolling.
- **Casey (distracted mobile):** seven form sections have no progress or draft, the fixed tabbar occupies the thumb zone needed by the CTA, and prefilled answers trade fewer taps for a dangerous risk of submitting inaccurate personal information.

# Minor Observations

- The partially visible next gallery photo is a good swipe affordance.
- Listing CTA copy should disclose that compatibility must be completed first.
- The application compatibility checkbox has no form name.
- Filter apply/reset controls sit below the first viewport without a persistent action area.
- Course navigation at the top and product navigation at the bottom create two competing systems on mobile.
- Footer and navigation text at 11px read as technical residue rather than intentional product copy.
- “Profile complete” and “Owner direct” should not look as evidential as document or video verification.

# Questions to Consider

- If the product’s value is “who you live with,” why is the room always the largest object and the people the smallest?
- Is compatibility a persistent profile completed once, or a required gate for every application?
- Can the product defend 92% with a formula and show the top matches plus one likely tension?
- Are the bottom tabs product information architecture or only navigation between prototype screens?

# Phased Visual UI Improvement Plan

1. Resolve authority: trust-versus-photo hierarchy, actual product navigation, flat elevation policy, and a canonical room fixture.
2. Normalize the design system: semantic typography/spacing/radius/elevation roles, remove legacy `--kit-*`, and align the filter sheet, UI kit, and token page.
3. Rebuild discovery and detail hierarchy around household plus evidence, with explicit proof/claim/habit/status variants.
4. Rebuild compatibility/application as a three-step draftable flow with neutral defaults, an explained result, correct recap, and honest prototype completion.
5. Fix shell and responsive behavior at 320/390/430/1440 plus zoom, safe-area spacing, and desktop scroll affordance.
6. Run consolidated canonical-data, computed-token/type, link, keyboard, detector, and visual QA.

# Typography Workstream

Recommended roles: page title Onest 800 at 24px on 320 and 26px from 390 with 1.12 line height; detail title 22/1.18/800; section title 18/1.3/700; card title 17/1.3/700; body Golos 16/1.5/400; control 16/1.25–1.35/700; supporting 14/1.45/400; field label 14/1.35/600; metadata 13/1.45/400; bottom navigation at least 12/1.2/600–700; 11px overline only for nonessential uppercase text. Long body copy should remain 34–40ch and hints at most 42ch. Responsive rules may change display roles, never shrink body or controls.

Acceptance: product components do not consume raw length primitives as font size/line height; screens have no local font declarations; computed role matrix matches at 320/390/430/1440; 200% zoom and 320px retain all controls without horizontal overflow; long Ukrainian labels do not clip; kit and token showcase render the same roles as real screens.
