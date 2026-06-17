import { expect, test } from "@playwright/test";

import { loginAsAdmin, logout } from "./helpers/app";

const LOGIN = process.env.PLAYWRIGHT_LOGIN || "admin";
const PASSWORD = process.env.PLAYWRIGHT_PASSWORD || "inventario123";

test.describe("Autenticacao", () => {
  test("permite iniciar sessao e entrar no painel", async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("mostra erro quando as credenciais sao invalidas", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Utilizador ou email").fill(LOGIN);
    await page.getByPlaceholder("Palavra-passe").fill(`${PASSWORD}-errada`);
    await page.getByRole("button", { name: /^entrar$/i }).click();

    await expect(page.getByRole("alert")).toContainText(/credenciais invalidas/i);
    await expect(page.getByRole("heading", { name: /invent.rio it/i })).toBeVisible();
  });

  test("permite terminar a sessao e voltar ao login", async ({ page }) => {
    await loginAsAdmin(page);
    await logout(page);
  });
});
