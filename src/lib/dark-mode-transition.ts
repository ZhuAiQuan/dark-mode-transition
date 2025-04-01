import type { GenericMouseEvent } from '../types'

type Theme = 'light' | 'dark';
// 扩展主题配置，允许其他键
type ThemeConfig = {
  /**
   * CSS 变量 整个网站背景色
   */
  '--bg-clr': string;
  /**
   * CSS 变量 整个网站文字颜色
   */
  '--text-clr': string;
  /**
   * CSS 变量 过渡动画持续时间
   */
  '--transition-duration': string;
  [key: string]: string;
};

type Themes = {
  [T in Theme]: ThemeConfig;
};

export default class DarkModeTransition {
  // private theme: Theme;
  private transitionDuration: number = 0.5;
  private themes: Themes;
  constructor({
    themes,
  }: {
    themes?: Themes,
  }) {
    // this.theme = defaultTheme;
    this.themes = themes || {
      light: {
        '--bg-clr': '#fff',
        '--text-clr': '#242424',
        '--transition-duration': '0.5s',
      },
      dark: {
        '--bg-clr': '#242424',
        '--text-clr': '#fff',
        '--transition-duration': '0.5s',
      }
    };
    this.toggle = this.toggle.bind(this);

    this.initStyle();
  }
  toggle(e: GenericMouseEvent) {
    const isDark = document.documentElement.classList.contains('dark');
    // this.theme = !isDark ? 'light' : 'dark';
    const { clientX, clientY } = e;

    const transition = this.safeStartTransition(() => {
      document.documentElement.classList.toggle('dark');
    });

    transition?.ready.then(() => {
      const radius = Math.hypot(
        Math.max(clientX, innerWidth - clientX),
        Math.max(clientY, innerHeight - clientY)
      );
      const clipPath = [
        `circle(${radius}px at ${clientX}px ${clientY}px)`,
        `circle(0px at ${clientX}px ${clientY}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: isDark ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: this.transitionDuration * 1000,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    })
  }
  private safeStartTransition(callback: () => void) {

    // 降级动画
    if (!document.startViewTransition) {
      callback();
      document.documentElement.animate([
        {
          opacity: 0,
        },
        {
          opacity: 1,
        }
      ], {
        duration: this.transitionDuration * 1000,
      })
      return;
    }
    return document.startViewTransition(callback)
  }
  private initStyle() {
    const sheet = new CSSStyleSheet();
    const { light, dark } = this.themes;
    sheet.replaceSync(`
      :root {
        ${Object.entries(light).map(([key, value]) => `${key}: ${value};`).join('\n')}
        color: var(--text-clr);
        background-color: var(--bg-clr);
      }
      :is(html.dark, html.dark@media (prefers-color-scheme: dark)) {
        ${Object.entries(dark).map(([key, value]) => `${key}: ${value};`).join('\n')}
        transition-property: background-color;
        transition-delay: var(--transition-duration);
      }
      ::view-transition-new(root),
      ::view-transition-old(root){
        animation: none;
      }
      ::view-transition-new(root) {
        mix-blend-mode: exclusion;
      }
    `);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
  }
}