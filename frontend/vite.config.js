import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Default to 5173 (matches the backend CORS allowlist); honor PORT when set
  // so tooling can run a second instance on a free port.
  server: { port: Number(process.env.PORT) || 5173 },
});
