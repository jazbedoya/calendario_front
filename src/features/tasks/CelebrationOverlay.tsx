/**
 * CelebrationOverlay — modal de celebración al completar todas las tareas.
 *
 * Incluye:
 *  - Confeti suave en colores de la app
 *  - Tuga en animación "celebrating" (Lottie)
 *  - Mensaje alentador rotativo
 *  - Racha de días consecutivos (si streak ≥ 2)
 *  - Vibración háptica (si está activada en Ajustes)
 *  - Auto-cierre a los 4.5 s; también se cierra al tocar
 */
import { useEffect, useRef } from "react";
import {
  Animated, Dimensions, Modal, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { TugaAnimation } from "@/features/mascot/TugaAnimation";
import { useCelebrationSettings } from "@/stores/celebrationSettingsStore";

// ── Confeti ───────────────────────────────────────────────────────────────────
const COLORS = ["#C8553D", "#E07A5F", "#8DB5AA", "#C4B5E8", "#F6C870", "#88A99E"];
const PHI    = 1.6180339887;

// Particles defined once at module scope (deterministic, no jank on re-renders)
const PARTICLES = Array.from({ length: 26 }, (_, i) => ({
  id:       i,
  color:    COLORS[i % COLORS.length],
  size:     7 + (i % 4),
  isRect:   i % 3 !== 0,
  delay:    Math.round((i * 73) % 650),
  duration: 1900 + Math.round((i * 61) % 600),
  xFrac:    ((i * PHI) % 1),             // evenly spread 0–1 via golden ratio
  drift:    ((i % 5) - 2) * 22,          // −44 to +44 px horizontal drift
}));

interface ConfettiLayerProps { run: boolean }

function ConfettiLayer({ run }: ConfettiLayerProps) {
  const { width: W, height: H } = Dimensions.get("window");
  const anims = useRef(PARTICLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!run) return;
    anims.forEach((a) => a.setValue(0));

    Animated.parallel(
      PARTICLES.map((p, i) =>
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(anims[i], {
            toValue:  1,
            duration: p.duration,
            useNativeDriver: true,
          }),
        ]),
      ),
    ).start();
  }, [run]);

  return (
    <>
      {PARTICLES.map((p, i) => {
        const translateY = anims[i].interpolate({ inputRange: [0, 1], outputRange: [-30, H + 80] });
        const translateX = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, p.drift]  });
        const rotate     = anims[i].interpolate({ inputRange: [0, 1], outputRange: ["0deg", "630deg"] });
        const opacity    = anims[i].interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });

        return (
          <Animated.View
            key={p.id}
            style={{
              position:        "absolute",
              left:            p.xFrac * W,
              top:             0,
              width:           p.size,
              height:          p.isRect ? Math.round(p.size * 0.55) : p.size,
              borderRadius:    p.isRect ? 2 : p.size / 2,
              backgroundColor: p.color,
              transform:       [{ translateX }, { translateY }, { rotate }],
              opacity,
            }}
          />
        );
      })}
    </>
  );
}

// ── Overlay principal ─────────────────────────────────────────────────────────

interface Props {
  visible:  boolean;
  streak:   number;
  onClose:  () => void;
}

export function CelebrationOverlay({ visible, streak, onClose }: Props) {
  const { t } = useTranslation();
  const { hapticsEnabled } = useCelebrationSettings();

  const messages = t("celebration.messages", { returnObjects: true }) as Array<{ title: string; body: string }>;

  // Stable message index for this open session
  const idxRef    = useRef(0);
  const openedRef = useRef(false);

  // Card entry animation
  const cardScale   = useRef(new Animated.Value(0.72)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && !openedRef.current) {
      openedRef.current = true;

      // Pick a random message
      idxRef.current = Math.floor(Math.random() * messages.length);

      // Haptics
      if (hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      // Card spring-in
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 90,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue:  1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (!visible) {
      openedRef.current = false;
      cardScale.setValue(0.72);
      cardOpacity.setValue(0);
    }
  }, [visible, hapticsEnabled]);

  // Auto-dismiss
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  const msg = messages[idxRef.current] ?? messages[0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        {/* Tap outside to dismiss */}
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        {/* Center card */}
        <Animated.View style={[s.card, { transform: [{ scale: cardScale }], opacity: cardOpacity }]}>
          {/* Tuga celebrating */}
          <View style={s.tugaWrap}>
            <TugaAnimation state="celebrating" size={140} loop />
          </View>

          {/* Message */}
          <Text style={s.title}>{msg.title}</Text>
          <Text style={s.body}>{msg.body}</Text>

          {/* Streak */}
          {streak >= 2 && (
            <View style={s.streakBadge}>
              <Text style={s.streakTxt}>{t("celebration.streak", { count: streak })}</Text>
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity style={s.btn} onPress={onClose} activeOpacity={0.8}>
            <Text style={s.btnTxt}>{t("celebration.closeBtn")}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Confetti — above everything, no touch events */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ConfettiLayer run={visible} />
        </View>
      </View>
    </Modal>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(30, 20, 15, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  tugaWrap: {
    width: 140,
    height: 140,
    marginBottom: 8,
    overflow: "hidden",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "center",
    letterSpacing: -0.2,
    marginTop: 4,
  },
  body: {
    fontSize: 15,
    color: "#5A5A5A",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 22,
  },
  streakBadge: {
    marginTop: 14,
    backgroundColor: "#FFF4E8",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  streakTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#C8553D",
  },
  btn: {
    marginTop: 20,
    backgroundColor: "#C8553D",
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 40,
  },
  btnTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
