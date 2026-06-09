import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { googleAuthApi, getMeApi } from "@/features/auth/api";
import { useAuthStore } from "@/stores/authStore";
import { useMascotStore } from "@/features/mascot/mascotStore";

// Captura el hash inmediatamente cuando carga el módulo,
// antes de que expo-router pueda reescribir la URL
const INITIAL_HASH = typeof window !== "undefined" ? window.location.hash : "";
const INITIAL_SEARCH = typeof window !== "undefined" ? window.location.search : "";

function extractToken(): string | null {
  // Google implicit flow: token en el hash (#access_token=...)
  if (INITIAL_HASH) {
    const params = new URLSearchParams(INITIAL_HASH.substring(1));
    const token = params.get("access_token");
    if (token) return token;
    // Si hay error de Google, lo capturamos
    const error = params.get("error");
    if (error) return null;
  }
  // Por si Google lo manda como query param
  if (INITIAL_SEARCH) {
    const params = new URLSearchParams(INITIAL_SEARCH.substring(1));
    return params.get("access_token");
  }
  return null;
}

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const syncMascotName = useMascotStore((s) => s.syncMascotName);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = extractToken();

    if (!accessToken) {
      // Mostrar qué había en la URL para diagnosticar
      const hash = INITIAL_HASH || "(vacío)";
      const search = INITIAL_SEARCH || "(vacío)";
      setErrorMsg(`No se encontró el token.\nhash: ${hash}\nquery: ${search}`);
      setTimeout(() => router.replace("/(auth)/login"), 4000);
      return;
    }

    googleAuthApi(accessToken)
      .then(async (tokens) => {
        await setTokens(tokens.access_token, tokens.refresh_token);
        const me = await getMeApi();
        setUser(me);
        await syncMascotName(me.mascot_name);
        router.replace("/");
      })
      .catch((e) => {
        setErrorMsg(`Error al verificar con el servidor: ${e?.message ?? "desconocido"}`);
        setTimeout(() => router.replace("/(auth)/login"), 4000);
      });
  }, []);

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#A0432B" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAF7",
    padding: 24,
  },
  errorText: {
    color: "#C0392B",
    fontSize: 13,
    textAlign: "center",
    fontFamily: "monospace",
  },
});
