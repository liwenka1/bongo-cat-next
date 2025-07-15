/**
 * 连接路径片段
 */
export function join(...segments: string[]): string {
  return segments
    .filter((segment) => segment && segment !== ".")
    .join("/")
    .replace(/\/+/g, "/");
}
