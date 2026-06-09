import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import type { MascotMood } from "./getMascotState";
import { TugaAnimation, MOOD_TO_STATE } from "./TugaAnimation";
import type { TugaState } from "./TugaAnimation";

export type MascotSize = "small" | "medium" | "large";

const SIZE_PX: Record<MascotSize, number> = {
  small:  80,
  medium: 120,
  large:  160,
};
const FRAME_PADDING = 12;

interface Props {
  name: string;
  mood: MascotMood;
  message: string;
  size?: MascotSize;
  showName?: boolean;
  /**
   * Dispara esta animación una sola vez, luego vuelve al estado del mood.
   * Útil para celebrar un logro puntual sin cambiar el mood general.
   */
  oneShotState?: TugaState;
  onOneShotComplete?: () => void;
}

export function Mascot({
  name,
  mood,
  message,
  size = "medium",
  showName = true,
  oneShotState,
  onOneShotComplete,
}: Props) {
  const [playing, setPlaying] = useState<TugaState | null>(null);
  const prevOneShot = useRef<TugaState | undefined>(undefined);

  useEffect(() => {
    if (oneShotState && oneShotState !== prevOneShot.current) {
      prevOneShot.current = oneShotState;
      setPlaying(oneShotState);
    }
    if (!oneShotState) {
      prevOneShot.current = undefined;
    }
  }, [oneShotState]);

  const activeState = playing ?? MOOD_TO_STATE[mood];
  const isOneShot   = playing !== null;

  function handleFinish() {
    setPlaying(null);
    onOneShotComplete?.();
  }

  const px        = SIZE_PX[size];
  const frameSize = px + FRAME_PADDING * 2;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.frame, { width: frameSize, height: frameSize, borderRadius: frameSize * 0.22 }]}>
        <TugaAnimation
          state={activeState}
          size={px}
          loop={!isOneShot}
          onFinish={isOneShot ? handleFinish : undefined}
        />
      </View>
      {showName && name ? (
        <Text style={styles.name}>{name}</Text>
      ) : null}
      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 8,
  },

  frame: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F6F2",
    borderWidth: 1,
    borderColor: "rgba(30, 42, 74, 0.10)",
    // Shadow
    shadowColor: "#1E2A4A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },

  name: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
    color: "#1E2A4A",
    letterSpacing: 0.2,
  },

  message: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B6B6B",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
