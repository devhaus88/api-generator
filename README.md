**Data:** 2026-05-16
**Responsável:** Cristiano Amaral

# Progress API Generator

> Gerador visual de APIs REST para **Progress OpenEdge ABL** no padrão TOTVS Datasul.
> Crie um endpoint completo em menos de 3 minutos, sem erros de compilação.

---

## 🚀 Como Usar

### Opção A — Importar arquivo .df (recomendado)
1. Abra o arquivo `api-generator.html` com duplo clique no browser
2. Clique em **"📂 Carregar arquivo .df"**
3. Selecione o `.df` exportado do dicionário de dados
4. Escolha a tabela e marque os campos desejados
5. Clique **"Aplicar Campos Selecionados"**
6. Clique em **Download ZIP** e extraia na pasta do projeto
7. Compile no Progress Editor e pronto!

### Opção B — Preenchimento manual
1. Abra o arquivo `api-generator.html` com duplo clique no browser
2. Preencha o formulário com os dados da sua API
3. Adicione campos com o botão **"+"**
4. Clique em **Download ZIP** e extraia na pasta do projeto
5. Compile no Progress Editor e pronto!

**Nenhuma instalação necessária. Funciona 100% offline.**

---

## 📦 O que é Gerado?

Para cada API, a ferramenta gera automaticamente os **3 arquivos obrigatórios** do padrão TOTVS:

```
📁 download.zip
├── customNomeV1.i          ← Definição da Temp-Table (DTO)
├── customNomeRules.p       ← Lógica de negócio (pi-get, pi-query, pi-action)
└── customNome.p            ← Controller REST (verbos GET/POST)
```

---

## 🏗️ Arquitetura dos Arquivos Gerados

### 1. `customNomeV1.i` — Include de Temp-Table
Define o contrato de dados da API: campos, tipos e mapeamento JSON.

```progress
DEFINE TEMP-TABLE tt-productItemInfo NO-UNDO SERIALIZE-NAME 'productItemInfo':U
    FIELD it-codigo   AS CHARACTER INITIAL ? SERIALIZE-NAME 'itCodigo':U
    FIELD desc-item   AS CHARACTER INITIAL ? SERIALIZE-NAME 'descItem':U
    FIELD peso-liquido AS DECIMAL  INITIAL ? SERIALIZE-NAME 'pesoLiquido':U
    FIELD r-rowid     AS CHARACTER INITIAL ? SERIALIZE-NAME 'rRowid':U
    .
```

### 2. `customNomeRules.p` — Arquivo de Regras
Contém as 3 procedures padrão do framework:

| Procedure | Verbo | Descrição |
|---|---|---|
| `pi-get-v1` | `GET /api/enp/v1/customNome/{id}` | Busca um único registro pelo ID |
| `pi-query-v1` | `GET /api/enp/v1/customNome` | Lista com paginação, filtros e ordenação dinâmica |
| `pi-action-v1` | `POST /api/enp/v1/customNome` | Executa uma ação (criar/atualizar/validar) |

### 3. `customNome.p` — Controller REST
Ponto de entrada HTTP. Define os verbos e vincula ao Rules:

```progress
{utp/ut-api-action.i pi-get    GET /~*/}
{utp/ut-api-action.i pi-query  GET /~*}
{utp/ut-api-action.i pi-action POST /~*}

{include/customApi.i2 pi-query  pi-query-v1}
{include/customApi.i1 pi-get    pi-get-v1}
{include/customApi.i1 pi-action pi-action-v1}
```

---

## 🧠 Funcionalidades do Gerador

| Feature | Descrição |
|---|---|
| **Importação de .df** | Carregue um arquivo `.df` e selecione tabela/campos automaticamente |
| **camelCase automático** | `desc-item` → `descItem` gerado automaticamente |
| **Preview em tempo real** | Código atualizado conforme o formulário é preenchido |
| **Syntax Highlighting** | Highlight de código ABL/Progress nos previews |
| **Download ZIP** | 3 arquivos prontos para extrair na pasta do projeto |
| **Opções configuráveis** | Ativar/desativar `pi-action-v1`, `pathParams`, `totalCount` |
| **Seleção de campos** | Escolha quais campos da tabela incluir na API via checkboxes |
| **Detecção de índices** | Sugere campo chave automaticamente pelo índice PRIMARY |

---

## 📐 Padrões Respeitados

A ferramenta segue rigorosamente o padrão do framework TOTVS Datasul:

- ✅ Assinatura correta de `pi-query-v1` com `aOutput AS JsonArray`, `lHasNext` e `iTotalHits`
- ✅ Uso de `buildWhere` e `buildBy` via `{cdp/utils.i}` para filtros/ordenação dinâmicos
- ✅ Paginação com `QUERY-PREPARE`, `REPOSITION-TO-ROW` e `QUERY-OFF-END`
- ✅ Conversão via `JsonAPIUtils:convertTempTableToJsonArray`
- ✅ Includes obrigatórios: `{utp/ut-glob.i}`, `{METHOD/dbotterr.i}`, `{cdp/utils.i}`
- ✅ Tratamento de erros com `RowErrors` e `FINALLY: fn-has-row-errors()`

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 + CSS3 | Estrutura e estilo da interface |
| JavaScript (ES6+) | Motor de geração de código e lógica da UI |
| highlight.js | Syntax highlighting do código ABL nos previews |
| JSZip | Geração do arquivo `.zip` para download |

**Sem frameworks, sem dependência de servidor, sem instalação.**

---

## 📁 Estrutura do Projeto

```
📁 api-generator/
├── api-generator.html     ← Aplicação completa (arquivo único)
├── parts/                 ← Código-fonte separado (CSS, JS, HTML)
│   ├── style.css
│   ├── app.js
│   └── body.html
├── gen.py                 ← Script que monta o HTML a partir dos parts
├── PRD.md                 ← Requisitos do produto
├── README.md              ← Este arquivo
├── PLANO_TECNICO.md       ← Plano técnico detalhado
└── INSTRUCOES_TESTE.md    ← Guia de teste passo a passo
```

---

## 🗺️ Roadmap

| Versão | Funcionalidade |
|---|---|
| **V1.0** ✅ | MVP: Geração dos 3 arquivos, preview, download ZIP |
| **V1.1** ✅ | Importação de arquivo `.df` com parser, modal de seleção e auto-preenchimento |
| **V1.1.1** ✅ | Correção do download ZIP (MIME type `application/zip`, extensão garantida) |
| **V2.0** | Salvar/carregar templates (localStorage), suporte a JOIN |
| **V3.0** | Plugin VS Code, integração JDBC, deploy automático PASOE |

---

## 👨‍💻 Contexto do Projeto

Este gerador foi desenvolvido no contexto da migração do módulo de **APIs** de Base Progress, que substituiu a arquitetura legada Flex/Java por APIs RESTful nativas em Progress OpenEdge, seguindo o padrão de Cockpits Web da TOTVS Datasul.
