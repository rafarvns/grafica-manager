import { useState } from 'react';
import { PriceTableEntry } from '@/hooks/usePrintHistory';
import { PaperType } from '@/services/paperTypeService';
import type { ColorMode } from '@grafica/shared/types';
import styles from './PriceTableManager.module.css';

interface PriceTableManagerProps {
  priceTable: PriceTableEntry[];
  paperTypes: PaperType[];
  onPricesUpdated: () => void;
  onCreate: (paperTypeId: string, quality: string, colors: string, unitPrice: number) => Promise<void>;
  onUpdate: (id: string, unitPrice: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const QUALITIES = ['rascunho', 'padrão', 'premium'];
const COLORS: ColorMode[] = ['P&B', 'colorido'];

export function PriceTableManager({
  priceTable,
  paperTypes,
  onPricesUpdated,
  onCreate,
  onUpdate,
  onDelete,
}: PriceTableManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newPrice, setNewPrice] = useState({
    paperTypeId: '',
    quality: 'rascunho',
    colors: 'P&B' as ColorMode,
    unitPrice: '',
  });

  const handleCreateClick = () => {
    setShowCreateForm(true);
    setNewPrice({ paperTypeId: '', quality: 'rascunho', colors: 'P&B', unitPrice: '' });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPrice.paperTypeId || !newPrice.unitPrice || !newPrice.colors) {
      setMessage({ type: 'error', text: 'Preencha todos os campos.' });
      return;
    }

    const unitPrice = parseFloat(newPrice.unitPrice);
    if (unitPrice <= 0) {
      setMessage({ type: 'error', text: 'O preço deve ser maior que zero.' });
      return;
    }

    try {
      setLoading(true);
      await onCreate(newPrice.paperTypeId, newPrice.quality, newPrice.colors, unitPrice);
      setMessage({ type: 'success', text: 'Preço criado com sucesso!' });
      setShowCreateForm(false);
      onPricesUpdated();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao criar preço';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (id: string, currentPrice: number) => {
    setEditingId(id);
    setEditingValue(currentPrice);
  };

  const handleEditSave = async (id: string) => {
    if (editingValue <= 0) {
      setMessage({ type: 'error', text: 'O preço deve ser maior que zero.' });
      return;
    }

    try {
      setLoading(true);
      await onUpdate(id, editingValue);
      setMessage({ type: 'success', text: 'Preço atualizado com sucesso!' });
      setEditingId(null);
      onPricesUpdated();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar preço';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este preço?')) {
      return;
    }

    try {
      setLoading(true);
      await onDelete(id);
      setMessage({ type: 'success', text: 'Preço deletado com sucesso!' });
      onPricesUpdated();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao deletar preço';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {message && (
        <div
          className={`${styles.message} ${styles[message.type]}`}
          data-testid={
            message.type === 'success'
              ? 'price-created-message'
              : 'price-error-message'
          }
        >
          {message.text}
        </div>
      )}

      <div className={styles.header}>
        <h2>Tabela de Preços</h2>
        <button
          className={styles.createButton}
          onClick={handleCreateClick}
          disabled={loading || showCreateForm}
          data-testid="create-price-button"
        >
          + Nova Entrada
        </button>
      </div>

      {showCreateForm && (
        <form className={styles.createForm} onSubmit={handleCreateSubmit}>
          <div className={styles.formField}>
            <label htmlFor="paper-type">Tipo de Papel:</label>
            <select
              id="paper-type"
              data-testid="new-price-paper-type"
              value={newPrice.paperTypeId}
              onChange={(e) =>
                setNewPrice({ ...newPrice, paperTypeId: e.target.value })
              }
              disabled={loading}
            >
              <option value="">Selecione o papel</option>
              {paperTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.size || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label htmlFor="quality">Qualidade:</label>
            <select
              id="quality"
              data-testid="new-price-quality"
              value={newPrice.quality}
              onChange={(e) =>
                setNewPrice({ ...newPrice, quality: e.target.value })
              }
              disabled={loading}
            >
              {QUALITIES.map((q) => (
                <option key={q} value={q}>
                  {q.charAt(0).toUpperCase() + q.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label htmlFor="colors">Tipo de Cor:</label>
            <select
              id="colors"
              data-testid="new-price-colors"
              value={newPrice.colors}
              onChange={(e) =>
                setNewPrice({ ...newPrice, colors: e.target.value as ColorMode })
              }
              disabled={loading}
            >
              {COLORS.map((c) => (
                <option key={c} value={c}>
                  {c === 'P&B' ? 'P&B' : 'Colorido'}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label htmlFor="unit-price">Preço Unitário (R$):</label>
            <input
              id="unit-price"
              type="number"
              data-testid="new-price-unit-price"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              value={newPrice.unitPrice}
              onChange={(e) =>
                setNewPrice({ ...newPrice, unitPrice: e.target.value })
              }
              disabled={loading}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
              data-testid="submit-new-price"
            >
              {loading ? 'Criando...' : 'Criar'}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setShowCreateForm(false)}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table} data-testid="price-table">
          <thead>
            <tr>
              <th>Tipo de Papel</th>
              <th>Qualidade</th>
              <th>Tipo de Cor</th>
              <th>Preço Unitário</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {priceTable.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  Nenhuma entrada de preço configurada.
                </td>
              </tr>
            ) : (
              priceTable.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    {paperTypes.find(t => t.id === entry.paperTypeId)?.name || entry.paperTypeId}
                  </td>
                  <td className={styles.quality}>
                    {entry.quality.charAt(0).toUpperCase() + entry.quality.slice(1)}
                  </td>
                  <td>
                    {entry.colors === 'P&B' ? 'P&B' : 'Colorido'}
                  </td>
                  <td>
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        data-testid="edit-price-unit-price"
                        step="0.01"
                        min="0.01"
                        value={editingValue}
                        onChange={(e) =>
                          setEditingValue(parseFloat(e.target.value) || 0)
                        }
                        disabled={loading}
                        className={styles.priceInput}
                      />
                    ) : (
                      <span>R$ {entry.unitPrice.toFixed(2)}</span>
                    )}
                  </td>
                  <td className={styles.actions}>
                    {editingId === entry.id ? (
                      <>
                        <button
                          className={styles.saveButton}
                          onClick={() => handleEditSave(entry.id)}
                          disabled={loading}
                          data-testid="save-price"
                        >
                          Salvar
                        </button>
                        <button
                          className={styles.cancelButton}
                          onClick={() => setEditingId(null)}
                          disabled={loading}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={styles.editButton}
                          onClick={() => handleEditStart(entry.id, entry.unitPrice)}
                          disabled={loading}
                          data-testid="edit-price"
                        >
                          Editar
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDelete(entry.id)}
                          disabled={loading}
                          data-testid="delete-price"
                        >
                          Deletar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
