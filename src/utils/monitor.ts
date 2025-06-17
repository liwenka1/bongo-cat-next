import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { cursorPosition, monitorFromPoint } from '@tauri-apps/api/window'

interface CursorPosition {
  x: number
  y: number
}

interface Monitor {
  name?: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  scaleFactor: number
  cursorPosition?: CursorPosition
}

export async function getCursorMonitor() {
  try {
    const appWindow = getCurrentWebviewWindow()
    const scaleFactor = await appWindow.scaleFactor()
    const point = await cursorPosition()
    const { x, y } = point.toLogical(scaleFactor)
    const monitor = await monitorFromPoint(x, y)

    if (!monitor) return null

    return {
      ...monitor,
      cursorPosition: point,
    }
  } catch (error) {
    console.error('Failed to get cursor monitor:', error)
    return null
  }
} 