// Mock data estructurado como si viniera del backend.
// TODO Sprint 3: reemplazar con TanStack Query → GET /home/summary
import { HomeData } from "./types";

export const mockHomeData: HomeData = {
  areas: [
    {
      layer: "family",
      title: "FAMILIA",
      subtitle: "3 eventos hoy · 1 aviso",
      color: "#E89B53",
      iconName: "people",
      route: "/family",
    },
    {
      layer: "work",
      title: "TRABAJO",
      subtitle: "5 reuniones · día intenso",
      color: "#3D6B5F",
      iconName: "briefcase",
      route: "/work",
    },
    {
      layer: "personal",
      title: "PERSONAL",
      subtitle: "tiempo para ti · 2 relaciones",
      color: "#5B5193",
      iconName: "moon",
      route: "/personal",
    },
  ],
  insights: [
    {
      id: "focus",
      iconName: "bar-chart",
      text: "Tu enfoque ha subido un 12% esta semana.",
      backgroundColor: "#FBF0EB",
      textColor: "#C8553D",
    },
    {
      id: "next-slot",
      iconName: "calendar",
      text: "Próximo hueco libre: 16:30",
      backgroundColor: "#EFEFED",
      textColor: "#1A1A1A",
    },
  ],
};
