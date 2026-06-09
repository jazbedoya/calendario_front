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
import { signupApi } from "@/features/auth/api";
import { Mascot } from "@/features/mascot/Mascot";
import { useGoogleAuth } from "@/features/auth/useGoogleAuth";
import { Colors } from "@/lib/theme";

type FormData = { full_name: string; email: string; password: string };

export default function SignupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const schema = z.object({
    full_name: z.string().min(2, t("auth.validation.minChars_other", { count: 2 })),
    email: z.string().email(t("auth.validation.emailInvalid")),
    password: z.string().min(8, t("auth.validation.minChars_other", { count: 8 })),
  });

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { full_name: "", email: "", password: "" } });

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
    try {
      await signupApi({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      router.replace("/(auth)/login" as any);
    } catch (err: unknown) {
      const axiosErr = err as any;
      const msg = axiosErr?.response?.data?.detail ?? (err instanceof Error ? err.message : "Error desconocido");
      setError("root", { message: msg });
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
              <View style={styles.mascotWrap}>
                <Mascot name="" mood="excited" message="" />
              </View>
              <Text style={styles.title}>{t("auth.signup.title")}</Text>
              <Text style={styles.subtitle}>{t("auth.signup.subtitle")}</Text>
            </>
          )}

          {/* Botón Google */}
          <Pressable
            style={({ pressed }) => [styles.googleBtn, pressed && styles.googleBtnPressed]}
            onPress={() => promptAsync()}
            disabled={googleDisabled}
          >
            <AntDesign name="google" size={18} color="#4285F4" />
            <Text style={styles.googleBtnText}>{t("auth.signup.googleBtn")}</Text>
          </Pressable>

          {/* Separador */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t("auth.signup.divider")}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>{t("auth.signup.nameLabel")}</Text>
          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                style={[styles.input, errors.full_name && styles.inputError]}
                placeholder={t("auth.signup.namePlaceholder")}
                placeholderTextColor={Colors.placeholder}
                autoCapitalize="words"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />
          {errors.full_name && <Text style={styles.fieldError}>{errors.full_name.message}</Text>}

          <Text style={[styles.label, styles.labelSpaced]}>{t("auth.signup.emailLabel")}</Text>
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

          <Text style={[styles.label, styles.labelSpaced]}>{t("auth.signup.passwordLabel")}</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={[styles.passwordRow, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t("auth.signup.passwordPlaceholder")}
                  placeholderTextColor={Colors.placeholder}
                  secureTextEntry={!showPassword}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                </Pressable>
              </View>
            )}
          />
          {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}

          {errors.root && <Text style={styles.rootError}>{errors.root.message}</Text>}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>{t("auth.signup.submitBtn")}</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.signup.hasAccount")} </Text>
            <Link href={"/(auth)/login" as any} asChild>
              <Pressable>
                <Text style={styles.footerLink}>{t("auth.signup.loginLink")}</Text>
              </Pressable>
            </Link>
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

  // Tortuga
  mascotWrap: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    alignSelf: "center",
    width: 140,
    height: 140,
    borderRadius: 20,
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
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
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleBtnPressed: { backgroundColor: "#F5F3F0" },
  googleBtnText: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },

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

  fieldError: { fontSize: 12, color: Colors.error, marginTop: 4 },
  rootError: { fontSize: 13, color: Colors.error, marginTop: 12, textAlign: "center" },

  // Botón principal
  primaryBtn: {
    height: 54,
    borderRadius: 18,
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
});
