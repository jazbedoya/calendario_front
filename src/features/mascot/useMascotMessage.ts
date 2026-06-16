import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Resuelve una messageKey que puede apuntar a un string o a un array de strings.
 * Cuando es array, elige uno al azar al montar y lo mantiene estable
 * mientras no cambie la key (es decir, mientras no cambie la franja horaria).
 */
export function useMascotMessage(messageKey: string): string {
  const { t } = useTranslation();

  return useMemo(() => {
    const val = t(messageKey, { returnObjects: true });
    if (Array.isArray(val) && val.length > 0) {
      return val[Math.floor(Math.random() * val.length)] as string;
    }
    return val as string;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageKey]); // solo re-randomiza al cambiar de franja
}
