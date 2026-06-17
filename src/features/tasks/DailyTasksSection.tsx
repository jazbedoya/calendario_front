import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Animated } from "react-native";
import { useTranslation } from "react-i18next";

import { useQueryClient } from "@tanstack/react-query";
import { useGetTodayTasks, useGetYesterdayPending, useCreateTask, useToggleTask, useDeleteTask, useGetStreak } from "./hooks";
import { TodayPath }            from "./TodayPath";
import { TaskRow }              from "./TaskRow";
import { AddTask }              from "./AddTask";
import { CelebrationOverlay }   from "./CelebrationOverlay";
import { useTodayDate }         from "./hooks";
import type { MascotMood }      from "@/features/mascot/getMascotState";

const ACCENT = "#C8553D";

function TaskSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={s.list}>
      {[0.75, 0.55, 0.65].map((w, i) => (
        <View key={i} style={[s.skeletonRow, i > 0 && s.skeletonBorder]}>
          <Animated.View style={[s.skeletonCircle, { opacity }]} />
          <Animated.View style={[s.skeletonLine, { opacity, width: `${w * 100}%` as any }]} />
        </View>
      ))}
    </View>
  );
}

function useProgressMessage(t: ReturnType<typeof useTranslation>['t']) {
  return (done: number, total: number): { msg: string; mood: MascotMood } => {
    if (total === 0)         return { msg: t('tasks.progress.empty'),                              mood: "balanced"    };
    if (done === 0)          return { msg: t('tasks.progress.start'),                              mood: "happy"       };
    if (done === total)      return { msg: t('tasks.progress.done'),                               mood: "excited"     };
    if (done / total < 0.5) return { msg: t('tasks.progress.half',    { done, total }),            mood: "happy"       };
    return                         { msg: t('tasks.progress.mostDone', { done, total }),           mood: "encouraging" };
  };
}

interface DailyTasksSectionProps {
  onInputFocus?: () => void;
}

export function DailyTasksSection({ onInputFocus }: DailyTasksSectionProps) {
  const { t } = useTranslation();
  const today = useTodayDate();
  const { data: tasks = [], isLoading, isPending } = useGetTodayTasks();
  const { data: yesterdayPending = [] }            = useGetYesterdayPending();
  const progressMessage = useProgressMessage(t);

  // IDs de sugerencias de ayer ya añadidas (se ocultan individualmente)
  const [addedFromYesterday, setAddedFromYesterday] = useState<string[]>([]);

  const { mutate: create } = useCreateTask();
  const { mutate: toggle } = useToggleTask();
  const { mutate: remove } = useDeleteTask();
  const { data: streakData, refetch: refetchStreak } = useGetStreak();
  const qc = useQueryClient();

  const done  = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct   = total > 0 ? done / total : 0;

  const { msg, mood } = useMemo(() => progressMessage(done, total), [done, total]);

  // ── Celebración al completar todas ───────────────────────────────────────
  const [celebrating, setCelebrating] = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const prevDone    = useRef(done);
  const prevTotal   = useRef(total);
  // Prevents re-triggering in the same session after closing + re-completing
  const alreadyFired = useRef(false);

  useEffect(() => {
    const justFinished =
      done > 0 &&
      done === total &&
      (done > prevDone.current || total !== prevTotal.current) &&
      !alreadyFired.current;

    if (justFinished) {
      alreadyFired.current = true;
      setCelebrating(true);
      refetchStreak().finally(() => setShowModal(true));
    }

    // Reset guard if user unchecks a task
    if (done < total && done < prevDone.current) {
      alreadyFired.current = false;
    }

    prevDone.current  = done;
    prevTotal.current = total;
  }, [done, total]);

  function handleCloseModal() {
    setShowModal(false);
    // Las tareas completadas se quedan tachadas hasta que cambie el día
  }

  return (
    <>
      <View style={s.card}>
        <Text style={s.title}>{t('tasks.sectionTitle')}</Text>
        {!isLoading && <Text style={s.subtitle}>{msg}</Text>}

        {/* Camino con Tuga */}
        <TodayPath
          progress={pct}
          mood={mood}
          celebrate={celebrating}
          onCelebrationEnd={() => setCelebrating(false)}
        />

        {/* Contador */}
        {total > 0 && (
          <Text style={s.counter}>
            {t('tasks.counter', { done, total, count: total })}
          </Text>
        )}

        {/* Skeleton mientras carga por primera vez */}
        {isLoading && <TaskSkeleton />}

        {/* Lista */}
        {!isLoading && tasks.length > 0 && (
          <View style={s.list}>
            {tasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                accent={ACCENT}
                onToggle={() => toggle({ id: task.id, done: !task.done })}
                onDelete={() => remove(task.id)}
                isLast={i === tasks.length - 1}
              />
            ))}
          </View>
        )}

        {/* Sugerencias de ayer — solo cuando hoy está vacío y ya cargó */}
        {tasks.length === 0 && !isLoading && yesterdayPending
          .filter((yt) => !addedFromYesterday.includes(yt.id))
          .map((yt) => (
            <View key={yt.id} style={s.yesterdayRow}>
              <Text style={s.yesterdayText} numberOfLines={2}>
                {t('tasks.yesterday.pending')} <Text style={s.yesterdayTask}>{yt.text}</Text>
              </Text>
              <TouchableOpacity
                style={s.yesterdayBtn}
                activeOpacity={0.75}
                onPress={() => {
                  create(yt.text);
                  setAddedFromYesterday((prev) => [...prev, yt.id]);
                }}
              >
                <Text style={s.yesterdayBtnText}>{t('tasks.yesterday.add')}</Text>
              </TouchableOpacity>
            </View>
          ))
        }

        {/* Añadir tarea */}
        <AddTask
          accent={ACCENT}
          onAdd={(text) => create(text)}
          onFocus={onInputFocus}
        />
      </View>

      {/* Modal de celebración — fuera del card para flotar sobre toda la app */}
      <CelebrationOverlay
        visible={showModal}
        streak={streakData?.current_streak ?? 1}
        onClose={handleCloseModal}
      />
    </>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  title:    { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  subtitle: { fontSize: 13, color: "#888888", lineHeight: 18, marginTop: -4 },
  counter:  { fontSize: 12, fontWeight: "600", color: "#AAAAAA", textAlign: "right", marginTop: -4 },
  list: {
    backgroundColor: "#FAFAF9",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0EDE9",
  },

  yesterdayRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF8F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDE9E4",
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  yesterdayText: { flex: 1, fontSize: 13, color: "#AAAAAA", lineHeight: 18 },
  yesterdayTask: { color: "#888888", fontWeight: "600" },
  yesterdayBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F3ECE9",
  },
  yesterdayBtnText: { fontSize: 13, fontWeight: "700", color: "#C8553D" },

  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: "#FAFAF9",
  },
  skeletonBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F0EDE9",
  },
  skeletonCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E8E4E0",
  },
  skeletonLine: {
    height: 13,
    borderRadius: 6,
    backgroundColor: "#E8E4E0",
  },
});
