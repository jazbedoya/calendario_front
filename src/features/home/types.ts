export type Layer = "family" | "work" | "personal";

export interface LifeAreaSummary {
  layer: Layer;
  title: string;
  subtitle: string;
  color: string;
  iconName: string;
  route: "/family" | "/work" | "/personal";
}

export interface InsightData {
  id: string;
  iconName: string;
  text: string;
  backgroundColor: string;
  textColor: string;
}

export interface HomeData {
  areas: LifeAreaSummary[];
  insights: InsightData[];
}
