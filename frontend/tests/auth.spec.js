import { expect, test } from "@playwright/test";

// Credenciais por defeito para desenvolvimento local.
// Podes substituir com:
// PLAYWRIGHT_LOGIN=teu_login
// PLAYWRIGHT_PASSWORD=tua_password
const LOGIN = process.env.PLAYWRIGHT_LOGIN || "admin";
const PASSWORD = process.env.PLAYWRIGHT_PASSWORD || "admin";

test.describe("Autenticacao", () => {
  test("permite iniciar sessao e entrar no painel", async ({ page }) => {
    await page.goto("/");

    // Confirma que estamos mesmo no ecra de autenticacao.
    await expect(page.getByRole("heading", { name: /invent.rio it/i })).toBeVisible();

    // Preenche o mesmo formulario que um utilizador real usa no browser.
    await page.getByPlaceholder("Utilizador ou email").fill(LOGIN);
    await page.getByPlaceholder("Palavra-passe").fill(PASSWORD);
    await page.getByRole("button", { name: /^entrar$/i }).click();

    // Depois do login a app deixa de mostrar o formulario e carrega o painel.
    await expect(page.getByRole("button", { name: /^sair$/i })).toBeVisible();
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });
});
