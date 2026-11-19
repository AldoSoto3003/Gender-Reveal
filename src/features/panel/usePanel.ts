import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Asistencia, EstadoSello, Evento, FotoHistoria, FotoRecuerdo, Prediccion } from '../../lib/types';

export interface DatosPanel {
  evento: Evento | null;
  asistencias: Asistencia[];
  predicciones: Prediccion[];
  historia: FotoHistoria[];
  recuerdos: FotoRecuerdo[];
  sello: EstadoSello | null;
}

export function usePanel(activo: boolean) {
  const [d, setD] = useState<DatosPanel>({ evento: null, asistencias: [], predicciones: [], historia: [], recuerdos: [], sello: null });

  const recargar = useCallback(async () => {
    const [evento, asistencias, predicciones, historia, recuerdos, sello] = await Promise.all([
      api.evento(),
      api.asistencias(),
      api.predicciones(),
      api.fotosHistoria(),
      api.recuerdosTodos(),
      api.estadoSello(),
    ]);
    setD({ evento, asistencias, predicciones, historia, recuerdos, sello });
  }, []);

  useEffect(() => {
    if (!activo) return;
    void recargar();
    const dejar = api.escuchar(() => void recargar());
    // Las confirmaciones no viajan por tiempo real (son privadas): se refrescan cada 30 s.
    const t = setInterval(() => void recargar(), 30000);
    return () => {
      dejar();
      clearInterval(t);
    };
  }, [activo, recargar]);

  return { ...d, recargar };
}
