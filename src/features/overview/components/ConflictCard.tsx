import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useTranslation } from 'react-i18next';
import { LAYER_COLORS, type Conflict, type CalendarEvent } from '../types';

interface ConflictCardProps {
  conflict: Conflict;
  timezone: string;
  onEdit: (event: CalendarEvent) => void;
}

export function ConflictCard({ conflict, timezone, onEdit }: ConflictCardProps) {
  const { t } = useTranslation();
  const { type, eventA, eventB } = conflict;

  const startTimeA = formatInTimeZone(parseISO(eventA.startAt), timezone, 'HH:mm');
  const startTimeB = formatInTimeZone(parseISO(eventB.startAt), timezone, 'HH:mm');

  const typeLabel =
    type === 'overlap' ? t('conflict.overlap') : t('conflict.tight');

  return (
    <View style={styles.card}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Ionicons name="warning" size={15} color="#D97706" />
        <Text style={styles.headerText} numberOfLines={1}>
          {typeLabel}
          {'  '}
          <Text style={[styles.layerTag, { color: LAYER_COLORS[conflict.layers[0]] }]}>
            {t(`layers.${conflict.layers[0]}`)}
          </Text>
          <Text style={styles.vs}>{' vs '}</Text>
          <Text style={[styles.layerTag, { color: LAYER_COLORS[conflict.layers[1]] }]}>
            {t(`layers.${conflict.layers[1]}`)}
          </Text>
        </Text>
      </View>

      {/* Detalle de eventos con botón editar por fila */}
      <TouchableOpacity style={styles.eventRow} onPress={() => onEdit(eventA)} activeOpacity={0.7}>
        <Text style={styles.detail} numberOfLines={1}>{eventA.title} · <Text style={styles.time}>{startTimeA}</Text></Text>
        <Ionicons name="pencil-outline" size={14} color="#D97706" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.eventRow} onPress={() => onEdit(eventB)} activeOpacity={0.7}>
        <Text style={styles.detail} numberOfLines={1}>{eventB.title} · <Text style={styles.time}>{startTimeB}</Text></Text>
        <Ionicons name="pencil-outline" size={14} color="#D97706" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    marginBottom: 8,
    gap: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  layerTag: {
    fontWeight: '700',
  },
  vs: {
    color: '#92400E',
    fontWeight: '400',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 21,
    gap: 8,
  },
  detail: {
    flex: 1,
    fontSize: 13,
    color: '#78350F',
  },
  time: {
    fontWeight: '700',
  },
});
