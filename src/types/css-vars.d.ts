import 'react';

declare module 'react' {
  /** Lets inline styles set CSS custom properties, e.g. style={{ '--daylight': '0.4' }}. */
  interface CSSProperties {
    [property: `--${string}`]: string | undefined;
  }
}
