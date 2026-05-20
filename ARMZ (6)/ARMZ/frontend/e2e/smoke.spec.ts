import { expect, test, type Page } from '@playwright/test';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const routeLike = (basePath: string) =>
  new RegExp(`^(?:https?:\\/\\/[^/]+)?${escapeRegex(basePath)}(?:/.*)?(?:\\?.*)?(?:#.*)?$`);
const routeLikeAny = (...basePaths: string[]) =>
  new RegExp(
    `^(?:https?:\\/\\/[^/]+)?(?:${basePaths
      .map((path) => `${escapeRegex(path)}(?:/.*)?`)
      .join('|')})(?:\\?.*)?(?:#.*)?$`
  );

type Role = 'student' | 'employer' | 'admin';

const buildUser = (role: Role) => {
  const common = {
    id: `${role}-1`,
    name: `${role[0].toUpperCase()}${role.slice(1)} Tester`,
    email: `${role}@example.com`,
    isVerified: true,
    profileComplete: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    subscription: role === 'student' ? 'premium' : 'placement',
  };

  if (role === 'admin') {
    return {
      ...common,
      role: 'admin' as const,
      isPrime: true,
    };
  }

  return {
    ...common,
    role,
    isPrime: false,
  };
};

const mockAuthenticatedApi = async (page: Page, role: Role) => {
  const user = buildUser(role);

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.startsWith('/api') ? url.pathname.slice(4) : url.pathname;
    const method = route.request().method();

    if (path.endsWith('/auth/profile') && method === 'GET') {
      await route.fulfill({ json: { user } });
      return;
    }

    if (path.endsWith('/dashboard/stats') && method === 'GET') {
      await route.fulfill({
        json: {
          data: {
            totalJobs: 4,
            totalApplications: 2,
            totalHires: 1,
            activeUsers: 12,
            activeStudents: 6,
            revenue: '0',
            jobTrends: [],
            userActivity: [],
          },
        },
      });
      return;
    }

    if (path.endsWith('/applications') && method === 'GET') {
      await route.fulfill({ json: { data: [] } });
      return;
    }

    if (path.endsWith('/jobs') && method === 'GET') {
      await route.fulfill({
        json: {
          data: [
            {
              id: 'job-1',
              title: 'Cabin Crew',
              company_name: 'ARMZ Aviation',
              location: 'Mumbai',
              description: 'Sample role',
              salary: '50000',
              experience: '1 year',
              category: 'Aviation',
              type: 'Full-time',
              posted_at: '2026-01-01T00:00:00Z',
              logo: '',
              requirements: [],
              responsibilities: [],
              status: 'Active',
              applications: 0,
              views: 0,
            },
          ],
        },
      });
      return;
    }

    if (path.includes('/saved-jobs') && method === 'GET') {
      await route.fulfill({ json: { data: [] } });
      return;
    }

    if (path.endsWith('/users') && method === 'GET') {
      await route.fulfill({
        json: {
          data: [
            {
              id: 'student-1',
              first_name: 'Student',
              last_name: 'Tester',
              email: 'student@example.com',
            },
          ],
        },
      });
      return;
    }

    if (path.endsWith('/leads') && method === 'GET') {
      await route.fulfill({ json: { data: [] } });
      return;
    }

    await route.fulfill({ json: { data: [] } });
  });
};

const seedSession = async (page: Page, role: Role) => {
  const user = buildUser(role);

  await mockAuthenticatedApi(page, role);
  await page.addInitScript((seedUser) => {
    const persistedAuthState = JSON.stringify({
      state: {
        user: seedUser,
        isAuthenticated: true,
      },
      version: 0,
    });

    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.setItem('auth-storage', persistedAuthState);
    sessionStorage.setItem('auth-storage', persistedAuthState);
  }, user);
};

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test.describe('public smoke checks', () => {
  test('login screen shows current role actions', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('button', { name: /Login as Candidate/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Login as Employer/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Register Now/i })).toBeVisible();
  });

  test('register defaults to student fields', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByPlaceholder('John Doe')).toBeVisible();
    await expect(page.getByPlaceholder('john@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. Emirates')).toHaveCount(0);
  });

  test('register employer toggle reveals company fields', async ({ page }) => {
    await page.goto('/register');

    await page.getByRole('button', { name: /^Employer$/i }).click();
    await expect(page.getByPlaceholder('e.g. Emirates')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. Sarah Smith')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. HR contact number')).toBeVisible();
  });

  test('student protected route redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(routeLike('/login'));
  });

  test('admin protected route redirects to admin login when unauthenticated', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(routeLike('/admin-login'));
    await expect(page.getByRole('button', { name: /Authorize Access/i })).toBeVisible();
  });

  test('seeded student session reaches protected dashboards', async ({ page }) => {
    await seedSession(page, 'student');
    await page.goto('/dashboard');
    await expect(page).toHaveURL(routeLike('/dashboard'));

    await page.goto('/employer');
    await expect(page).toHaveURL(routeLikeAny('/dashboard', '/employer'));
  });

  test('seeded employer session reaches protected dashboards', async ({ page }) => {
    await seedSession(page, 'employer');
    await page.goto('/employer');
    await expect(page).toHaveURL(routeLike('/employer'));

    await page.goto('/dashboard');
    await expect(page).toHaveURL(routeLikeAny('/dashboard', '/employer'));
  });

  test('seeded admin session reaches admin dashboard', async ({ page }) => {
    await seedSession(page, 'admin');
    await page.goto('/admin');
    await expect(page).toHaveURL(routeLike('/admin'));
  });

  test('admin access policy allows student and employer protected areas', async ({ page }) => {
    await seedSession(page, 'admin');

    await page.goto('/dashboard');
    await expect(page).toHaveURL(routeLike('/dashboard'));

    await page.goto('/employer');
    await expect(page).toHaveURL(routeLike('/employer'));
  });
});
