import { Customer } from '@/hooks/useCustomers';
import styles from './CustomerTable.module.css';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customerId: string) => void;
  onDelete: (customerId: string) => void;
  onViewDetails: (customerId: string) => void;
  activeOrderCounts: Record<string, number>;
}

export function CustomerTable({
  customers,
  onEdit,
  onDelete,
  onViewDetails,
  activeOrderCounts,
}: CustomerTableProps) {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table} data-testid="customers-table" role="table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Email</th>
            <th scope="col">Telefone</th>
            <th scope="col">Cidade</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => {
            const hasActiveOrders = (activeOrderCounts[customer.id] || 0) > 0;

            return (
              <tr
                key={customer.id}
                className={styles.row}
                onClick={() => onViewDetails(customer.id)}
                data-testid="customer-row"
              >
                <td className={styles.name}>{customer.name}</td>
                <td className={styles.email}>{customer.email}</td>
                <td className={styles.phone}>{customer.phone || '-'}</td>
                <td className={styles.city}>{customer.city || '-'}</td>
                <td className={styles.actions}>
                  <button
                    className={styles.viewButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(customer.id);
                    }}
                  >
                    Ver Detalhes
                  </button>
                  <button
                    className={styles.editButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(customer.id);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(customer.id);
                    }}
                    disabled={hasActiveOrders}
                    title={
                      hasActiveOrders
                        ? 'Não é possível deletar cliente com pedidos ativos'
                        : undefined
                    }
                    data-testid="delete-customer-button"
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
