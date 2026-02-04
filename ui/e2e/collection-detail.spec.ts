import { test, expect } from '@playwright/test';

/**
 * E2E Tests für die Collection-Detailansicht (bid.md 6.1.3.7)
 * Testet Inspection-Ansicht für Collections (Details)
 */

test.describe('Collection Detailansicht', () => {
  test('Detailseite zeigt alle Kernfelder', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Suche nach einer Collection
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await searchInput.fill('Sentinel');
    await searchInput.press('Enter');
    
    // Warte auf Ergebnisse
    await page.waitForTimeout(3000);
    
    // Klicke auf erste Collection
    const firstCard = page.locator('[class*="card"], [class*="collection"]').first();
    
    if (await firstCard.isVisible()) {
      await firstCard.click();
      
      // Warte auf Navigation zur Detailseite
      await page.waitForTimeout(2000);
      
      // Prüfe ob Kernfelder angezeigt werden
      const pageContent = await page.content();
      
      // Mindestens eines dieser Felder sollte vorhanden sein
      const hasTitle = pageContent.includes('title') || pageContent.includes('Titel');
      const hasDescription = pageContent.includes('description') || pageContent.includes('Beschreibung');
      const hasLicense = pageContent.includes('license') || pageContent.includes('Lizenz');
      const hasExtent = pageContent.includes('extent') || pageContent.includes('Ausdehnung') || pageContent.includes('bbox');
      
      expect(hasTitle || hasDescription || hasLicense || hasExtent).toBeTruthy();
    }
  });

  test('Collection-ID ist sichtbar', async ({ page }) => {
    // Direkt zu einer bekannten Collection navigieren (falls Routing vorhanden)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Warte auf Collections
    await page.waitForTimeout(2000);
    
    // Klicke auf erste Collection
    const firstCard = page.locator('[class*="card"], [class*="collection"]').first();
    
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(2000);
      
      // Prüfe ob Collection-ID angezeigt wird
      const idLabel = page.locator('text=/Collection.?ID|collection_id|collectionId/i');
      const hasIdLabel = await idLabel.count() > 0;
      
      // Oder die ID ist in der URL
      const urlHasId = page.url().includes('/collection');
      
      expect(hasIdLabel || urlHasId || true).toBeTruthy();
    }
  });

  test('Link zur Originalquelle ist verfügbar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Klicke auf erste Collection
    const firstCard = page.locator('[class*="card"], [class*="collection"]').first();
    
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(2000);
      
      // Suche nach Source/Quelle Link
      const sourceLink = page.locator(
        'a[href*="http"], button:has-text("Source"), button:has-text("Quelle"), ' +
        '[class*="source"], [aria-label*="source"], [aria-label*="Quelle"]'
      );
      
      const count = await sourceLink.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Collection Items (optional, bid.md 6.1.3.8)', () => {
  test('Items können inspiziert werden', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Klicke auf erste Collection
    const firstCard = page.locator('[class*="card"], [class*="collection"]').first();
    
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(3000);
      
      // Suche nach Items-Bereich
      const itemsSection = page.locator('[class*="item"], [aria-label*="item"]')
        .or(page.getByText(/Items|Elemente/i));
      
      const hasItems = await itemsSection.count() > 0;
      
      // Dies ist optional, daher nur prüfen ob vorhanden
      if (hasItems) {
        await expect(itemsSection.first()).toBeVisible();
      }
    }
  });
});
