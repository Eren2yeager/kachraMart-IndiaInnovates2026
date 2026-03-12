// Centralized theme configuration for KachraMart
export const theme = {
  colors: {
    // Primary brand colors
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Main green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    // Secondary colors
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    // Waste type colors
    waste: {
      biodegradable: '#22c55e', // Green
      recyclable: '#3b82f6', // Blue
      hazardous: '#ef4444', // Red
      ewaste: '#f59e0b', // Amber
      construction: '#8b5cf6', // Purple
    },
    // Status colors
    status: {
      pending: '#f59e0b', // Amber
      assigned: '#3b82f6', // Blue
      pickedUp: '#8b5cf6', // Purple
      stored: '#06b6d4', // Cyan
      sold: '#22c55e', // Green
      cancelled: '#ef4444', // Red
    },
    // Role colors
    role: {
      citizen: '#3b82f6', // Blue
      collector: '#f59e0b', // Amber
      dealer: '#8b5cf6', // Purple
      admin: '#ef4444', // Red
    },
  },
  // Animation variants
  animation: {
    duration: {
      fast: 0.2,
      normal: 0.3,
      slow: 0.5,
    },
    ease: {
      default: [0.4, 0, 0.2, 1],
      in: [0.4, 0, 1, 1],
      out: [0, 0, 0.2, 1],
      inOut: [0.4, 0, 0.2, 1],
    },
  },
  // Spacing
  spacing: {
    section: '4rem',
    container: '1.5rem',
  },
  // Border radius
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
} as const;

// Animation presets for framer-motion
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
} as const;
