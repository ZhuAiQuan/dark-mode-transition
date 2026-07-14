type GenericMouseEvent<T = unknown> = T extends { __isReactEvent?: true }
  ? import('react').MouseEvent<HTMLElement>
  : MouseEvent

/** 用户选择的主题模式 */
type ThemeMode = 'light' | 'dark' | 'system'

/** 实际生效的主题 */
type ResolvedTheme = 'light' | 'dark'

type DarkModeTransitionOptions = {
  /**
   * 挂在 `<html>` 上表示夜间的 class，默认 `dark`
   * （与 Tailwind `darkMode: 'class'` 一致）
   */
  darkClass?: string
  /**
   * 初始模式，默认 `system`
   */
  defaultMode?: ThemeMode
  /**
   * 若传入，则把用户选择的 mode 持久化到 localStorage
   */
  storageKey?: string
  /**
   * 圆形过渡动画时长（秒），默认 `0.5`
   */
  transitionDuration?: number
  /**
   * mode / resolved 变化时回调
   */
  onChange?: (mode: ThemeMode, resolved: ResolvedTheme) => void
}

export type {
  GenericMouseEvent,
  ThemeMode,
  ResolvedTheme,
  DarkModeTransitionOptions,
}
