/**
 * Check if running on macOS
 */
export const isMac = typeof window !== "undefined" && navigator.userAgent.toLowerCase().includes("mac");

/**
 * Check if running on Windows
 */
export const isWindows = typeof window !== "undefined" && navigator.userAgent.toLowerCase().includes("win");

/**
 * Check if running on Linux
 */
export const isLinux = typeof window !== "undefined" && navigator.userAgent.toLowerCase().includes("linux");

/**
 * Get platform name
 */
export function getPlatform(): "mac" | "windows" | "linux" | "unknown" {
  if (isMac) return "mac";
  if (isWindows) return "windows";
  if (isLinux) return "linux";
  return "unknown";
}
