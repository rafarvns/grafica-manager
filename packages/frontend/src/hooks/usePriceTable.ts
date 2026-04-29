import { useState, useEffect, useCallback } from 'react';
import { priceTableService } from '@/services/priceTableService';
import { useToast } from './useToast';
import type { PriceTableEntry, CreatePriceTableEntryDTO, UpdatePriceTableEntryDTO } from '@grafica/shared/types';

export function usePriceTable() {
  const [prices, setPrices] = useState<PriceTableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await priceTableService.getPrices();
      setPrices(data);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar preços';
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const createPrice = useCallback(
    async (data: CreatePriceTableEntryDTO) => {
      try {
        setLoading(true);
        const newPrice = await priceTableService.createPrice(data);
        addToast({ message: 'Preço criado com sucesso', type: 'success' });
        await fetchPrices();
        return newPrice;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao criar preço';
        addToast({ message: msg, type: 'error' });
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addToast, fetchPrices]
  );

  const updatePrice = useCallback(
    async (id: string, data: UpdatePriceTableEntryDTO) => {
      try {
        setLoading(true);
        const updated = await priceTableService.updatePrice(id, data);
        addToast({ message: 'Preço atualizado com sucesso', type: 'success' });
        await fetchPrices();
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao atualizar preço';
        addToast({ message: msg, type: 'error' });
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addToast, fetchPrices]
  );

  const deletePrice = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        await priceTableService.deletePrice(id);
        addToast({ message: 'Preço removido com sucesso', type: 'success' });
        await fetchPrices();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao remover preço';
        addToast({ message: msg, type: 'error' });
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addToast, fetchPrices]
  );

  return {
    prices,
    loading,
    error,
    fetchPrices,
    createPrice,
    updatePrice,
    deletePrice,
  };
}
