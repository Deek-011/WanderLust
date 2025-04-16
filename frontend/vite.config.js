import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load environment variables for the current mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
          secure: false,
          // rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),
//     tailwindcss(),
//   ],
//   server: {
//     proxy: {
//       "/api": {
//         target: VITE_BACKEND_URL,
//         changeOrigin: true,
//         secure: false,
//         // rewrite: (path) => path.replace(/^\/api/, ""),
//       },
//     },
//   },
// });
