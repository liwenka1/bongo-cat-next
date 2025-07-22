"use client";

import { useCatStore } from "@/stores/cat-store";
import { Select } from "antd";
import { useI18n } from "@/hooks/use-i18n";
import { useModelStore } from "@/stores/model-store";
import { useEffect } from "react";
import type React from "react";

interface ExpressionSelectorProps {
  availableExpressions: { name: string; originalName: string }[];
}

export function ExpressionSelector({ availableExpressions }: ExpressionSelectorProps) {
  const { selectedExpression, setSelectedExpression } = useCatStore();
  const { currentModel } = useModelStore();
  const { t } = useI18n(["ui", "expressions"]);

  useEffect(() => {
    if (availableExpressions.length > 0) {
      // 模型切换时，总是设置第一个表情为默认值
      setSelectedExpression({ name: availableExpressions[0].name });
    } else {
      // 没有可用表情时，清空选择
      setSelectedExpression(null);
    }
  }, [availableExpressions, setSelectedExpression]);

  if (availableExpressions.length === 0) {
    return null;
  }

  const handleChange = (value: string | null) => {
    if (value) {
      setSelectedExpression({ name: value });
    } else {
      setSelectedExpression(null);
    }
  };

  // 动态翻译表情名称
  const translateExpressionName = (originalName: string): string => {
    if (!currentModel) return originalName;
    return t(`${currentModel.id}.${originalName}`, {
      ns: "expressions",
      defaultValue: originalName
    });
  };

  const options = availableExpressions.map((expression) => ({
    value: expression.name,
    label: translateExpressionName(expression.originalName) // 使用动态翻译
  }));

  return (
    <Select
      placeholder={t("selectExpression", { ns: "ui" })}
      value={selectedExpression?.name ?? null}
      onChange={handleChange}
      options={options}
      style={{ width: "100%" }}
    />
  );
}
