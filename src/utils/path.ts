/**
 * 连接路径片段
 */
export function join(...segments: string[]): string {
  return segments
    .filter((segment) => segment && segment !== ".")
    .join("/")
    .replace(/\/+/g, "/");
}

/**
 * 获取文件扩展名
 */
export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot === -1 ? "" : filename.slice(lastDot + 1);
}

/**
 * 获取不带扩展名的文件名
 */
export function getBasename(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  const lastSlash = Math.max(filename.lastIndexOf("/"), filename.lastIndexOf("\\"));

  if (lastDot === -1) {
    return filename.slice(lastSlash + 1);
  }

  return filename.slice(lastSlash + 1, lastDot);
}

/**
 * 检查路径是否为绝对路径
 */
export function isAbsolute(path: string): boolean {
  return /^([a-zA-Z]:)?[/\\]/.test(path);
}

/**
 * 标准化路径分隔符
 */
export function normalize(path: string): string {
  return path.replace(/[/\\]+/g, "/");
}
