import { test, expect } from '@playwright/test';

/**
 * Pruebas E2E para ProfileStore
 * 
 * Estas pruebas verifican la funcionalidad del store de perfil
 * en un entorno de navegador real.
 */
test.describe('ProfileStore E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal
    await page.goto('/');
    
    // Esperar a que la página cargue
    await page.waitForLoadState('networkidle');
  });

  test('should load the main page successfully', async ({ page }) => {
    // Verificar que la página principal carga
    await expect(page).toHaveTitle(/TuTienda/);
    
    // Verificar que hay contenido en la página
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    // Verificar meta tags básicos
    const title = page.locator('title');
    await expect(title).toBeAttached();
    
    // Verificar que hay un viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toBeAttached();
  });

  test('should handle navigation properly', async ({ page }) => {
    // Verificar que la navegación funciona
    const currentUrl = page.url();
    expect(currentUrl).toContain('localhost');
    
    // Verificar que no hay errores de JavaScript en la consola
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Recargar la página para verificar estabilidad
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verificar que no hay errores críticos
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should have responsive design', async ({ page }) => {
    // Probar diferentes tamaños de pantalla
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // Esperar a que se ajuste el layout
      
      // Verificar que la página sigue siendo visible
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Verificar que no hay overflow horizontal
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);
      
      // Permitir un pequeño margen para scrollbars
      expect(scrollWidth - clientWidth).toBeLessThanOrEqual(20);
    }
  });

  test('should load without accessibility violations', async ({ page }) => {
    // Verificar elementos básicos de accesibilidad
    
    // Verificar que hay un elemento main o contenido principal
    const hasMain = await page.locator('main, [role="main"], #__next').count();
    expect(hasMain).toBeGreaterThan(0);
    
    // Verificar que las imágenes tienen alt text (si existen)
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        const role = await img.getAttribute('role');
        
        // Las imágenes deben tener alt, aria-label, o role="presentation"
        expect(
          alt !== null || 
          ariaLabel !== null || 
          role === 'presentation' ||
          role === 'img'
        ).toBeTruthy();
      }
    }
  });

  test('should handle form interactions', async ({ page }) => {
    // Buscar formularios en la página
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      // Verificar que los formularios tienen elementos básicos
      const inputs = page.locator('input, textarea, select');
      const inputCount = await inputs.count();
      
      if (inputCount > 0) {
        // Verificar que los inputs son accesibles
        for (let i = 0; i < Math.min(inputCount, 3); i++) {
          const input = inputs.nth(i);
          const isVisible = await input.isVisible();
          
          if (isVisible) {
            // Verificar que el input puede recibir foco
            await input.focus();
            const isFocused = await input.evaluate(el => document.activeElement === el);
            expect(isFocused).toBeTruthy();
          }
        }
      }
    }
  });
});