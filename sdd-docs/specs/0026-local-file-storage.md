# Feature: Servidor de Arquivos Local (File Storage)

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar o sistema de armazenamento local de arquivos (design PDFs, mockups, documentos) associados a pedidos. Inclui endpoints para upload, listagem e download; estrutura de pastas organizada por pedido; validação de tipos de arquivo; e política de retenção (limpeza de arquivos de pedidos concluídos há > X dias). Arquivos nunca são deletados manualmente pelo usuário — apenas pela política de retenção automática.

## Requisitos Funcionais

- [ ] RF1 — API POST `/api/orders/:orderId/attachments` — Upload de arquivo, retorna ID e URL relativa
- [ ] RF2 — API GET `/api/orders/:orderId/attachments` — Listar arquivos do pedido com tamanho, tipo, data upload
- [ ] RF3 — API GET `/api/orders/:orderId/attachments/:fileId` — Download de arquivo (streaming)
- [ ] RF4 — API DELETE `/api/orders/:orderId/attachments/:fileId` — Marcar arquivo para deleção (soft-delete)
- [ ] RF5 — Estrutura de pastas: `files/orders/{orderId}/{uuid}.{ext}` (ex: `files/orders/ORD-001/abc123.pdf`)
- [ ] RF6 — Validação de upload:
  - [ ] RF6a — Tipos aceitos: PDF, PNG, JPG, GIF (max 10MB por arquivo)
  - [ ] RF6b — Rejeitar tipos perigosos (EXE, BAT, SCR, VBS, etc.)
  - [ ] RF6c — Validar MIME type (não confiar apenas em extensão)
- [ ] RF7 — Política de retenção automática:
  - [ ] RF7a — Job cron diário que deleta arquivos de pedidos com status "cancelled" ou "shipping" há > 90 dias
  - [ ] RF7b — Não deletar pedidos "draft", "scheduled", "in_production", "completed" (ainda em transição)
  - [ ] RF7c — Log de deleção: registrar quantos arquivos foram deletados, liberar espaço em disco
- [ ] RF8 — Frontend: não exibe botão "Deletar" — arquivos são imutáveis durante vida do pedido (soft-delete não visível)
- [ ] RF9 — Prévia de arquivo: suporte a preview inline para PDF (spec 0006), PNG, JPG
- [ ] RF10 — Controle de acesso (futuro): usuário só acessa arquivos de seus pedidos (autenticação)

## Requisitos Não-Funcionais

- [ ] RNF1 — Armazenamento em disco local, caminho configurável via `FILE_STORAGE_PATH` env
- [ ] RNF2 — Download com streaming (não carrega arquivo inteiro em memória)
- [ ] RNF3 — Upload com validação de MIME type via `file-type` lib (leve)
- [ ] RNF4 — Cron job com job queue (Bull, spec 0002)
- [ ] RNF5 — Quotas: avisar se pasta exceder 1GB (opcional para MVP)

## Critérios de Aceite

### Cenário 1: Upload de arquivo em novo pedido
- **Given** usuário criando pedido em `/orders` → formulário com campo "Adicionar Arquivo"
- **When** seleciona `design.pdf` (500KB)
- **Then** arquivo é enviado via POST `/api/orders/{orderId}/attachments` durante salvamento do pedido
- **Then** resposta contém: { id: "file-123", filename: "design.pdf", size: 500000, url: "/files/orders/ORD-001/file-123.pdf" }
- **Then** arquivo é salvo em disco em `files/orders/ORD-001/file-123.pdf`

### Cenário 2: Listar arquivos do pedido
- **Given** pedido ORD-001 com 3 arquivos
- **When** frontend faz GET `/api/orders/ORD-001/attachments`
- **Then** resposta lista: [{ id, filename, size, uploadedAt, type }] com 3 entradas

### Cenário 3: Download de arquivo
- **Given** arquivo `design.pdf` listado
- **When** usuário clica para baixar
- **Then** browser faz GET `/api/orders/ORD-001/attachments/file-123`
- **Then** header `Content-Disposition: attachment; filename="design.pdf"` força download
- **Then** arquivo é enviado com streaming

### Cenário 4: Preview inline de PDF
- **Given** arquivo PDF listado em seção de "Arquivos" do pedido
- **When** usuário clica para visualizar preview (não baixar)
- **Then** modal abre com PDF Preview (spec 0006) exibindo PDF inline

### Cenário 5: Validação de tipo de arquivo
- **Given** usuário tenta fazer upload de `script.exe`
- **When** enviar arquivo
- **Then** erro: "Tipo de arquivo não permitido. Aceitos: PDF, PNG, JPG, GIF"
- **Then** upload é bloqueado

### Cenário 6: Validação de tamanho
- **Given** usuário tenta upload de arquivo > 10MB
- **When** enviar
- **Then** erro: "Arquivo deve ter máximo 10MB"
- **Then** upload bloqueado

### Cenário 7: Soft-delete de arquivo
- **Given** arquivo listado em pedido (não há botão "deletar" visível)
- **When** admin deletar via API DELETE `/api/orders/ORD-001/attachments/file-123`
- **Then** arquivo é marcado como `deletedAt` (soft-delete)
- **When** GET `/api/orders/ORD-001/attachments`
- **Then** arquivo não aparece mais (filtrado `deletedAt IS NULL`)
- **Then** arquivo ainda existe em disco (não é deletado fisicamente)

### Cenário 8: Retenção automática — pedido shipped
- **Given** pedido ORD-001 com status "shipping", criado em "2025-12-01"
- **Given** hoje é "2026-04-27" (149 dias depois, > 90 dias)
- **When** cron job de retenção roda
- **Then** job detecta: status="shipping" E idade > 90 dias
- **Then** arquivos do pedido são deletados fisicamente
- **Then** log registra: "Deletados 3 arquivos de ORD-001 (shipping, 149 dias)"

### Cenário 9: Retenção automática — não deleta pedido ativo
- **Given** pedido ORD-002 com status "in_production", criado em "2025-12-01"
- **Given** hoje é "2026-04-27" (149 dias depois)
- **When** cron job roda
- **Then** job NÃO deleta: status é ativo (não cancelled/shipping)
- **Then** arquivos permanecem em disco

### Cenário 10: Criar pasta de pedido automaticamente
- **Given** novo pedido criado: ORD-099
- **When** primeiro arquivo é uploadado
- **Then** pasta `files/orders/ORD-099/` é criada automaticamente
- **Then** arquivo é salvo: `files/orders/ORD-099/abc123.pdf`

## API Contract

Backend expõe:
- `POST /api/orders/:orderId/attachments` — Upload de arquivo
- `GET /api/orders/:orderId/attachments` — Listar arquivos
- `GET /api/orders/:orderId/attachments/:fileId` — Download (streaming)
- `DELETE /api/orders/:orderId/attachments/:fileId` — Soft-delete

Não expostos ao frontend:
- `DELETE /api/files/{path}` — Delete físico (cron job apenas)

Documentar em `sdd-docs/api/files.yaml`.

## Dependências

- Specs relacionadas: [0010-manual-order-crud.md](0010-manual-order-crud.md), [0006-pdf-document-preview.md](0006-pdf-document-preview.md), [0020-order-detail-screen.md](0020-order-detail-screen.md)
- Pacotes/serviços externos: `file-type` (detecção MIME leve)
- ADRs relevantes: [0002-job-queue-bull-redis.md](0002-job-queue-bull-redis.md) (cron via Bull)

## Notas de Implementação

- **Domain Layer**:
  - `src/domain/entities/OrderAttachment.ts` — Entity imutável
  - `src/domain/repositories/OrderAttachmentRepository.ts` — Interface

- **Application Layer**:
  - `src/application/use-cases/UploadOrderAttachmentUseCase.ts`
  - `src/application/use-cases/ListOrderAttachmentsUseCase.ts`
  - `src/application/use-cases/DeleteOrderAttachmentUseCase.ts`
  - `src/application/use-cases/RetentionCleanupUseCase.ts`

- **Infrastructure Layer**:
  - `src/infrastructure/file-storage/LocalFileStorage.ts` — abstração para disco
  - `src/infrastructure/file-storage/validators/MimeTypeValidator.ts`
  - `src/infrastructure/database/repositories/PrismaOrderAttachmentRepository.ts`
  - `src/infrastructure/http/controllers/OrderAttachmentController.ts`
  - `src/infrastructure/http/routes/orderAttachments.ts`
  - `src/infrastructure/jobs/RetentionCleanupJob.ts` — cron (Bull)

- **Schema Prisma**:
  ```prisma
  model OrderAttachment {
    id String @id @default(uuid())
    orderId String
    order Order @relation(fields: [orderId], references: [id])
    filename String
    originalFilename String
    filepath String @unique // path no disco
    size Int
    mimeType String
    uploadedAt DateTime @default(now())
    deletedAt DateTime? // soft-delete
    
    @@index([orderId])
    @@index([deletedAt])
  }
  ```

- **Upload de arquivo**:
  ```typescript
  // src/infrastructure/file-storage/LocalFileStorage.ts
  export class LocalFileStorage {
    private basePath = process.env.FILE_STORAGE_PATH || './files';
    
    async upload(orderId: string, file: Express.Multer.File): Promise<string> {
      // Validar MIME type
      const mimeType = await fileType.fromBuffer(file.buffer);
      if (!ALLOWED_TYPES.includes(mimeType.mime)) {
        throw new InvalidMimeTypeError();
      }
      
      // Validar tamanho
      if (file.size > MAX_FILE_SIZE) {
        throw new FileTooLargeError();
      }
      
      // Criar pasta
      const orderPath = path.join(this.basePath, 'orders', orderId);
      await fs.mkdir(orderPath, { recursive: true });
      
      // Salvar com UUID
      const filename = `${uuidv4()}.${ext}`;
      const filepath = path.join(orderPath, filename);
      
      await fs.writeFile(filepath, file.buffer);
      return `files/orders/${orderId}/${filename}`;
    }
    
    async download(filepath: string): Promise<ReadStream> {
      const fullPath = path.join(this.basePath, filepath);
      return fs.createReadStream(fullPath);
    }
    
    async delete(filepath: string): Promise<void> {
      const fullPath = path.join(this.basePath, filepath);
      await fs.unlink(fullPath);
    }
  }
  ```

- **Cron job de retenção**:
  ```typescript
  // src/infrastructure/jobs/RetentionCleanupJob.ts
  export async function runRetentionCleanup() {
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const ordersToClean = await prisma.order.findMany({
      where: {
        status: { in: ['cancelled', 'shipping'] },
        updatedAt: { lt: cutoffDate }
      },
      include: { attachments: { where: { deletedAt: null } } }
    });
    
    let deletedCount = 0;
    for (const order of ordersToClean) {
      for (const attachment of order.attachments) {
        await fileStorage.delete(attachment.filepath);
        await prisma.orderAttachment.update({
          where: { id: attachment.id },
          data: { deletedAt: new Date() }
        });
        deletedCount++;
      }
    }
    
    logger.info(`Retention cleanup: deleted ${deletedCount} files from ${ordersToClean.length} orders`);
  }
  
  // Schedule with Bull (daily at 3 AM)
  retentionQueue.add('cleanup', {}, { repeat: { pattern: '0 3 * * *' } });
  ```

- **Tipos permitidos** (allowlist):
  ```typescript
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif'
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  ```

- **Frontend (em 0020 — Order Detail)**:
  - Componente `OrderFileUpload.tsx` com drag-drop
  - Validação de tamanho/tipo antes de upload
  - Preview inline para PDF/imagens
  - Button "Download" para cada arquivo
  - Não exibe "Delete" — soft-delete transparente

- **Testes esperados**:
  - Unit: validação de MIME type (permite PDF, rejeita EXE)
  - Unit: validação de tamanho (10MB limit)
  - Unit: cálculo de data de retenção (> 90 dias)
  - Integration: upload de arquivo, salvo em disco, DB atualizado
  - Integration: download de arquivo com streaming
  - Integration: soft-delete, arquivo desaparece de listagem mas existe em disco
  - Integration: cron job deleta arquivos de pedidos shipped/cancelled > 90 dias
  - E2E: upload arquivo em novo pedido → baixar → verificar conteúdo

- **Riscos**:
  - Espaço em disco: se uploads descontrolados, enche disco → implementar quotas/alertas
  - Segurança: upload de arquivo malicioso (trojan em imagem) → validar MIME stritamente, não executar
  - Concorrência: 2 uploads simultâneos do mesmo arquivo → UUID garante uniqueness
  - Cron falhando: se retention job falha, arquivos acumulam → monitorar logs, alertar
  - Corrupção: arquivo corrompido em disco → verificação de integridade (CRC?) opcional
  - Soft-delete acumulado: se muitos arquivos soft-deletados, pasta fica grande → hard-delete na retenção

- **Implementação sugerida (ordem)**:
  1. Criar modelo `OrderAttachment` no Prisma
  2. Executar migration
  3. Criar abstração `LocalFileStorage`
  4. Implementar validators (MIME, tamanho)
  5. Criar use case de upload
  6. Criar controller POST `/api/orders/:id/attachments`
  7. Criar use case de listagem
  8. Criar controller GET `/api/orders/:id/attachments`
  9. Implementar download (streaming)
  10. Criar use case de soft-delete
  11. Criar cron job de retenção (Bull)
  12. Integrar em OrderDetail (0020)
  13. Testes E2E

---

**Esta spec fornece armazenamento de arquivos para 0010 (Order CRUD), 0020 (Order Detail), 0006 (PDF Preview) e outros specs que mencionam upload/download.**
