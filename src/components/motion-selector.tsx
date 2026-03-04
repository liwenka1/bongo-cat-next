import { useCatStore } from "@/stores/cat-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";
import { useModelStore } from "@/stores/model-store";
import { useEffect } from "react";

interface MotionSelectorProps {
  availableMotions: { group: string; name: string; originalName: string }[];
}

export function MotionSelector({ availableMotions }: MotionSelectorProps) {
  const { selectedMotion, setSelectedMotion } = useCatStore();
  const { currentModel } = useModelStore();
  const { t } = useI18n(["ui", "motions"]);

  useEffect(() => {
    if (availableMotions.length === 0) {
      setSelectedMotion(null);
      return;
    }

    const hasSelectedMotion =
      selectedMotion !== null &&
      availableMotions.some((motion) => motion.group === selectedMotion.group && motion.name === selectedMotion.name);

    if (!hasSelectedMotion) {
      setSelectedMotion({
        group: availableMotions[0].group,
        name: availableMotions[0].name
      });
    }
  }, [availableMotions, selectedMotion, setSelectedMotion]);

  if (availableMotions.length === 0) {
    return null;
  }

  const handleChange = (value: string | null) => {
    if (value) {
      const separatorIndex = value.indexOf("|");
      if (separatorIndex === -1) return;
      const group = value.slice(0, separatorIndex);
      const name = value.slice(separatorIndex + 1);
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
  const motionLabelMap = new Map(options.map((option) => [option.value, option.label]));
  const motionPlaceholder = t("selectMotion", { ns: "ui" });

  return (
    <Select
      value={selectedMotion ? `${selectedMotion.group}|${selectedMotion.name}` : null}
      onValueChange={(value) => {
        handleChange(value);
      }}
    >
      <SelectTrigger className="bg-background w-full">
        <SelectValue placeholder={motionPlaceholder}>
          {(value) => (typeof value === "string" ? (motionLabelMap.get(value) ?? value) : motionPlaceholder)}
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
