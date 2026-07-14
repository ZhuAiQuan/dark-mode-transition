/// <reference types="vite/client" />

/** View Transition API — 尚未进入默认 DOM lib 的补全 */
interface ViewTransition {
  readonly ready: Promise<void>
  readonly finished: Promise<void>
  readonly updateCallbackDone: Promise<void>
  skipTransition(): void
}

interface Document {
  startViewTransition?(
    updateCallback?: () => void | Promise<void>,
  ): ViewTransition
}
