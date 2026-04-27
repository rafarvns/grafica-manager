import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';
import { configureAxe } from 'vitest-axe';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const axeMatchers = require('vitest-axe/matchers') as Record<string, unknown>;

// Registra o matcher toHaveNoViolations no expect do Vitest
// vitest-axe/matchers exporta a função como valor em runtime
expect.extend(axeMatchers as Parameters<typeof expect.extend>[0]);

// Limpa o DOM após cada teste para evitar vazamentos de estado
afterEach(() => {
  cleanup();
});

// Configura o axe com regras WCAG 2.1 AA
configureAxe({
  globalOptions: {
    rules: [{ id: 'color-contrast', enabled: false }],
  },
});
