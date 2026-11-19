import type { Api } from '../types';
import { crearApiDemo } from './demo';
import { crearApiSupabase } from './supabase';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const evento = import.meta.env.VITE_EVENT_ID as string | undefined;

/** Si faltan las variables de Supabase, la app corre en modo demo con datos en el navegador. */
export const api: Api = url && key && evento ? crearApiSupabase(url, key, evento) : crearApiDemo();

export function mensajeError(e: unknown): string {
  return e instanceof Error ? e.message : 'Algo salió mal. Intenta de nuevo.';
}
