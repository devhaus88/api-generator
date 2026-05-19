# Product Requirements Document (PRD)
**Produto:** Progress API Generator — Gerador de APIs REST para OpenEdge/ABL
**Versão:** 2.0.0
**Status:** Concluído ✅
**Data:** 2026-05-18
**Responsável:** Cristiano Amaral

---

## 1. Visão Geral e Problema a Resolver

### 1.1 Contexto
O desenvolvimento de APIs REST nativas em **Progress OpenEdge ABL** utilizando o framework TOTVS exige a criação manual de 3 arquivos interligados para cada endpoint:

1. **Include de Temp-Table** (`*V1.i`) — Define a estrutura de dados/DTO com mapeamento `SERIALIZE-NAME` para JSON.
2. **Rules** (`*Rules.p`) — Contém a lógica de negócio com 3 procedures padrão (`pi-get-v1`, `pi-query-v1`, `pi-action-v1`).
3. **Controller** (`*.p`) — Define os verbos REST (`GET`, `POST`) e vincula ao arquivo de regras.

A criação manual desses arquivos é:
- **Repetitiva e propensa a erros** — nomenclatura, serialize-name, assinatura de procedures.
- **Lenta** — uma API simples demora de 30 a 60 minutos para ser criada corretamente do zero.
- **Inconsistente** — cada desenvolvedor segue o padrão com pequenas variações que causam erros de compilação.

### 1.2 Solução Proposta
Desenvolver um **gerador visual de código (SPA)** que automatiza 100% da criação dos 3 arquivos no padrão correto. O desenvolvedor preenche um formulário intuitivo e obtém os arquivos prontos para compilar.

---

## 2. Objetivos do Produto

| Objetivo | Métrica de Sucesso |
|---|---|
| Reduzir tempo de criação de uma API | De ~45 min → < 3 min |
| Eliminar erros de padrão de assinatura | 0 erros de compilação relacionados a estrutura |
| Padronizar 100% dos arquivos gerados | Conformidade com modelo `customNomeRules.p` |
| Ferramenta sem instalação | Funciona com duplo clique no browser |

---

## 3. Público-Alvo

- **Desenvolvedores Progress/ABL** da equipe de Engenharia (ENP, CDP, MAN)
- **Tech Leads** que revisam e aprovam entregas de APIs
- Desenvolvedores de módulos externos que integram com TOTVS Datasul

---

## 4. Escopo — Versão 1.0 (MVP)

### 4.1 Funcionalidades Incluídas

#### F01 — Formulário de Definição da API
- Campo: Nome da API (ex: `ProductItemInfo` → gera `customProductItemInfo`)
- Campo: Módulo (`enp`, `cdp`, `cpp`, `man`, personalizado)
- Campo: Versão (`2.00.00.000`)
- Campo: Tabela Progress principal (ex: `item`)
- Campo: Campo chave para filtro GET único (ex: `item.it-codigo`)
- Campo: Campo de filtro de busca rápida para o `pi-query-v1` (BEGINS)

#### F02 — Editor Dinâmico de Campos da Temp-Table
- Adicionar / Remover campos dinamicamente
- Por campo: nome Progress, tipo (`CHARACTER`, `INTEGER`, `DECIMAL`, `LOGICAL`, `DATE`, `INT64`), serialize-name JSON
- **Conversão automática** de `desc-item` → `descItem` (camelCase)
- Campo `r-rowid` adicionado automaticamente (padrão obrigatório)
- Reordenação de campos via drag-and-drop

#### F06 — Importação de Arquivo `.df` (Data Definition)
- Botão **"Carregar arquivo .df"** abre o seletor de arquivos do sistema
- **Parser completo** do formato `.df` do Progress OpenEdge, extraindo:
  - `ADD TABLE` — nome da tabela e label/descrição
  - `ADD FIELD` — nome do campo, tipo (`CHARACTER`, `INTEGER`, `DECIMAL`, `LOGICAL`, `DATE`), label e formato
  - `ADD INDEX` — nome do índice, campos componentes, flags `PRIMARY` e `UNIQUE`
- **Modal de seleção interativa**:
  - Dropdown para selecionar a tabela (caso o `.df` contenha múltiplas tabelas)
  - Lista de campos com checkboxes para selecionar/desmarcar individualmente
  - Botão "Selecionar/Desmarcar todos"
  - Exibição dos índices da tabela com sugestão automática do campo chave (baseado no índice `PRIMARY`)
- Ao clicar **"Aplicar Campos Selecionados"**:
  - O formulário é preenchido automaticamente (Nome da API, Tabela, Campo Chave)
  - Os campos selecionados são inseridos na Temp-Table com tipos e serialize-names corretos
  - O preview dos 3 arquivos é atualizado imediatamente

#### F03 — Geração de Código com Preview
- Abas de preview para cada arquivo gerado: `*V1.i`, `*Rules.p`, `*.p`
- Syntax highlighting para ABL/Progress
- Atualização em tempo real (reactive) conforme o formulário é preenchido
- Botão **📋 Copiar** por arquivo

#### F04 — Download
- Botão **⬇️ Download ZIP** — gera arquivo `.zip` com MIME type `application/zip`
- Nome do ZIP: `customNome_api.zip`
- Elemento de download adicionado ao DOM com `setTimeout` para garantir a extensão `.zip`

#### F05 — Opções de Geração
- Checkbox: Incluir `pi-action-v1` (POST) com mapeamento completo de payload
- Checkbox: Incluir suporte a `pathParams` (para `GET /~*/`)
- Checkbox: Incluir `lTotalCount` / `iTotalHits` no `pi-query-v1`

#### F07 — Gerenciador de Templates Dinâmicos
- Motor de templates baseado em tags (`{{apiName}}`, `{{table}}`, `{{#each fields}}`, `{{#if action}}`).
- Interface modal para criar, duplicar, editar e excluir templates customizados.
- Permite configurar quantidade arbitrária de arquivos gerados por tabela (1, 2, 3 ou mais arquivos).
- Permite selecionar no formulário principal qual Template aplicar para cada API/tabela importada.
- Persistência das configurações e templates customizados via `localStorage`.

### 4.2 Funcionalidades Fora do Escopo (V1.0)
- Conexão direta ao banco de dados Progress para introspeccionar tabelas
- Deploy automático de arquivos no servidor PASOE
- Suporte a JOINs entre múltiplas tabelas
- Geração de testes automatizados

---

## 5. Requisitos Não-Funcionais

| Requisito | Especificação |
|---|---|
| **Plataforma** | Funciona em qualquer browser moderno (Chrome, Edge, Firefox) |
| **Instalação** | Zero — arquivo HTML único, sem servidor |
| **Conectividade** | Funciona 100% offline (libs carregadas localmente ou via CDN com cache) |
| **Performance** | Geração de código < 100ms após qualquer alteração no formulário |
| **Responsividade** | Suporta telas de 1366×768 (laptop) a 2560×1440 (monitor externo) |
| **Acessibilidade** | Atalhos de teclado para ações principais |

---

## 6. Padrões Obrigatórios a Respeitar

A ferramenta deve gerar código **idêntico** ao padrão validado em `customNomeRules.p`:

### 6.1 Assinatura pi-query-v1
```progress
PROCEDURE pi-query-v1:
    DEFINE INPUT  PARAM oInput     AS JsonObject NO-UNDO.
    DEFINE OUTPUT PARAM aOutput    AS JsonArray  NO-UNDO.
    DEFINE OUTPUT PARAM lHasNext   AS LOGICAL    NO-UNDO INITIAL FALSE.
    DEFINE OUTPUT PARAM iTotalHits AS INTEGER    NO-UNDO.
    DEFINE OUTPUT PARAM TABLE FOR RowErrors.
```

### 6.2 Assinatura pi-get-v1
```progress
PROCEDURE pi-get-v1:
    DEFINE INPUT  PARAM oInput  AS JsonObject NO-UNDO.
    DEFINE OUTPUT PARAM oOutput AS JsonObject NO-UNDO.
    DEFINE OUTPUT PARAM TABLE FOR RowErrors.
```

### 6.3 Assinatura pi-action-v1
```progress
PROCEDURE pi-action-v1:
    DEFINE INPUT  PARAM oInput  AS JsonObject NO-UNDO.
    DEFINE OUTPUT PARAM oOutput AS JsonObject NO-UNDO.
    DEFINE OUTPUT PARAM TABLE FOR RowErrors.
```

### 6.4 Includes obrigatórios no Rules
```progress
{cdp/utils.i}           /* buildWhere, buildBy */
{utp/ut-glob.i}
{METHOD/dbotterr.i}
```

### 6.5 Retorno do pi-query-v1
```progress
ASSIGN aOutput = JsonAPIUtils:convertTempTableToJsonArray(
    TEMP-TABLE tt-nome:HANDLE, (LENGTH(TRIM(cExcept)) > 0)).
```

---

## 7. Fluxo de Uso (User Journey)

### Fluxo A — Manual (preenchimento direto)
```
1. Abrir api-generator.html no browser
2. Preencher o nome da API (ex: ProductItemInfo)
3. Selecionar módulo (enp) e tabela Progress (item)
4. Informar campo chave (item.it-codigo) e campo de filtro
5. Adicionar campos da temp-table (+campo, tipo, serialize-name)
6. Visualizar preview em tempo real nos 3 arquivos
7. Clicar em "Download ZIP"
8. Extrair ZIP na pasta correta do projeto
9. Compilar no Progress Editor → sem erros
```

### Fluxo B — Via importação de .df (recomendado)
```
1. Abrir api-generator.html no browser
2. Clicar em "Carregar arquivo .df"
3. Selecionar o arquivo .df exportado do dicionário de dados
4. No modal, escolher a tabela desejada
5. Marcar/desmarcar os campos que deseja incluir na API
6. Clicar em "Aplicar Campos Selecionados"
7. Formulário é preenchido automaticamente
8. Ajustar opções (pi-action, pathParams, etc.) se necessário
9. Clicar em "Download ZIP"
10. Compilar no Progress Editor → sem erros
```

---

## 8. Próximas Versões (Roadmap)

### V1.0 ✅ (Entregue)
- Formulário de definição manual da API
- Editor dinâmico de campos com camelCase automático
- Geração dos 3 arquivos (Include, Rules, Controller)
- Preview com syntax highlighting + Download ZIP

### V1.1 ✅ (Entregue)
- **Importação de arquivo `.df`** com parser completo de tabelas, campos e índices
- Modal de seleção interativa com checkboxes
- Sugestão automática de campo chave a partir do índice PRIMARY
- Auto-preenchimento do formulário após importação

### V2.0 ✅ (Entregue)
- Persistência de estado (localStorage)
- **Gerenciador de Templates Dinâmicos** (motor de tags, múltiplos arquivos)
- Atribuição de templates por tabela importada

### V3.0 (Futuro)
- Integração com banco Progress via JDBC para introspeccionar colunas automaticamente
- Plugin para VS Code (extensão)
- Modo SaaS com autenticação e workspace por empresa
