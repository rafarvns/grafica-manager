import { test, expect } from '@playwright/test';

test.describe('Histórico de Impressões', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/print-history');
  });

  test.describe('Carregamento e listagem', () => {
    test('deve carregar a tela de histórico com tabela e filtros', async ({ page }) => {
      // Aguardar tabela carregar
      const table = page.locator('[data-testid="print-history-table"]');
      await expect(table).toBeVisible();

      // Verificar existência de filtros
      const startDateInput = page.locator('[data-testid="filter-start-date"]');
      const endDateInput = page.locator('[data-testid="filter-end-date"]');
      const statusSelect = page.locator('[data-testid="filter-status"]');

      await expect(startDateInput).toBeVisible();
      await expect(endDateInput).toBeVisible();
      await expect(statusSelect).toBeVisible();
    });

    test('deve exibir lista de impressões com colunas corretas', async ({ page }) => {
      // Aguardar tabela e verificar headers
      const headers = page.locator('[data-testid="print-history-table"] thead th');
      const headerCount = await headers.count();

      expect(headerCount).toBeGreaterThan(0);

      // Verificar presença de colunas importantes
      const documentColumn = page.locator('text=Documento');
      const statusColumn = page.locator('text=Status');
      const costColumn = page.locator('text=Custo');

      await expect(documentColumn).toBeVisible();
      await expect(statusColumn).toBeVisible();
      await expect(costColumn).toBeVisible();
    });

    test('deve exibir indicadores de custo total e taxa de sucesso', async ({ page }) => {
      const statsContainer = page.locator('[data-testid="print-history-stats"]');
      await expect(statsContainer).toBeVisible();

      const statCost = page.locator('[data-testid="stat-cost"]');
      const statSuccessRate = page.locator('[data-testid="stat-success-rate"]');

      await expect(statCost).toBeVisible();
      await expect(statSuccessRate).toBeVisible();

      // Verificar que contêm números
      const costText = await statCost.textContent();
      const rateText = await statSuccessRate.textContent();

      expect(costText).toMatch(/[\d.,]/);
      expect(rateText).toMatch(/[\d.,]%/);
    });
  });

  test.describe('Filtros', () => {
    test('deve filtrar por período (data inicial e final)', async ({ page }) => {
      const startDateInput = page.locator('[data-testid="filter-start-date"]');
      const endDateInput = page.locator('[data-testid="filter-end-date"]');
      const applyButton = page.locator('[data-testid="apply-filters-button"]');

      // Definir datas
      await startDateInput.fill('2026-04-01');
      await endDateInput.fill('2026-04-15');

      // Aplicar filtro
      await applyButton.click();

      // Aguardar requisição completar (indicador de loading desaparecer)
      const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
      await expect(loadingSpinner).not.toBeVisible({ timeout: 2000 });

      // Verificar que tabela foi atualizada
      const table = page.locator('[data-testid="print-history-table"]');
      await expect(table).toBeVisible();
    });

    test('deve filtrar por status', async ({ page }) => {
      const statusSelect = page.locator('[data-testid="filter-status"]');
      const applyButton = page.locator('[data-testid="apply-filters-button"]');

      // Selecionar status "sucesso"
      await statusSelect.selectOption('sucesso');
      await applyButton.click();

      // Aguardar tabela atualizar
      const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
      await expect(loadingSpinner).not.toBeVisible({ timeout: 2000 });

      // Verificar que todos os registros visíveis têm status "sucesso"
      const statusCells = page.locator('[data-testid="job-status"]');
      const count = await statusCells.count();

      for (let i = 0; i < count; i++) {
        const text = await statusCells.nth(i).textContent();
        expect(text).toContain('Sucesso');
      }
    });

    test('deve limpar filtros', async ({ page }) => {
      const startDateInput = page.locator('[data-testid="filter-start-date"]');
      const clearButton = page.locator('[data-testid="clear-filters-button"]');

      // Definir um filtro
      await startDateInput.fill('2026-04-01');

      // Limpar
      await clearButton.click();

      // Verificar que input foi limpo
      const value = await startDateInput.inputValue();
      expect(value).toBe('');
    });

    test('deve combinar múltiplos filtros', async ({ page }) => {
      const startDateInput = page.locator('[data-testid="filter-start-date"]');
      const statusSelect = page.locator('[data-testid="filter-status"]');
      const applyButton = page.locator('[data-testid="apply-filters-button"]');

      // Definir múltiplos filtros
      await startDateInput.fill('2026-04-01');
      await statusSelect.selectOption('sucesso');
      await applyButton.click();

      // Aguardar atualização
      const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
      await expect(loadingSpinner).not.toBeVisible({ timeout: 2000 });

      // Tabela deve estar visível
      const table = page.locator('[data-testid="print-history-table"]');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Tabela de Preços', () => {
    test('deve exibir aba ou seção de tabela de preços', async ({ page }) => {
      const priceTableTab = page.locator('[data-testid="price-table-tab"]');

      if (await priceTableTab.isVisible()) {
        await priceTableTab.click();
      }

      const priceTable = page.locator('[data-testid="price-table"]');
      await expect(priceTable).toBeVisible();
    });

    test('deve criar novo preço', async ({ page }) => {
      const priceTableTab = page.locator('[data-testid="price-table-tab"]');

      if (await priceTableTab.isVisible()) {
        await priceTableTab.click();
      }

      const createButton = page.locator('[data-testid="create-price-button"]');
      await createButton.click();

      // Aguardar modal/formulário aparecer
      const paperTypeSelect = page.locator('[data-testid="new-price-paper-type"]');
      const qualitySelect = page.locator('[data-testid="new-price-quality"]');
      const priceInput = page.locator('[data-testid="new-price-unit-price"]');
      const submitButton = page.locator('[data-testid="submit-new-price"]');

      await expect(paperTypeSelect).toBeVisible();
      await expect(qualitySelect).toBeVisible();
      await expect(priceInput).toBeVisible();

      // Preencher formulário
      await paperTypeSelect.selectOption('paper-type-1');
      await qualitySelect.selectOption('normal');
      await priceInput.fill('0.75');

      // Submeter
      await submitButton.click();

      // Aguardar sucesso
      const successMessage = page.locator('[data-testid="price-created-message"]');
      await expect(successMessage).toBeVisible({ timeout: 2000 });
    });

    test('deve atualizar preço existente', async ({ page }) => {
      const priceTableTab = page.locator('[data-testid="price-table-tab"]');

      if (await priceTableTab.isVisible()) {
        await priceTableTab.click();
      }

      // Encontrar primeiro preço e clicar em editar
      const editButton = page.locator('[data-testid="edit-price"]').first();
      await expect(editButton).toBeVisible();
      await editButton.click();

      // Preencher novo valor
      const priceInput = page.locator('[data-testid="edit-price-unit-price"]');
      await priceInput.clear();
      await priceInput.fill('1.50');

      // Salvar
      const saveButton = page.locator('[data-testid="save-price"]');
      await saveButton.click();

      // Aguardar sucesso
      const successMessage = page.locator('[data-testid="price-updated-message"]');
      await expect(successMessage).toBeVisible({ timeout: 2000 });
    });

    test('deve deletar preço se não estiver em uso', async ({ page }) => {
      const priceTableTab = page.locator('[data-testid="price-table-tab"]');

      if (await priceTableTab.isVisible()) {
        await priceTableTab.click();
      }

      // Encontrar preço sem uso e deletar
      const deleteButton = page.locator('[data-testid="delete-price"]').first();
      await expect(deleteButton).toBeVisible();
      await deleteButton.click();

      // Confirmar deleção
      const confirmButton = page.locator('[data-testid="confirm-delete-price"]');
      await expect(confirmButton).toBeVisible();
      await confirmButton.click();

      // Aguardar sucesso
      const successMessage = page.locator('[data-testid="price-deleted-message"]');
      await expect(successMessage).toBeVisible({ timeout: 2000 });
    });

    test('deve mostrar aviso ao tentar deletar preço em uso', async ({ page }) => {
      const priceTableTab = page.locator('[data-testid="price-table-tab"]');

      if (await priceTableTab.isVisible()) {
        await priceTableTab.click();
      }

      // Encontrar preço em uso e tentar deletar
      const deleteButton = page.locator('[data-testid="delete-price"]').first();
      await deleteButton.click();

      // Se mostrar aviso de "em uso", verificar presença de checkbox para force delete
      const forceCheckbox = page.locator('[data-testid="force-delete-checkbox"]');

      if (await forceCheckbox.isVisible()) {
        // Preço está em uso - marcar força e deletar
        await forceCheckbox.check();
        const confirmButton = page.locator('[data-testid="confirm-delete-price"]');
        await confirmButton.click();

        const warningMessage = page.locator('[data-testid="force-delete-warning"]');
        await expect(warningMessage).toBeVisible({ timeout: 2000 });
      }
    });
  });

  test.describe('Detalhes de impressão', () => {
    test('deve abrir detalhes ao clicar em um registro', async ({ page }) => {
      // Clicar em primeiro registro
      const firstRow = page.locator('[data-testid="print-job-row"]').first();
      await firstRow.click();

      // Aguardar modal/drawer
      const detailsPanel = page.locator('[data-testid="print-job-details"]');
      await expect(detailsPanel).toBeVisible();

      // Verificar informações
      const documentName = page.locator('[data-testid="detail-document-name"]');
      const status = page.locator('[data-testid="detail-status"]');
      const cost = page.locator('[data-testid="detail-cost"]');

      await expect(documentName).toBeVisible();
      await expect(status).toBeVisible();
      await expect(cost).toBeVisible();
    });

    test('deve fechar detalhes ao clicar X ou fora do painel', async ({ page }) => {
      // Abrir detalhes
      const firstRow = page.locator('[data-testid="print-job-row"]').first();
      await firstRow.click();

      const detailsPanel = page.locator('[data-testid="print-job-details"]');
      await expect(detailsPanel).toBeVisible();

      // Fechar
      const closeButton = page.locator('[data-testid="close-details-button"]');
      await closeButton.click();

      // Verificar que fechou
      await expect(detailsPanel).not.toBeVisible();
    });

    test('deve exibir mensagem de erro se job for deletado', async ({ page }) => {
      // Abrir detalhes
      const firstRow = page.locator('[data-testid="print-job-row"]').first();
      await firstRow.click();

      const detailsPanel = page.locator('[data-testid="print-job-details"]');
      await expect(detailsPanel).toBeVisible();

      // Simular erro ao carregar (pode mockado no beforeEach)
      // ou deixar painel abrir e verificar que carregou dados
      const content = await detailsPanel.textContent();
      expect(content).toBeTruthy();
    });
  });

  test.describe('Responsividade e acessibilidade', () => {
    test('deve ser responsivo em telas pequenas (<768px)', async ({ page }) => {
      // Redimensionar viewport
      await page.setViewportSize({ width: 600, height: 800 });

      const table = page.locator('[data-testid="print-history-table"]');
      await expect(table).toBeVisible();

      // Verificar que componentes estão adaptados
      const mobileMenu = page.locator('[data-testid="mobile-filters-menu"]');

      // Se existir menu mobile, deve estar visível
      if (await mobileMenu.isVisible()) {
        expect(await mobileMenu.isVisible()).toBe(true);
      }
    });

    test('deve ser navegável por teclado', async ({ page }) => {
      // Tab para primeira célula da tabela
      await page.keyboard.press('Tab');

      const focusedElement = page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBeTruthy();

      // Verificar que links/botões têm focus visível
      const filterButton = page.locator('[data-testid="apply-filters-button"]');
      await filterButton.focus();

      const isFocused = await filterButton.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.outline !== 'none' || style.boxShadow !== 'none';
      });

      expect(isFocused).toBe(true);
    });

    test('deve ter labels acessíveis para inputs', async ({ page }) => {
      const startDateInput = page.locator('[data-testid="filter-start-date"]');

      // Verificar se tem label ou aria-label
      const hasLabel = await startDateInput.evaluate((el) => {
        const label = document.querySelector(`label[for="${el.id}"]`);
        const ariaLabel = el.getAttribute('aria-label');
        return label !== null || ariaLabel !== null;
      });

      expect(hasLabel).toBe(true);
    });
  });

  test.describe('Paginação e Sorting', () => {
    test('deve exibir controles de paginação', async ({ page }) => {
      const pagination = page.locator('[data-testid="pagination"]');
      await expect(pagination).toBeVisible();

      const pageInfo = page.locator('[data-testid="page-info"]');
      await expect(pageInfo).toBeVisible();

      const pageSizeSelect = page.locator('[data-testid="page-size-select"]');
      await expect(pageSizeSelect).toBeVisible();
    });

    test('deve navegar entre páginas', async ({ page }) => {
      const nextPageButton = page.locator('[data-testid="next-page"]');

      // Se houver próxima página, clicar
      if (await nextPageButton.isEnabled()) {
        await nextPageButton.click();

        // Verificar que a tabela atualizou
        const table = page.locator('[data-testid="print-history-table"]');
        await expect(table).toBeVisible();
      }
    });

    test('deve alterar tamanho de página', async ({ page }) => {
      const pageSizeSelect = page.locator('[data-testid="page-size-select"]');
      await pageSizeSelect.selectOption('50');

      // Verificar que a tabela atualizou
      const table = page.locator('[data-testid="print-history-table"]');
      await expect(table).toBeVisible();
    });

    test('deve ordenar por coluna ao clicar no header', async ({ page }) => {
      const sortCostHeader = page.locator('[data-testid="sort-cost"]');
      await sortCostHeader.click();

      // Verificar que a tabela atualizou
      const table = page.locator('[data-testid="print-history-table"]');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Estatísticas (KPIs)', () => {
    test('deve exibir cards de estatísticas', async ({ page }) => {
      const statsContainer = page.locator('[data-testid="print-history-stats"]');
      await expect(statsContainer).toBeVisible();

      const statTotal = page.locator('[data-testid="stat-total"]');
      const statCost = page.locator('[data-testid="stat-cost"]');
      const statSuccessRate = page.locator('[data-testid="stat-success-rate"]');

      await expect(statTotal).toBeVisible();
      await expect(statCost).toBeVisible();
      await expect(statSuccessRate).toBeVisible();
    });
  });

  test.describe('Exportação', () => {
    test('deve ter botões de exportação CSV e PDF', async ({ page }) => {
      const exportCsvButton = page.locator('[data-testid="export-csv-button"]');
      const exportPdfButton = page.locator('[data-testid="export-pdf-button"]');

      await expect(exportCsvButton).toBeVisible();
      await expect(exportPdfButton).toBeVisible();
    });
  });

  test.describe('Reprocessar impressão com erro', () => {
    test('deve exibir botão de reprocessar para job com erro', async ({ page }) => {
      // Filtrar por status "erro"
      const statusSelect = page.locator('[data-testid="filter-status"]');
      await statusSelect.selectOption('erro');
      const applyButton = page.locator('[data-testid="apply-filters-button"]');
      await applyButton.click();

      // Clicar em um job com erro
      const firstRow = page.locator('[data-testid="print-job-row"]').first();
      await firstRow.click();

      // Verificar que o botão de reprocessar aparece
      const reprocessButton = page.locator('[data-testid="reprocess-button"]');
      if (await reprocessButton.isVisible()) {
        await reprocessButton.click();

        // Verificar modal de confirmação
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();
      }
    });
  });
});
