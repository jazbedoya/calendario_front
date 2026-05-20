export type Layer = "family" | "work" | "personal";

export const LAYER_COLORS: Record<Layer, string> = {
  family: "#E8826B",
  work: "#7A9B7A",
  personal: "#8B86C9",
};

export const LAYER_LABELS: Record<Layer, string> = {
  family: "FAMILIA",
  work: "TRABAJO",
  personal: "PERSONAL",
};

export interface User {
  id: string;
  email: string;
  fullName: string;
  timezone: string;
}

export interface Event {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  layer: Layer;
  location?: string;
}

// TODO: expandir con EventContext, Relationship, etc. en Sprints siguientes
