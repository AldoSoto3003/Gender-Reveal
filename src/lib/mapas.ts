export function googleMaps(direccion: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
}

export function appleMaps(direccion: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(direccion)}`;
}
