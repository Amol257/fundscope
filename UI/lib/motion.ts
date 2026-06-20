// lib/motion.ts
// Single source of truth for every easing curve and spring config in the project.

// Entrances: content appearing on scroll or mount (cards, rows, sections)
export const EASE_ENTRANCE: [number, number, number, number] = [0.16, 1, 0.3, 1]; // ease-out-expo

// Exits: content leaving (dropdown close, modal dismiss, tooltip hide)
export const EASE_EXIT: [number, number, number, number] = [0.7, 0, 0.84, 0]; // ease-in-quart

// Ambient loops: background shapes, idle drift, anything with repeat: Infinity
export const EASE_AMBIENT = 'easeInOut' as const;

// Micro-interactions: button press, icon swap, anything under 200ms
export const EASE_MICRO: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Springs: anything that should feel physically dragged or magnetized (tilt, magnetic buttons, the globe)
export const SPRING_TACTILE = { stiffness: 220, damping: 22, mass: 0.5 };   // cards, buttons
export const SPRING_HEAVY   = { stiffness: 120, damping: 18, mass: 0.9 };   // larger elements, the grade cube idle settle
