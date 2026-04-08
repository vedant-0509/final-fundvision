// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/api': {
//         // Updated to explicit IP to prevent connection refusal on Windows
//         target: 'http://127.0.0.1:8000',
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
//   build: {
//     outDir: 'dist',
//     sourcemap: false,
//   },
// });



// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/api/v1': {
//         target: 'http://127.0.0.1:8000',
//         changeOrigin: true,
//         secure: false,
//         rewrite: (path: string) => path.replace(/^\/api\/v1/, ''), // ✅ fixed type
//       },
//     },
//   },
//   build: {
//     outDir: 'dist',
//     sourcemap: false,
//   },
// });










import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // We target /api so it catches both /api/v1 and general /api calls
      '/api': {
        // Using 127.0.0.1 is safer than 'localhost' on many systems
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        // REMOVED rewrite: 
        // We keep the path intact so FastAPI receives "/api/v1/recommend" 
        // instead of just "/recommend"
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});