import { expect, test } from "@playwright/test";

import {
  acceptNextDialog,
  createComputer,
  createInventory,
  loginAsAdmin,
  openRowAction,
  rowByText,
  uniqueValue,
} from "./helpers/app";

test.describe("Computadores", () => {
  test("workflow CRUD de um computador", async ({ page }) => {
    const inventarioNome = uniqueValue("PW-INV-PC");
    const hostname = uniqueValue("PW-HOST");
    const hostnameNovo = `${hostname}-novo`;
    const numeroSerie = uniqueValue("PW-SN");

    await loginAsAdmin(page);
    await createInventory(page, { nome: inventarioNome, descricao: "Base para computador" });
    await createComputer(page, {
      nome: "Playwright Desktop",
      hostname,
      numeroSerie,
      enderecoIp: "10.10.10.10",
      inventarioNome,
      sistemaOperativo: "Windows 11 Pro",
    });

    await openRowAction(page, hostname, /editar/i);
    const dialog = page.getByRole("dialog", { name: /editar computador/i });
    await dialog.getByLabel(/hostname/i).fill(hostnameNovo);
    await dialog.getByLabel("Estado").fill("manutencao");
    await dialog.getByRole("button", { name: /guardar apenas altera..es/i }).click();

    await expect(rowByText(page, hostnameNovo)).toBeVisible();
    await expect(rowByText(page, hostnameNovo)).toContainText("manutencao");

    await acceptNextDialog(page);
    await openRowAction(page, hostnameNovo, /apagar/i);

    await expect(rowByText(page, hostnameNovo)).toHaveCount(0);
  });
});
