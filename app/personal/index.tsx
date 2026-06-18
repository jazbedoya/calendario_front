import { useTranslation } from "react-i18next";
import { AreaCalendarScreen } from "@/features/overview/components/AreaCalendarScreen";

export default function PersonalScreen() {
  const { t } = useTranslation();
  return <AreaCalendarScreen layer="personal" accent="#8B86C9" accentLight="#D5D3F0" title={t("layers.personal")} />;
}
