import type {
  DarkModeTransitionOptions,
  GenericMouseEvent,
  ResolvedTheme,
  ThemeMode,
} from '../types'

const MEDIA_QUERY = '(prefers-color-scheme: dark)'

export default class DarkModeTransition {
  private darkClass: string
  private transitionDuration: number
  private storageKey?: string
  private onChange?: DarkModeTransitionOptions['onChange']
  private mode: ThemeMode
  private mediaQuery: MediaQueryList
  private onMediaChange: (e: MediaQueryListEvent) => void
  private vtSheet: CSSStyleSheet | null = null

  constructor(options: DarkModeTransitionOptions = {}) {
    this.darkClass = options.darkClass ?? 'dark'
    this.transitionDuration = options.transitionDuration ?? 0.5
    this.storageKey = options.storageKey
    this.onChange = options.onChange

    this.mediaQuery = window.matchMedia(MEDIA_QUERY)
    this.onMediaChange = () => {
      if (this.mode === 'system') {
        this.applyResolved(this.resolve('system'), { animate: false })
        this.emitChange()
      }
    }

    this.mode = this.readStoredMode() ?? options.defaultMode ?? 'system'
    this.toggle = this.toggle.bind(this)
    this.setMode = this.setMode.bind(this)

    this.initViewTransitionStyle()
    this.applyResolved(this.resolve(this.mode), { animate: false })
    this.mediaQuery.addEventListener('change', this.onMediaChange)
    this.emitChange()
  }

  /** 当前用户选择的模式 */
  getMode(): ThemeMode {
    return this.mode
  }

  /** 当前实际生效的主题 */
  getResolved(): ResolvedTheme {
    return this.resolve(this.mode)
  }

  /**
   * 在 light / dark 之间切换（会把 mode 写成明确值，不再跟随 system）
   */
  toggle(e: GenericMouseEvent) {
    const next: ResolvedTheme = this.getResolved() === 'dark' ? 'light' : 'dark'
    this.setMode(next, e)
  }

  /**
   * 设置主题模式。传入事件时，若 resolved 发生变化则播放圆形过渡。
   */
  setMode(mode: ThemeMode, e?: GenericMouseEvent) {
    const prevResolved = this.getResolved()
    this.mode = mode
    this.persistMode(mode)

    const nextResolved = this.resolve(mode)
    const shouldAnimate = Boolean(e) && prevResolved !== nextResolved

    this.applyResolved(nextResolved, {
      animate: shouldAnimate,
      event: e,
      toDark: nextResolved === 'dark',
    })
    this.emitChange()
  }

  /** 移除监听，避免泄漏 */
  destroy() {
    this.mediaQuery.removeEventListener('change', this.onMediaChange)
  }

  private resolve(mode: ThemeMode): ResolvedTheme {
    if (mode === 'system') {
      return this.mediaQuery.matches ? 'dark' : 'light'
    }
    return mode
  }

  private applyResolved(
    resolved: ResolvedTheme,
    {
      animate,
      event,
      toDark,
    }: {
      animate: boolean
      event?: GenericMouseEvent
      toDark?: boolean
    },
  ) {
    const apply = () => {
      document.documentElement.classList.toggle(
        this.darkClass,
        resolved === 'dark',
      )
    }

    if (!animate || !event) {
      apply()
      return
    }

    const { clientX, clientY } = event
    // 清掉上次 fill:forwards 残留，否则新的 ::view-transition-new 会被钉在终态，日间展开看不见
    this.cancelVtAnimations()
    const transition = this.safeStartTransition(apply)

    transition?.ready.then(() => {
      const radius = Math.hypot(
        Math.max(clientX, innerWidth - clientX),
        Math.max(clientY, innerHeight - clientY),
      )
      const large = `circle(${radius}px at ${clientX}px ${clientY}px)`
      const small = `circle(0px at ${clientX}px ${clientY}px)`

      // 日间→夜间：收缩旧层；夜间→日间：展开新层
      // fill: forwards 防止动画结束瞬间 clip 复位闪一帧；finished 后再 cancel 避免残留
      const animOptions: KeyframeAnimationOptions = {
        duration: this.transitionDuration * 1000,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      }

      let animation: Animation
      if (toDark) {
        this.setVtLayer({ oldOnTop: true })
        animation = document.documentElement.animate(
          { clipPath: [large, small] },
          { ...animOptions, pseudoElement: '::view-transition-old(root)' },
        )
      } else {
        this.setVtLayer({ oldOnTop: false })
        animation = document.documentElement.animate(
          { clipPath: [small, large] },
          { ...animOptions, pseudoElement: '::view-transition-new(root)' },
        )
      }

      transition.finished.finally(() => {
        animation.cancel()
      })
    })
  }

  private cancelVtAnimations() {
    document.documentElement.getAnimations().forEach((anim) => {
      const pseudo = (anim.effect as KeyframeEffect | null)?.pseudoElement
      if (pseudo?.startsWith('::view-transition')) {
        anim.cancel()
      }
    })
  }

  private safeStartTransition(callback: () => void) {
    if (!document.startViewTransition) {
      callback()
      document.documentElement.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: this.transitionDuration * 1000 },
      )
      return
    }
    return document.startViewTransition(callback)
  }

  private initViewTransitionStyle() {
    this.vtSheet = new CSSStyleSheet()
    this.setVtLayer({ oldOnTop: false })
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.vtSheet]
  }

  private setVtLayer({ oldOnTop }: { oldOnTop: boolean }) {
    this.vtSheet?.replaceSync(`
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
      }
      ::view-transition-old(root) {
        z-index: ${oldOnTop ? 1 : 0};
      }
      ::view-transition-new(root) {
        z-index: ${oldOnTop ? 0 : 1};
      }
    `)
  }

  private readStoredMode(): ThemeMode | null {
    if (!this.storageKey) return null
    try {
      const value = localStorage.getItem(this.storageKey)
      if (value === 'light' || value === 'dark' || value === 'system') {
        return value
      }
    } catch {
      // ignore
    }
    return null
  }

  private persistMode(mode: ThemeMode) {
    if (!this.storageKey) return
    try {
      localStorage.setItem(this.storageKey, mode)
    } catch {
      // ignore
    }
  }

  private emitChange() {
    this.onChange?.(this.mode, this.resolve(this.mode))
  }
}
