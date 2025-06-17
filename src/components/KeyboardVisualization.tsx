import { useMemo, ReactElement } from 'react'
import { convertFileSrc } from '@tauri-apps/api/core'
import { useCatStore } from '@/stores/catStore'
import { useModelStore } from '@/stores/modelStore'
import { join } from '@/utils/path'

interface KeyImageProps {
  keyName: string
  side: 'left' | 'right'
  isPressed: boolean
}

function KeyImage({ keyName, side, isPressed }: KeyImageProps) {
  const { currentModel } = useModelStore()
  
  if (!isPressed || !currentModel) return null

  const imagePath = convertFileSrc(join(currentModel.path, 'resources', `${side}-keys`, `${keyName}.png`))

  return (
    <img
      src={imagePath}
      alt={`${keyName} key`}
      className="absolute w-full h-full"
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}

// 键盘映射 - 将按键代码映射到图片文件名
const keyMapping: Record<string, string> = {
  'KeyQ': 'KeyQ',
  'KeyW': 'KeyW', 
  'KeyE': 'KeyE',
  'KeyR': 'KeyR',
  'KeyT': 'KeyT',
  'KeyY': 'KeyY',
  'KeyU': 'KeyU',
  'KeyI': 'KeyI',
  'KeyO': 'KeyO',
  'KeyP': 'KeyP',
  'KeyA': 'KeyA',
  'KeyS': 'KeyS',
  'KeyD': 'KeyD',
  'KeyF': 'KeyF',
  'KeyG': 'KeyG',
  'KeyH': 'KeyH',
  'KeyJ': 'KeyJ',
  'KeyK': 'KeyK',
  'KeyL': 'KeyL',
  'KeyZ': 'KeyZ',
  'KeyX': 'KeyX',
  'KeyC': 'KeyC',
  'KeyV': 'KeyV',
  'KeyB': 'KeyB',
  'KeyN': 'KeyN',
  'KeyM': 'KeyM',
  'Space': 'Space',
  'ArrowUp': 'UpArrow',
  'ArrowDown': 'DownArrow',
  'ArrowLeft': 'LeftArrow',
  'ArrowRight': 'RightArrow',
}

export function KeyboardVisualization() {
  const { pressedKeys, setPressedKeys } = useCatStore()

  const keyImages = useMemo(() => {
    const images: ReactElement[] = []
    
    pressedKeys.forEach((key) => {
      const mappedKey = keyMapping[key]
      if (!mappedKey) return
      
      // 确定是左手还是右手按键
      const leftKeys = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB']
      const rightKeys = ['KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'KeyN', 'KeyM', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      
      let side: 'left' | 'right' = 'left'
      if (rightKeys.includes(key)) {
        side = 'right'
      } else if (key === 'Space') {
        side = 'left' // 空格键放在左边
      }
      
      images.push(
      <KeyImage
          key={`${side}-${key}`}
          keyName={mappedKey}
          side={side}
        isPressed={true}
      />
      )
    })
    
    return images
  }, [pressedKeys])

  return (
    <>
      {keyImages}
    </>
  )
} 