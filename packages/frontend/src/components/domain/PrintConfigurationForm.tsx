import React, { useState } from 'react';
import { usePrintConfiguration, ColorMode, Quality, DPI } from '@/hooks/usePrintConfiguration';
import styles from './PrintConfigurationForm.module.css';

interface PrintConfigurationFormProps {
  onApply?: (config: any) => void;
  showPresetsSidebar?: boolean;
}

export function PrintConfigurationForm({
  onApply,
  showPresetsSidebar = true,
}: PrintConfigurationFormProps) {
  const {
    configuration,
    paperTypes,
    presets,
    loading,
    error,
    setColorMode,
    setPaperType,
    setQuality,
    setDPI,
    saveAsPreset,
    loadPreset,
    deletePreset,
    createPaperType,
    deletePaperType,
  } = usePrintConfiguration();

  const [presetName, setPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [showNewPaperForm, setShowNewPaperForm] = useState(false);
  const [newPaperForm, setNewPaperForm] = useState({
    name: '',
    weight: 150,
    size: 'A4',
    color: 'Branco',
  });

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      await saveAsPreset(presetName.trim());
      setPresetName('');
      setShowPresetInput(false);
    } catch (err) {
      console.error('Erro ao salvar preset:', err);
    }
  };

  const handleCreatePaperType = async () => {
    if (!newPaperForm.name.trim()) return;
    try {
      await createPaperType(newPaperForm.name, newPaperForm.weight, newPaperForm.size, newPaperForm.color);
      setNewPaperForm({ name: '', weight: 150, size: 'A4', color: 'Branco' });
      setShowNewPaperForm(false);
    } catch (err) {
      console.error('Erro ao criar papel:', err);
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply(configuration);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando configurações...</div>;
  }

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.mainContent}>
        {/* Formulário de Configuração */}
        <form className={styles.form}>
          <h2 className={styles.title}>Configuração de Impressão</h2>

          {/* Color Mode */}
          <div className={styles.formGroup}>
            <label htmlFor="colorMode" className={styles.label}>
              Modelo de Cor
            </label>
            <select
              id="colorMode"
              value={configuration.colorMode}
              onChange={(e) => setColorMode(e.target.value as ColorMode)}
              className={styles.select}
            >
              <option value="CMYK">CMYK (Cor Total)</option>
              <option value="RGB">RGB (Tela/Digital)</option>
              <option value="GRAYSCALE">Escala de Cinza</option>
            </select>
          </div>

          {/* Paper Type */}
          <div className={styles.formGroup}>
            <label htmlFor="paperType" className={styles.label}>
              Tipo de Papel
            </label>
            <div className={styles.selectWithButton}>
              <select
                id="paperType"
                value={configuration.paperTypeId}
                onChange={(e) => setPaperType(e.target.value)}
                className={styles.select}
              >
                {paperTypes.map((paper) => (
                  <option key={paper.id} value={paper.id}>
                    {paper.name} ({paper.weight}g)
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.smallButton}
                onClick={() => setShowNewPaperForm(!showNewPaperForm)}
                title="Adicionar novo tipo de papel"
              >
                +
              </button>
            </div>
          </div>

          {/* New Paper Form */}
          {showNewPaperForm && (
            <div className={styles.subForm}>
              <input
                type="text"
                placeholder="Nome do papel"
                value={newPaperForm.name}
                onChange={(e) => setNewPaperForm({ ...newPaperForm, name: e.target.value })}
                className={styles.input}
              />
              <input
                type="number"
                placeholder="Peso (g/m²)"
                value={newPaperForm.weight}
                onChange={(e) => setNewPaperForm({ ...newPaperForm, weight: parseInt(e.target.value) })}
                className={styles.input}
                min="50"
                max="500"
              />
              <select
                value={newPaperForm.size}
                onChange={(e) => setNewPaperForm({ ...newPaperForm, size: e.target.value })}
                className={styles.select}
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="A2">A2</option>
                <option value="A1">A1</option>
                <option value="A0">A0</option>
              </select>
              <input
                type="text"
                placeholder="Cor"
                value={newPaperForm.color}
                onChange={(e) => setNewPaperForm({ ...newPaperForm, color: e.target.value })}
                className={styles.input}
              />
              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.buttonSuccess}
                  onClick={handleCreatePaperType}
                >
                  Salvar Papel
                </button>
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={() => setShowNewPaperForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Quality */}
          <div className={styles.formGroup}>
            <label htmlFor="quality" className={styles.label}>
              Qualidade de Impressão
            </label>
            <select
              id="quality"
              value={configuration.quality}
              onChange={(e) => setQuality(e.target.value as Quality)}
              className={styles.select}
            >
              <option value="rascunho">Rascunho (rápido, baixo custo)</option>
              <option value="normal">Normal (padrão)</option>
              <option value="alta">Alta (melhor qualidade)</option>
            </select>
          </div>

          {/* DPI */}
          <div className={styles.formGroup}>
            <label htmlFor="dpi" className={styles.label}>
              Resolução (DPI)
            </label>
            <select
              id="dpi"
              value={configuration.dpi}
              onChange={(e) => setDPI(parseInt(e.target.value) as DPI)}
              className={styles.select}
            >
              <option value={150}>150 DPI (rápido)</option>
              <option value={300}>300 DPI (padrão)</option>
              <option value={600}>600 DPI (alta resolução)</option>
            </select>
          </div>

          {/* Buttons */}
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.buttonPrimary} onClick={handleApply}>
              Aplicar Configuração
            </button>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={() => setShowPresetInput(!showPresetInput)}
            >
              Salvar como Preset
            </button>
          </div>

          {showPresetInput && (
            <div className={styles.subForm}>
              <input
                type="text"
                placeholder="Nome do preset"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className={styles.input}
                autoFocus
              />
              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.buttonSuccess}
                  onClick={handleSavePreset}
                  disabled={!presetName.trim()}
                >
                  Salvar
                </button>
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={() => setShowPresetInput(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Presets Sidebar */}
      {showPresetsSidebar && (
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Presets Salvos</h3>
          {presets.length === 0 ? (
            <p className={styles.emptyMessage}>Nenhum preset salvo</p>
          ) : (
            <ul className={styles.presetList}>
              {presets.map((preset) => (
                <li key={preset.id} className={styles.presetItem}>
                  <div className={styles.presetInfo}>
                    <strong>{preset.name}</strong>
                    <small>{preset.paperTypeName} • {preset.quality} • {preset.dpi}dpi</small>
                  </div>
                  <div className={styles.presetActions}>
                    <button
                      className={styles.buttonSmall}
                      onClick={() => loadPreset(preset.id)}
                      title="Aplicar preset"
                    >
                      Aplicar
                    </button>
                    <button
                      className={styles.buttonSmallDanger}
                      onClick={() => deletePreset(preset.id)}
                      title="Deletar preset"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </div>
  );
}
