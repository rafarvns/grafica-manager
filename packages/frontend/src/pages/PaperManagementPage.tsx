import React, { useState, useEffect } from 'react';
import { paperTypeService, PaperType } from '@/services/paperTypeService';
import styles from './ManagementPages.module.css';

export function PaperManagementPage() {
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    weight: 150,
    standardSize: 'A4',
    color: 'Branco',
  });

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const data = await paperTypeService.listPaperTypes();
      setPaperTypes(data);
    } catch (err) {
      setError('Erro ao carregar papéis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await paperTypeService.createPaperType(formData);
      setFormData({ name: '', weight: 150, standardSize: 'A4', color: 'Branco' });
      setShowForm(false);
      await fetchPapers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar papel');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este papel?')) return;
    try {
      setLoading(true);
      await paperTypeService.deletePaperType(id);
      await fetchPapers();
    } catch (err) {
      setError('Erro ao excluir papel');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await paperTypeService.toggleActive(id);
      await fetchPapers();
    } catch (err) {
      setError('Erro ao alterar status');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Cadastro de Papéis</h1>
        <button className={styles.addButton} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Novo Papel'}
        </button>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nome:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Gramatura (g):</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Tamanho:</label>
              <input
                type="text"
                value={formData.standardSize}
                onChange={(e) => setFormData({ ...formData, standardSize: e.target.value })}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Cor:</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                required
              />
            </div>
          </div>
          <button type="submit" className={styles.saveButton} disabled={loading}>
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
    </div>
  );
}
