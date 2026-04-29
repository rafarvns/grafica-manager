import React, { useEffect, useState } from 'react';
import styles from './OrderModal.module.css';
import { useOrderForm } from '@/hooks/useOrderForm';
import { useCustomers } from '@/hooks/useCustomers';
import { usePrintConfiguration } from '@/hooks/usePrintConfiguration';
import { useNotification } from '@/contexts/NotificationContext';
import { Order, OrderAttachment } from '@grafica/shared';
import { OrderFileUpload } from './OrderFileUpload';
import { orderService } from '@/services/OrderService';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialOrder?: Order | undefined;
}

export function OrderModal({ isOpen, onClose, onSuccess, initialOrder }: OrderModalProps) {
  const { notify } = useNotification();
  const [attachments, setAttachments] = useState<OrderAttachment[]>(initialOrder?.attachments || []);
  const [uploading, setUploading] = useState(false);

  const { 
    formData, 
    errors, 
    loading, 
    setFieldValue, 
    submit, 
    isEditing 
  } = useOrderForm({ initialOrder, onSuccess: () => {
    notify({ message: isEditing ? 'Pedido atualizado com sucesso' : 'Pedido criado com sucesso', type: 'success' });
    onSuccess();
    onClose();
  }});

  const { customers, listCustomers } = useCustomers();
  const { priceTable } = usePrintConfiguration();

  const handleProductSelect = (productId: string) => {
    const product = priceTable.find(p => p.id === productId);
    if (product) {
      setFieldValue('description', `${product.name} - ${product.friendlyCode}`);
      setFieldValue('paperType', product.paperTypeName || '');
      setFieldValue('productionCost', product.unitPrice * formData.quantity);
    }
  };

  useEffect(() => {
    if (isOpen) {
      listCustomers({ pageSize: 100 });
      setAttachments(initialOrder?.attachments || []);
    }
  }, [isOpen, listCustomers, initialOrder]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
  };

  const handleUpload = async (file: File) => {
    if (!initialOrder) {
      notify({ message: 'Salve o pedido primeiro para adicionar arquivos', type: 'warning' });
      return;
    }

    try {
      setUploading(true);
      const newAtt = await orderService.uploadAttachment(initialOrder.id, file);
      setAttachments((prev) => [...prev, newAtt]);
      notify({ message: 'Arquivo enviado com sucesso', type: 'success' });
    } catch (err) {
      notify({ message: 'Erro ao enviar arquivo', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!initialOrder) return;
    try {
      setUploading(true);
      await orderService.deleteAttachment(initialOrder.id, id);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      notify({ message: 'Arquivo removido', type: 'success' });
    } catch (err) {
      notify({ message: 'Erro ao remover arquivo', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const isReadOnly = initialOrder?.status === 'shipping';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>{isEditing ? `Editar Pedido ${initialOrder?.orderNumber}` : 'Novo Pedido'}</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </header>

        <div className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="customerId">Cliente *</label>
                <select
                  id="customerId"
                  value={formData.customerId}
                  onChange={(e) => setFieldValue('customerId', e.target.value)}
                  disabled={loading || isReadOnly || isEditing}
                >
                  <option value="">Selecione um cliente</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.customerId && <span className={styles.error}>{errors.customerId}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="productId">Produto (Opcional)</label>
                <select
                  id="productId"
                  defaultValue=""
                  onChange={(e) => handleProductSelect(e.target.value)}
                  disabled={loading || isReadOnly}
                >
                  <option value="">Configuração Manual</option>
                  {priceTable.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.friendlyCode} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="deadline">Data Limite *</label>
                <input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFieldValue('deadline', e.target.value)}
                  disabled={loading || isReadOnly}
                />
                {errors.deadline && <span className={styles.error}>{errors.deadline}</span>}
              </div>

              <div className={styles.fieldFull}>
                <label htmlFor="description">Descrição *</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFieldValue('description', e.target.value)}
                  disabled={loading || isReadOnly}
                  rows={2}
                />
                {errors.description && <span className={styles.error}>{errors.description}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="quantity">Quantidade *</label>
                <input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFieldValue('quantity', parseInt(e.target.value) || 0)}
                  disabled={loading || isReadOnly}
                />
                {errors.quantity && <span className={styles.error}>{errors.quantity}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="paperType">Tipo de Papel *</label>
                <input
                  id="paperType"
                  type="text"
                  value={formData.paperType}
                  onChange={(e) => setFieldValue('paperType', e.target.value)}
                  disabled={loading || isReadOnly}
                  placeholder="Ex: Couchê 150g"
                />
                {errors.paperType && <span className={styles.error}>{errors.paperType}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="dimensions">Dimensões *</label>
                <input
                  id="dimensions"
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFieldValue('dimensions', e.target.value)}
                  disabled={loading || isReadOnly}
                  placeholder="Ex: 10x15cm"
                />
                {errors.dimensions && <span className={styles.error}>{errors.dimensions}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="salePrice">Preço de Venda (R$) *</label>
                <input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => setFieldValue('salePrice', parseFloat(e.target.value) || 0)}
                  disabled={loading || isReadOnly}
                />
                {errors.salePrice && <span className={styles.error}>{errors.salePrice}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="productionCost">Custo Estimado (R$) *</label>
                <input
                  id="productionCost"
                  type="number"
                  step="0.01"
                  value={formData.productionCost}
                  onChange={(e) => setFieldValue('productionCost', parseFloat(e.target.value) || 0)}
                  disabled={loading || isReadOnly}
                />
                {errors.productionCost && <span className={styles.error}>{errors.productionCost}</span>}
              </div>
            </div>

            {errors.form && <div className={styles.formError}>{errors.form}</div>}

            {isEditing && (
              <OrderFileUpload 
                attachments={attachments}
                onUpload={handleUpload}
                onDelete={handleDeleteAttachment}
                loading={uploading}
                disabled={isReadOnly}
              />
            )}

            <footer className={styles.footer}>
              <button type="button" onClick={onClose} className={styles.cancelButton} disabled={loading}>
                Cancelar
              </button>
              {!isReadOnly && (
                <button type="submit" className={styles.saveButton} disabled={loading}>
                  {loading ? 'Salvando...' : isEditing ? 'Atualizar Pedido' : 'Criar Pedido'}
                </button>
              )}
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
