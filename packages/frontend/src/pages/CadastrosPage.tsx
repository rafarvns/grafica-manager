import React, { useState, useEffect } from 'react';
import { paperTypeService, PaperType } from '@/services/paperTypeService';
import { PriceTableManager } from '@/components/domain/PriceTableManager';
import { usePrintHistory } from '@/hooks/usePrintHistory';
import styles from './CadastrosPage.module.css';

type CadastrosTab = 'papeis' | 'produtos';

export function CadastrosPage() {
  const [activeTab, setActiveTab] = useState<CadastrosTab>('papeis');

  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);
  const [loadingPaper, setLoadingPaper] = useState(false);
  const [paperError, setPaperError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', weight: 150, standardSize: 'A4', color: 'Branco' });

  const {
    priceTable,
    loading: loadingProduct,
    error: productError,
    createPriceEntry,
    updatePriceEntry,
    deletePriceEntry,
    fetchPriceTable,
  } = usePrintHistory();

  const fetchPapers = async () => {
    try {
      setLoadingPaper(true);
      const data = await paperTypeService.listPaperTypes();
      setPaperTypes(data);
    } catch {
      setPaperError('Erro ao carregar papéis');
    } finally {
      setLoadingPaper(false);
    }
  };

  useEffect(() => {
    fetchPapers();
    fetchPriceTable();
  }, [fetchPriceTable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoadingPaper(true);
      await paperTypeService.createPaperType(formData);
      setFormData({ name: '', weight: 150, standardSize: 'A4', color: 'Branco' });
      setShowForm(false);
      await fetchPapers();
    } catch (err) {
      setPaperError(err instanceof Error ? err.message : 'Erro ao criar papel');
    } finally {
      setLoadingPaper(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este papel?')) return;
    try {
      setLoadingPaper(true);
      await paperTypeService.deletePaperType(id);
      await fetchPapers();
    } catch {
      setPaperError('Erro ao excluir papel');
    } finally {
      setLoadingPaper(false);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await paperTypeService.toggleActive(id);
      await fetchPapers();
    } catch {
      setPaperError('Erro ao alterar status');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Cadastros</h1>
        <p>Gerencie papéis e produtos do sistema.</p>
      </header>

      <nav className={styles.tabs} aria-label="Abas de cadastro" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'papeis'}
          className={`${styles.tabButton} ${activeTab === 'papeis' ? styles.active : ''}`}
          onClick={() => setActiveTab('papeis')}
        >
          Papéis
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'produtos'}
          className={`${styles.tabButton} ${activeTab === 'produtos' ? styles.active : ''}`}
          onClick={() => setActiveTab('produtos')}
        >
          Produtos
        </button>
      </nav>

      <main className={styles.content} role="tabpanel">
        {activeTab === 'papeis' && (
          <section>
            <div className={styles.sectionHeader}>
              <h2>Cadastro de Papéis</h2>
              <button className={styles.addButton} onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancelar' : '+ Novo Papel'}
              </button>
            </div>

            {paperError && <div className={styles.error}>{paperError}</div>}

            {showForm && (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="paper-name">Nome:</label>
                  <input
                    id="paper-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="paper-weight">Gramatura (g):</label>
                    <input
                      id="paper-weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="paper-size">Tamanho:</label>
                    <input
                      id="paper-size"
                      type="text"
                      value={formData.standardSize}
                      onChange={(e) => setFormData({ ...formData, standardSize: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="paper-color">Cor:</label>
                    <input
                      id="paper-color"
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className={styles.saveButton} disabled={loadingPaper}>
                  Salvar
                </button>
              </form>
            )}

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Gramatura</th>
                    <th>Tamanho</th>
                    <th>Cor</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paperTypes.map((paper) => (
                    <tr key={paper.id} className={!paper.active ? styles.inactiveRow : ''}>
                      <td>{paper.name}</td>
                      <td>{paper.weight}g</td>
                      <td>{paper.size}</td>
                      <td>{paper.color}</td>
                      <td>
                        <button
                          className={paper.active ? styles.statusActive : styles.statusInactive}
                          onClick={() => toggleActive(paper.id)}
                        >
                          {paper.active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td>
                        <button className={styles.deleteButton} onClick={() => handleDelete(paper.id)}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'produtos' && (
          <section>
            <h2>Cadastro de Produtos</h2>
            {productError && <div className={styles.error}>{productError}</div>}
            {loadingProduct && !priceTable.length ? (
              <div className={styles.loading}>Carregando...</div>
            ) : (
              <PriceTableManager
                priceTable={priceTable}
                paperTypes={paperTypes}
                onPricesUpdated={fetchPriceTable}
                onCreate={(name, description, friendlyCode, paperTypeId, quality, colors, unitPrice) =>
                  createPriceEntry(name, description, friendlyCode, paperTypeId, quality, colors, unitPrice)
                }
                onUpdate={(id, unitPrice) => updatePriceEntry(id, { unitPrice })}
                onDelete={deletePriceEntry}
              />
            )}
          </section>
        )}
      </main>
    </div>
  );
}
