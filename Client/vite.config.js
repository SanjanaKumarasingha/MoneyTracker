import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    base:"",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    open: true,
    port: 5173, // You can change the port if needed
  },
  build: {
    outDir: "build", // Match create-react-app's default build directory
  },
});
