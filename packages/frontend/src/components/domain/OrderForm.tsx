import React, { useState } from 'react';
import styles from './OrderForm.module.css';

interface OrderFormProps {
  onSubmit: (input: {
    customerId: string;
    orderNumber: string;
    description: string;
    quantity: number;
    salePrice: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export function OrderForm({ onSubmit, onCancel }: OrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    orderNumber: '',
    description: '',
    quantity: 1,
    salePrice: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' || name === 'salePrice' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.customerId || !formData.orderNumber || !formData.description) {
        throw new Error('Preencha todos os campos obrigatórios');
      }
      if (formData.quantity <= 0) {
        throw new Error('Quantidade deve ser maior que 0');
      }
      if (formData.salePrice < 0) {
        throw new Error('Valor de venda não pode ser negativo');
      }

      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Novo Pedido</h2>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="customerId">Cliente *</label>
            <input
              id="customerId"
              name="customerId"
              type="text"
              value={formData.customerId}
              onChange={handleChange}
              placeholder="ID do cliente"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="orderNumber">Número do Pedido *</label>
            <input
              id="orderNumber"
              name="orderNumber"
              type="text"
              value={formData.orderNumber}
              onChange={handleChange}
              placeholder="Ex: PED-001"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Descrição *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrição do pedido"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className={styles.rowGroup}>
            <div className={styles.formGroup}>
              <label htmlFor="quantity">Quantidade *</label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="salePrice">Valor de Venda *</label>
              <input
                id="salePrice"
                name="salePrice"
                type="number"
                value={formData.salePrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
