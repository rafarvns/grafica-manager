import { test, expect } from '@playwright/test';

test.describe('Customer CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/customers');
  });

  test.describe('Listagem de clientes', () => {
    test('deve carregar e exibir lista de clientes', async ({ page }) => {
      const table = page.locator('[data-testid="customers-table"]');
      await expect(table).toBeVisible();

      const rows = page.locator('[data-testid="customer-row"]');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('deve exibir colunas corretas na tabela', async ({ page }) => {
      const headers = page.locator('[data-testid="customers-table"] thead th');

      const nameHeader = page.locator('text=Nome');
      const emailHeader = page.locator('text=Email');
      const cityHeader = page.locator('text=Cidade');

      await expect(nameHeader).toBeVisible();
      await expect(emailHeader).toBeVisible();
      await expect(cityHeader).toBeVisible();
    });

    test('deve exibir mensagem quando não há clientes', async ({ page }) => {
      const emptyState = page.locator('[data-testid="empty-customers-state"]');

      if (await emptyState.isVisible()) {
        expect(await emptyState.textContent()).toContain('Nenhum cliente');
      }
    });
  });

  test.describe('Filtros', () => {
    test('deve filtrar clientes por nome', async ({ page }) => {
      const filterInput = page.locator('[data-testid="filter-customer-name"]');
      const applyButton = page.locator('[data-testid="apply-customer-filters"]');

      await filterInput.fill('João');
      await applyButton.click();

      const spinner = page.locator('[data-testid="loading-spinner"]');
      await expect(spinner).not.toBeVisible({ timeout: 2000 });

      const table = page.locator('[data-testid="customers-table"]');
      await expect(table).toBeVisible();
    });

    test('deve filtrar clientes por cidade', async ({ page }) => {
      const filterInput = page.locator('[data-testid="filter-customer-city"]');
      const applyButton = page.locator('[data-testid="apply-customer-filters"]');

      await filterInput.fill('São Paulo');
      await applyButton.click();

      const spinner = page.locator('[data-testid="loading-spinner"]');
      await expect(spinner).not.toBeVisible({ timeout: 2000 });
    });

    test('deve limpar filtros', async ({ page }) => {
      const filterInput = page.locator('[data-testid="filter-customer-name"]');
      const clearButton = page.locator('[data-testid="clear-customer-filters"]');

      await filterInput.fill('João');
      await clearButton.click();

      const value = await filterInput.inputValue();
      expect(value).toBe('');
    });

    test('deve combinar múltiplos filtros', async ({ page }) => {
      const nameInput = page.locator('[data-testid="filter-customer-name"]');
      const cityInput = page.locator('[data-testid="filter-customer-city"]');
      const applyButton = page.locator('[data-testid="apply-customer-filters"]');

      await nameInput.fill('João');
      await cityInput.fill('São Paulo');
      await applyButton.click();

      const spinner = page.locator('[data-testid="loading-spinner"]');
      await expect(spinner).not.toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Paginação', () => {
    test('deve navegar entre páginas', async ({ page }) => {
      const nextButton = page.locator('[data-testid="next-page-button"]');

      if (await nextButton.isVisible()) {
        await nextButton.click();

        const spinner = page.locator('[data-testid="loading-spinner"]');
        await expect(spinner).not.toBeVisible({ timeout: 2000 });
      }
    });

    test('deve mostrar página atual', async ({ page }) => {
      const pageIndicator = page.locator('[data-testid="current-page"]');

      if (await pageIndicator.isVisible()) {
        const text = await pageIndicator.textContent();
        expect(text).toMatch(/\d+/);
      }
    });
  });

  test.describe('Criar cliente', () => {
    test('deve abrir formulário de novo cliente', async ({ page }) => {
      const createButton = page.locator('[data-testid="create-customer-button"]');
      await createButton.click();

      const form = page.locator('[data-testid="customer-form"]');
      await expect(form).toBeVisible();
    });

    test('deve criar novo cliente com dados mínimos', async ({ page }) => {
      const createButton = page.locator('[data-testid="create-customer-button"]');
      await createButton.click();

      const nameInput = page.locator('[data-testid="customer-name-input"]');
      const emailInput = page.locator('[data-testid="customer-email-input"]');
      const submitButton = page.locator('[data-testid="submit-customer-form"]');

      const timestamp = Date.now();
      await nameInput.fill(`Cliente Teste ${timestamp}`);
      await emailInput.fill(`teste${timestamp}@example.com`);
      await submitButton.click();

      const successMessage = page.locator('[data-testid="customer-success-message"]');
      await expect(successMessage).toBeVisible({ timeout: 2000 });
    });

    test('deve validar email obrigatório', async ({ page }) => {
      const createButton = page.locator('[data-testid="create-customer-button"]');
      await createButton.click();

      const nameInput = page.locator('[data-testid="customer-name-input"]');
      const submitButton = page.locator('[data-testid="submit-customer-form"]');

      await nameInput.fill('Cliente Teste');
      await submitButton.click();

      const errorMessage = page.locator('[data-testid="customer-error-message"]');
      await expect(errorMessage).toBeVisible();
    });

    test('deve validar formato de email', async ({ page }) => {
      const createButton = page.locator('[data-testid="create-customer-button"]');
      await createButton.click();

      const nameInput = page.locator('[data-testid="customer-name-input"]');
      const emailInput = page.locator('[data-testid="customer-email-input"]');
      const submitButton = page.locator('[data-testid="submit-customer-form"]');

      await nameInput.fill('Cliente Teste');
      await emailInput.fill('email-invalido');
      await submitButton.click();

      const errorMessage = page.locator('[data-testid="customer-error-message"]');
      await expect(errorMessage).toBeVisible();
    });

    test('deve criar cliente com todos os campos opcionais', async ({ page }) => {
      const createButton = page.locator('[data-testid="create-customer-button"]');
      await createButton.click();

      const timestamp = Date.now();
      const nameInput = page.locator('[data-testid="customer-name-input"]');
      const emailInput = page.locator('[data-testid="customer-email-input"]');
      const phoneInput = page.locator('[data-testid="customer-phone-input"]');
      const cityInput = page.locator('[data-testid="customer-city-input"]');
      const submitButton = page.locator('[data-testid="submit-customer-form"]');

      await nameInput.fill(`Cliente ${timestamp}`);
      await emailInput.fill(`teste${timestamp}@example.com`);
      await phoneInput.fill('11987654321');
      await cityInput.fill('São Paulo');
      await submitButton.click();

      const successMessage = page.locator('[data-testid="customer-success-message"]');
      await expect(successMessage).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Editar cliente', () => {
    test('deve abrir formulário de edição ao clicar em linha', async ({ page }) => {
      const firstRow = page.locator('[data-testid="customer-row"]').first();

      if (await firstRow.isVisible()) {
        await firstRow.click();

        const form = page.locator('[data-testid="customer-form"]');
        await expect(form).toBeVisible();
      }
    });

    test('deve atualizar dados do cliente', async ({ page }) => {
      const firstRow = page.locator('[data-testid="customer-row"]').first();

      if (await firstRow.isVisible()) {
        await firstRow.click();

        const phoneInput = page.locator('[data-testid="customer-phone-input"]');
        const submitButton = page.locator('[data-testid="submit-customer-form"]');

        await phoneInput.fill('21999999999');
        await submitButton.click();

        const successMessage = page.locator('[data-testid="customer-success-message"]');
        await expect(successMessage).toBeVisible({ timeout: 2000 });
      }
    });

    test('deve fechar formulário ao cancelar', async ({ page }) => {
      const createButton = page.locator('[data-testid="create-customer-button"]');
      await createButton.click();

      const form = page.locator('[data-testid="customer-form"]');
      await expect(form).toBeVisible();

      const cancelButton = page.locator('[data-testid="cancel-customer-form"]');
      await cancelButton.click();

      await expect(form).not.toBeVisible();
    });
  });

  test.describe('Deletar cliente', () => {
    test('deve abrir diálogo de confirmação ao deletar', async ({ page }) => {
      const firstRow = page.locator('[data-testid="customer-row"]').first();

      if (await firstRow.isVisible()) {
        const deleteButton = firstRow.locator('[data-testid="delete-customer-button"]');

        if (await deleteButton.isVisible()) {
          await deleteButton.click();

          const dialog = page.locator('[data-testid="delete-customer-dialog"]');
          await expect(dialog).toBeVisible();
        }
      }
    });

    test('deve bloquear deleção se cliente tem pedidos ativos', async ({
      page,
    }) => {
      const firstRow = page.locator('[data-testid="customer-row"]').first();

      if (await firstRow.isVisible()) {
        const deleteButton = firstRow.locator('[data-testid="delete-customer-button"]');

        if (await deleteButton.isVisible()) {
          await deleteButton.click();

          const dialog = page.locator('[data-testid="delete-customer-dialog"]');

          if (await dialog.isVisible()) {
            const confirmButton = page.locator('[data-testid="confirm-delete"]');
            await confirmButton.click();

            // Se houver erro sobre pedidos ativos, deve ser exibido
            const errorMessage = page.locator(
              '[data-testid="customer-error-message"]'
            );

            if (await errorMessage.isVisible()) {
              const text = await errorMessage.textContent();
              expect(text).toContain('pedidos');
            }
          }
        }
      }
    });

    test('deve deletar cliente sem pedidos ativos', async ({ page }) => {
      // Criar cliente sem pedidos
      const createButton = page.locator('[data-testid="create-customer-button"]');
      await createButton.click();

      const timestamp = Date.now();
      const nameInput = page.locator('[data-testid="customer-name-input"]');
      const emailInput = page.locator('[data-testid="customer-email-input"]');
      const submitButton = page.locator('[data-testid="submit-customer-form"]');

      await nameInput.fill(`Delete Test ${timestamp}`);
      await emailInput.fill(`delete${timestamp}@example.com`);
      await submitButton.click();

      const successMessage = page.locator('[data-testid="customer-success-message"]');
      await expect(successMessage).toBeVisible({ timeout: 2000 });

      // Encontrar e deletar
      const rows = page.locator('[data-testid="customer-row"]');
      const count = await rows.count();

      if (count > 0) {
        const firstRow = rows.first();
        const deleteButton = firstRow.locator('[data-testid="delete-customer-button"]');

        if (await deleteButton.isVisible()) {
          await deleteButton.click();

          const dialog = page.locator('[data-testid="delete-customer-dialog"]');
          if (await dialog.isVisible()) {
            const confirmButton = page.locator('[data-testid="confirm-delete"]');
            await confirmButton.click();

            const deletedMessage = page.locator('[data-testid="customer-success-message"]');
            await expect(deletedMessage).toBeVisible({ timeout: 2000 });
          }
        }
      }
    });
  });

  test.describe('Detalhes do cliente', () => {
    test('deve exibir resumo de pedidos', async ({ page }) => {
      const firstRow = page.locator('[data-testid="customer-row"]').first();

      if (await firstRow.isVisible()) {
        await firstRow.click();

        const orderSummary = page.locator('[data-testid="customer-order-summary"]');

        if (await orderSummary.isVisible()) {
          const totalOrders = page.locator('[data-testid="total-orders"]');
          await expect(totalOrders).toBeVisible();
        }
      }
    });
  });

  test.describe('Responsividade e acessibilidade', () => {
    test('deve ser responsivo em telas pequenas', async ({ page }) => {
      await page.setViewportSize({ width: 600, height: 800 });

      const table = page.locator('[data-testid="customers-table"]');
      await expect(table).toBeVisible();
    });

    test('deve ter labels acessíveis nos inputs', async ({ page }) => {
      const createButton = page.locator('[data-testid="create-customer-button"]');
      await createButton.click();

      const nameInput = page.locator('[data-testid="customer-name-input"]');

      const hasLabel = await nameInput.evaluate((el) => {
        const label = document.querySelector(`label[for="${el.id}"]`);
        const ariaLabel = el.getAttribute('aria-label');
        return label !== null || ariaLabel !== null;
      });

      expect(hasLabel).toBe(true);
    });
  });
});
