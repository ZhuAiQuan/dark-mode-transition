# dark-mode-transition

用 [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) 做圆形主题切换动画。

库**只负责**在 `<html>` 上切换 class（默认 `dark`），**不接管**你的 CSS 变量或主题色。颜色怎么写完全由业务决定。

## Install

```bash
npm i dark-mode-transition
```

## 约定

切换夜间时，库会给 `<html>` 加上 `dark` class（可通过 `darkClass` 改名）：

```html
<html class="dark">
```

你自己用任何方式响应即可，例如：

```css
:root {
  --bg: #fff;
  --text: #111;
}

html.dark {
  --bg: #111;
  --text: #fff;
}
```

或 Tailwind `darkMode: 'class'` + `dark:` 工具类。

## Usage

```js
import { DarkModeTransition } from 'dark-mode-transition'

const theme = new DarkModeTransition({
  // darkClass: 'dark',       // 默认，与 Tailwind class 策略一致
  // defaultMode: 'system',   // 'light' | 'dark' | 'system'
  // storageKey: 'theme',     // 传入则持久化用户选择
  // transitionDuration: 0.5, // 秒
  onChange(mode, resolved) {
    console.log(mode, resolved)
  },
})

// 点击切换 light ↔ dark（会退出 system，改为明确模式）
button.addEventListener('click', (e) => theme.toggle(e))

// 或指定模式；传入事件时，若实际主题变了会播动画
theme.setMode('dark', e)
theme.setMode('system') // 跟随系统，一般不传事件、不播圆形动画

theme.getMode()     // 'light' | 'dark' | 'system'
theme.getResolved() // 'light' | 'dark'（system 时按 OS 解析）

// 不再使用时
theme.destroy()
```

### 状态说明

| 概念 | 含义 |
|------|------|
| `mode` | 用户选择：`light` / `dark` / `system` |
| `resolved` | 实际生效：永远是 `light` 或 `dark` |

- 手动 `toggle` / `setMode('light'|'dark')`：写入明确 mode，可带动画  
- `mode === 'system'` 时监听 `prefers-color-scheme`，OS 变化会同步 class，**不播**圆形动画（没有点击坐标）

### 开发调试

```bash
npm run dev
```

demo 直接引用源码，支持 HMR。发布前再 `npm run build`。

## API

### `new DarkModeTransition(options?)`

| 选项 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `darkClass` | `string` | `'dark'` | 挂在 `<html>` 上表示夜间的 class |
| `defaultMode` | `ThemeMode` | `'system'` | 初始模式（无 storage 时） |
| `storageKey` | `string` | — | 有值则把 mode 存 localStorage |
| `transitionDuration` | `number` | `0.5` | 动画时长（秒） |
| `onChange` | `(mode, resolved) => void` | — | mode / resolved 变化回调 |

### 方法

- `toggle(e)` — 在 resolved light/dark 间切换  
- `setMode(mode, e?)` — 设置 mode；有事件且 resolved 变化时播动画  
- `getMode()` / `getResolved()`  
- `destroy()` — 移除媒体查询监听  
