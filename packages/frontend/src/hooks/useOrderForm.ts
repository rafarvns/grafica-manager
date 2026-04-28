import { useState, useCallback } from 'react';
import { CreateOrderDTO, Order, UpdateOrderDTO } from '@grafica/shared';
import { orderService } from '@/services/OrderService';

interface UseOrderFormOptions {
  initialOrder?: Order | null | undefined;
  onSuccess?: () => void;
}

export function useOrderForm({ initialOrder, onSuccess }: UseOrderFormOptions = {}) {
  const [formData, setFormData] = useState<CreateOrderDTO>({
    customerId: initialOrder?.customerId || '',
    description: initialOrder?.description || '',
    quantity: initialOrder?.quantity || 1,
    paperType: initialOrder?.paperType || '',
    dimensions: initialOrder?.dimensions || '',
    deadline: initialOrder?.deadline || '',
    salePrice: initialOrder?.salePrice || 0,
    productionCost: initialOrder?.productionCost || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const setFieldValue = useCallback((field: keyof CreateOrderDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) newErrors.customerId = 'Cliente é obrigatório';
    if (!formData.description) newErrors.description = 'Descrição é obrigatória';
    else if (formData.description.length < 10) newErrors.description = 'Mínimo 10 caracteres';
    
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Deve ser maior que zero';
    if (!formData.paperType) newErrors.paperType = 'Tipo de papel é obrigatório';
    if (!formData.dimensions) newErrors.dimensions = 'Dimensões são obrigatórias';
    if (!formData.deadline) newErrors.deadline = 'Data limite é obrigatória';
    if (formData.salePrice < 0) newErrors.salePrice = 'Preço não pode ser negativo';
    if (formData.productionCost < 0) newErrors.productionCost = 'Custo não pode ser negativo';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const submit = async () => {
    if (!validate()) return false;

    setLoading(true);
    try {
      if (initialOrder) {
        await orderService.updateOrder(initialOrder.id, formData as UpdateOrderDTO);
      } else {
        await orderService.createOrder(formData);
      }
      onSuccess?.();
      return true;
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Erro ao salvar pedido' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    errors,
    loading,
    setFieldValue,
    submit,
    isEditing: !!initialOrder,
  };
}
