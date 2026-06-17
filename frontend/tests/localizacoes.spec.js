import { expect, test } from "@playwright/test";

import {
  acceptNextDialog,
  createLocation,
  loginAsAdmin,
  openRowAction,
  rowByText,
  uniqueValue,
} from "./helpers/app";

test.describe("Localizacoes", () => {
  test("workflow CRUD de uma localizacao", async ({ page }) => {
    const nome = uniqueValue("PW-LOC");
    const nomeAtualizado = `${nome}-OK`;

    await test.step("Inicia sessao como administrador", async () => {
      await loginAsAdmin(page);
    });

    await test.step("Cria uma localizacao", async () => {
      await createLocation(page, { nome, descricao: "Localizacao criada por Playwright" });
    });

    await test.step("Edita a localizacao", async () => {
      await openRowAction(page, nome, /editar/i);
      const dialog = page.getByRole("dialog", { name: /editar localiza..o/i });
      await dialog.getByLabel("Nome").fill(nomeAtualizado);
      await dialog.getByLabel(/descri/i).fill("Depois da edicao");
      await dialog.getByRole("button", { name: /guardar altera..es/i }).click();
    });

    await test.step("Valida os dados atualizados na tabela", async () => {
      await expect(rowByText(page, nomeAtualizado)).toBeVisible();
      await expect(rowByText(page, nomeAtualizado)).toContainText("Depois da edicao");
    });

    await test.step("Apaga a localizacao", async () => {
      await acceptNextDialog(page);
      await openRowAction(page, nomeAtualizado, /apagar/i);
      await expect(rowByText(page, nomeAtualizado)).toHaveCount(0);
    });
  });
});
