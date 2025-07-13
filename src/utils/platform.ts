/**
 * 检查是否运行在 macOS 上
 */
export const isMac = typeof window !== "undefined" && navigator.userAgent.toLowerCase().includes("mac");

/**
 * 检查是否运行在 Windows 上
 */
export const isWindows = typeof window !== "undefined" && navigator.userAgent.toLowerCase().includes("win");

/**
 * 检查是否运行在 Linux 上
 */
export const isLinux = typeof window !== "undefined" && navigator.userAgent.toLowerCase().includes("linux");

/**
 * 获取平台名称
 */
export function getPlatform(): "mac" | "windows" | "linux" | "unknown" {
  if (isMac) return "mac";
  if (isWindows) return "windows";
  if (isLinux) return "linux";
  return "unknown";
}
