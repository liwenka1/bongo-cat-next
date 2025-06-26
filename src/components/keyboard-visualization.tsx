import { useMemo, useState, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useCatStore } from "@/stores/catStore";
import { useModelStore } from "@/stores/modelStore";
import { join } from "@/utils/path";
import { exists } from "@tauri-apps/plugin-fs";
import Image from "next/image";

export function KeyboardVisualization() {
  const { pressedLeftKeys, pressedRightKeys } = useCatStore();
  const { currentModel } = useModelStore();
  const [keyImageCache, setKeyImageCache] = useState<Record<string, string>>({});

  // 预加载并缓存按键图片路径
  useEffect(() => {
    if (!currentModel) return;
    
    const cacheKeyImages = async () => {
      const cache: Record<string, string> = {};
      const allKeys = [...new Set([...pressedLeftKeys, ...pressedRightKeys])];
      
      for (const key of allKeys) {
        // 检查是否有特定的左右变体
        const isModifier = ["Shift", "Control", "Alt", "Meta"].some(mod => key.includes(mod));
        
        if (isModifier) {
          // 对于修饰键，检查是否有特定的左右变体
          const leftPath = join(currentModel.path, "resources", "left-keys", `${key}.png`);
          const rightPath = join(currentModel.path, "resources", "right-keys", `${key}.png`);
          
          // 检查通用版本
          const genericKey = key.replace("Left", "").replace("Right", "");
          const genericLeftPath = join(currentModel.path, "resources", "left-keys", `${genericKey}.png`);
          const genericRightPath = join(currentModel.path, "resources", "right-keys", `${genericKey}.png`);
          
          // 优先使用特定的左右变体
          const leftExists = await exists(leftPath);
          const rightExists = await exists(rightPath);
          const genericLeftExists = await exists(genericLeftPath);
          const genericRightExists = await exists(genericRightPath);
          
          const leftCacheKey = `left-${key}`;
          const rightCacheKey = `right-${key}`;
          
          if (leftExists) {
            cache[leftCacheKey] = convertFileSrc(leftPath);
          } else if (genericLeftExists) {
            cache[leftCacheKey] = convertFileSrc(genericLeftPath);
          }
          
          if (rightExists) {
            cache[rightCacheKey] = convertFileSrc(rightPath);
          } else if (genericRightExists) {
            cache[rightCacheKey] = convertFileSrc(genericRightPath);
          }
        } else {
          // 对于普通按键，直接检查左右目录
          const leftPath = join(currentModel.path, "resources", "left-keys", `${key}.png`);
          const rightPath = join(currentModel.path, "resources", "right-keys", `${key}.png`);
          
          const leftExists = await exists(leftPath);
          const rightExists = await exists(rightPath);
          
          if (leftExists) {
            cache[`left-${key}`] = convertFileSrc(leftPath);
          }
          
          if (rightExists) {
            cache[`right-${key}`] = convertFileSrc(rightPath);
          }
        }
      }
      
      setKeyImageCache(cache);
    };
    
    void cacheKeyImages();
  }, [currentModel, pressedLeftKeys, pressedRightKeys]);

  // 根据按键获取缓存的图片路径
  const getKeyImagePath = (key: string, side: "left" | "right") => {
    const cacheKey = `${side}-${key}`;
    return keyImageCache[cacheKey] || "";
  };

  const leftKeyImages = useMemo(() => {
    if (!currentModel || !pressedLeftKeys.length) return [];

    return pressedLeftKeys.map((key) => {
      const imagePath = getKeyImagePath(key, "left");
      if (!imagePath) return null;
      
      return (
        <Image
          key={`left-${key}`}
          width={100}
          height={100}
          src={imagePath}
          alt={`${key} key`}
          className="absolute z-10 size-full"
        />
      );
    }).filter(Boolean);
  }, [pressedLeftKeys, currentModel, keyImageCache]);

  const rightKeyImages = useMemo(() => {
    if (!currentModel || !pressedRightKeys.length) return [];

    return pressedRightKeys.map((key) => {
      const imagePath = getKeyImagePath(key, "right");
      if (!imagePath) return null;
      
      return (
        <Image
          key={`right-${key}`}
          width={100}
          height={100}
          src={imagePath}
          alt={`${key} key`}
          className="absolute z-10 size-full"
        />
      );
    }).filter(Boolean);
  }, [pressedRightKeys, currentModel, keyImageCache]);

  return (
    <>
      {leftKeyImages}
      {rightKeyImages}
    </>
  );
}
