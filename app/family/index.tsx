import { useTranslation } from "react-i18next";
import { AreaCalendarScreen } from "@/features/overview/components/AreaCalendarScreen";

export default function FamilyScreen() {
  const { t } = useTranslation();
  return <AreaCalendarScreen layer="family" accent="#E8826B" accentLight="#F5D0C5" title={t("layers.family")} />;
}
