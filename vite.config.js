import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5000',  // Configuración para proxy si es necesario
    }
  },
  build: {
    outDir: 'dist',  // Carpeta donde se generará el build
  },
});
