import { useState, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { readDir } from "@tauri-apps/plugin-fs";
import { useModelStore } from "@/stores/modelStore";
import { useCatStore } from "@/stores/catStore";
import { join } from "@/utils/path";
import { isImage } from "@/utils/is";
import type { MouseMoveValue } from "@/types";

export function useDevice() {
  const [supportLeftKeys, setSupportLeftKeys] = useState<string[]>([]);
  const [supportRightKeys, setSupportRightKeys] = useState<string[]>([]);
  const [pressedLeftKeys, setPressedLeftKeys] = useState<string[]>([]);
  const [pressedRightKeys, setPressedRightKeys] = useState<string[]>([]);
  const [mousePosition, setMousePosition] = useState<MouseMoveValue>({ x: 0, y: 0 });

  const { currentModel } = useModelStore();
  const { pressedKeys, mousePressed } = useCatStore();

  // 加载支持的按键列表
  useEffect(() => {
    if (!currentModel) return;

    const loadSupportedKeys = async () => {
      try {
        // 加载左手按键
        try {
          const leftKeysPath = join(currentModel.path, "resources", "left-keys");
          const leftFiles = await readDir(leftKeysPath);
          const leftImageFiles = leftFiles.filter((file) => {
            const name = file.name || "";
            return isImage(name);
          });
          setSupportLeftKeys(
            leftImageFiles.map((file) => {
              const name = file.name || "";
              return name.split(".")[0];
            })
          );
        } catch {
          setSupportLeftKeys([]);
        }

        // 加载右手按键
        try {
          const rightKeysPath = join(currentModel.path, "resources", "right-keys");
          const rightFiles = await readDir(rightKeysPath);
          const rightImageFiles = rightFiles.filter((file) => {
            const name = file.name || "";
            return isImage(name);
          });
          setSupportRightKeys(
            rightImageFiles.map((file) => {
              const name = file.name || "";
              return name.split(".")[0];
            })
          );
        } catch {
          setSupportRightKeys([]);
        }
      } catch (error) {
        console.error("Failed to load supported keys:", error);
      }
    };

    void loadSupportedKeys();
  }, [currentModel]);

  // 根据 catStore 中的按键状态更新左右手按键
  useEffect(() => {
    const leftKeys = pressedKeys.filter((key) => supportLeftKeys.includes(key));
    const rightKeys = pressedKeys.filter((key) => supportRightKeys.includes(key));

    setPressedLeftKeys(leftKeys);
    setPressedRightKeys(rightKeys);
  }, [pressedKeys, supportLeftKeys, supportRightKeys]);

  // 获取按键图片路径
  const getKeyImagePath = (key: string, side: "left" | "right") => {
    if (!currentModel) return null;
    const keyPath = join(currentModel.path, "resources", `${side}-keys`, `${key}.png`);
    return convertFileSrc(keyPath);
  };

  return {
    supportLeftKeys,
    supportRightKeys,
    pressedLeftKeys,
    pressedRightKeys,
    mousePosition,
    getKeyImagePath
  };
}
