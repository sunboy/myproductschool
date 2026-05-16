# HackProduct motion primitives

Use these components before importing `framer-motion` directly. The goal is a calm, coaching-oriented motion language that works across new routes without each page inventing its own timing.

## Page and section entry

- `MotionPage` for client route shells.
- `MotionSection` for below-the-fold sections that should reveal once.
- `MotionCard` for individual elevated surfaces.

## Dynamic lists

Use `MotionList` around a grid or list and `MotionListItem` around each item. Give stable `layoutId`s when the same item can move between layouts.

```tsx
<MotionList layoutKey="practice-results" className="grid gap-3">
  {items.map((item) => (
    <MotionListItem key={item.id} layoutId={`item-${item.id}`}>
      <ItemCard item={item} />
    </MotionListItem>
  ))}
</MotionList>
```

## Async, drawers, and collapsible panels

- `PresencePanel` for content that mounts and unmounts.
- `CollapsiblePanel` for transcript/chat/FLOW-style controlled panels.
- `FocusSurface` for center-stage detected context such as a challenge prompt, rubric signal, or important coaching moment.

## Progress states

Use `AnimatedProgress` for plan, chapter, grading, and feedback progress. Set `state="active"` for in-progress work, `state="complete"` for completed work, and `state="next"` for the next recommended item.

## Scroll-driven reader UI

Use `useScrollCollapse(ref)` against the actual scroll container. Do not listen to `window` scroll when the page owns an inner scroll region.
