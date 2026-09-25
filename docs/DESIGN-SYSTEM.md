
# JobApply AI — Design System

## 1. Design Direction

JobApply AI uses a dark cinematic, premium product-showcase aesthetic.

Core characteristics:

- Deep black and navy foundation.

- Cyan and blue accent lighting.

- Controlled glow rather than excessive neon.

- Large visual compositions.

- Layered depth and atmospheric gradients.

- Sophisticated typography.

- Premium editorial/product presentation.

- Purposeful motion and interaction.

- Strong visual hierarchy.

- Responsive across desktop, tablet and mobile.

## 2. Visual Principles

### Depth

Use layered surfaces, subtle borders, blur, shadows and controlled gradients to create depth.

### Contrast

Maintain strong text contrast and clear hierarchy.

### Glow

Use glow selectively for:

- AI intelligence.

- Interactive states.

- Important actions.

- Data visualizations.

- 3D/WebGL scenes.

### Motion

Motion should communicate:

- State changes.

- Navigation.

- Hierarchy.

- Progress.

- Spatial relationships.

Avoid animation that exists only for decoration.

## 3. Typography

Typography should feel:

- Technical.

- Modern.

- Premium.

- Highly readable.

Use a consistent type scale and avoid excessive font variations.

## 4. Color System

Primary foundation:

- Near-black.

- Deep navy.

- Dark neutral surfaces.

Accent system:

- Cyan.

- Electric blue.

- Controlled blue-violet where appropriate.

Semantic colors:

- Success.

- Warning.

- Error.

- Informational.

Semantic colors must remain accessible and must not replace the primary visual identity.

## 5. Surfaces

Use a small number of reusable surface patterns:

- Base background.

- Elevated panel.

- Glass/blur surface.

- Interactive surface.

- Modal/dialog surface.

Avoid creating a unique visual treatment for every component.

## 6. Components

Primary UI foundation:

- shadcn/ui

- Base UI

Use reusable primitives for:

- Buttons.

- Inputs.

- Forms.

- Dialogs.

- Cards.

- Navigation.

- Tabs.

- Tooltips.

- Dropdowns.

- Toasts.

Product-specific components should compose these primitives instead of duplicating them.

## 7. Motion Stack

Motion:

- Interface interactions.

- Micro-interactions.

- Component transitions.

GSAP:

- Complex cinematic timelines.

- Scroll-driven storytelling.

- Large visual sequences.

Lenis:

- Smooth scrolling where appropriate.

Three.js / React Three Fiber:

- AI visualizations.

- Germany topology.

- City networks.

- Job signal visualizations.

- Other meaningful 3D experiences.

## 8. Accessibility

- Keyboard navigation must work.

- Focus states must remain visible.

- Interactive elements need accessible names.

- Respect prefers-reduced-motion.

- Maintain sufficient color contrast.

- Do not rely on color alone to communicate meaning.

## 9. Responsive Design

Design for:

- Mobile.

- Tablet.

- Laptop.

- Desktop.

- Large displays.

Do not simply scale desktop layouts down.

Layouts should adapt their hierarchy and interaction patterns to smaller screens.

## 10. Performance

- Avoid unnecessary animations.

- Lazy-load expensive media.

- Lazy-load heavy 3D scenes.

- Optimize images and video.

- Avoid unnecessary WebGL.

- Keep interaction responsive.

Every visual effect must justify its performance cost.

## 11. Component Rule

Before creating a new component:

1. Check whether an existing component can be reused.

2. Check shadcn/Base UI primitives.

3. Extend an existing component when appropriate.

4. Only create a new component when the behavior or visual role is genuinely different.

Do not create duplicate components.

