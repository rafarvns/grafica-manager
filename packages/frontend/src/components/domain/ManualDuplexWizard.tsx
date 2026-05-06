import React, { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import {
  computeManualDuplexPasses,
  formatPagesParam,
  type ManualDuplexFlip,
} from '@/utils/manualDuplex';
import type { PrintJobResult } from '@/types/printer';
import styles from './ManualDuplexWizard.module.css';

export interface ManualDuplexCompletion {
  status: 'success' | 'cancelled' | 'error';
  partial: boolean;
  errorMessage?: string;
}

interface ManualDuplexWizardProps {
  isOpen: boolean;
  onClose: () => void;
  totalPages: number;
  flipType: ManualDuplexFlip;
  printerName: string;
  documentName: string;
  /** Executa uma passagem; recebe pages CSV ("1,3,5") e devolve PrintJobResult. */
  onRunPass: (pagesCsv: string) => Promise<PrintJobResult>;
  /** Chamado quando o wizard fecha (sucesso, cancel ou erro). */
  onComplete: (result: ManualDuplexCompletion) => void;
}

type Step = 'confirm' | 'printing-front' | 'flip' | 'printing-back' | 'done' | 'error';

export function ManualDuplexWizard({
  isOpen,
  onClose,
  totalPages,
  flipType,
  printerName,
  documentName,
  onRunPass,
  onComplete,
}: ManualDuplexWizardProps) {
  const [step, setStep] = useState<Step>('confirm');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const passes = computeManualDuplexPasses(totalPages);
  const sheetsCount = passes.pass1.length;

  const reset = useCallback(() => {
    setStep('confirm');
    setErrorMessage('');
    setConfirmingCancel(false);
  }, []);

  const closeAndReset = useCallback((completion: ManualDuplexCompletion) => {
    onComplete(completion);
    reset();
    onClose();
  }, [onComplete, onClose, reset]);

  const handleStart = useCallback(async () => {
    setStep('printing-front');
    const result = await onRunPass(formatPagesParam(passes.pass1));
    if (result.status === 'success') {
      setStep('flip');
    } else if (result.status === 'cancelled') {
      closeAndReset({ status: 'cancelled', partial: false });
    } else {
      setErrorMessage(result.error);
      setStep('error');
    }
  }, [onRunPass, passes.pass1, closeAndReset]);

  const handlePrintBack = useCallback(async () => {
    setStep('printing-back');
    const result = await onRunPass(formatPagesParam(passes.pass2));
    if (result.status === 'success') {
      setStep('done');
    } else if (result.status === 'cancelled') {
      closeAndReset({ status: 'cancelled', partial: true });
    } else {
      setErrorMessage(result.error);
      setStep('error');
    }
  }, [onRunPass, passes.pass2, closeAndReset]);

  const handleRetryFromError = useCallback(() => {
    // Retomada simplificada: volta ao passo de virada para usuário decidir.
    setStep('flip');
    setErrorMessage('');
  }, []);

  const handleCancelFromFlip = useCallback(() => {
    if (!confirmingCancel) {
      setConfirmingCancel(true);
      return;
    }
    closeAndReset({ status: 'cancelled', partial: true });
  }, [confirmingCancel, closeAndReset]);

  const handleCloseDone = useCallback(() => {
    closeAndReset({ status: 'success', partial: false });
  }, [closeAndReset]);

  const handleCloseFromConfirm = useCallback(() => {
    closeAndReset({ status: 'cancelled', partial: false });
  }, [closeAndReset]);

  // Bloqueia fechamento via Escape/backdrop em meio às passagens (uso direto do onClose abaixo).
  const safeOnClose = () => {
    if (step === 'printing-front' || step === 'printing-back') return;
    if (step === 'flip') {
      handleCancelFromFlip();
      return;
    }
    if (step === 'confirm') {
      handleCloseFromConfirm();
      return;
    }
    handleCloseDone();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={safeOnClose} title="Frente e verso manual">
      {step === 'confirm' && (
        <div className={styles.body}>
          <p className={styles.intro}>
            Vamos imprimir <strong>{documentName}</strong> em duas passagens na impressora{' '}
            <strong>{printerName}</strong>.
          </p>
          <ul className={styles.summary}>
            <li>📄 Total de páginas: <strong>{totalPages}</strong></li>
            <li>🖨️ Folhas usadas: <strong>{sheetsCount}</strong></li>
            <li>1️⃣ Primeiro: imprime a <strong>frente</strong> ({passes.pass1.length} {passes.pass1.length === 1 ? 'página' : 'páginas'})</li>
            <li>🔄 Você vira o maço de folhas seguindo as instruções na tela</li>
            <li>2️⃣ Depois: imprime o <strong>verso</strong> ({passes.pass2.length} {passes.pass2.length === 1 ? 'página' : 'páginas'})</li>
            {passes.hasOrphanLastPage && (
              <li className={styles.note}>
                ℹ️ Como o documento tem número ímpar de páginas, a última folha ficará só com frente impressa.
              </li>
            )}
          </ul>
          <p className={styles.tip}>
            💡 Antes de começar, garanta que há papel suficiente na bandeja ({sheetsCount} {sheetsCount === 1 ? 'folha' : 'folhas'}).
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={handleCloseFromConfirm}>
              Cancelar
            </button>
            <button type="button" className={styles.primaryButton} onClick={handleStart}>
              Iniciar impressão
            </button>
          </div>
        </div>
      )}

      {step === 'printing-front' && (
        <div className={styles.body}>
          <div className={styles.spinner} aria-label="Imprimindo" />
          <p className={styles.statusText}>Imprimindo a frente das folhas…</p>
          <p className={styles.subtleText}>Páginas: {passes.pass1.join(', ')}</p>
        </div>
      )}

      {step === 'flip' && (
        <div className={styles.body}>
          <h3 className={styles.flipTitle}>Vire as folhas e recoloque na bandeja</h3>
          <FlipIllustration type={flipType} />
          <ol className={styles.steps}>
            <li>Retire as folhas da saída <strong>sem mexer na ordem</strong>.</li>
            <li>
              Vire o maço {flipType === 'long' ? <>pelo <strong>lado mais longo</strong> (como abrir um livro)</> : <>pelo <strong>lado mais curto</strong> (como abrir um caderno espiral)</>}.
            </li>
            <li>Coloque o maço de volta na bandeja com a parte impressa virada para baixo.</li>
          </ol>
          <p className={styles.tip}>
            💡 Dica: a página 1 deve ficar embaixo do maço; a última página ímpar (página{' '}
            <strong>{passes.pass1[passes.pass1.length - 1]}</strong>) deve ficar em cima.
          </p>
          {confirmingCancel ? (
            <div className={styles.cancelConfirm}>
              <p>
                ⚠️ A frente já foi impressa. Cancelar agora deixará o documento incompleto. Tem certeza?
              </p>
              <div className={styles.actions}>
                <button type="button" className={styles.cancelButton} onClick={() => setConfirmingCancel(false)}>
                  Voltar
                </button>
                <button type="button" className={styles.dangerButton} onClick={handleCancelFromFlip}>
                  Sim, cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.actions}>
              <button type="button" className={styles.cancelButton} onClick={handleCancelFromFlip}>
                Cancelar
              </button>
              <button type="button" className={styles.primaryButton} onClick={handlePrintBack}>
                Já recoloquei, imprimir verso
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'printing-back' && (
        <div className={styles.body}>
          <div className={styles.spinner} aria-label="Imprimindo" />
          <p className={styles.statusText}>Imprimindo o verso das folhas…</p>
          <p className={styles.subtleText}>Páginas: {passes.pass2.join(', ')}</p>
        </div>
      )}

      {step === 'done' && (
        <div className={styles.body}>
          <div className={styles.successIcon} aria-hidden="true">✅</div>
          <h3 className={styles.flipTitle}>Documento impresso frente e verso!</h3>
          {passes.hasOrphanLastPage && (
            <p className={styles.note}>
              ℹ️ A última página (página {totalPages}) ficou só com frente impressa, pois o documento tem número ímpar de páginas.
            </p>
          )}
          <div className={styles.actions}>
            <button type="button" className={styles.primaryButton} onClick={handleCloseDone}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {step === 'error' && (
        <div className={styles.body}>
          <div className={styles.errorIcon} aria-hidden="true">⚠️</div>
          <h3 className={styles.flipTitle}>Erro na impressão</h3>
          <p className={styles.subtleText}>{errorMessage || 'Falha desconhecida.'}</p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => closeAndReset({ status: 'error', partial: true, errorMessage })}
            >
              Fechar
            </button>
            <button type="button" className={styles.primaryButton} onClick={handleRetryFromError}>
              Tentar novamente
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function FlipIllustration({ type }: { type: ManualDuplexFlip }) {
  if (type === 'long') {
    // Vira pelo lado longo (vertical em retrato) — eixo vertical, como abrir um livro.
    return (
      <svg className={styles.illustration} viewBox="0 0 320 140" aria-hidden="true">
        <rect x="20" y="20" width="80" height="100" rx="4" fill="#e0e7ff" stroke="#6366f1" strokeWidth="2" />
        <text x="60" y="75" textAnchor="middle" fill="#1e1b4b" fontSize="14" fontFamily="sans-serif">FRENTE</text>
        <path
          d="M 130 70 C 145 50, 175 50, 190 70 L 185 65 M 190 70 L 185 75"
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <text x="160" y="100" textAnchor="middle" fill="#6366f1" fontSize="11" fontFamily="sans-serif">vira como livro</text>
        <rect x="220" y="20" width="80" height="100" rx="4" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
        <text x="260" y="75" textAnchor="middle" fill="#78350f" fontSize="14" fontFamily="sans-serif">VERSO</text>
        <text x="260" y="92" textAnchor="middle" fill="#78350f" fontSize="9" fontFamily="sans-serif">(em branco)</text>
      </svg>
    );
  }
  // Vira pelo lado curto (horizontal em retrato) — eixo horizontal, como bloco/caderno espiral.
  return (
    <svg className={styles.illustration} viewBox="0 0 320 140" aria-hidden="true">
      <rect x="20" y="20" width="80" height="100" rx="4" fill="#e0e7ff" stroke="#6366f1" strokeWidth="2" />
      <text x="60" y="75" textAnchor="middle" fill="#1e1b4b" fontSize="14" fontFamily="sans-serif">FRENTE</text>
      <path
        d="M 130 60 C 130 45, 190 45, 190 60 M 130 80 C 130 95, 190 95, 190 80 M 185 55 L 190 60 L 185 65"
        fill="none"
        stroke="#6366f1"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <text x="160" y="115" textAnchor="middle" fill="#6366f1" fontSize="11" fontFamily="sans-serif">vira como caderno</text>
      <rect x="220" y="20" width="80" height="100" rx="4" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
      <text x="260" y="75" textAnchor="middle" fill="#78350f" fontSize="14" fontFamily="sans-serif" transform="rotate(180 260 70)">VERSO</text>
      <text x="260" y="92" textAnchor="middle" fill="#78350f" fontSize="9" fontFamily="sans-serif">(em branco)</text>
    </svg>
  );
}
