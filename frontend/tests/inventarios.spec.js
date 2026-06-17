import { expect, test } from "@playwright/test";

import {
  acceptNextDialog,
  createInventory,
  expectAlertText,
  loginAsAdmin,
  openRowAction,
  rowByText,
  uniqueValue,
} from "./helpers/app";

test.describe("Inventarios", () => {
  test("workflow CRUD de um inventario", async ({ page }) => {
    const nome = uniqueValue("PW-INV");
    const nomeAtualizado = `${nome}-OK`;

    await loginAsAdmin(page);
    await createInventory(page, { nome, descricao: "Inventario criado por Playwright" });

    await openRowAction(page, nome, /detalhes/i);
    let dialog = page.getByRole("dialog", { name: /detalhes do invent.rio/i });
    await expect(dialog).toContainText(nome);
    await expect(dialog).toContainText(/inventario criado por playwright/i);
    await dialog.getByRole("button", { name: /^fechar$/i }).last().click();

    await openRowAction(page, nome, /editar/i);
    dialog = page.getByRole("dialog", { name: /editar invent.rio/i });
    await dialog.getByLabel("Nome").fill(nomeAtualizado);
    await dialog.getByLabel(/descri/i).fill("Depois da edicao");
    await dialog.getByRole("button", { name: /guardar altera..es/i }).click();

    await expectAlertText(page, /inventario atualizado/i);
    await expect(rowByText(page, nomeAtualizado)).toBeVisible();

    await acceptNextDialog(page);
    await openRowAction(page, nomeAtualizado, /apagar/i);
    await expect(rowByText(page, nomeAtualizado)).toHaveCount(0);
  });
});
