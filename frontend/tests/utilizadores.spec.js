import { expect, test } from "@playwright/test";

import {
  acceptNextDialog,
  createUser,
  loginAsAdmin,
  openRowAction,
  rowByText,
  uniqueValue,
} from "./helpers/app";

test.describe("Utilizadores", () => {
  test("workflow CRUD de um utilizador", async ({ page }) => {
    const username = uniqueValue("pw.user");
    const nomeAtualizado = uniqueValue("Playwright Utilizador Editado");

    await loginAsAdmin(page);
    await createUser(page, {
      nome: "Playwright Utilizador",
      username,
      emailLocal: username,
      password: "Playwright123!",
    });
    await openRowAction(page, username, /editar/i);

    const dialog = page.getByRole("dialog", { name: /editar utilizador/i });
    await dialog.getByLabel(/nome completo/i).fill(nomeAtualizado);
    await dialog.getByLabel(/nova palavra-passe/i).fill("Playwright456!");
    await dialog.getByRole("button", { name: /guardar altera..es/i }).click();

    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(rowByText(page, username)).toBeVisible();
    await expect(rowByText(page, username)).toContainText(nomeAtualizado);

    await acceptNextDialog(page);
    await openRowAction(page, username, /apagar/i);

    await expect(rowByText(page, username)).toHaveCount(0);
  });
});
