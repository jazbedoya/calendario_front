import { useTranslation } from "react-i18next";
import { AreaCalendarScreen } from "@/features/overview/components/AreaCalendarScreen";

export default function FamilyScreen() {
  const { t } = useTranslation();
  return <AreaCalendarScreen layer="family" accent="#E89B53" accentLight="rgba(232, 155, 83, 0.14)" title={t("layers.family")} />;
}
