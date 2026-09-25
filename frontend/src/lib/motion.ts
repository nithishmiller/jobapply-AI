/**
 * Motion variants and easing exports for Framer Motion / Motion library.
 * Based on token values from tokens.ts
 */

import type { Variants, Transition, Easing } from "motion";
import {
  durations,
  stagger,
  interactionStates,
} from "./tokens";

// Re-export token values
export { durations, stagger, interactionStates } from "./tokens";

// Type-safe easing for motion
const easingMotion = {
  linear: "linear" as Easing,
  in: "cubic-bezier(0.4, 0, 0.2, 1)" as Easing,
  out: "cubic-bezier(0.0, 0, 0.2, 1)" as Easing,
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)" as Easing,
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)" as Easing,
  expoOut: "cubic-bezier(0.95, 0.05, 0.795, 0.035)" as Easing,
  expoInOut: "cubic-bezier(1, 0, 0, 1)" as Easing,
};

// Standard transitions
export const transitions = {
  fast: { duration: durations.fast / 1000, ease: easingMotion.out },
  normal: { duration: durations.normal / 1000, ease: easingMotion.inOut },
  slow: { duration: durations.slow / 1000, ease: easingMotion.inOut },
  cinematic: { duration: durations.cinematic / 1000, ease: easingMotion.expoOut },
  spring: { duration: durations.normal / 1000, ease: easingMotion.spring },
} as const satisfies Record<string, Transition>;

// Stagger variants
export const staggerVariants = {
  base: stagger.base / 1000,
  item: stagger.item / 1000,
  group: stagger.group / 1000,
} as const;

// Fade variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.normal,
  },
};

export const fadeOut: Variants = {
  visible: { opacity: 1 },
  hidden: {
    opacity: 0,
    transition: transitions.fast,
  },
};

// Slide variants
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
};

// Scale variants
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
};

export const scaleOut: Variants = {
  visible: { opacity: 1, scale: 1 },
  hidden: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.fast,
  },
};

// Stagger container
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerVariants.item,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerVariants.group,
    },
  },
};

// Item variants for staggering
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
};

// Page transition variants
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.cinematic,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: transitions.slow,
  },
};

// Card hover variant
export const cardHover: Variants = {
  initial: {
    scale: 1,
    y: 0,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
  },
  hover: {
    scale: interactionStates.hover.scale,
    y: -8,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
    transition: transitions.fast,
  },
};

// Button interaction variants
export const buttonTap: Variants = {
  initial: { scale: 1 },
  hover: { scale: interactionStates.hover.scale },
  tap: { scale: interactionStates.active.scale },
};

// Glow pulse variant
export const glowPulse: Variants = {
  initial: { boxShadow: "0 0 0 rgba(108, 198, 212, 0)" },
  animate: {
    boxShadow: [
      "0 0 0 rgba(108, 198, 212, 0)",
      "0 0 20px rgba(108, 198, 212, 0.4)",
      "0 0 0 rgba(108, 198, 212, 0)",
    ],
    transition: {
      duration: durations.cinematic / 1000,
      repeat: Infinity,
      ease: easingMotion.inOut,
    },
  },
};

// Modal/overlay variants
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: transitions.fast,
  },
};

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.normal },
  exit: { opacity: 0, transition: transitions.normal },
};

// Scroll-driven animation helpers
export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.cinematic,
  },
};

export const scrollRevealStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerVariants.item,
    },
  },
};

// Text reveal variants
export const textReveal: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slow / 1000, ease: easingMotion.expoOut },
  },
};

export const textRevealStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerVariants.base / 1000,
    },
  },
};

// Export all variants as a combined object for convenience
export const variants = {
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  scaleIn,
  scaleOut,
  staggerContainer,
  staggerContainerSlow,
  staggerItem,
  pageTransition,
  cardHover,
  buttonTap,
  glowPulse,
  modalVariants,
  backdropVariants,
  scrollReveal,
  scrollRevealStagger,
  textReveal,
  textRevealStagger,
} as const;