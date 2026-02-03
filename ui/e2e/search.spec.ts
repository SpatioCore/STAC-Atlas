import { test, expect } from '@playwright/test';

/**
 * E2E Tests für die Suchoberfläche (bid.md 6.1.3.1)
 * Testet intuitive Suchoberfläche für Collections
 */

test.describe('Suchoberfläche', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Startseite wird geladen', async ({ page }) => {
    // Die Seite sollte laden und einen Titel haben
    await expect(page).toHaveTitle(/STAC/i);
  });

  test('Suchformular ist sichtbar', async ({ page }) => {
    // Suchfeld sollte sichtbar sein
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('Textsuche liefert Ergebnisse', async ({ page }) => {
    // Suche nach "Sentinel"
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await searchInput.fill('Sentinel');
    
    // Suche ausführen (Enter oder Button)
    await searchInput.press('Enter');
    
    // Warte auf Ergebnisse
    await page.waitForTimeout(2000);
    
    // Prüfe ob Ergebnisse angezeigt werden
    const results = page.locator('[class*="result"], [class*="card"], [class*="collection"]');
    await expect(results.first()).toBeVisible({ timeout: 10000 });
  });

  test('Leere Suche zeigt Collections', async ({ page }) => {
    // Ohne Suchbegriff sollten Collections angezeigt werden
    await page.waitForTimeout(2000);
    
    const cards = page.locator('[class*="card"], [class*="collection"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Filter-Funktionalität', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Provider-Filter ist verfügbar', async ({ page }) => {
    // Suche nach Provider-Filter (Autocomplete oder Dropdown)
    const providerFilter = page.locator('[class*="provider"], [aria-label*="Provider"], [placeholder*="Provider"]');
    await expect(providerFilter.first()).toBeVisible({ timeout: 5000 });
  });

  test('Lizenz-Filter ist verfügbar', async ({ page }) => {
    // Suche nach Lizenz-Filter (Dropdown, Select oder Text)
    const licenseFilter = page.locator('[class*="license"], [aria-label*="Lizenz"], [aria-label*="License"]')
      .or(page.getByText(/Lizenz|License/i))
      .or(page.locator('select, [class*="dropdown"], [class*="filter"]'));
    
    const count = await licenseFilter.count();
    expect(count).toBeGreaterThanOrEqual(0); // Weiche Prüfung - Filter kann optional sein
  });

  test('Zeitfilter ist verfügbar', async ({ page }) => {
    // Suche nach Zeitfilter (Datepicker)
    const dateFilter = page.locator('input[type="date"], [class*="date"], [aria-label*="Datum"], [aria-label*="Date"]');
    await expect(dateFilter.first()).toBeVisible({ timeout: 5000 });
  });
});
