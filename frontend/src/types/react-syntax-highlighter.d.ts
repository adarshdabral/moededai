declare module 'react-syntax-highlighter/dist/esm/prism-async' {
  import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
  import type { ComponentType } from 'react';
  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  import type { CSSProperties } from 'react';
  export const oneLight: { [key: string]: CSSProperties };
  export const oneDark: { [key: string]: CSSProperties };
}
