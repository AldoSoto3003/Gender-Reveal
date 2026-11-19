import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Puerto fijo: el login de los papás solo redirige a esta URL (ver supabase/config.toml).
  server: { port: 5190, strictPort: true },
  preview: { port: 5190, strictPort: true },
});
