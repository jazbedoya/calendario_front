import { zodResolver } from "@hookform/resolvers/zod";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
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
import { TugaAnimation } from "@/features/mascot/TugaAnimation";
import { useGoogleAuth } from "@/features/auth/useGoogleAuth";
import { colors, spacing, radius, fontSize, fontWeight, shadows } from "@/theme";

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

  const onSubmit = async (data: FormData) => {
    const attempt = async () => {
      const result = await signupApi({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        redirect_to: Linking.createURL("email-verified"),
      });
      router.replace({ pathname: "/(auth)/pending-verification", params: { email: result.email } } as any);
    };

    try {
      await attempt();
    } catch (err: unknown) {
      const axiosErr = err as any;
      if (!axiosErr?.response) {
        try { await attempt(); return; } catch (retryErr: unknown) {
          const retryAxios = retryErr as any;
          const msg = retryAxios?.response?.data?.detail ?? (retryErr instanceof Error ? retryErr.message : "Error desconocido");
          setError("root", { message: msg });
          return;
        }
      }
      const msg = axiosErr?.response?.data?.detail ?? (err instanceof Error ? err.message : "Error desconocido");
      setError("root", { message: msg });
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <Text style={s.brand}>A V A N T E</Text>

          {/* Tuga + Títulos */}
          {!(Platform.OS === "android" && keyboardVisible) && (
            <View style={s.heroSection}>
              <View style={s.tugaCircle}>
                <TugaAnimation state="idle" size={90} />
              </View>
              <Text style={s.title}>{t("auth.signup.title")}</Text>
              <Text style={s.subtitle}>{t("auth.signup.subtitle")}</Text>
            </View>
          )}

          {/* Google */}
          <TouchableOpacity
            style={[s.googleBtn, shadows.soft]}
            onPress={() => promptAsync()}
            disabled={googleDisabled}
            activeOpacity={0.8}
          >
            <AntDesign name="google" size={18} color="#4285F4" />
            <Text style={s.googleBtnText}>{t("auth.signup.googleBtn")}</Text>
          </TouchableOpacity>

          {/* Separador */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>{t("auth.signup.divider")}</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Nombre */}
          <Text style={s.label}>{t("auth.signup.nameLabel")}</Text>
          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={[s.inputRow, errors.full_name && s.inputError]}>
                <Ionicons name="person-outline" size={18} color={colors.fieldIcon} style={s.inputIcon} />
                <TextInput
                  style={s.inputField}
                  placeholder={t("auth.signup.namePlaceholder")}
                  placeholderTextColor={colors.fieldPlaceholder}
                  autoCapitalize="words"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              </View>
            )}
          />
          {errors.full_name && <Text style={s.fieldError}>{errors.full_name.message}</Text>}

          {/* Email */}
          <Text style={[s.label, s.labelSpaced]}>{t("auth.signup.emailLabel")}</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={[s.inputRow, errors.email && s.inputError]}>
                <Ionicons name="mail-outline" size={18} color={colors.fieldIcon} style={s.inputIcon} />
                <TextInput
                  style={s.inputField}
                  placeholder="tu@email.com"
                  placeholderTextColor={colors.fieldPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              </View>
            )}
          />
          {errors.email && <Text style={s.fieldError}>{errors.email.message}</Text>}

          {/* Contraseña */}
          <Text style={[s.label, s.labelSpaced]}>{t("auth.signup.passwordLabel")}</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={[s.inputRow, errors.password && s.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.fieldIcon} style={s.inputIcon} />
                <TextInput
                  style={s.inputField}
                  placeholder={t("auth.signup.passwordPlaceholder")}
                  placeholderTextColor={colors.fieldPlaceholder}
                  secureTextEntry={!showPassword}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.fieldIcon} />
                </Pressable>
              </View>
            )}
          />
          {errors.password && <Text style={s.fieldError}>{errors.password.message}</Text>}

          {errors.root && <Text style={s.rootError}>{errors.root.message}</Text>}

          {/* Botón Crear cuenta */}
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={s.primaryBtnInner}>
                  <Text style={s.primaryBtnText}>{t("auth.signup.submitBtn")}</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.white} />
                </View>
              )}
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>{t("auth.signup.hasAccount")} </Text>
            <Link href={"/(auth)/login" as any} asChild>
              <Pressable>
                <Text style={s.footerLink}>{t("auth.signup.loginLink")}</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: spacing.screenX, paddingBottom: 40 },

  brand: {
    textAlign: "center", fontSize: fontSize.label, fontWeight: fontWeight.semibold,
    color: colors.ink, letterSpacing: 6, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },

  heroSection: { alignItems: "center", marginBottom: spacing["2xl"] },
  tugaCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.border, ...shadows.card,
    overflow: "hidden",
  },
  title: {
    textAlign: "center", fontSize: fontSize.title, fontWeight: fontWeight.bold,
    color: colors.ink, marginTop: spacing.xl,
  },
  subtitle: {
    textAlign: "center", fontSize: fontSize.bodySm, fontStyle: "italic",
    color: colors.textMuted, marginTop: 6,
  },

  googleBtn: {
    width: "100%", height: 54, borderRadius: radius.field,
    borderWidth: 1, borderColor: colors.fieldBorder, backgroundColor: colors.surface,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
  },
  googleBtnText: { fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: colors.ink },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: spacing.xl },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline },
  dividerText: {
    marginHorizontal: 12, fontSize: fontSize.caption, fontWeight: fontWeight.medium,
    color: colors.textFaint,
  },

  label: { fontSize: fontSize.label, fontWeight: fontWeight.semibold, color: colors.fieldLabel, marginBottom: 6 },
  labelSpaced: { marginTop: spacing.lg },

  inputRow: {
    flexDirection: "row", alignItems: "center", height: 54, borderRadius: radius.field,
    borderWidth: 1.5, borderColor: colors.fieldBorder, paddingHorizontal: spacing.lg,
    backgroundColor: colors.fieldBg, gap: spacing.sm,
  },
  inputIcon: { opacity: 0.7 },
  inputField: { flex: 1, fontSize: fontSize.body, color: colors.ink },
  inputError: { borderColor: colors.invalid },

  fieldError: { fontSize: fontSize.caption, color: colors.invalid, marginTop: spacing.xs },
  rootError: { fontSize: fontSize.label, color: colors.invalid, marginTop: spacing.md, textAlign: "center" },

  primaryBtn: {
    height: 56, borderRadius: radius.hero, backgroundColor: colors.terracotta,
    alignItems: "center", justifyContent: "center", marginTop: spacing["2xl"],
    ...shadows.fab,
  },
  primaryBtnInner: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  primaryBtnText: { fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold, color: colors.white },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing["2xl"] },
  footerText: { fontSize: fontSize.bodySm, color: colors.textSecondary },
  footerLink: { fontSize: fontSize.bodySm, fontWeight: fontWeight.bold, color: colors.ink, textDecorationLine: "underline" },
});
