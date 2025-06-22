/**
 * Join path segments
 */
export function join(...segments: string[]): string {
  return segments
    .filter(segment => segment && segment !== '.')
    .join('/')
    .replace(/\/+/g, '/')
}

/**
 * Get file extension
 */
export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot === -1 ? '' : filename.slice(lastDot + 1)
}

/**
 * Get filename without extension
 */
export function getBasename(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  const lastSlash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'))
  
  if (lastDot === -1) {
    return filename.slice(lastSlash + 1)
  }
  
  return filename.slice(lastSlash + 1, lastDot)
}

/**
 * Check if path is absolute
 */
export function isAbsolute(path: string): boolean {
  return /^([a-zA-Z]:)?[/\\]/.test(path)
}

/**
 * Normalize path separators
 */
export function normalize(path: string): string {
  return path.replace(/[/\\]+/g, '/')
} 