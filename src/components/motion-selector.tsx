import { useCatStore } from "@/stores/cat-store";
import { Select } from "antd";
import { useI18n } from "@/hooks/use-i18n";
import { useModelStore } from "@/stores/model-store";
import type React from "react";

interface MotionSelectorProps {
  availableMotions: { group: string; name: string; originalName: string }[];
}

export function MotionSelector({ availableMotions }: MotionSelectorProps) {
  const { selectedMotion, setSelectedMotion } = useCatStore();
  const { currentModel } = useModelStore();
  const { t } = useI18n(["ui", "motions"]);

  if (availableMotions.length === 0) {
    return null;
  }

  const handleChange = (value: string | null) => {
    if (value) {
      const [group, name] = value.split("|");
      setSelectedMotion({ group, name });
    } else {
      setSelectedMotion(null);
    }
  };

  // 动态翻译动作名称
  const translateMotionName = (originalName: string): string => {
    if (!currentModel) return originalName;
    return t(`${currentModel.id}.${originalName}`, {
      ns: "motions",
      defaultValue: originalName
    });
  };

  const options = availableMotions.map((motion) => ({
    value: `${motion.group}|${motion.name}`,
    label: translateMotionName(motion.originalName) // 使用动态翻译
  }));

  return (
    <Select
      placeholder={t("selectMotion", { ns: "ui" })}
      value={selectedMotion ? `${selectedMotion.group}|${selectedMotion.name}` : null}
      onChange={handleChange}
      options={options}
      allowClear
      style={{ width: "100%" }}
    />
  );
}
