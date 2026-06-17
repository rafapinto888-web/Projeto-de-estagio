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

    await loginAsAdmin(page);
    await createLocation(page, { nome, descricao: "Localizacao criada por Playwright" });
    await openRowAction(page, nome, /editar/i);

    const dialog = page.getByRole("dialog", { name: /editar localiza..o/i });
    await dialog.getByLabel("Nome").fill(nomeAtualizado);
    await dialog.getByLabel(/descri/i).fill("Depois da edicao");
    await dialog.getByRole("button", { name: /guardar altera..es/i }).click();

    await expect(rowByText(page, nomeAtualizado)).toBeVisible();
    await expect(rowByText(page, nomeAtualizado)).toContainText("Depois da edicao");

    await acceptNextDialog(page);
    await openRowAction(page, nomeAtualizado, /apagar/i);
    await expect(rowByText(page, nomeAtualizado)).toHaveCount(0);
  });
});
