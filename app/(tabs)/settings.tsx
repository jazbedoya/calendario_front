import { useState } from "react";
import { StreakPill } from "@/features/tasks/StreakPill";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "react-native";
import { useTranslation } from "react-i18next";

import { useAuthStore }              from "@/stores/authStore";
import { useMascotStore }            from "@/features/mascot/mascotStore";
import { useCelebrationSettings }    from "@/stores/celebrationSettingsStore";
import { getHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { getMascotState }            from "@/features/mascot/getMascotState";
import { TugaAnimation, MOOD_TO_STATE } from "@/features/mascot/TugaAnimation";
import {
  useCalendarStatus,
  useSyncCalendar,
  useDisconnectCalendar,
} from "@/features/calendar/useCalendarSync";
import { getCalendarConnectUrlApi } from "@/features/calendar/api";
import { getGoogleRedirectUri } from "@/lib/getGoogleRedirectUri";
import { useCalendarStore }          from "@/features/calendar/calendarStore";
import { useLanguageStore }          from "@/features/settings/languageStore";
import { useHolidayStore }           from "@/features/settings/holidayStore";
import type { HolidayCountry }       from "@/features/overview/getHolidays";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT = "#C8553D";
const BG = "#F8F6F2";

const LANG_ICONS: Record<SupportedLanguage, string> = {
  es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", de: "🇩🇪",
};

const COUNTRY_FLAGS: Record<HolidayCountry, string> = {
  ES: "🇪🇸", PY: "🇵🇾",
};

const HOLIDAY_COUNTRIES: HolidayCountry[] = ["ES", "PY"];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { mascotName, setMascotName } = useMascotStore();
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(mascotName);
  const deviceTz    = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour   = getHours(toZonedTime(new Date(), deviceTz));
  const mascotState = getMascotState({ hourOfDay: localHour });

  const { language, setLanguage } = useLanguageStore();
  const { country, setCountry }   = useHolidayStore();
  const { hapticsEnabled, setHapticsEnabled } = useCelebrationSettings();

  const qc = useQueryClient();
  const { isConnecting, setConnecting } = useCalendarStore();
  const { data: calStatus } = useCalendarStatus();
  const syncMutation       = useSyncCalendar();
  const disconnectMutation = useDisconnectCalendar();

  function startEdit() { setDraft(mascotName); setEditing(true); }
  async function saveEdit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      Alert.alert(t("settings.mascot.invalidName"), t("settings.mascot.invalidNameMsg"));
      return;
    }
    await setMascotName(trimmed);
    setEditing(false);
  }
  function cancelEdit() { setDraft(mascotName); setEditing(false); }

  async function handleConnectCalendar() {
    try {
      setConnecting(true);
      const redirectTo = Linking.createURL("calendar/connected");
      const url = await getCalendarConnectUrlApi(redirectTo, getGoogleRedirectUri());
      if (Platform.OS === "web") {
        window.location.href = url;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
        if (result.type === "success") qc.invalidateQueries({ queryKey: ["calendar-status"] });
        setConnecting(false);
      }
    } catch {
      Alert.alert(t("settings.calendar.errorTitle"), t("settings.calendar.connectError"));
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    if (Platform.OS === "web") {
      if (window.confirm(t("settings.calendar.disconnectMsg"))) disconnectMutation.mutate();
    } else {
      Alert.alert(t("settings.calendar.disconnectTitle"), t("settings.calendar.disconnectMsg"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("settings.calendar.disconnectConfirm"), style: "destructive", onPress: () => disconnectMutation.mutate() },
      ]);
    }
  }

  function formatLastSync(iso: string | null | undefined): string {
    if (!iso) return "–";
    return new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  const isConnected = calStatus?.connected ?? false;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.titleRow}>
          <Text style={s.screenTitle}>{t("settings.title")}</Text>
          <StreakPill />
        </View>

        {/* ══════════════════════════════════════════════════════
            MASCOTA — card compacta horizontal
            ══════════════════════════════════════════════════════ */}
        <View style={s.card}>
          <View style={s.mascotRow}>
            <View style={s.mascotFrame}>
              <TugaAnimation state={MOOD_TO_STATE[mascotState.mood]} size={56} />
            </View>
            <View style={s.mascotInfo}>
              <Text style={s.mascotName}>{mascotName}</Text>
              <Text style={s.mascotHint}>{t("settings.mascot.section")}</Text>
            </View>
            {!editing && (
              <TouchableOpacity style={s.mascotEditBtn} onPress={startEdit} activeOpacity={0.7}>
                <Ionicons name="pencil-outline" size={15} color={ACCENT} />
              </TouchableOpacity>
            )}
          </View>
          {editing && (
            <View style={s.editBlock}>
              <TextInput
                style={s.input}
                value={draft}
                onChangeText={setDraft}
                placeholder={t("settings.mascot.namePlaceholder")}
                placeholderTextColor="#CCCCCC"
                maxLength={20}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={saveEdit}
              />
              <View style={s.editBtns}>
                <TouchableOpacity style={s.saveBtn} onPress={saveEdit} activeOpacity={0.8}>
                  <Text style={s.saveBtnTxt}>{t("settings.mascot.saveBtn")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelEdit} activeOpacity={0.7}>
                  <Text style={s.cancelTxt}>{t("settings.mascot.cancelBtn")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ══════════════════════════════════════════════════════
            PREFERENCIAS — idioma, país, haptics en una sola card
            ══════════════════════════════════════════════════════ */}
        <Text style={s.sectionLabel}>{t("settings.language.section")}</Text>
        <View style={s.card}>
          {/* Idioma */}
          <View style={s.prefRow}>
            <View style={[s.prefIcon, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons name="language-outline" size={16} color="#4A6FA5" />
            </View>
            <View style={s.pillGroup}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const active = lang === language;
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[s.pill, active && s.pillActive]}
                    onPress={() => setLanguage(lang)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.pillFlag}>{LANG_ICONS[lang]}</Text>
                    <Text style={[s.pillTxt, active && s.pillTxtActive]}>
                      {t(`settings.language.${lang}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={s.divider} />

          {/* País festivos */}
          <View style={s.prefRow}>
            <View style={[s.prefIcon, { backgroundColor: "#FFF8E8" }]}>
              <Ionicons name="flag-outline" size={16} color="#C8A52A" />
            </View>
            <Text style={s.prefLabel}>{t("settings.country.section")}</Text>
            <View style={s.pillGroup}>
              {HOLIDAY_COUNTRIES.map((c) => {
                const active = c === country;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[s.pill, active && s.pillActive]}
                    onPress={() => setCountry(c)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.pillFlag}>{COUNTRY_FLAGS[c]}</Text>
                    <Text style={[s.pillTxt, active && s.pillTxtActive]}>
                      {t(`settings.country.${c}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Haptics hidden for now */}
        </View>

        {/* ══════════════════════════════════════════════════════
            GOOGLE CALENDAR
            ══════════════════════════════════════════════════════ */}
        <Text style={s.sectionLabel}>{t("settings.calendar.section")}</Text>
        <View style={s.card}>
          {isConnected ? (
            <>
              <View style={s.calConnected}>
                <View style={s.calDot} />
                <View style={{ flex: 1 }}>
                  <View style={s.calEmailRow}>
                    <Text style={s.calEmail}>{calStatus?.google_email}</Text>
                    <View style={s.calBadge}>
                      <Text style={s.calBadgeTxt}>{t("settings.calendar.connected")}</Text>
                    </View>
                  </View>
                  <Text style={s.calMeta}>
                    {calStatus?.last_synced_at
                      ? `${t("settings.calendar.lastSync", { date: formatLastSync(calStatus.last_synced_at) })}${syncMutation.isSuccess ? `  ·  ${t("settings.calendar.imported", { count: syncMutation.data.synced })}` : ""}`
                      : t("settings.calendar.noSync")}
                  </Text>
                </View>
              </View>
              <View style={s.calActions}>
                <TouchableOpacity
                  style={s.calActionBtn}
                  onPress={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  activeOpacity={0.7}
                >
                  {syncMutation.isPending
                    ? <ActivityIndicator size="small" color="#1976D2" />
                    : <Ionicons name="refresh-outline" size={16} color="#1976D2" />}
                  <Text style={[s.calActionTxt, { color: "#1976D2" }]}>{t("settings.calendar.sync")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.calActionBtn}
                  onPress={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  activeOpacity={0.7}
                >
                  {disconnectMutation.isPending
                    ? <ActivityIndicator size="small" color={ACCENT} />
                    : <Ionicons name="unlink-outline" size={16} color={ACCENT} />}
                  <Text style={[s.calActionTxt, { color: ACCENT }]}>{t("settings.calendar.disconnect")}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={s.calConnect}
              onPress={handleConnectCalendar}
              disabled={isConnecting}
              activeOpacity={0.7}
            >
              {isConnecting ? (
                <ActivityIndicator size="small" color="#1A1A1A" />
              ) : (
                <Ionicons name="logo-google" size={18} color="#1A1A1A" />
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.calConnectTxt}>{t("settings.calendar.connect")}</Text>
                <Text style={s.calConnectHint}>{t("settings.calendar.description")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
            </TouchableOpacity>
          )}
        </View>

        {/* ══════════════════════════════════════════════════════
            APOYAR (solo Android/web)
            ══════════════════════════════════════════════════════ */}
        {Platform.OS !== "ios" ? (
          <>
            <Text style={s.sectionLabel}>{t("settings.support.section")}</Text>
            <View style={[s.card, s.supportCard]}>
              <View style={s.supportRow}>
                <Text style={s.supportEmoji}>☕</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.supportTitle}>{t("settings.support.title")}</Text>
                  <Text style={s.supportDesc}>{t("settings.support.description")}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={s.supportBtn}
                onPress={() => Linking.openURL("https://ko-fi.com/jazmin_bedoya")}
                activeOpacity={0.85}
              >
                <Text style={s.supportBtnTxt}>{t("settings.support.button")}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={s.sectionLabel}>{t("settings.community.section")}</Text>
            <View style={s.card}>
              <TouchableOpacity
                style={s.communityRow}
                onPress={() => {
                  // TODO: replace with actual App Store URL
                  Linking.openURL("https://apps.apple.com/app/id0000000000");
                }}
                activeOpacity={0.7}
              >
                <View style={[s.prefIcon, { backgroundColor: "#FFF8E8" }]}>
                  <Ionicons name="star-outline" size={16} color="#E8A317" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.communityLabel}>{t("settings.community.review")}</Text>
                  <Text style={s.communityHint}>{t("settings.community.reviewHint")}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#CCCCCC" />
              </TouchableOpacity>
              <View style={s.divider} />
              <TouchableOpacity
                style={s.communityRow}
                onPress={() => {
                  const message = t("settings.community.shareMessage");
                  Share.share({ message }).catch(() => {});
                }}
                activeOpacity={0.7}
              >
                <View style={[s.prefIcon, { backgroundColor: "#EEF6EE" }]}>
                  <Ionicons name="share-outline" size={16} color="#4CAF50" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.communityLabel}>{t("settings.community.share")}</Text>
                  <Text style={s.communityHint}>{t("settings.community.shareHint")}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#CCCCCC" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            ACERCA DE
            ══════════════════════════════════════════════════════ */}
        <Text style={s.sectionLabel}>{t("settings.about.section")}</Text>
        <View style={s.card}>
          <View style={s.aboutBlock}>
            <Text style={s.aboutTitle}>{t("settings.about.title")}</Text>
            <Text style={s.aboutTagline}>{t("settings.about.tagline")}</Text>
            <Text style={s.aboutDesc}>{t("settings.about.description", { mascotName })}</Text>
            <View style={s.aboutFooter}>
              <Text style={s.aboutCredits}>{t("settings.about.creditsText")}</Text>
              <Text style={s.aboutVersion}>{t("settings.about.version")} 1.0.0</Text>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════
            CERRAR SESIÓN
            ══════════════════════════════════════════════════════ */}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={async () => { await logout(); router.replace("/(auth)/login"); }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={17} color={ACCENT} />
          <Text style={s.logoutTxt}>{t("settings.session.logout")}</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },

  // Header
  titleRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  screenTitle: { fontSize: 28, fontWeight: "800", color: "#1A1A1A", letterSpacing: -0.3 },

  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: "#999999",
    textTransform: "uppercase", letterSpacing: 1.2,
    marginBottom: 8, marginLeft: 4, marginTop: 28,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#F0EDE8", marginLeft: 56 },

  // ── Mascot ──
  mascotRow: {
    flexDirection: "row", alignItems: "center",
    padding: 16, gap: 14,
  },
  mascotFrame: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "#F8F6F2",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(0,0,0,0.06)",
  },
  mascotInfo: { flex: 1 },
  mascotName: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  mascotHint: { fontSize: 12, color: "#AAAAAA", marginTop: 2 },
  mascotEditBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "#FFF3EE", alignItems: "center", justifyContent: "center",
  },

  editBlock: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  input: {
    height: 46, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E8E5E0",
    paddingHorizontal: 14, fontSize: 15, color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
  },
  editBtns: { flexDirection: "row", alignItems: "center", gap: 12 },
  saveBtn: {
    height: 40, paddingHorizontal: 24, borderRadius: 12,
    backgroundColor: "#4CAF50", alignItems: "center", justifyContent: "center",
  },
  saveBtnTxt: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  cancelTxt:  { fontSize: 14, color: "#8A8A8A" },

  // ── Preferences (language, country, haptics) ──
  prefRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    flexWrap: "wrap",
  },
  prefIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  prefLabel: { fontSize: 14, fontWeight: "500", color: "#1A1A1A" },
  prefHint:  { fontSize: 11, color: "#AAAAAA", marginTop: 1 },
  pillGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "#F5F3F0",
    borderWidth: 1.5, borderColor: "transparent",
  },
  pillActive: { backgroundColor: "#FFF3EE", borderColor: ACCENT },
  pillFlag:   { fontSize: 15 },
  pillTxt:       { fontSize: 13, fontWeight: "500", color: "#6A6A6A" },
  pillTxtActive: { color: ACCENT, fontWeight: "700" },

  // ── Google Calendar ──
  calConnected: {
    flexDirection: "row", alignItems: "center",
    padding: 16, gap: 12,
  },
  calDot:     { width: 9, height: 9, borderRadius: 5, backgroundColor: "#4CAF50" },
  calEmailRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  calEmail:   { fontSize: 14, fontWeight: "600", color: "#1A1A1A", flexShrink: 1 },
  calBadge:    { backgroundColor: "#E8F5E9", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  calBadgeTxt: { fontSize: 10, fontWeight: "600", color: "#388E3C" },
  calMeta:     { fontSize: 12, color: "#8A8A8A", marginTop: 3 },
  calActions: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 16, paddingBottom: 14,
  },
  calActionBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12, backgroundColor: "#F8F6F2",
  },
  calActionTxt: { fontSize: 13, fontWeight: "600" },
  calConnect: {
    flexDirection: "row", alignItems: "center",
    padding: 16, gap: 14,
  },
  calConnectTxt:  { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  calConnectHint: { fontSize: 12, color: "#AAAAAA", marginTop: 2, lineHeight: 17 },

  // ── Support ──
  supportCard: { backgroundColor: "#FFFAF6", borderWidth: 1, borderColor: "#F5E6D8" },
  supportRow:  { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 20, paddingBottom: 14 },
  supportEmoji:  { fontSize: 32 },
  supportTitle:  { fontSize: 16, fontWeight: "700", color: "#1A1A1A", marginBottom: 4 },
  supportDesc:   { fontSize: 13, color: "#7A6A5A", lineHeight: 19 },
  supportBtn: {
    marginHorizontal: 20, marginBottom: 20, paddingVertical: 13,
    borderRadius: 14, backgroundColor: ACCENT, alignItems: "center",
  },
  supportBtnTxt: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  // ── Community (iOS) ──
  communityRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  communityLabel: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  communityHint:  { fontSize: 11, color: "#AAAAAA", marginTop: 1 },

  // ── About ──
  aboutBlock:   { padding: 20, gap: 10 },
  aboutTitle:   { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  aboutTagline: { fontSize: 13, color: ACCENT, fontWeight: "500", marginTop: -4 },
  aboutDesc:    { fontSize: 13, color: "#6A6A6A", lineHeight: 20 },
  aboutFooter:  { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#F0EDE8", paddingTop: 10, marginTop: 4 },
  aboutCredits: { fontSize: 11, color: "#BBBBBB", lineHeight: 16 },
  aboutVersion: { fontSize: 11, color: "#CCCCCC", textAlign: "right", marginTop: 6 },

  // ── Logout ──
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 28, paddingVertical: 14,
    borderRadius: 16, backgroundColor: "#FFF5F3",
    borderWidth: 1, borderColor: "#FCDADA",
  },
  logoutTxt: { fontSize: 15, fontWeight: "600", color: ACCENT },
});
