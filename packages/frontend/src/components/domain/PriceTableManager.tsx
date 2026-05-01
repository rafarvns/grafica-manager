import { useState } from 'react';
import { PriceTableEntry } from '@/hooks/usePrintHistory';
import { PaperType } from '@/services/paperTypeService';
import type { ColorMode } from '@grafica/shared/types';
import styles from './PriceTableManager.module.css';

interface PriceTableManagerProps {
  priceTable: PriceTableEntry[];
  paperTypes: PaperType[];
  onPricesUpdated: () => void;
  onCreate: (name: string, description: string, friendlyCode: string, paperTypeId: string, quality: string, colors: string, unitPrice: number, maxPages: number) => Promise<void>;
  onUpdate: (id: string, unitPrice: number, name?: string, description?: string, maxPages?: number) => Promise<void>;
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
  const [editingMaxPages, setEditingMaxPages] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newPrice, setNewPrice] = useState({
    name: '',
    description: '',
    friendlyCode: '',
    paperTypeId: '',
    quality: 'rascunho',
    colors: 'P&B' as ColorMode,
    unitPrice: '',
    maxPages: '1',
  });

  const handleCreateClick = () => {
    setShowCreateForm(true);
    setNewPrice({ name: '', description: '', friendlyCode: '', paperTypeId: '', quality: 'rascunho', colors: 'P&B', unitPrice: '', maxPages: '1' });
  };

  const generateFriendlyCode = (data: typeof newPrice) => {
    const initials = data.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();

    const qualityMap: Record<string, string> = { rascunho: 'RSC', padrão: 'PDR', premium: 'PRM' };
    const q = qualityMap[data.quality] || 'UNK';

    const c = data.colors === 'P&B' ? 'PB' : 'CLR';

    const paper = paperTypes.find(t => t.id === data.paperTypeId);
    const pInit = paper ? paper.name.split(' ').map(w => w[0]).join('').toUpperCase() : '??';

    const priceStr = data.unitPrice ? parseFloat(data.unitPrice).toFixed(2).replace('.', '') : '000';

    return `${initials}-${pInit}-${q}-${c}-${priceStr}`;
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

    const maxPages = parseInt(newPrice.maxPages) || 1;
    if (maxPages < 1) {
      setMessage({ type: 'error', text: 'O máximo de páginas deve ser >= 1.' });
      return;
    }

    try {
      setLoading(true);
      const friendlyCode = generateFriendlyCode(newPrice);
      await onCreate(newPrice.name, newPrice.description, friendlyCode, newPrice.paperTypeId, newPrice.quality, newPrice.colors, unitPrice, maxPages);
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

  const handleEditStart = (id: string, currentPrice: number, currentMaxPages: number) => {
    setEditingId(id);
    setEditingValue(currentPrice);
    setEditingMaxPages(currentMaxPages);
  };

  const handleEditSave = async (id: string) => {
    if (editingValue <= 0) {
      setMessage({ type: 'error', text: 'O preço deve ser maior que zero.' });
      return;
    }

    if (editingMaxPages < 1) {
      setMessage({ type: 'error', text: 'O máximo de páginas deve ser >= 1.' });
      return;
    }

    try {
      setLoading(true);
      await onUpdate(id, editingValue, undefined, undefined, editingMaxPages);
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
          <div className={`${styles.formField} ${styles.formFieldFull}`}>
            <label htmlFor="product-name">Nome do Produto:</label>
            <input
              id="product-name"
              type="text"
              placeholder="ex: Cartão de Visita, Panfleto..."
              value={newPrice.name}
              onChange={(e) =>
                setNewPrice({ ...newPrice, name: e.target.value })
              }
              disabled={loading}
              required
            />
          </div>

          <div className={`${styles.formField} ${styles.formFieldFull}`}>
            <label htmlFor="description">Descrição:</label>
            <textarea
              id="description"
              placeholder="Detalhes adicionais sobre o produto..."
              value={newPrice.description}
              onChange={(e) =>
                setNewPrice({ ...newPrice, description: e.target.value })
              }
              disabled={loading}
              className={styles.textarea}
            />
          </div>

          <div className={`${styles.formField} ${styles.formFieldFull}`}>
            <label htmlFor="friendly-code">Código do Produto (Automático):</label>
            <input
              id="friendly-code"
              type="text"
              value={generateFriendlyCode(newPrice)}
              disabled
              className={styles.readonlyInput}
            />
          </div>

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

          <div className={styles.formField}>
            <label htmlFor="max-pages">Máximo de Páginas:</label>
            <input
              id="max-pages"
              type="number"
              data-testid="new-price-max-pages"
              placeholder="1"
              min="1"
              step="1"
              value={newPrice.maxPages}
              onChange={(e) =>
                setNewPrice({ ...newPrice, maxPages: e.target.value })
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
              <th>Cód</th>
              <th>Nome do Produto</th>
              <th>Tipo de Papel</th>
              <th>Qualidade</th>
              <th>Tipo de Cor</th>
              <th>Preço Unitário</th>
              <th>Máx. Pág.</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {priceTable.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyCell}>
                  Nenhuma entrada de preço configurada.
                </td>
              </tr>
            ) : (
              priceTable.map((entry) => (
                <tr key={entry.id}>
                  <td className={styles.codeCell}>
                    <code>{entry.friendlyCode}</code>
                  </td>
                  <td>
                    <strong>{entry.name || 'Sem nome'}</strong>
                    {entry.description && (
                      <p className={styles.entryDescription}>{entry.description}</p>
                    )}
                  </td>
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
                  <td>
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        data-testid="edit-price-max-pages"
                        min="1"
                        step="1"
                        value={editingMaxPages}
                        onChange={(e) =>
                          setEditingMaxPages(parseInt(e.target.value) || 1)
                        }
                        disabled={loading}
                        className={styles.priceInput}
                      />
                    ) : (
                      <span>{entry.maxPages ?? 1}</span>
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
                          onClick={() => handleEditStart(entry.id, entry.unitPrice, entry.maxPages ?? 1)}
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
