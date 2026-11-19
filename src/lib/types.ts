export type Sexo = 'nina' | 'nino';

export interface Evento {
  id: string;
  fecha_hora: string;
  lugar: string;
  direccion: string;
  nota: string;
  nombres_papas: string;
  telefono: string;
  estado: 'pendiente' | 'revelado';
  resultado: Sexo | null;
  revelado_en: string | null;
  galeria_visible: boolean;
  invitados_suben_fotos: boolean;
  es_prueba: boolean;
}

export type EventoEditable = Pick<
  Evento,
  'fecha_hora' | 'lugar' | 'direccion' | 'nota' | 'nombres_papas' | 'telefono' | 'galeria_visible' | 'invitados_suben_fotos'
>;

export interface Prediccion {
  id: string;
  nombre: string;
  prediccion: Sexo;
  creado_en: string;
}

export interface MiPrediccion {
  nombre: string;
  prediccion: Sexo;
  peso_kg: number | null;
}

/** 'si' = viene, 'tal_vez' = aún no lo sabe, 'no' = no podrá ir */
export type Respuesta = 'si' | 'tal_vez' | 'no';

export interface Asistencia {
  id: string;
  nombre: string;
  respuesta: Respuesta;
  /** Total que viene: 1 (quien confirma) + adultos + niños; 0 si no viene */
  personas: number;
  /** Adultos que acompañan a quien confirma */
  adultos: number;
  ninos: number;
  /** Nombres de los acompañantes (texto libre, opcional) */
  acompanantes: string;
  mensaje: string;
  creado_en: string;
  actualizado_en: string;
}

export interface MiAsistencia {
  nombre: string;
  respuesta: Respuesta;
  adultos: number;
  ninos: number;
  acompanantes: string;
  /** Calculado: 1 + adultos + niños (0 si no viene) */
  personas: number;
  mensaje: string;
}

export interface FotoHistoria {
  id: string;
  url: string;
  ruta: string;
  titulo: string;
  tipo: 'foto' | 'ecografia';
  posicion: number;
}

export interface FotoRecuerdo {
  id: string;
  url: string;
  ruta: string;
  bucket: string;
  subida_por: string;
  estado: 'pendiente' | 'publicada' | 'quitada';
  creado_en: string;
}

export interface EstadoSello {
  link_creado: boolean;
  sellado: boolean;
  sellado_en: string | null;
}

export interface GuardianInfo {
  sellado: boolean;
  fecha_hora: string;
  revelado: boolean;
}

/** Contrato único de datos. Lo implementan Supabase (producción) y el modo demo (navegador). */
export interface Api {
  modo: 'supabase' | 'demo';

  // Invitados
  evento(): Promise<Evento>;
  predicciones(): Promise<Prediccion[]>;
  miPrediccion(): Promise<MiPrediccion | null>;
  guardarPrediccion(nombre: string, prediccion: Sexo, pesoKg: number | null): Promise<void>;
  borrarPrediccion(): Promise<void>;
  miAsistencia(): Promise<MiAsistencia | null>;
  guardarAsistencia(a: MiAsistencia): Promise<void>;
  fotosHistoria(): Promise<FotoHistoria[]>;
  recuerdosPublicados(): Promise<FotoRecuerdo[]>;
  subirRecuerdo(archivo: Blob, nombre: string): Promise<void>;
  /** Escucha cambios del evento, predicciones y recuerdos. Devuelve la función para dejar de escuchar. */
  escuchar(alCambiar: (tabla: 'eventos' | 'predicciones' | 'fotos_recuerdos') => void): () => void;

  // Papás
  sesion(): Promise<{ email: string; admin: boolean } | null>;
  entrar(email: string): Promise<void>;
  salir(): Promise<void>;
  alCambiarSesion(cb: () => void): () => void;
  asistencias(): Promise<Asistencia[]>;
  actualizarEvento(cambios: Partial<EventoEditable>): Promise<void>;
  subirFotoHistoria(archivo: Blob, titulo: string, tipo: FotoHistoria['tipo']): Promise<void>;
  editarFotoHistoria(id: string, cambios: Partial<Pick<FotoHistoria, 'titulo' | 'tipo'>>): Promise<void>;
  ordenarFotosHistoria(ids: string[]): Promise<void>;
  borrarFotoHistoria(id: string): Promise<void>;
  recuerdosTodos(): Promise<FotoRecuerdo[]>;
  subirRecuerdoAdmin(archivo: Blob): Promise<void>;
  aprobarRecuerdo(foto: FotoRecuerdo): Promise<void>;
  quitarRecuerdo(foto: FotoRecuerdo): Promise<void>;
  estadoSello(): Promise<EstadoSello>;
  crearLinkGuardian(): Promise<{ token: string; pin: string }>;
  revelar(): Promise<Sexo>;
  reiniciarPrueba(): Promise<void>;

  // Guardián
  guardianInfo(token: string): Promise<GuardianInfo | null>;
  sellar(token: string, pin: string, resultado: Sexo): Promise<void>;
}
