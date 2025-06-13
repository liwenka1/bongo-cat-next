import type { LiteralUnion } from 'antd/es/_util/type'

export function join(...paths: LiteralUnion<'resources' | 'left-keys' | 'right-keys' | 'background.png' | 'cover.png'>[]) {
  const separator = '/'
  
  const joinPaths = paths.map((path) => {
    if (path.endsWith(separator)) {
      return path.slice(0, -1)
    }

    return path
  })

  return joinPaths.join(separator)
} 