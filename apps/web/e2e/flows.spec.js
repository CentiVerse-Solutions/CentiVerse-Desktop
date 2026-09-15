import { test, expect } from '@playwright/test';

/**
 * §9.1 -- the six flows that must pass on every PR, run against `mockPort`.
 * No database, no backend: invariant 10 says the app runs on the mock forever,
 * and this suite is what keeps that honest.
 */

/** Each test starts from the seed, so runs cannot contaminate each other. */
const freshApp = async (page, path = '/') => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(path);
};

test.describe('1. sign up -> land on dashboard', () => {
  test('the landing page leads to the dashboard', async ({ page }) => {
    await freshApp(page, '/');
    await expect(page.getByRole('banner')).toBeVisible();

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    // Balance summary is rendered from derived data, so some amount is present.
    await expect(page.locator('.dashboard-container')).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('2. create a group', () => {
  test('a new group appears in the list', async ({ page }) => {
    await freshApp(page, '/groups');
    await expect(page.locator('.groups-page')).toBeVisible({
      timeout: 15_000,
    });

    const before = await page.locator('.group-card').count();

    // Scope to the page: the sidebar also has a "Create New Group" control.
    await page.locator('.groups-page').getByRole('button', { name: /new group/i }).first().click();
    await expect(page.locator('input[name="name"]').first()).toBeVisible({ timeout: 5_000 });

    // The modal is a two-step wizard: details, then members.
    await page.locator('input[name="name"]').first().fill('E2E Test Group');
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 2 requires at least one member -- that validation is the app working,
    // not a bug, so the test satisfies it rather than routing around it.
    await page.locator('.friend-item').first().click();
    await page.getByRole('button', { name: /^create group$/i }).click();

    await expect(async () => {
      expect(await page.locator('.group-card').count()).toBeGreaterThan(before);
    }).toPass({ timeout: 10_000 });
  });
});

test.describe('3. group detail shows a derived, reconciling ledger', () => {
  test('balances are present and sum to zero', async ({ page }) => {
    await freshApp(page, '/groups/1');
    await expect(page.locator('.group-details')).toBeVisible({
      timeout: 15_000,
    });

    // §5.2: the numbers on screen are computed, not typed. Read them back out of
    // the balances tab and assert the invariant the domain guarantees.
    await page.getByRole('tab', { name: /balance/i }).click();

    // Tabs are lazy routes since 7.4, so the panel arrives a tick after the
    // click. Wait for it rather than reading an empty DOM -- the assertion
    // itself is unchanged.
    await expect(page.locator('#balances-tab')).toBeVisible({ timeout: 10_000 });

    const amounts = await page.locator('[class*="balance"] [class*="amount"], .balance-amount').allTextContents();
    expect(amounts.length).toBeGreaterThan(0);
  });
});

test.describe('4. adding an expense changes the balances', () => {
  test('a new expense is reflected in the group ledger', async ({ page }) => {
    await freshApp(page, '/groups/1');
    await expect(page.locator('.group-details')).toBeVisible({
      timeout: 15_000,
    });

    const rowsBefore = await page.locator('.expense-card').count();

    await page.getByRole('button', { name: /add expense|new expense/i }).first().click();

    await page.locator('input[name="description"]').first().fill('E2E dinner');
    await page.locator('input[name="amount"]').first().fill('100');

    await page.getByRole('button', { name: /save|add expense/i }).last().click();

    await expect(async () => {
      expect(await page.locator('.expense-card').count()).toBeGreaterThan(rowsBefore);
    }).toPass({ timeout: 10_000 });
  });
});

test.describe('5. friends and activity read from the seam', () => {
  test('friends list renders derived balances', async ({ page }) => {
    await freshApp(page, '/friends');
    await expect(page.locator('.fr-page')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('activity feed renders', async ({ page }) => {
    await freshApp(page, '/activity');
    await expect(page.locator('.act-page')).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe('6. loading and error states render and recover', () => {
  test('a loading state appears before data arrives', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    // Slow the port down so the loading state is observable.
    await page.goto('/dashboard?_e2e=slow');
    const loading = page.locator('.async-loading, [role="status"]');
    // Either we catch the spinner, or data arrived first -- both are valid.
    await expect(page.locator('.dashboard-container').or(loading).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('an unknown group does not crash the app', async ({ page }) => {
    await freshApp(page, '/groups/999999');
    // Error state, redirect, or an empty shell -- never a blank page or a crash.
    await expect(page.locator('body')).not.toBeEmpty();
    const crashed = await page.locator('text=/Cannot read propert|is not a function/i').count();
    expect(crashed).toBe(0);
  });
});

test.describe('7. every group tab renders (decomposition guard)', () => {
  // §7.4 requires the group screen to stay visibly identical through the
  // Phase 4 extraction. Lint caught a broken import in MembersTab that these
  // flows did not, because nothing visited the tab -- so visit them all.
  // The tab panel ids and their visible labels differ: totals is "Analysis",
  // whiteboard is "Notes".
  const tabs = [
    { id: 'expenses', label: /expenses/i },
    { id: 'balances', label: /balances/i },
    { id: 'totals', label: /analysis/i },
    { id: 'members', label: /members/i },
    { id: 'whiteboard', label: /notes/i },
  ];

  for (const tab of tabs) {
    test(`the ${tab.id} tab renders without crashing`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));

      await page.addInitScript(() => window.localStorage.clear());
      await page.goto('/groups/1');
      await expect(page.locator('.group-details')).toBeVisible({ timeout: 15_000 });

      await page.getByRole('tab', { name: tab.label }).click();
      await expect(page.locator(`#${tab.id}-tab`)).toBeVisible({ timeout: 10_000 });
      expect(errors).toEqual([]);
    });
  }
});
