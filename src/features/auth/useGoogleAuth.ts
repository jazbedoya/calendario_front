import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { googleAuthApi, getMeApi } from "@/features/auth/api";
import { useAuthStore } from "@/stores/authStore";
import { useMascotStore } from "@/features/mascot/mascotStore";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";

// En web usamos redirect completo para evitar el bloqueo COOP de Google
const WEB_REDIRECT_URI = "http://localhost:8085/google-callback";

function buildGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_WEB_CLIENT_ID,
    redirect_uri: WEB_REDIRECT_URI,
    response_type: "token",
    scope: "openid profile email",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function useGoogleAuth(onError?: (msg: string) => void) {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const syncMascotName = useMascotStore((s) => s.syncMascotName);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    ...(GOOGLE_ANDROID_CLIENT_ID && { androidClientId: GOOGLE_ANDROID_CLIENT_ID }),
    ...(GOOGLE_IOS_CLIENT_ID && { iosClientId: GOOGLE_IOS_CLIENT_ID }),
    scopes: ["openid", "profile", "email"],
  });

  useEffect(() => {
    if (Platform.OS === "web") return; // native sólo; web lo maneja google-callback.tsx
    if (response?.type !== "success") return;
    const accessToken = response.authentication?.accessToken;
    if (!accessToken) {
      onError?.("No se pudo obtener el token de Google");
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
      .catch(() => onError?.("Error al iniciar sesión con Google"));
  }, [response]);

  const handlePrompt = () => {
    if (Platform.OS === "web") {
      window.location.href = buildGoogleAuthUrl();
    } else {
      console.log("[GoogleAuth] redirect_uri:", request?.url);
      promptAsync();
    }
  };

  return { promptAsync: handlePrompt, disabled: Platform.OS === "web" ? false : !request };
}
