// src/types.ts
type GenericMouseEvent<T = unknown> = T extends { __isReactEvent?: true }
  ? import('react').MouseEvent<HTMLElement> // 只有用 React 时才引入
  : MouseEvent; // 默认使用原生 DOM 类型

export type { GenericMouseEvent };