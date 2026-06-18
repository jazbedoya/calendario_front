import { zodResolver } from "@hookform/resolvers/zod";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { loginApi, getMeApi } from "@/features/auth/api";
import { useAuthStore } from "@/stores/authStore";
import { useMascotStore } from "@/features/mascot/mascotStore";
import { Mascot } from "@/features/mascot/Mascot";
import { useGoogleAuth } from "@/features/auth/useGoogleAuth";
import { Colors } from "@/lib/theme";

type FormData = { email: string; password: string };

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const syncMascotName     = useMascotStore((s) => s.syncMascotName);
  const completeOnboarding = useMascotStore((s) => s.completeOnboarding);
  const [showPassword, setShowPassword] = useState(false);

  const schema = z.object({
    email: z.string().email(t("auth.validation.emailInvalid")),
    password: z.string().min(1, t("auth.validation.required")),
  });

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const { promptAsync, disabled: googleDisabled } = useGoogleAuth(
    (msg) => setError("root", { message: msg })
  );

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // ── lógica original intacta ───────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    const attempt = async () => {
      const tokens = await loginApi(data);
      await setTokens(tokens.access_token, tokens.refresh_token);
      const me = await getMeApi();
      setUser(me);
      await syncMascotName(me.mascot_name);
      const isNewAccount = Date.now() - new Date(me.created_at).getTime() < 120_000;
      if (isNewAccount) {
        router.replace("/onboarding");
      } else {
        await completeOnboarding();
        router.replace("/");
      }
    };

    try {
      await attempt();
    } catch (e: any) {
      const status = e?.response?.status;
      if (!status) {
        // Primer intento sin respuesta (tunnel handshake) → reintentar una vez
        try {
          await attempt();
          return;
        } catch {}
      }
      let message: string;
      if (status === 401) {
        message = t("auth.errors.wrongCredentials");
      } else if (status === 403 && e?.response?.data?.detail === "email_not_verified") {
        message = t("auth.errors.emailNotVerified");
      } else if (status >= 500) {
        message = t("auth.errors.serverError");
      } else if (!e?.response) {
        message = t("auth.errors.connectionError");
      } else {
        message = t("auth.errors.unexpected");
      }
      setError("root", { message });
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header pequeño — siempre visible */}
          <View style={styles.topHeader}>
            <Text style={styles.topBrand}>Avante</Text>
          </View>

          {/* Tortuga + Títulos — ocultos en Android cuando el teclado está abierto */}
          {!(Platform.OS === "android" && keyboardVisible) && (
            <>
              <Mascot name="" mood="happy" message="" size="large" showName={false} />
              <Text style={styles.title}>{t("auth.login.title")}</Text>
              <Text style={styles.subtitle}>{t("auth.login.subtitle")}</Text>
            </>
          )}

          {/* Botón Google */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => promptAsync()}
            disabled={googleDisabled}
            activeOpacity={0.8}
          >
            <AntDesign name="google" size={20} color="#4285F4" />
            <Text style={styles.googleBtnText}>{t("auth.login.googleBtn")}</Text>
          </TouchableOpacity>

          {/* Separador */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t("auth.login.divider")}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email */}
          <Text style={styles.label}>{t("auth.login.emailLabel")}</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="tu@email.com"
                placeholderTextColor={Colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />
          {errors.email && <Text style={styles.fieldError}>{errors.email.message}</Text>}

          {/* Contraseña */}
          <Text style={[styles.label, styles.labelSpaced]}>{t("auth.login.passwordLabel")}</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={[styles.passwordRow, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.placeholder}
                  secureTextEntry={!showPassword}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </Pressable>
              </View>
            )}
          />
          {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}

          <Pressable onPress={() => router.push("/(auth)/forgot-password" as any)}>
            <Text style={styles.forgotPassword}>{t("auth.login.forgotPassword")}</Text>
          </Pressable>

          {errors.root && <Text style={styles.rootError}>{errors.root.message}</Text>}

          {/* Botón Entrar */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>{t("auth.login.submitBtn")}</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.login.noAccount")} </Text>
            <Link href={"/(auth)/signup" as any} asChild>
              <Pressable>
                <Text style={styles.footerLink}>{t("auth.login.createAccount")}</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.legalBlock}>
            <Text style={styles.legalLinks}>{t("auth.login.privacy")}</Text>
            <Text style={styles.legalCopy}>{t("auth.login.copyright")}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },

  // Header pequeño — siempre visible
  topHeader: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  topBrand: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  // Títulos
  title: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "700",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
    color: Colors.midnight,
    marginTop: 20,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 28,
  },

  // Google
  googleBtn: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  googleBtnText: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },

  // Separador
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },

  // Campos
  label: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary, marginBottom: 6 },
  labelSpaced: { marginTop: 16 },

  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.inputBg,
  },
  inputError: { borderColor: Colors.error },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    backgroundColor: Colors.inputBg,
  },
  passwordInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },

  forgotPassword: {
    textAlign: "right",
    color: Colors.midnight,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 8,
  },

  fieldError: { fontSize: 12, color: Colors.error, marginTop: 4 },
  rootError: { fontSize: 13, color: Colors.error, marginTop: 12, textAlign: "center" },

  // Botón principal
  primaryBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },

  // Footer
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  footerLink: { fontSize: 14, fontWeight: "700", color: Colors.midnight },

  // Pie legal
  legalBlock: { alignItems: "center", marginTop: 24, gap: 4 },
  legalLinks: { fontSize: 11, color: Colors.textMuted },
  legalCopy:  { fontSize: 11, color: "#CCCCCC" },
});
