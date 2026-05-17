# Plano Técnico de Implementação — Progress API Generator

**Documento:** Especificação técnica detalhada para implementação do API Generator
**Versão:** 1.0
**Data:** 2026-05-15
**Responsável:** Cristiano Amaral
---

## 1. Decisão de Arquitetura

### Por que SPA (Single Page Application) como arquivo HTML único?

| Critério | SPA HTML único | Next.js/Vite | Electron App |
|---|---|---|---|
| Instalação | ✅ Nenhuma | ❌ Node.js necessário | ❌ Instalador |
| Funciona offline | ✅ Sim | ⚠️ Parcial | ✅ Sim |
| Compartilhamento | ✅ Copiar 1 arquivo | ❌ Deploy de servidor | ❌ Instalador |
| Manutenção | ✅ 1 arquivo | ❌ vários | ❌ vários |
| **Decisão** | ✅ **ESCOLHIDO** | — | — |

---

## 2. Estrutura do Arquivo `api-generator.html`

O arquivo é dividido em 3 seções:

```
api-generator.html
├── <head>         → meta, estilos CSS embutidos, CDNs (highlight.js, JSZip)
├── <body>
│   ├── #sidebar   → Formulário (esquerda)
│   └── #preview   → Abas de preview do código (direita)
└── <script>       → Motor de geração + lógica de UI
```

---

## 3. Layout e Design

### Estrutura Visual
```
┌──────────────────────────────────────────────────────────────────────┐
│  🔷 Progress API Generator                          [Tema: Dark ▼]   │
├──────────────────┬───────────────────────────────────────────────────┤
│                  │  [ *V1.i ] [ *Rules.p ] [ *.p ]   [📋] [⬇️ ZIP]  │
│  DEFINIÇÃO       ├───────────────────────────────────────────────────┤
│                  │                                                    │
│  Nome da API     │  DEFINE TEMP-TABLE tt-productItemInfo             │
│  [____________]  │      NO-UNDO SERIALIZE-NAME 'productItemInfo':U   │
│                  │      FIELD it-codigo  AS CHARACTER                │
│  Módulo          │          INITIAL ? SERIALIZE-NAME 'itCodigo':U    │
│  [enp      ▼]   │      FIELD desc-item  AS CHARACTER                │
│                  │          INITIAL ? SERIALIZE-NAME 'descItem':U    │
│  Tabela Progress │      ...                                          │
│  [item_______]   │                                                    │
│                  │                                                    │
│  Campo Chave     │                                                    │
│  [it-codigo___]  │                                                    │
│                  │                                                    │
│  CAMPOS DA TT    │                                                    │
│  ┌────────────┐  │                                                    │
│  │desc-item   │  │                                                    │
│  │CHARACTER   │  │                                                    │
│  │descItem  🗑│  │                                                    │
│  └────────────┘  │                                                    │
│  [+ Adicionar]   │                                                    │
│                  │                                                    │
│  OPÇÕES          │                                                    │
│  ☑ pi-action-v1  │                                                    │
│  ☑ pathParams    │                                                    │
│  ☑ totalCount    │                                                    │
│                  │                                                    │
│  [⬇️ DOWNLOAD]  │                                                    │
└──────────────────┴───────────────────────────────────────────────────┘
```

### Paleta de Cores (Dark Mode)
```css
--bg-primary:    #0d1117   /* Fundo geral */
--bg-secondary:  #161b22   /* Sidebar e cards */
--bg-surface:    #1c2128   /* Inputs e editor */
--accent:        #2d7aea   /* Azul TOTVS */
--accent-hover:  #4090f0
--success:       #3fb950   /* Verde — gerado OK */
--text-primary:  #e6edf3
--text-muted:    #7d8590
--border:        #30363d
--syntax-keyword:#ff7b72   /* Progress keywords */
--syntax-string: #a5d6ff   /* Strings */
--syntax-comment:#8b949e   /* Comentários */
```

---

## 4. Motor de Geração de Código (JavaScript)

### 4.1 Conversor camelCase
```javascript
function toCamelCase(progressFieldName) {
    // desc-item       → descItem
    // peso-liquido    → pesoLiquido
    // it-codigo       → itCodigo
    // cod_tipo_comp   → codTipoComp
    return progressFieldName
        .replace(/[-_](.)/g, (_, char) => char.toUpperCase());
}
```

### 4.2 Estrutura do Estado da Aplicação
```javascript
const state = {
    apiName: '',           // ex: 'ProductItemInfo'
    module: 'enp',         // ex: 'enp', 'cdp', 'cpp'
    version: '2.00.00.000',
    table: '',             // ex: 'item'
    keyField: '',          // ex: 'item.it-codigo'
    filterField: '',       // ex: 'item.it-codigo' (para BEGINS no pi-query)
    fields: [              // Array de campos da Temp-Table
        {
            name: 'desc-item',
            type: 'CHARACTER',
            serializeName: 'descItem',  // auto-gerado
            isCustomSN: false            // true se o usuário editou manualmente
        }
    ],
    options: {
        includePiAction: true,
        includePathParams: true,
        includeTotalCount: true
    }
};
```

### 4.3 Templates de Geração

#### Template: `*V1.i`
```javascript
function generateInclude(state) {
    const ttName = `tt-${toCamelCase(state.apiName).toLowerCase()}`;
    const sn = state.apiName.charAt(0).toLowerCase() + state.apiName.slice(1);
    
    const fields = state.fields.map(f =>
        `    FIELD ${f.name.padEnd(30)} AS ${f.type.padEnd(12)} INITIAL ? SERIALIZE-NAME '${f.serializeName}':U`
    ).join('\n');

    return `DEFINE TEMP-TABLE ${ttName} NO-UNDO SERIALIZE-NAME '${sn}':U\n${fields}\n    FIELD r-rowid                          AS CHARACTER INITIAL ? SERIALIZE-NAME 'rRowid':U\n    .`;
}
```

#### Template: `*Rules.p` — cabeçalho
```javascript
function generateRulesHeader(state) {
    const apiFullName = `custom${state.apiName}`;
    return `BLOCK-LEVEL ON ERROR UNDO, THROW.

USING PROGRESS.json.*.
USING PROGRESS.json.ObjectModel.*.
USING com.totvs.framework.api.*.
USING com.totvs.po.*.

{include/i-prgvrs.i ${apiFullName}Rules ${state.version} }
{include/i-license-manager.i ${apiFullName}Rules ${state.module}}

{utp/ut-glob.i}
{METHOD/dbotterr.i}
{APIs/${state.module}/rules/${apiFullName}V1.i}

{cdp/utils.i}

DEFINE TEMP-TABLE RowErrorsInfo NO-UNDO LIKE RowErrors.

/*:T--- FUNCTIONS ---*/
...`;
}
```

### 4.4 Reatividade — Atualização do Preview
```javascript
// Observer pattern: qualquer mudança no formulário dispara regeneração
document.addEventListener('input', debounce(regenerateAll, 200));

function regenerateAll() {
    const code = {
        include:    generateInclude(state),
        rules:      generateRules(state),
        controller: generateController(state)
    };
    renderPreview(activeTab, code[activeTab]);
    highlightCode();
}
```

---

## 5. Download em ZIP

```javascript
async function downloadZip() {
    const zip = new JSZip();
    const prefix = `custom${state.apiName}`;
    
    zip.file(`${prefix}V1.i`,      generateInclude(state));
    zip.file(`${prefix}Rules.p`,   generateRules(state));
    zip.file(`${prefix}.p`,        generateController(state));
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${prefix}_api_v${new Date().toISOString().slice(0,10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
}
```

---

## 6. Validações do Formulário

| Campo | Validação | Mensagem de Erro |
|---|---|---|
| Nome da API | Letras e números apenas, sem espaços | "Use apenas letras e números" |
| Módulo | Seleção obrigatória | "Selecione um módulo" |
| Tabela Progress | Sem espaços, sem caracteres especiais | "Nome de tabela inválido" |
| Campo Chave | Formato `tabela.campo` obrigatório | "Use o formato tabela.campo" |
| Campos TT | Mínimo 1 campo além do r-rowid | "Adicione ao menos 1 campo" |
| Serialize-Name | Formato camelCase, sem espaços | "Formato inválido" |

---

## 7. Plano de Implementação por Fases

### Fase 1 — Estrutura Base (Dia 1)
- [ ] Estrutura HTML com layout 2 colunas (sidebar + preview)
- [ ] CSS completo: dark mode, tokens, componentes
- [ ] Formulário: Nome, Módulo, Tabela, Campo Chave
- [ ] Estado reativo (`state` object)

### Fase 2 — Editor de Campos (Dia 1-2)
- [ ] Card de campo dinâmico (adicionar/remover)
- [ ] Conversor camelCase automático
- [ ] Dropdown de tipos de dados
- [ ] Campo serialize-name editável manualmente
- [ ] Drag-and-drop para reordenação

### Fase 3 — Motor de Geração (Dia 2)
- [ ] Template `*V1.i`
- [ ] Template `*Rules.p` — `pi-get-v1`
- [ ] Template `*Rules.p` — `pi-query-v1` (com paginação e buildWhere)
- [ ] Template `*Rules.p` — `pi-action-v1` (com payload mapping)
- [ ] Template `*.p` (Controller)

### Fase 4 — Preview e UX (Dia 3)
- [ ] Abas de preview (V1.i / Rules.p / .p)
- [ ] Integração do highlight.js para ABL
- [ ] Botão Copiar por aba
- [ ] Atualização reativa com debounce

### Fase 5 — Download e Polimento (Dia 3)
- [ ] Integração JSZip
- [ ] Botão Download ZIP funcional
- [ ] Validações de formulário com feedback visual
- [ ] Animações de micro-interação
- [ ] Testes com APIs reais do projeto

---

## 8. Critérios de Aceite

### CA01 — Geração Correta
- Gerar `customProductItemInfo` usando a ferramenta e comparar byte-a-byte com o arquivo real
- Compilar os 3 arquivos gerados no Progress Editor sem nenhum erro

### CA02 — Performance
- Atualização do preview em < 200ms após qualquer digitação

### CA03 — UX
- Usuário consegue criar e baixar uma API em menos de 3 minutos na primeira utilização
- Funciona em Chrome, Edge e Firefox (últimas 2 versões)

### CA04 — Offline
- Todas as funcionalidades funcionam sem conexão com internet
- (libs highlight.js e JSZip incluídas inline ou via CDN com fallback)

---

## 9. Dependências Externas (CDN)

| Lib | Versão | Uso | Tamanho |
|---|---|---|---|
| highlight.js | 11.x | Syntax highlighting ABL | ~50KB |
| JSZip | 3.x | Geração do ZIP para download | ~100KB |

Ambas serão carregadas via CDN com `crossorigin` e poderão ser substituídas por cópias locais para uso offline completo.

---

## 10. Exemplo de Saída Esperada

### Input
```
Nome:      ProductItemInfo
Módulo:    enp
Tabela:    item
KeyField:  item.it-codigo
Campos:    it-codigo (CHARACTER), desc-item (CHARACTER), peso-liquido (DECIMAL)
Opções:    ☑ pi-action-v1, ☑ pathParams, ☑ totalCount
```

### Output — `customProductItemInfoV1.i`
```progress
DEFINE TEMP-TABLE tt-productItemInfo NO-UNDO SERIALIZE-NAME 'productItemInfo':U
    FIELD it-codigo                        AS CHARACTER INITIAL ? SERIALIZE-NAME 'itCodigo':U
    FIELD desc-item                        AS CHARACTER INITIAL ? SERIALIZE-NAME 'descItem':U
    FIELD peso-liquido                     AS DECIMAL   INITIAL ? SERIALIZE-NAME 'pesoLiquido':U
    FIELD r-rowid                          AS CHARACTER INITIAL ? SERIALIZE-NAME 'rRowid':U
    .
```

### Output — `customProductItemInfo.p` (Controller)
```progress
USING Progress.Lang.Error.
USING com.totvs.framework.api.JsonApiResponseBuilder.

{utp/ut-api.i}
{utp/ut-api-utils.i}

{include/i-prgvrs.i customProductItemInfo 2.00.00.000 }
{include/i-license-manager.i customProductItemInfo enp}

{utp/ut-api-action.i pi-get         GET /~*/}
{utp/ut-api-action.i pi-query       GET /~*}
{utp/ut-api-action.i pi-action      POST /~*}

{utp/ut-api-notfound.i}
{utils/ParseJsonResponseAddTotalHits.i}

&global-define API_RULES "APIs/enp/rules/customProductItemInfoRules.p"

DEFINE VARIABLE apiHandler AS HANDLE NO-UNDO.

/*:T--- PROCEDURES V1 ---*/

{include/customApi.i2 pi-query  pi-query-v1}
{include/customApi.i1 pi-get    pi-get-v1}
{include/customApi.i1 pi-action pi-action-v1}
```
