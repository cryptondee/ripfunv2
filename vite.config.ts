import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Expose only VITE_ prefixed vars to client
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react()],
    define: {
      // Example replacement for optional GEMINI API (server only)
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || '')
    }
  };
});
