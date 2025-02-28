import { defineConfig } from 'vite';

export default defineConfig({
  base: '/', // Asegúrate de que esta ruta sea correcta para tu despliegue
  server: {
    proxy: {
      '/api': 'http://localhost:5000', // Configuración para proxy si es necesario
    }
  },
  build: {
    outDir: 'dist', // Carpeta donde se generará el build
  },
});

