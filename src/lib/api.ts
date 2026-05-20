import axios from "axios";
import Constants from "expo-constants";

const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://10.0.2.2:8000";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// TODO Sprint 1: interceptor de auth con refresh automático de tokens
