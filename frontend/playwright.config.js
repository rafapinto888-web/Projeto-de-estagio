import { defineConfig, devices } from "@playwright/test";

// Configuracao base dos testes E2E.
// O frontend arranca em 5173 e a API continua separada em 8000.
export default defineConfig({
  testDir: "./tests",
  timeout: 90000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium",
      // Usa o Edge ja instalado no Windows para nao depender do chrome-headless-shell
      // descarregado pelo Playwright, que foi a origem do erro no modo headless.
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
  ],
});
