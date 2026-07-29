import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // three is by far the largest dependency and changes least often —
        // splitting it keeps app-code deploys from re-downloading it.
        manualChunks: { three: ["three"] },
      },
    },
  },
});
