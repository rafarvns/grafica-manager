import { describe, it, expect } from 'vitest';
import { PeriodFilter } from '@/domain/value-objects/PeriodFilter';

describe('PeriodFilter', () => {
  describe('today()', () => {
    it('deve criar período com início às 00:00:00 do dia atual', () => {
      const period = PeriodFilter.today();
      const now = new Date();
      expect(period.from.getFullYear()).toBe(now.getFullYear());
      expect(period.from.getMonth()).toBe(now.getMonth());
      expect(period.from.getDate()).toBe(now.getDate());
      expect(period.from.getHours()).toBe(0);
      expect(period.from.getMinutes()).toBe(0);
      expect(period.from.getSeconds()).toBe(0);
    });

    it('deve criar período com fim às 23:59:59 do dia atual', () => {
      const period = PeriodFilter.today();
      expect(period.to.getHours()).toBe(23);
      expect(period.to.getMinutes()).toBe(59);
      expect(period.to.getSeconds()).toBe(59);
    });

    it('deve ter preset "today"', () => {
      expect(PeriodFilter.today().preset).toBe('today');
    });

    it('deve ter 1 dia', () => {
      expect(PeriodFilter.today().getDays()).toBe(1);
    });
  });

  describe('thisWeek()', () => {
    it('deve iniciar na segunda-feira da semana atual', () => {
      const period = PeriodFilter.thisWeek();
      expect(period.from.getDay()).toBe(1);
    });

    it('deve terminar no domingo da semana atual', () => {
      const period = PeriodFilter.thisWeek();
      expect(period.to.getDay()).toBe(0);
    });

    it('deve cobrir exatamente 7 dias', () => {
      expect(PeriodFilter.thisWeek().getDays()).toBe(7);
    });

    it('deve ter preset "thisWeek"', () => {
      expect(PeriodFilter.thisWeek().preset).toBe('thisWeek');
    });
  });

  describe('thisMonth()', () => {
    it('deve iniciar no primeiro dia do mês corrente', () => {
      const period = PeriodFilter.thisMonth();
      expect(period.from.getDate()).toBe(1);
    });

    it('deve terminar no último dia do mês corrente', () => {
      const period = PeriodFilter.thisMonth();
      const now = new Date();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      expect(period.to.getDate()).toBe(lastDay);
    });

    it('deve começar à meia-noite', () => {
      const period = PeriodFilter.thisMonth();
      expect(period.from.getHours()).toBe(0);
    });

    it('deve ter preset "thisMonth"', () => {
      expect(PeriodFilter.thisMonth().preset).toBe('thisMonth');
    });
  });

  describe('lastSevenDays()', () => {
    it('deve cobrir exatamente 7 dias', () => {
      expect(PeriodFilter.lastSevenDays().getDays()).toBe(7);
    });

    it('deve terminar hoje (23:59:59)', () => {
      const period = PeriodFilter.lastSevenDays();
      const now = new Date();
      expect(period.to.getDate()).toBe(now.getDate());
      expect(period.to.getHours()).toBe(23);
    });

    it('deve ter preset "lastSevenDays"', () => {
      expect(PeriodFilter.lastSevenDays().preset).toBe('lastSevenDays');
    });
  });

  describe('custom()', () => {
    it('deve criar período com as datas fornecidas', () => {
      const from = new Date('2024-01-01T00:00:00');
      const to = new Date('2024-01-31T23:59:59');
      const period = PeriodFilter.custom(from, to);
      expect(period.from).toEqual(from);
      expect(period.to).toEqual(to);
    });

    it('deve aceitar from igual a to (mesmo dia)', () => {
      const date = new Date('2024-01-15');
      expect(() => PeriodFilter.custom(date, date)).not.toThrow();
    });

    it('deve lançar erro quando from é posterior a to', () => {
      const from = new Date('2024-01-31');
      const to = new Date('2024-01-01');
      expect(() => PeriodFilter.custom(from, to)).toThrow(
        'Data inicial deve ser anterior ou igual à data final'
      );
    });

    it('deve ter preset "custom"', () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-01-31');
      expect(PeriodFilter.custom(from, to).preset).toBe('custom');
    });
  });

  describe('getDays()', () => {
    it('deve retornar 1 para um período de mesmo dia', () => {
      const date = new Date('2024-01-15');
      expect(PeriodFilter.custom(date, date).getDays()).toBe(1);
    });

    it('deve retornar 31 para janeiro completo', () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-01-31');
      expect(PeriodFilter.custom(from, to).getDays()).toBe(31);
    });

    it('deve retornar 2 para dois dias consecutivos', () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-01-02');
      expect(PeriodFilter.custom(from, to).getDays()).toBe(2);
    });
  });

  describe('contains()', () => {
    const from = new Date('2024-01-01');
    const to = new Date('2024-01-31');

    it('deve retornar true para data dentro do período', () => {
      const period = PeriodFilter.custom(from, to);
      expect(period.contains(new Date('2024-01-15'))).toBe(true);
    });

    it('deve retornar true para data no limite inferior', () => {
      const period = PeriodFilter.custom(from, to);
      expect(period.contains(from)).toBe(true);
    });

    it('deve retornar true para data no limite superior', () => {
      const period = PeriodFilter.custom(from, to);
      expect(period.contains(to)).toBe(true);
    });

    it('deve retornar false para data anterior ao período', () => {
      const period = PeriodFilter.custom(from, to);
      expect(period.contains(new Date('2023-12-31'))).toBe(false);
    });

    it('deve retornar false para data posterior ao período', () => {
      const period = PeriodFilter.custom(from, to);
      expect(period.contains(new Date('2024-02-01'))).toBe(false);
    });
  });
});
