import { expect } from "@playwright/test";

export function uniqueValue(prefix) {
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${rand}`;
}

export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function loginAsAdmin(page) {
  await page.goto("/");
  const logoutButton = page.getByRole("button", { name: /sair/i });
  const dashboardHeading = page.getByRole("heading", { name: /^dashboard$/i });
  const loginHeading = page.getByRole("heading", { name: /invent.rio it/i });

  const jaAutenticado = await logoutButton
    .waitFor({ state: "visible", timeout: 2500 })
    .then(() => true)
    .catch(() => false);

  if (jaAutenticado) {
    await expect(dashboardHeading).toBeVisible({ timeout: 10000 });
    return;
  }

  await expect(loginHeading).toBeVisible({ timeout: 10000 });
  await page.getByPlaceholder("Utilizador ou email").fill(
    process.env.PLAYWRIGHT_LOGIN || "admin",
  );
  await page.getByPlaceholder("Palavra-passe").fill(
    process.env.PLAYWRIGHT_PASSWORD || "inventario123",
  );
  await page.getByRole("button", { name: /^entrar$/i }).click();
  await expect(page.getByRole("button", { name: /sair/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^dashboard$/i })).toBeVisible();
}

export async function logout(page) {
  await page.getByRole("button", { name: /sair/i }).click();
  await expect(page.getByRole("heading", { name: /invent.rio it/i })).toBeVisible();
}

export async function gotoSection(page, hash, headingPattern) {
  await page.goto(`/#${hash}`);
  await expect(page.getByRole("heading", { name: headingPattern, level: 1 })).toBeVisible();
}

export async function expectAlertText(page, pattern) {
  await expect(page.getByRole("alert")).toContainText(pattern);
}

export async function acceptNextDialog(page) {
  page.once("dialog", (dialog) => dialog.accept());
}

export function rowByText(page, text) {
  return page.getByRole("row").filter({ hasText: text }).first();
}

export async function openMuiSelectAndChoose(page, scope, label, optionPattern) {
  await scope.getByLabel(label).click();
  await page.getByRole("option", { name: optionPattern }).click();
}

export async function chooseFirstRealOption(page, scope, label, skipPattern = /escolhe/i) {
  await scope.getByLabel(label).click();
  const options = page.getByRole("option");
  const count = await options.count();
  for (let i = 0; i < count; i += 1) {
    const option = options.nth(i);
    const text = (await option.innerText()).trim();
    if (!text || skipPattern.test(text)) continue;
    await option.click();
    return text;
  }
  throw new Error(`Nao foi encontrada uma opcao valida para o campo "${label}"`);
}

export async function openRowAction(page, rowText, actionName) {
  const row = rowByText(page, rowText);
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: actionName }).click();
}

export async function deleteRowAndConfirm(page, rowText, actionName = /apagar/i) {
  await acceptNextDialog(page);
  await openRowAction(page, rowText, actionName);
}

export async function createInventory(page, data) {
  const {
    nome,
    descricao = "",
    tipo = "normal",
    rede = "",
  } = data;

  await gotoSection(page, "inventarios", /invent/i);
  await page.getByRole("button", { name: /novo invent.rio/i }).click();
  const dialog = page.getByRole("dialog", { name: /novo invent.rio/i });
  await dialog.getByLabel("Nome").fill(nome);
  if (tipo === "sub_rede") {
    await openMuiSelectAndChoose(page, dialog, "Tipo", /rede \(sub-rede\)/i);
    await dialog.getByLabel("IP da rede").fill(rede);
  }
  if (descricao) {
    await dialog.getByLabel(/descri/i).fill(descricao);
  }
  await dialog.getByRole("button", { name: /criar invent.rio/i }).click();
  await expect(rowByText(page, nome)).toBeVisible({ timeout: 15000 });
}

export async function createLocation(page, data) {
  const { nome, descricao = "" } = data;

  await gotoSection(page, "localizacoes", /^localiza..es$/i);
  await page.getByRole("button", { name: /nova localiza..o/i }).click();
  const dialog = page.getByRole("dialog", { name: /nova localiza..o/i });
  await dialog.getByLabel("Nome").fill(nome);
  if (descricao) {
    await dialog.getByLabel(/descri/i).fill(descricao);
  }
  await dialog.getByRole("button", { name: /criar localiza..o/i }).click();
  await expect(rowByText(page, nome)).toBeVisible({ timeout: 20000 });
}

export async function createUser(page, data) {
  const {
    nome,
    username,
    emailLocal,
    password,
  } = data;

  await gotoSection(page, "utilizadores", /^utilizadores$/i);
  await page.getByRole("button", { name: /novo utilizador/i }).click();
  const dialog = page.getByRole("dialog", { name: /novo utilizador/i });
  await dialog.getByLabel(/nome completo/i).fill(nome);
  await dialog.getByLabel(/utilizador \(login\)/i).fill(username);
  await dialog.getByLabel(/email institucional/i).fill(emailLocal);
  await chooseFirstRealOption(page, dialog, "Perfil");
  await dialog.getByLabel(/palavra-passe inicial/i).fill(password);
  await dialog.getByRole("button", { name: /continuar/i }).click();
  await expect(page.getByRole("dialog", { name: /confirmar dados/i })).toBeVisible();
  await page.getByRole("button", { name: /sim, criar/i }).click();
  await expect(rowByText(page, username)).toBeVisible();
}

export async function createComputer(page, data) {
  const {
    nome,
    estado = "ativo",
    marca = "Playwright",
    modelo = "Teste",
    numeroSerie,
    hostname = "",
    enderecoIp = "",
    macAddress = "",
    sistemaOperativo = "",
    inventarioNome,
  } = data;

  await gotoSection(page, "computadores", /^computadores$/i);
  await page.getByRole("button", { name: /novo computador/i }).click();
  const dialog = page.getByRole("dialog", { name: /novo computador/i });
  await dialog.getByLabel("Nome").fill(nome);
  await dialog.getByLabel("Estado").fill(estado);
  await dialog.getByLabel("Marca").fill(marca);
  await dialog.getByLabel("Modelo").fill(modelo);
  await dialog.getByLabel(/n.mero de s.rie/i).fill(numeroSerie);
  if (hostname) await dialog.getByLabel(/hostname/i).fill(hostname);
  if (enderecoIp) await dialog.getByLabel(/endere.o ip/i).fill(enderecoIp);
  if (macAddress) await dialog.getByLabel("MAC").fill(macAddress);
  if (sistemaOperativo) {
    await dialog.getByLabel(/sistema operativo/i).fill(sistemaOperativo);
  }
  await openMuiSelectAndChoose(page, dialog, "Inventário", new RegExp(escapeRegex(inventarioNome), "i"));
  await dialog.getByRole("button", { name: /criar computador/i }).click();
  await expect(page.getByText(hostname || numeroSerie, { exact: true }).first()).toBeVisible({
    timeout: 10000,
  });
}

export async function cleanupInventory(page, nome) {
  await gotoSection(page, "inventarios", /invent/i);
  if ((await rowByText(page, nome).count()) === 0) return;
  await deleteRowAndConfirm(page, nome);
  await expect(rowByText(page, nome)).toHaveCount(0);
}

export async function cleanupLocation(page, nome) {
  await gotoSection(page, "localizacoes", /^localiza..es$/i);
  if ((await rowByText(page, nome).count()) === 0) return;
  await deleteRowAndConfirm(page, nome);
  await expect(rowByText(page, nome)).toHaveCount(0);
}

export async function cleanupUser(page, username) {
  await gotoSection(page, "utilizadores", /^utilizadores$/i);
  if ((await rowByText(page, username).count()) === 0) return;
  await deleteRowAndConfirm(page, username);
  await expect(rowByText(page, username)).toHaveCount(0);
}

export async function cleanupComputer(page, hostnameOrSerie) {
  await gotoSection(page, "computadores", /^computadores$/i);
  if ((await rowByText(page, hostnameOrSerie).count()) === 0) return;
  await deleteRowAndConfirm(page, hostnameOrSerie);
  await expect(rowByText(page, hostnameOrSerie)).toHaveCount(0);
}
