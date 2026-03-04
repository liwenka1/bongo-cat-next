"use client";

import { useCatStore } from "@/stores/cat-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";
import { useModelStore } from "@/stores/model-store";
import { useEffect } from "react";

interface ExpressionSelectorProps {
  availableExpressions: { name: string; originalName: string }[];
}

export function ExpressionSelector({ availableExpressions }: ExpressionSelectorProps) {
  const { selectedExpression, setSelectedExpression } = useCatStore();
  const { currentModel } = useModelStore();
  const { t } = useI18n(["ui", "expressions"]);

  useEffect(() => {
    if (availableExpressions.length === 0) {
      setSelectedExpression(null);
      return;
    }

    const hasSelectedExpression =
      selectedExpression !== null &&
      availableExpressions.some((expression) => expression.name === selectedExpression.name);

    if (!hasSelectedExpression) {
      setSelectedExpression({ name: availableExpressions[0].name });
    }
  }, [availableExpressions, selectedExpression, setSelectedExpression]);

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
  const expressionLabelMap = new Map(options.map((option) => [option.value, option.label]));
  const expressionPlaceholder = t("selectExpression", { ns: "ui" });

  return (
    <Select
      value={selectedExpression?.name ?? null}
      onValueChange={(value) => {
        handleChange(value);
      }}
    >
      <SelectTrigger className="bg-background w-full">
        <SelectValue placeholder={expressionPlaceholder}>
          {(value) => (typeof value === "string" ? (expressionLabelMap.get(value) ?? value) : expressionPlaceholder)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
