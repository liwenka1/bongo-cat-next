"use client";

import { useCatStore } from "@/stores/cat-store";
import { Select } from "antd";
import type React from "react";

interface ExpressionSelectorProps {
  availableExpressions: { name: string; displayName: string }[];
}

export function ExpressionSelector({ availableExpressions }: ExpressionSelectorProps) {
  const { selectedExpression, setSelectedExpression } = useCatStore();

  const handleChange = (value: string | null) => {
    if (value) {
      setSelectedExpression({ name: value });
    } else {
      setSelectedExpression(null);
    }
  };

  // 如果没有可用的表情，不渲染任何东西
  if (availableExpressions.length === 0) {
    return null;
  }

  // 将表情列表转换为 Select 组件需要的格式
  const options = availableExpressions.map(({ name, displayName }) => ({
    value: name, // 值使用内部name
    label: displayName // 显示使用displayName
  }));

  // 方便地将 selectedExpression 转换为字符串以便与 Select 的 value 属性匹配
  const selectedValue = selectedExpression ? selectedExpression.name : null;

  return (
    <div
      className="expression-selector"
      style={{ width: 200 }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <Select
        placeholder="Select an expression"
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
