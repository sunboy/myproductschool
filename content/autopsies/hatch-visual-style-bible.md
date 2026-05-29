# Hatch Visual Style Bible for Public Autopsies

Purpose: keep every public autopsy image recognizable as HackProduct, useful as evidence, and consistent across web, thumbnails, and social crops.

## Canonical Hatch Reference

Official Hatch source asset:
- Repo path: `public/images/hatch/hatch-official-mascot.png`
- Original implementation source: `/Users/sandeep/Documents/hackproduct-marketing/mascot.png`
- SHA-256: `ef5b1d4f624c6c61b586f4f495e1c4a9e1cfc37054e951e55337f58a5b6d865c`
- Native size: `1024x1024`

This mascot is the source of truth for Hatch in every autopsy image. Prompt-only character drawings are not approved. Final Hatch variants must be generated from this reference, edited from this reference, or composited from this reference.

Required Hatch traits:
- Rounded forest-green head frame.
- Cream face and cream body.
- Graduation cap on top of the head.
- Upward growth arrow attached near the cap.
- Green `H` mark on the chest.
- Bright friendly eyes with simple cartoon highlights.
- Simple mitten hands.
- Friendly coach expression.
- Clean flat illustration texture, not realistic fabric, plastic, 3D, or painterly detail.

Approved Hatch variant set:
- Narrator.
- Pointing.
- Reading.
- Thinking.
- Coaching.
- Celebrating.
- Small watermark-adjacent pose.

Older `public/images/hacky_*` files may be used as secondary pose inspiration only when they match the official mascot. They are not the source of truth.

## Visual System

Hatch is the narrator, not the subject. Use Hatch to point, react, compare, or frame evidence. The product decision remains the visual center.

Core look:
- Flat geometric illustration with crisp vector-like edges.
- Warm cream background, forest green structure, amber emphasis, charcoal linework.
- Product references are abstracted into shapes, UI blocks, timelines, metrics, and object metaphors.
- No human faces or real person likenesses. Hatch must preserve the official mascot traits listed above.
- No photorealism, mock stock scenes, neon cyber gradients, busy textures, or fake app screenshots.
- No large paragraphs inside images. Use labels only when the role requires them.

Palette:
- Cream: `#faf6f0`
- Forest: `#4a7c59`
- Deep forest: `#244232`
- Amber: `#705c30`
- Soft amber: `#c9ad68`
- Charcoal: `#1e211c`
- Mist: `#dfe6dc`

Composition:
- One primary idea per image.
- Use 3 to 5 major shapes, then small evidence marks.
- Keep Hatch at 12 to 20 percent of canvas height unless the asset role is `hatch-narrator`.
- Leave clean negative space for page overlays and crops.
- Show causality with arrows, sequence bands, before/after splits, or pressure points.

## Prompt Template

Use this template for every generated concept prompt:

```text
Create a flat geometric HackProduct autopsy illustration for [company/product] about [decision or failure mechanism]. Canvas role: [asset role]. Show [specific objects and layout]. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as [small narrator / main narrator / absent] doing [specific action]. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Use warm cream background, forest green structure, amber highlights, charcoal linework. Keep shapes crisp, editorial, and evidence-driven. No human faces, no photorealism, no fake screenshots, no dense text. [Crop instruction]. [Watermark instruction].
```

Role-specific prompt endings:
- Hero: `Leave quiet space in the upper left for title overlay.`
- Thumbnail: `Make the decision readable at small size with one strong focal shape.`
- Social cover: `Keep the center 70 percent clear of edge-critical details.`
- Evidence card: `Use one short label and one visible artifact shape only.`

Forbidden prompt language:
- "cinematic", "stunning", "viral", "beautiful chaos", "futuristic vibe", "premium 3D", "highly detailed", "dramatic lighting".
- Any instruction to redraw Hatch from scratch.
- Any instruction that removes Hatch's cap, growth arrow, H chest mark, green and cream palette, or friendly face style.

## Asset Roles

Every public autopsy should ship these final roles:

| Role | Purpose | Default size | Safe crop | Hatch use |
| --- | --- | --- | --- | --- |
| `hero` | Top of autopsy page | 2400x1350 | 16:9, 4:3 center | Small narrator, optional |
| `hatch-narrator` | Hatch-led explanation moment | 1600x1600 | 1:1 | Main subject |
| `failure-mechanism` | Visual model of why the decision failed or worked | 1800x1200 | 3:2, 16:9 center | Pointer or observer |
| `evidence-card` | Single proof point, metric, quote, artifact, or timeline beat | 1600x1000 | 8:5, 1:1 center | Usually absent |
| `lesson-frame` | Transferable product lesson | 1800x1200 | 3:2, 4:3 center | Coach stance |
| `thumbnail` | Listing card and small preview | 1200x900 | 4:3 | Tiny mark only |
| `social-cover` | OG and social share | 2400x1260 | 1.91:1 | Small narrator or watermark |

These roles are the distribution and QA kit, not a mandate to show seven images inside every article. The reader should show only the visuals that carry distinct story work. Default reader use:
- `hero` appears at the top of the article.
- `failure-mechanism` may appear once inside the long read when it clarifies the core mechanism.
- `evidence-card` or `lesson-frame` may appear only when it adds a new proof point or transfer lesson.
- `thumbnail` and `social-cover` are for listing cards, dashboards, SEO, and sharing. Do not show them as article body content.
- `hatch-narrator` is optional inside the article and should be used only when Hatch adds a new narrative beat.

## File Naming

Store final assets under:

```text
public/images/autopsies/[story-slug]/final/[role].[ext]
```

Examples:

```text
public/images/autopsies/instagram-stories/final/hero.svg
public/images/autopsies/instagram-stories/final/failure-mechanism.svg
public/images/autopsies/instagram-stories/final/social-cover.svg
```

Use lowercase slugs, hyphens, exact role names, and the extension recorded in the manifest. Do not add version numbers to final paths. Put alternates in a local working folder, not in `public`.

## Watermark Rules

Watermark text: `Told by Hatch · HackProduct` or `HackProduct Autopsy`.

Rules:
- Add watermark to every final image.
- Keep watermark subtle but readable at 320 px wide.
- Place watermark bottom right with at least 48 px padding on 2400 px wide assets.
- Use `#244232` at 70 to 85 percent opacity on cream backgrounds.
- Use cream at 85 percent opacity on dark green panels.
- Keep watermark below 4 percent of canvas width.
- Never place watermark on top of Hatch, data labels, or product marks.

## Crop Rules

Safe zones:
- Keep all essential content inside center 70 percent width and center 76 percent height.
- Keep title overlay zones clear in the hero upper left and social-cover center left.
- Keep Hatch away from the outer 10 percent edge unless intentionally used as a peeking narrator.

Per-role crop checks:
- `hero`: must survive 16:9 desktop and 4:3 tablet crops.
- `thumbnail`: must read at 320 px wide.
- `social-cover`: must read at 1200x630 and 1600x900 previews.
- `evidence-card`: labels must remain legible after a 1:1 center crop.

## QA Checklist

Before marking an image final:
- Role path matches the manifest.
- Product, story, and decision are visible without reading body copy.
- Hatch pose matches the role, keeps the official head shape, cap, growth arrow, `H` body mark, face style, and green/cream palette, and does not steal focus.
- Palette uses the approved colors or a documented exception.
- No human faces, photorealistic stock scenes, fake UI screenshots, or dense text.
- No copyrighted product UI recreation. Use abstract shapes and truthful references.
- Watermark follows role rules.
- Crop survives the listed safe crops.
- Thumbnail is readable at 320 px wide.
- Alt text states the image function, not a decorative mood.
- Manifest includes prompt, reference asset, reference SHA-256, source status, crop notes, and QA status.

Reject any Hatch variant with changed head shape, missing cap, missing growth arrow, wrong body mark, different face style, realistic texture, or inconsistent green and cream palette.

## Approval Standard

An asset is ready when a reviewer can answer these three questions in under five seconds:
- What decision is being shown?
- What mechanism or evidence matters?
- Why is Hatch present in this frame?
