import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { MascotMood } from "./getMascotState";
import { TugaAnimation, MOOD_TO_STATE } from "./TugaAnimation";
import type { TugaState } from "./TugaAnimation";

interface Props {
  name: string;
  mood: MascotMood;
  message: string;
  /**
   * Dispara esta animación una sola vez, luego vuelve al estado del mood.
   * Útil para celebrar un logro puntual sin cambiar el mood general.
   */
  oneShotState?: TugaState;
  onOneShotComplete?: () => void;
}

export function Mascot({ name, mood, message, oneShotState, onOneShotComplete }: Props) {
  const [playing, setPlaying] = useState<TugaState | null>(null);
  const prevOneShot = useRef<TugaState | undefined>(undefined);

  // Arranca el one-shot solo cuando cambia (evita re-triggers por re-renders)
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

  return (
    <View style={styles.wrapper}>
      <TugaAnimation
        state={activeState}
        size={120}
        loop={!isOneShot}
        onFinish={isOneShot ? handleFinish : undefined}
      />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 8,
  },
  name: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "600",
    color: "#3D3D3D",
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
