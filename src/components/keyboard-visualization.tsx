import { useMemo, useState, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useCatStore } from "@/stores/cat-store";
import { useModelStore } from "@/stores/model-store";
import { join } from "@/utils/path";
import Image from "next/image";

export function KeyboardVisualization() {
  const { pressedLeftKeys, pressedRightKeys, supportedLeftKeys, supportedRightKeys } = useCatStore();
  const { currentModel } = useModelStore();
  const [keyImageCache, setKeyImageCache] = useState<Record<string, string>>({});

  // 预加载并缓存按键图片路径（只在模型变化时更新）
  useEffect(() => {
    if (!currentModel) return;

    const cacheKeyImages = async () => {
      const cache: Record<string, string> = {};

      // 缓存所有支持的按键图片路径
      const allSupportedKeys = [...new Set([...supportedLeftKeys, ...supportedRightKeys])];

      for (const key of allSupportedKeys) {
        // 直接构建左右路径，不需要检查文件存在性
        const leftPath = join(currentModel.path, "resources", "left-keys", `${key}.png`);
        const rightPath = join(currentModel.path, "resources", "right-keys", `${key}.png`);

        cache[`left-${key}`] = convertFileSrc(leftPath);
        cache[`right-${key}`] = convertFileSrc(rightPath);
      }

      setKeyImageCache(cache);
    };

    void cacheKeyImages();
  }, [currentModel, supportedLeftKeys, supportedRightKeys]);

  // 根据按键获取缓存的图片路径
  const getKeyImagePath = (key: string, side: "left" | "right") => {
    const cacheKey = `${side}-${key}`;
    return keyImageCache[cacheKey] || "";
  };

  const leftKeyImages = useMemo(() => {
    if (!pressedLeftKeys.length) return [];

    // 去重，确保每个按键只渲染一次
    const uniqueKeys = [...new Set(pressedLeftKeys)];

    return uniqueKeys
      .map((key) => {
        const imagePath = getKeyImagePath(key, "left");
        if (!imagePath) return null;

        return (
          <Image
            key={`left-${key}`}
            width={100}
            height={100}
            src={imagePath}
            alt={`${key} key`}
            className="absolute size-full"
          />
        );
      })
      .filter(Boolean);
  }, [pressedLeftKeys, keyImageCache]);

  const rightKeyImages = useMemo(() => {
    if (!pressedRightKeys.length) return [];

    // 去重，确保每个按键只渲染一次
    const uniqueKeys = [...new Set(pressedRightKeys)];

    return uniqueKeys
      .map((key) => {
        const imagePath = getKeyImagePath(key, "right");
        if (!imagePath) return null;

        return (
          <Image
            key={`right-${key}`}
            width={100}
            height={100}
            src={imagePath}
            alt={`${key} key`}
            className="absolute size-full"
          />
        );
      })
      .filter(Boolean);
  }, [pressedRightKeys, keyImageCache]);

  return (
    <>
      {leftKeyImages}
      {rightKeyImages}
    </>
  );
}
