# Feature: Configurações Globais do Sistema

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar armazenamento centralizado de dados da gráfica (nome, CNPJ, telefone, endereço, logo, email para notificações) que são exibidos em relatórios PDF, documentos impressos, e cabeçalhos de exportação. Estes dados mudam raramente e são compartilhados por toda a aplicação. Devem ser persistidos no banco (única fonte de verdade) e acessíveis via API.

## Requisitos Funcionais

- [ ] RF1 — Modelo de dados `SystemSettings` no banco com campos: nome, CNPJ, telefone, endereço (rua, número, complemento, cidade, estado, CEP), logo (arquivo), email, website (opcional)
- [ ] RF2 — API GET `/api/system-settings` — retorna configurações atuais
- [ ] RF3 — API PATCH `/api/system-settings` — atualizar configurações (requer autenticação futura)
- [ ] RF4 — Upload de logo: endpoint POST `/api/system-settings/logo` — recebe arquivo PNG/JPG, salva em disco local
- [ ] RF5 — Dados padrão (seed): se primeira execução, populam campos com placeholders (nome="Gráfica Manager", CNPJ="00.000.000/0000-00", etc.)
- [ ] RF6 — Cache em memória: dados carregados uma vez na inicialização, atualizados via cache invalidation ao fazer PATCH
- [ ] RF7 — Frontend: tela de edição em `/settings/company` com formulário para editar dados (futuro, quando tiver autenticação)

## Requisitos Não-Funcionais

- [ ] RNF1 — Logo armazenada em disco local (pasta configurável via env)
- [ ] RNF2 — Logo máximo 2MB, formatos: PNG, JPG
- [ ] RNF3 — Cache in-memory com validação (recarrega se não existir)
- [ ] RNF4 — Dados de sistema nunca são deletados (soft-delete não aplicável)
- [ ] RNF5 — CNPJ validado formato quando salvo (XX.XXX.XXX/XXXX-XX)

## Critérios de Aceite

### Cenário 1: Inicializar sistema
- **Given** aplicação inicia pela primeira vez (banco vazio)
- **When** seed é executado (`prisma db seed`)
- **Then** tabela `SystemSettings` é populada com dados padrão: nome="Gráfica Manager", CNPJ="00.000.000/0000-00", endereço placeholder, etc.

### Cenário 2: Recuperar configurações
- **Given** aplicação rodando
- **When** frontend faz GET `/api/system-settings`
- **Then** resposta JSON com: { name: "Gráfica Manager", cnpj: "12.345.678/0000-90", phone: "(11) 9999-9999", address: {...}, logoUrl: "...", email: "..." }

### Cenário 3: Usar logo em relatório PDF
- **Given** relatório é gerado
- **When** PDF inclui cabeçalho
- **Then** logo da gráfica é exibido (recuperado via GET `/api/system-settings`)
- **Then** logo é inline no PDF (base64 ou fetch)

### Cenário 4: Atualizar dados da gráfica (futuro)
- **Given** usuário autenticado em `/settings/company`
- **When** altera nome para "Nova Gráfica Ltda"
- **When** clica "Salvar"
- **Then** fetch PATCH `/api/system-settings` com novo nome
- **Then** cache é invalidado, próximas requisições retornam dados novos

### Cenário 5: Upload de logo
- **Given** formulário de edição de configurações
- **When** usuário clica "Enviar Logo"
- **When** seleciona arquivo PNG (800x200px)
- **When** clica "Upload"
- **Then** arquivo é enviado para POST `/api/system-settings/logo`
- **Then** arquivo é salvo em `files/system/logo.png`, caminho é retornado
- **Then** campo logoUrl é atualizado no banco
- **Then** toast "Logo atualizada com sucesso"

### Cenário 6: Validação de CNPJ
- **Given** formulário com campo de CNPJ
- **When** usuário digita "invalid.cnpj"
- **When** clica "Salvar"
- **Then** erro inline: "CNPJ inválido. Use formato: XX.XXX.XXX/XXXX-XX"

## API Contract

Backend expõe:
- `GET /api/system-settings` — Recuperar configurações
- `PATCH /api/system-settings` — Atualizar configurações (futuro: autenticação)
- `POST /api/system-settings/logo` — Upload de logo
- `DELETE /api/system-settings/logo` — Remover logo

Documentar em `sdd-docs/api/system-settings.yaml`.

## Dependências

- Specs relacionadas: [0016-detailed-reports.md](0016-detailed-reports.md) (PDF com cabeçalho), [0024-reports-screen.md](0024-reports-screen.md) (export PDF)
- Pacotes/serviços externos: nenhum
- ADRs relevantes: nenhum

## Notas de Implementação

- **Domain Layer**:
  - `src/domain/entities/SystemSettings.ts` — Value Object ou Entity imutável
  - Validar CNPJ com regex: `/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/`

- **Application Layer**:
  - `src/application/use-cases/GetSystemSettingsUseCase.ts`
  - `src/application/use-cases/UpdateSystemSettingsUseCase.ts`
  - `src/application/use-cases/UploadLogoUseCase.ts`

- **Infrastructure Layer**:
  - `src/infrastructure/database/repositories/SystemSettingsRepository.ts` (interface em domain)
  - `src/infrastructure/database/prisma/repositories/PrismaSystemSettingsRepository.ts`
  - `src/infrastructure/file-storage/FileStorageService.ts` (salvar logo em disco)
  - `src/infrastructure/config/cache.ts` — cache em memória simples
  - `src/infrastructure/http/controllers/SystemSettingsController.ts`
  - `src/infrastructure/http/routes/systemSettings.ts`

- **Schema Prisma**:
  ```prisma
  model SystemSettings {
    id String @id @default(uuid())
    name String
    cnpj String
    phone String
    email String
    website String?
    address_street String
    address_number String
    address_complement String?
    address_city String
    address_state String
    address_zip String
    logoPath String?
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```

- **Cache em memória**:
  ```typescript
  let cachedSettings: SystemSettings | null = null;
  
  async function getSystemSettings(): Promise<SystemSettings> {
    if (!cachedSettings) {
      cachedSettings = await repository.find();
    }
    return cachedSettings;
  }
  
  async function updateSystemSettings(data: Partial<SystemSettings>) {
    const updated = await repository.update(data);
    cachedSettings = updated; // invalidate
    return updated;
  }
  ```

- **Upload de logo**:
  - Validar tipo MIME (image/png, image/jpeg)
  - Validar tamanho (<= 2MB)
  - Salvar em pasta configurável: `process.env.FILE_STORAGE_PATH || './files/system'`
  - Nome de arquivo: `logo_${Date.now()}.${ext}` (para versionamento)
  - Manter apenas última logo (deletar anterior se houver)
  - Retornar URL relativa: `/files/system/logo_1234567890.png`

- **Frontend (futuro)**:
  - Tela `/settings/company` com formulário (após autenticação)
  - Componente `CompanySettingsForm.tsx`
  - Hook `useCompanySettings.ts`
  - Service `companySettingsService.ts`

- **Seed**:
  ```typescript
  // prisma/seed.ts
  const systemSettings = await prisma.systemSettings.upsert({
    where: { id: 'default' }, // ou usar findFirst()
    update: {},
    create: {
      name: 'Gráfica Manager',
      cnpj: '00.000.000/0000-00',
      phone: '(11) 99999-9999',
      email: 'contato@grafica.com',
      address_street: 'Rua Exemplo',
      address_number: '123',
      address_city: 'São Paulo',
      address_state: 'SP',
      address_zip: '00000-000'
    }
  });
  ```

- **Testes esperados**:
  - Unit: validação de CNPJ (regex)
  - Unit: cálculo de tamanho de arquivo (< 2MB)
  - Integration: GET `/api/system-settings` retorna dados
  - Integration: PATCH `/api/system-settings` atualiza e invalida cache
  - Integration: POST `/api/system-settings/logo` salva arquivo e atualiza path
  - E2E (futuro): abrir tela de configurações → editar nome → salvaa → verificar em relatório PDF

- **Riscos**:
  - Concorrência: 2 usuários fazem upload logo simultâneos → sobrescreve anterior (mitigar com mutex ou fila)
  - Disco cheio: logo grande ou erro de escrita → tratamento de erro
  - Segurança: logo com código malicioso (SVG com script) → validar MIME stritamente (PNG/JPG)
  - Cache desincronizado: se aplicação tiver múltiplas instâncias, cache local não sincroniza (mitigar com cache distribuído futura)

- **Implementação sugerida (ordem)**:
  1. Criar modelo `SystemSettings` no Prisma
  2. Executar migration
  3. Criar seed com dados padrão
  4. Criar repository e use case de leitura
  5. Criar controller GET `/api/system-settings`
  6. Implementar cache em memória
  7. Criar use case de update (futuro)
  8. Criar use case de upload logo
  9. Criar controller PATCH e POST logo
  10. Validação de CNPJ
  11. Testes unitários e integração
  12. Frontend (futuro): tela `/settings/company`

---

**Esta spec fornece dados compartilhados para 0016 (Relatórios) e 0024 (Tela de Relatórios) na forma de cabeçalho/branding.**
