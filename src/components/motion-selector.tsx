"use client";

import { useCatStore } from "@/stores/cat-store";
import { Select } from "antd";
import type React from "react";

interface MotionSelectorProps {
  availableMotions: { group: string; name: string; displayName: string }[];
}

export function MotionSelector({ availableMotions }: MotionSelectorProps) {
  const selectedMotion = useCatStore((state) => state.selectedMotion);
  const setSelectedMotion = useCatStore((state) => state.setSelectedMotion);

  const handleChange = (value: string | null) => {
    if (value) {
      const [group, name] = value.split(":");
      setSelectedMotion({ group, name });
    } else {
      setSelectedMotion(null);
    }
  };

  // 如果没有可用的动作，不渲染任何东西
  if (availableMotions.length === 0) {
    return null;
  }

  // 将动作列表转换为 Select 组件需要的格式
  const options = availableMotions.map(({ group, name, displayName }) => ({
    value: `${group}:${name}`, // 值使用内部name
    label: displayName // 显示使用displayName
  }));

  // 方便地将 selectedMotion 转换为字符串以便与 Select 的 value 属性匹配
  const selectedValue = selectedMotion ? `${selectedMotion.group}:${selectedMotion.name}` : null;

  return (
    <div
      className="motion-selector"
      style={{ width: 200 }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <Select
        placeholder="Select a motion"
        value={selectedValue}
        onChange={handleChange}
        style={{ width: "100%" }}
        allowClear
        options={options}
        getPopupContainer={(triggerNode: HTMLElement) => triggerNode.parentElement!}
      />
    </div>
  );
}
