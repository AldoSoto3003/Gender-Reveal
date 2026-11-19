import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Evento, FotoHistoria, FotoRecuerdo, Prediccion } from '../lib/types';

interface Datos {
  evento: Evento | null;
  predicciones: Prediccion[];
  historia: FotoHistoria[];
  recuerdos: FotoRecuerdo[];
  error: string | null;
}

/**
 * Carga todo lo que ve el invitado y lo mantiene al día:
 * escucha cambios en tiempo real y, cerca de la hora del evento, también consulta cada 5 segundos
 * por si el WebSocket falla en el salón.
 */
export function useInvitacion() {
  const [d, setD] = useState<Datos>({ evento: null, predicciones: [], historia: [], recuerdos: [], error: null });

  const cargarEvento = useCallback(async () => {
    const evento = await api.evento();
    setD((x) => ({ ...x, evento }));
    return evento;
  }, []);
  const cargarPredicciones = useCallback(async () => {
    const predicciones = await api.predicciones();
    setD((x) => ({ ...x, predicciones }));
  }, []);
  const cargarRecuerdos = useCallback(async () => {
    const recuerdos = await api.recuerdosPublicados();
    setD((x) => ({ ...x, recuerdos }));
  }, []);
  const cargarHistoria = useCallback(async () => {
    const historia = await api.fotosHistoria();
    setD((x) => ({ ...x, historia }));
  }, []);

  useEffect(() => {
    Promise.all([cargarEvento(), cargarPredicciones(), cargarHistoria(), cargarRecuerdos()]).catch((e: unknown) =>
      setD((x) => ({ ...x, error: e instanceof Error ? e.message : 'No se pudo cargar la invitación' })),
    );
    return api.escuchar((tabla) => {
      if (tabla === 'eventos') {
        void cargarEvento();
        void cargarHistoria();
      }
      if (tabla === 'predicciones') void cargarPredicciones();
      if (tabla === 'fotos_recuerdos') void cargarRecuerdos();
    });
  }, [cargarEvento, cargarPredicciones, cargarHistoria, cargarRecuerdos]);

  // Respaldo: desde 10 minutos antes del evento, consultar cada 5 s hasta que se revele.
  const fecha = d.evento?.fecha_hora;
  const pendiente = d.evento?.estado === 'pendiente';
  useEffect(() => {
    if (!fecha || !pendiente) return;
    const t = setInterval(() => {
      if (Date.now() > Date.parse(fecha) - 10 * 60 * 1000) void cargarEvento();
    }, 5000);
    return () => clearInterval(t);
  }, [fecha, pendiente, cargarEvento]);

  return { ...d, recargarPredicciones: cargarPredicciones, recargarRecuerdos: cargarRecuerdos };
}
