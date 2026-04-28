import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const settings = await prisma.systemSettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      name: 'Gráfica Manager',
      cnpj: '00.000.000/0000-00',
      phone: '(11) 99999-9999',
      email: 'contato@grafica.com',
      address_street: 'Rua Exemplo',
      address_number: '123',
      address_city: 'São Paulo',
      address_state: 'SP',
      address_zip: '00000-000',
    },
  });
  console.log('Seed: System settings initialized.', settings.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
