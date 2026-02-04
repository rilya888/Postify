# Design System

## Color Palette

```typescript
// Colors for tailwind.config.ts
const colors = {
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',  // Main primary color (Indigo)
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#8b5cf6',  // Main secondary color (Purple)
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',  // Success color (Green)
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // Error color (Red)
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // Warning color (Amber)
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  background: {
    default: '#ffffff',
    muted: '#f9fafb',
    dark: '#111827',
  },
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    muted: '#9ca3af',
    inverse: '#ffffff',
  },
  border: {
    default: '#e5e7eb',
    muted: '#f3f4f6',
  },
  // HelixCast accent (cyan "Cast" effect)
  accent: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',  // Main accent (Cyan)
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
}

// HelixCast gradients (use bg-gradient-helix / bg-gradient-cast in Tailwind)
// gradient-helix: linear-gradient(135deg, #6366f1, #8b5cf6)
// gradient-cast: linear-gradient(90deg, #8b5cf6, #06b6d4)
```

## Typography

- **Headings:** Inter (Bold, 600-700 weight)
- **Body:** Inter (Regular, 400 weight)
- **Code:** JetBrains Mono (Regular, 400 weight)

## Spacing Scale

Using Tailwind's default spacing scale (4px base):
- xs: 0.5rem (4px)
- sm: 0.75rem (6px)
- base: 1rem (8px)
- lg: 1.5rem (12px)
- xl: 2rem (16px)
- 2xl: 3rem (24px)
- etc.

## Border Radius

- sm: 0.25rem (4px)
- base: 0.5rem (8px)
- md: 0.75rem (12px)
- lg: 1rem (16px)
- xl: 1.5rem (24px)
- full: 9999px

## Shadows

- sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
- base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
- md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
- lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
- xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'

---

*Будет использовано в ЭТАП 1 при настройке Tailwind*
