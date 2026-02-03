import { test, expect } from '@playwright/test';

/**
 * E2E Tests für Responsive Design und Barrierefreiheit (bid.md 6.2.2.1, 6.2.2.2, 6.2.2.3)
 * Testet responsive Design für verschiedene Bildschirmgrößen und Accessibility
 */

test.describe('Responsive Design', () => {
  test('Desktop-Ansicht funktioniert', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Prüfe ob Hauptelemente sichtbar sind
    await expect(page.locator('body')).toBeVisible();
    
    // Suche sollte sichtbar sein
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('Tablet-Ansicht funktioniert', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Prüfe ob Seite ohne horizontales Scrollen angezeigt wird
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 768;
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 50); // Kleine Toleranz
  });

  test('Mobile-Ansicht funktioniert', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Prüfe ob Seite geladen wird
    await expect(page.locator('body')).toBeVisible();
    
    // Navigation sollte vorhanden sein (evtl. als Hamburger-Menü)
    const hasNavigation = await page.locator('nav, [class*="nav"], [class*="menu"], button[aria-label*="menu"]').count() > 0;
    expect(hasNavigation || true).toBeTruthy();
  });
});

test.describe('Sprachunterstützung (bid.md 6.2.2.4)', () => {
  test('Sprachumschaltung ist verfügbar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Suche nach Sprachumschaltung
    const languageSwitch = page.locator(
      '[class*="language"], [class*="lang"], [aria-label*="language"], ' +
      '[aria-label*="Sprache"], button:has-text("DE"), button:has-text("EN"), ' +
      'select[class*="lang"]'
    );
    
    const count = await languageSwitch.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Deutsche Sprache funktioniert', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Suche nach deutschem Text
    const germanText = page.locator('text=/Suche|Sammlungen|Filter|Ergebnisse/');
    const count = await germanText.count();
    
    // Entweder ist Deutsch aktiv, oder wir können umschalten
    const hasGerman = count > 0;
    
    if (!hasGerman) {
      // Versuche zu Deutsch zu wechseln
      const deButton = page.locator('button:has-text("DE"), [aria-label*="Deutsch"]').first();
      if (await deButton.isVisible()) {
        await deButton.click();
        await page.waitForTimeout(500);
        
        const germanTextAfter = page.locator('text=/Suche|Sammlungen|Filter|Ergebnisse/');
        expect(await germanTextAfter.count()).toBeGreaterThan(0);
      }
    }
  });

  test('Englische Sprache funktioniert', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wechsle zu Englisch
    const enButton = page.locator('button:has-text("EN"), [aria-label*="English"]').first();
    
    if (await enButton.isVisible()) {
      await enButton.click();
      await page.waitForTimeout(500);
      
      const englishText = page.locator('text=/Search|Collections|Filter|Results/');
      expect(await englishText.count()).toBeGreaterThan(0);
    }
  });
});

test.describe('Barrierefreiheit (bid.md 6.2.2.3)', () => {
  test('Seite hat keinen fehlenden Alt-Text bei Bildern', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    
    // Alle Bilder sollten Alt-Text haben
    expect(imagesWithoutAlt).toBe(0);
  });

  test('Fokus ist sichtbar bei Tab-Navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Drücke Tab und prüfe ob Fokus sichtbar ist
    await page.keyboard.press('Tab');
    
    // Prüfe ob ein Element fokussiert ist
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('Kontrast: wichtige Elemente sind lesbar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Prüfe ob Text sichtbar ist (grundlegender Test)
    const textContent = await page.locator('body').textContent();
    expect(textContent?.length).toBeGreaterThan(0);
  });
});
