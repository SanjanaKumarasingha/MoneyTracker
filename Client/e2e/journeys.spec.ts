import { test, expect, Page, request as playwrightRequest } from '@playwright/test';

// Critical user journeys for the web client, driven through the real UI
// against the isolated e2e API (see playwright.config.ts). Locators use
// roles and visible labels - what a user (or screen reader) sees - rather
// than CSS classes, so styling changes don't break them.

const API = 'http://localhost:5001/api/v1';
const PASSWORD = 'Password123!';

// Unique per run, since the e2e database persists across tests in a run.
const uniqueName = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

type ApiUser = { id: number; username: string; token: string };

async function registerViaApi(): Promise<ApiUser> {
  const api = await playwrightRequest.newContext();
  const username = uniqueName('e2e');

  const created = await api.post(`${API}/users`, {
    data: { username, email: `${username}@example.com`, password: PASSWORD },
  });
  expect(created.status()).toBe(201);

  const login = await api.post(`${API}/auth/login`, {
    data: { username, password: PASSWORD },
  });
  expect(login.status()).toBe(201);

  const user = {
    id: (await created.json()).id,
    username,
    token: (await login.json()).access_token,
  };
  await api.dispose();
  return user;
}

async function createWalletViaApi(user: ApiUser, name: string) {
  const api = await playwrightRequest.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${user.token}` },
  });
  const res = await api.post(`${API}/wallets`, {
    data: { name, currency: 'LKR', userId: user.id },
  });
  expect(res.status()).toBe(201);
  await api.dispose();
}

async function logIn(page: Page, username: string) {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  // The header has its own Login/Register buttons - use the form's.
  await page.getByRole('main').getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

test('a signed-out visitor is sent to the login page', async ({ page }) => {
  await page.goto('/wallets');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('a new user can register and then log in', async ({ page }) => {
  const username = uniqueName('reg');

  await page.goto('/register');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Email').fill(`${username}@example.com`);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm Password').fill(PASSWORD);
  await page.getByRole('main').getByRole('button', { name: 'Register', exact: true }).click();
  await expect(page.getByText('User is created')).toBeVisible();

  await logIn(page, username);
  // A brand-new account has no wallets yet, so Home onboards them.
  await expect(page.getByText('Create your first wallet')).toBeVisible();
});

test('a user can create a wallet', async ({ page }) => {
  const user = await registerViaApi();
  const walletName = uniqueName('Wallet ');

  await logIn(page, user.username);
  await page.goto('/wallets');
  await page.getByRole('button', { name: 'New wallet' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name:').fill(walletName);
  await dialog.getByRole('combobox', { name: 'Currency' }).click();
  await dialog.getByPlaceholder('ISO Code of currency').fill('LKR');
  await dialog.getByRole('option', { name: 'LKR', exact: true }).click();
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();

  await expect(page.getByText(walletName).first()).toBeVisible();
});

test('a user can add an expense and see it on Home', async ({ page }) => {
  const user = await registerViaApi();
  await createWalletViaApi(user, 'Cash');

  await logIn(page, user.username);
  await page.getByRole('button', { name: 'Add record' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByText('Restaurant', { exact: true }).click();
  for (const key of ['1', '5', '0', '0']) {
    await dialog.getByRole('button', { name: key, exact: true }).click();
  }
  await dialog.getByLabel('Remarks:').fill('e2e team lunch');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText('e2e team lunch').first()).toBeVisible();
  await expect(page.getByText(/1,500\.00/).first()).toBeVisible();
});
