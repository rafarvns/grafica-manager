import React, { useState } from 'react';
import { PdfPreviewModal } from '@/components/ui/PdfPreviewModal';

/**
 * Exemplo de como usar o PdfPreviewModal em um componente de domínio.
 * Este arquivo é um padrão de implementação para spec 0006.
 */

interface PdfPreviewExampleProps {
  // Path do PDF a visualizar
  pdfPath?: string;
  // Callback ao fechar
  onClose?: () => void;
}

export function PdfPreviewExample({ pdfPath, onClose }: PdfPreviewExampleProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPdfPath, setSelectedPdfPath] = useState<string | null>(pdfPath || null);

  const handleOpenPreview = (path: string) => {
    setSelectedPdfPath(path);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    onClose?.();
  };

  return (
    <>
      {/* Exemplo: Botão para abrir PDF preview */}
      <div>
        <button onClick={() => handleOpenPreview('/path/to/document.pdf')}>
          Visualizar PDF
        </button>
      </div>

      {/* Modal de preview */}
      <PdfPreviewModal
        isOpen={modalOpen}
        filePath={selectedPdfPath}
        onClose={handleCloseModal}
      />
    </>
  );
}

/**
 * Padrão de integração em OrderDetailsSection ou similar:
 *
 * export function OrderDetailsSection({ order }: { order: Order }) {
 *   const [pdfModalOpen, setPdfModalOpen] = useState(false);
 *   const [selectedPdfPath, setSelectedPdfPath] = useState<string | null>(null);
 *
 *   const handleViewPdf = (filePath: string) => {
 *     setSelectedPdfPath(filePath);
 *     setPdfModalOpen(true);
 *   };
 *
 *   return (
 *     <>
 *       <section>
 *         {order.attachments?.map((file) => (
 *           <div key={file.id}>
 *             {file.type === 'pdf' && (
 *               <button onClick={() => handleViewPdf(file.path)}>
 *                 📄 Ver PDF: {file.name}
 *               </button>
 *             )}
 *           </div>
 *         ))}
 *       </section>
 *
 *       <PdfPreviewModal
 *         isOpen={pdfModalOpen}
 *         filePath={selectedPdfPath}
 *         onClose={() => setPdfModalOpen(false)}
 *       />
 *     </>
 *   );
 * }
 */
