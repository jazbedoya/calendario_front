import { useTranslation } from "react-i18next";
import { AreaCalendarScreen } from "@/features/overview/components/AreaCalendarScreen";

export default function WorkScreen() {
  const { t } = useTranslation();
  return <AreaCalendarScreen layer="work" accent="#7A9B7A" accentLight="#D9E3D9" title={t("layers.work")} />;
}
