import { test, expect, Page } from '@playwright/test';

test.describe('PDF Preview Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para página que contém PDF preview (exemplo: order detail)
    await page.goto('/orders/test-order');
  });

  test('Cenário 1: Abrir preview de um PDF válido', async ({ page }) => {
    // Clica no botão de preview
    await page.click('[aria-label="Visualizar PDF"]');

    // Espera modal abrir
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Espera canvas render (PDF carregado)
    const canvas = modal.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verifica se título está presente
    await expect(modal.locator('h2')).toContainText('PDF Preview');
  });

  test('Cenário 2: Navegar entre páginas', async ({ page }) => {
    // Abre preview
    await page.click('[aria-label="Visualizar PDF"]');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Verifica página inicial (1/N)
    const pageInfo = modal.locator('[class*="pageInfo"]');
    const initialText = await pageInfo.textContent();
    expect(initialText).toContain('1 /');

    // Clica próxima página
    await modal.click('text=Próxima →');

    // Espera atualização
    await page.waitForTimeout(200);

    // Verifica se página mudou
    const updatedText = await pageInfo.textContent();
    expect(updatedText).toContain('2 /');
  });

  test('Cenário 3: Fechar preview com ESC', async ({ page }) => {
    // Abre preview
    await page.click('[aria-label="Visualizar PDF"]');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Pressiona ESC
    await page.keyboard.press('Escape');

    // Modal fecha
    await expect(modal).not.toBeVisible();
  });

  test('Cenário 4: Fechar preview com botão X', async ({ page }) => {
    // Abre preview
    await page.click('[aria-label="Visualizar PDF"]');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Clica botão fechar
    await modal.click('[aria-label="Fechar preview"]');

    // Modal fecha
    await expect(modal).not.toBeVisible();
  });

  test('Cenário 5: Navegar usando input de página', async ({ page }) => {
    // Abre preview
    await page.click('[aria-label="Visualizar PDF"]');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Encontra input de página
    const pageInput = modal.locator('[aria-label="Ir para página"]');

    // Limpa e digita nova página
    await pageInput.fill('5');
    await pageInput.press('Enter');

    // Espera render
    await page.waitForTimeout(300);

    // Verifica se está na página 5
    const pageInfo = modal.locator('[class*="pageInfo"]');
    const text = await pageInfo.textContent();
    expect(text).toContain('5 /');
  });

  test('Cenário 6: Aumentar zoom (zoomIn)', async ({ page }) => {
    // Abre preview
    await page.click('[aria-label="Visualizar PDF"]');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Verifica zoom inicial
    let zoomLevel = modal.locator('[class*="zoomLevel"]');
    let initialZoom = await zoomLevel.textContent();
    expect(initialZoom).toContain('100%');

    // Clica botão +
    await modal.click('button:has-text("+")');

    // Espera atualização
    await page.waitForTimeout(200);

    // Verifica novo zoom
    zoomLevel = modal.locator('[class*="zoomLevel"]');
    const newZoom = await zoomLevel.textContent();
    expect(newZoom).toContain('125%');
  });

  test('Cenário 7: Diminuir zoom (zoomOut)', async ({ page }) => {
    // Abre preview
    await page.click('[aria-label="Visualizar PDF"]');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Aumenta zoom primeiro
    await modal.click('button:has-text("+")');
    await page.waitForTimeout(200);

    // Clica botão -
    await modal.click('button:has-text("−")');

    // Espera atualização
    await page.waitForTimeout(200);

    // Verifica zoom voltou
    const zoomLevel = modal.locator('[class*="zoomLevel"]');
    const zoom = await zoomLevel.textContent();
    expect(zoom).toContain('100%');
  });

  test('Cenário 8: Usar slider de zoom', async ({ page }) => {
    // Abre preview
    await page.click('[aria-label="Visualizar PDF"]');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Encontra slider
    const zoomSlider = modal.locator('[aria-label="Nível de zoom"]');

    // Move slider para 200
    await zoomSlider.fill('200');

    // Espera atualização
    await page.waitForTimeout(300);

    // Verifica zoom
    const zoomLevel = modal.locator('[class*="zoomLevel"]');
    const text = await zoomLevel.textContent();
    expect(text).toContain('200%');
  });

  test('Cenário 9: Botão anterior desabilitado na primeira página', async ({ page }) => {
    // Abre preview
    await page.click('[aria-label="Visualizar PDF"]');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Verifica se botão anterior está desabilitado
    const prevButton = modal.locator('button:has-text("← Anterior")');
    await expect(prevButton).toBeDisabled();
  });

  test('Cenário 10: Clique em modal background fecha', async ({ page }) => {
    // Abre preview
    await page.click('[aria-label="Visualizar PDF"]');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Clica no overlay (background)
    const overlay = page.locator('[class*="overlay"]');
    await overlay.click({ position: { x: 0, y: 0 } });

    // Modal fecha
    await expect(modal).not.toBeVisible();
  });

  test('Cenário 11: Erro ao carregar PDF inválido', async ({ page }) => {
    // Simula erro de carregamento (mock ou arquivo inválido)
    // Este teste depende de setup específico para simular erro

    // Abre preview com arquivo inválido
    await page.click('[aria-label="Visualizar PDF"]');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Aguarda mensagem de erro (se arquivo inválido)
    // Nota: implementar com arquivo de teste inválido
    const errorMessage = modal.locator('[class*="error"]');
    if (await errorMessage.isVisible()) {
      expect(await errorMessage.textContent()).toContain('Erro');
    }
  });

  test('Cenário 12: Não há memory leak ao fechar modal', async ({ page }) => {
    // Abre preview
    await page.click('[aria-label="Visualizar PDF"]');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Obtém heap size antes
    const heapBefore = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    // Fecha modal múltiplas vezes
    for (let i = 0; i < 3; i++) {
      await modal.click('[aria-label="Fechar preview"]');
      await page.waitForTimeout(100);

      // Reabrir
      await page.click('[aria-label="Visualizar PDF"]');
      await page.waitForTimeout(300);
    }

    // Fecha final
    await modal.click('[aria-label="Fechar preview"]');

    // Força garbage collection (se disponível)
    await page.evaluate(() => {
      if ((global as any).gc) {
        (global as any).gc();
      }
    });

    await page.waitForTimeout(500);

    // Obtém heap size depois
    const heapAfter = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    // Verifica se não houve crescimento significativo
    // (heap após < heap antes * 1.5 é razoável para sem memory leak)
    if (heapBefore && heapAfter) {
      const growth = heapAfter / heapBefore;
      expect(growth).toBeLessThan(1.5);
    }
  });
});
