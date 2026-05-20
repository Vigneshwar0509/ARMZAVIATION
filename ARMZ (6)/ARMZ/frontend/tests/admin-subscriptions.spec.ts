import { test, expect, request } from '@playwright/test';

const BACKEND = 'http://127.0.0.1:8000';
const FRONTEND = 'http://localhost:5500';

test('admin can view subscriptions page', async ({ page, request: apiRequest }) => {
  // Request OTP via backend API and verify to obtain tokens
  await apiRequest.post(`${BACKEND}/api/auth/admin/login`, { data: { email: 'admin+ci@example.com', password: 'AdminPass123!' } });
  const send = await apiRequest.post(`${BACKEND}/api/auth/send-otp`, { data: { email: 'admin+ci@example.com', type: 'email' } });
  const sendJson = await send.json();
  const otp = sendJson.otp;

  const verify = await apiRequest.post(`${BACKEND}/api/auth/verify-otp`, { data: { email: 'admin+ci@example.com', otp, type: 'email' } });
  const verifyJson = await verify.json();

  // Set auth cookies in the browser context
  const cookies = [];
  if (verifyJson.token) cookies.push({ name: 'access_token', value: verifyJson.token, domain: '127.0.0.1', path: '/' });
  if (verifyJson.refreshToken) cookies.push({ name: 'refresh_token', value: verifyJson.refreshToken, domain: '127.0.0.1', path: '/' });
  await page.context().addCookies(cookies);

  // Navigate to admin subscriptions UI
  await page.goto(`${FRONTEND}/admin/subscriptions`);
  await page.waitForLoadState('networkidle');

  // Basic assertions: page has heading or subscriptions table
  const heading = await page.locator('h1, h2').first();
  await expect(heading).toBeVisible();
});
