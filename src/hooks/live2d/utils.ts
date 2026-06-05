/**
 * Live2D 系统工具函数
 */

export const DEFAULT_VIEWPORT_SIZE = {
  width: 800,
  height: 600
} as const;

/**
 * 获取图片尺寸
 */
export function getImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 有背景图时用背景尺寸，否则回退到默认视口尺寸。
 */
export async function getViewportSize(backgroundImage: string): Promise<{ width: number; height: number }> {
  if (!backgroundImage) {
    return { ...DEFAULT_VIEWPORT_SIZE };
  }

  return getImageSize(backgroundImage);
}
