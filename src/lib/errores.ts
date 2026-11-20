/**
 * Supabase y el navegador responden en inglés. Aquí se traducen los errores que pueden ver
 * los papás, el guardián o los invitados a un mensaje en español que diga qué hacer.
 * Los mensajes propios (los de las funciones SQL) ya vienen en español y pasan tal cual.
 */
const REGLAS: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  [/invalid login credentials|invalid_credentials/i, 'Correo o contraseña incorrectos. Revisa que estén bien escritos.'],
  [/email.not.confirmed/i, 'Ese correo todavía no está confirmado. En Supabase, márcalo como confirmado (ver docs/03-modelo-de-datos.md).'],
  [/password should be at least (\d+)/i, (m) => `La contraseña debe tener al menos ${m[1]} caracteres.`],
  [/should be different from the old password|same_password/i, 'La nueva contraseña debe ser distinta a la actual.'],
  [/weak password|password is known to be weak|weak_password/i, 'Esa contraseña es muy fácil de adivinar. Usa una más larga o con más variedad.'],
  [
    /email rate limit|over_email_send_rate_limit/i,
    'Se mandaron demasiados correos en poco tiempo. Espera alrededor de una hora e intenta de nuevo.',
  ],
  [
    /only request this (?:after|once every) (\d+) seconds?/i,
    (m) => `Espera ${m[1]} segundos e intenta de nuevo.`,
  ],
  [/jwt expired|invalid jwt|session.*(?:missing|expired)|refresh token/i, 'Tu sesión venció. Sal y vuelve a entrar al panel.'],
  [
    /otp_expired|(?:link|token).*(?:invalid|expired)|(?:invalid|expired).*(?:link|token)/i,
    'Ese link ya no funciona. Ahora se entra al panel con correo y contraseña.',
  ],
  [/unable to validate email|invalid email|email address .* is invalid/i, 'Ese correo no parece válido. Revisa que esté bien escrito.'],
  [/signups? not allowed|user not found/i, 'Ese correo no tiene acceso al panel. Usa el correo con el que se dio de alta.'],
  [/permission denied|row-level security|violates row level/i, 'No tienes permiso para hacer este cambio. Entra con el correo de papá o mamá.'],
  [/column .* does not exist|could not find the .* column|schema cache/i, 'La base de datos necesita una actualización para este cambio. Avísale a quien administra la página.'],
  [/payload too large|maximum allowed size|entity too large/i, 'La foto es demasiado pesada. Prueba con otra o tómale captura de pantalla.'],
  [/invalid mime type|mime type .* is not supported/i, 'Ese archivo no es una foto. Elige una imagen JPG o PNG.'],
  [/failed to fetch|networkerror|network request failed|load failed|fetch failed/i, 'No hay conexión. Revisa tu internet e intenta de nuevo.'],
  [/timeout|timed out/i, 'El servidor tardó demasiado en responder. Intenta de nuevo en un momento.'],
  [/too many requests|rate limit/i, 'Hubo demasiados intentos seguidos. Espera unos minutos e intenta de nuevo.'],
  [/duplicate key|already exists/i, 'Eso ya estaba guardado. Recarga la página para ver lo más reciente.'],
  [/internal server error|unexpected/i, 'Algo salió mal en el servidor. Intenta de nuevo en un momento.'],
];

export function traducirError(mensaje: string): string {
  const texto = mensaje.replace(/\+/g, ' ');
  for (const [patron, salida] of REGLAS) {
    const m = texto.match(patron);
    if (m) return typeof salida === 'string' ? salida : salida(m);
  }
  return mensaje;
}

// Se lee al cargar el módulo, antes de que el cliente de Supabase procese (y quizá borre) el hash.
const hashInicial = typeof window === 'undefined' ? '' : window.location.hash.replace(/^#/, '');

/**
 * Cuando un link de acceso falla, Supabase regresa a /panel con el error en el hash
 * (#error=access_denied&error_code=otp_expired&...). Devuelve el mensaje en español y limpia la URL.
 * Siempre da el mismo resultado, así que se puede llamar más de una vez (React en modo estricto lo hace).
 */
export function errorDelLink(): string | null {
  if (!hashInicial.includes('error')) return null;
  const p = new URLSearchParams(hashInicial);
  const codigo = p.get('error_code') ?? p.get('error') ?? '';
  const desc = p.get('error_description') ?? '';
  if (!codigo && !desc) return null;
  if (window.location.hash.includes('error')) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return traducirError(`${codigo} ${desc}`);
}
