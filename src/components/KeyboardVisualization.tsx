import { useMemo } from 'react'
import { useCatStore } from '@/stores/catStore'
import { useDevice } from '@/hooks/useDevice'

interface KeyImageProps {
  keyName: string
  side: 'left' | 'right'
  isPressed: boolean
}

function KeyImage({ keyName, side, isPressed }: KeyImageProps) {
  const { currentModelPath } = useCatStore()
  
  if (!isPressed) return null

  const imagePath = `/models/${currentModelPath}/resources/${side}-keys/${keyName}.png`

  return (
    <img
      src={imagePath}
      alt={`${keyName} key`}
      className="absolute pointer-events-none"
      style={{
        zIndex: 10,
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
      }}
      onError={(e) => {
        // 如果图片加载失败，隐藏元素
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}

export function KeyboardVisualization() {
  const { pressedLeftKeys, pressedRightKeys } = useDevice()

  const leftKeyImages = useMemo(() => {
    return pressedLeftKeys.map((key) => (
      <KeyImage
        key={`left-${key}`}
        keyName={key}
        side="left"
        isPressed={true}
      />
    ))
  }, [pressedLeftKeys])

  const rightKeyImages = useMemo(() => {
    return pressedRightKeys.map((key) => (
      <KeyImage
        key={`right-${key}`}
        keyName={key}
        side="right"
        isPressed={true}
      />
    ))
  }, [pressedRightKeys])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {leftKeyImages}
      {rightKeyImages}
    </div>
  )
} 