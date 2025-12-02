import 'react';

declare module 'react' {
  interface CSSProperties {
    // Allow Tailwind CSS custom properties
    '--tw-ring-color'?: string;
    '--tw-divide-color'?: string;
    // Allow any CSS custom property
    [key: `--${string}`]: string | number | undefined;
  }
}
