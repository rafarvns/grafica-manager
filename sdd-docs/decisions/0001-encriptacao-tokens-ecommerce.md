# ADR 0001: Encriptação de tokens de e-commerce no banco de dados

- **Status**: accepted
- **Data**: 2026-04-27
- **Autor**: rafarvns

## Contexto

A entidade `Store` (spec `0001-schema-banco-dados`) armazena tokens de acesso de integrações com e-commerces (Shopee, Mercado Livre). Esses tokens são credenciais sensíveis que permitem operações em nome da loja do usuário.

Duas abordagens foram consideradas para proteger esses tokens:
1. Manter os tokens apenas em variáveis de ambiente (`.env`), sem persistir no banco.
2. Persistir os tokens no banco encriptados, com a chave de encriptação em `.env`.

O CLAUDE.md (seção 11 — Segurança) exige que "tokens de e-commerce fiquem em `.env`, nunca em código", mas não endereça o caso de múltiplas lojas configuráveis dinamicamente pelo usuário via interface. Com uma única loja fixa, `.env` seria suficiente; com múltiplas lojas cadastradas dinamicamente, é necessário persistência.

## Decisão

Gravar os tokens de e-commerce encriptados no banco de dados (AES-256-GCM via módulo `crypto` nativo do Node.js), com a chave de encriptação (`ENCRYPTION_KEY`) armazenada exclusivamente em `.env`. Nenhum token é exposto em texto plano no banco ou nas respostas da API.

## Alternativas consideradas

- **Apenas `.env`**: simples e sem risco de vazamento via banco, mas impraticável para múltiplas lojas cadastradas dinamicamente pelo usuário. Exigiria reiniciar a aplicação a cada nova loja — inaceitável em um app desktop.
- **Serviço externo de secrets (ex.: HashiCorp Vault)**: mais seguro, mas pesado demais para o alvo de 4GB RAM/dual-core (CLAUDE.md seção 2) e adiciona dependência de rede desnecessária para um app local.
- **Encriptação com lib externa (ex.: `aes-js`)**: funcional, mas adiciona dependência fora da stack obrigatória sem ganho real — o módulo `crypto` nativo do Node 20 já oferece AES-256-GCM com interface adequada.

## Consequências

### Positivas
- Suporte a múltiplas lojas configuradas dinamicamente pelo usuário sem restart.
- Tokens nunca expostos em texto plano no banco — mesmo com acesso direto ao MySQL, o valor é ilegível sem a `ENCRYPTION_KEY`.
- Zero dependências externas adicionais (usa `crypto` nativo do Node).

### Negativas / trade-offs
- Se a `ENCRYPTION_KEY` for perdida, os tokens persistidos tornam-se irrecuperáveis — o usuário precisará reautorizar as lojas.
- Adiciona uma camada de encriptação/decriptação nos repositories de `Store`, aumentando levemente a complexidade da infrastructure layer.
- A `ENCRYPTION_KEY` precisa ser gerada de forma segura no setup e nunca versionada.

### Neutras
- A lógica de encriptação/decriptação será encapsulada em um utilitário em `infrastructure/config/` e não vaza para as camadas de domain ou application.
- O `.env.example` deve incluir `ENCRYPTION_KEY=` com instrução de geração (`openssl rand -hex 32`).

## Referências

- Specs: [`sdd-docs/specs/0001-schema-banco-dados.md`](../specs/0001-schema-banco-dados.md)
- ADRs relacionadas: nenhuma
- Issues / PRs: nenhum
