import { Customer } from '@/hooks/useCustomers';
import styles from './CustomerTable.module.css';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customerId: string) => void;
  onDelete: (customerId: string) => void;
}

export function CustomerTable({ customers, onEdit, onDelete }: CustomerTableProps) {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table} data-testid="customers-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Cidade</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className={styles.row}
              onClick={() => onEdit(customer.id)}
              data-testid="customer-row"
            >
              <td className={styles.name}>{customer.name}</td>
              <td className={styles.email}>{customer.email}</td>
              <td className={styles.phone}>{customer.phone || '-'}</td>
              <td className={styles.city}>{customer.city || '-'}</td>
              <td className={styles.actions}>
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
                  data-testid="delete-customer-button"
                >
                  Deletar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
