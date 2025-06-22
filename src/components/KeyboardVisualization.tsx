import { useMemo } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useCatStore } from "@/stores/catStore";
import { useModelStore } from "@/stores/modelStore";
import { join } from "@/utils/path";
import Image from "next/image";

export function KeyboardVisualization() {
  const { pressedLeftKeys, pressedRightKeys } = useCatStore();
  const { currentModel } = useModelStore();

  // 根据按键生成图片路径
  const resolveImagePath = (key: string, side: "left" | "right" = "left") => {
    if (!currentModel) return "";
    return convertFileSrc(
      join(currentModel.path, "resources", `${side}-keys`, `${key}.png`)
    );
  };

  const leftKeyImages = useMemo(() => {
    if (!currentModel || !pressedLeftKeys.length) return [];

    return pressedLeftKeys.map((key) => (
      <Image
        key={`left-${key}`}
        width={100}
        height={100}
        src={resolveImagePath(key, "left")}
        alt={`${key} key`}
        className="absolute size-full z-10"
      />
    ));
  }, [pressedLeftKeys, currentModel]);

  const rightKeyImages = useMemo(() => {
    if (!currentModel || !pressedRightKeys.length) return [];

    return pressedRightKeys.map((key) => (
      <Image
        key={`right-${key}`}
        width={100}
        height={100}
        src={resolveImagePath(key, "right")}
        alt={`${key} key`}
        className="absolute size-full z-10"
      />
    ));
  }, [pressedRightKeys, currentModel]);

  return (
    <>
      {leftKeyImages}
      {rightKeyImages}
    </>
  );
}