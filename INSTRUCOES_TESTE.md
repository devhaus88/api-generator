**Data:** 2026-05-16
**Responsável:** Cristiano Amaral

# Guia de Teste — Progress API Generator

## Como Abrir

### Opção 1 — Duplo Clique (mais simples)
1. Navegue até a pasta `C:\Tools_Progress_2026\api-generator\`
2. Dê **duplo clique** no arquivo `api-generator.html`
3. O browser padrão (Chrome/Edge) vai abrir a ferramenta

### Opção 2 — Via Servidor Local (caso o ZIP não funcione no duplo clique)
1. Abra o **Prompt de Comando** ou **PowerShell**
2. Execute:
   ```
   python -m http.server 9090 --directory C:\Tools_Progress_2026\api-generator
   ```
3. Abra o browser e acesse: `http://localhost:9090/api-generator.html`

---

## Passo a Passo — Teste Completo

### Passo 1: Preencher a Identificação da API

| Campo | Valor de Teste |
|---|---|
| **Nome da API** | `ProductItemInfo` |
| **Módulo** | `enp` (já vem selecionado) |
| **Versão** | `2.00.00.000` (já vem preenchido) |
| **Tabela Progress** | `item` |
| **Campo Chave (GET)** | `item.it-codigo` |
| **Campo Filtro (BEGINS)** | `item.it-codigo` |

### Passo 2: Adicionar Campos da Temp-Table

Clique em **"+ Adicionar Campo"** e preencha cada campo conforme a tabela abaixo.
Repita para cada linha (clique o botão novamente para cada campo):

| # | Campo Progress | Tipo | JSON Name (auto) |
|---|---|---|---|
| 1 | `it-codigo` | CHARACTER | `itCodigo` ← gerado automaticamente |
| 2 | `desc-item` | CHARACTER | `descItem` |
| 3 | `un` | CHARACTER | `un` |
| 4 | `fm-codigo` | CHARACTER | `fmCodigo` |
| 5 | `ge-codigo` | INTEGER | `geCodigo` |
| 6 | `peso-liquido` | DECIMAL | `pesoLiquido` |
| 7 | `largura` | DECIMAL | `largura` |
| 8 | `altura` | DECIMAL | `altura` |

> **Dica:** Ao digitar o nome do campo (ex: `desc-item`), o campo "JSON Name" é preenchido automaticamente em camelCase (`descItem`). Você pode editá-lo manualmente se quiser.

### Passo 3: Verificar as Opções

Confirme que os 3 checkboxes estão marcados:
- [x] Incluir pi-action-v1 (POST)
- [x] Incluir pathParams (GET /id)
- [x] Incluir totalCount/iTotalHits

### Passo 4: Visualizar o Código Gerado

Clique nas **3 abas** no painel direito para conferir cada arquivo:

| Aba | O que mostra |
|---|---|
| **\*V1.i** | A definição da Temp-Table com os campos e SERIALIZE-NAME |
| **\*Rules.p** | As procedures `pi-query-v1`, `pi-get-v1` e `pi-action-v1` |
| **\*.p (Controller)** | O controller REST com os verbos GET e POST declarados |

#### O que verificar em cada aba:

**Aba *V1.i:**
- Confirme que aparece `DEFINE TEMP-TABLE tt-productItemInfo`
- Verifique que cada campo tem o `SERIALIZE-NAME` correto em camelCase
- O campo `r-rowid` deve aparecer automaticamente no final

**Aba *Rules.p:**
- Deve conter 3 blocos `PROCEDURE`:
  1. `pi-query-v1` — com `QUERY-PREPARE`, `buildWhere`, `buildBy`, paginação
  2. `pi-get-v1` — com `FOR FIRST item NO-LOCK WHERE item.it-codigo EQ tableKey`
  3. `pi-action-v1` — com `oPayload:getCharacter(...)` para cada campo

**Aba *.p (Controller):**
- Deve conter as 3 declarações de rota:
  ```
  {utp/ut-api-action.i pi-get    GET /~*/}
  {utp/ut-api-action.i pi-query  GET /~*}
  {utp/ut-api-action.i pi-action POST /~*}
  ```
- E os 3 vínculos com o Rules no final

### Passo 5: Copiar ou Baixar

**Para copiar um arquivo individual:**
1. Clique na aba desejada (ex: `*Rules.p`)
2. Clique no botão **📋 Copiar** na barra superior
3. Cole no Procedure Editor do Progress para compilar

**Para baixar todos de uma vez:**
1. Clique no botão **⬇️ Download ZIP** (barra lateral ou topo)
2. Um arquivo `customProductItemInfo_api.zip` será baixado
3. Extraia o ZIP — você terá os 3 arquivos prontos:
   ```
   customProductItemInfoV1.i
   customProductItemInfoRules.p
   customProductItemInfo.p
   ```

### Passo 6: Compilar no Progress

1. Copie os 3 arquivos para as pastas corretas do seu projeto:
   - `customProductItemInfoV1.i` → `APIs/enp/rules/`
   - `customProductItemInfoRules.p` → `APIs/enp/rules/`
   - `customProductItemInfo.p` → `APIs/enp/api/v1/`
2. Abra o **Procedure Editor** do Progress
3. Compile `customProductItemInfoRules.p`
4. Se compilar sem erros, a API está pronta!

---

## Teste Rápido (2 minutos)

Se você quer apenas confirmar que a ferramenta funciona:

1. Abra `api-generator.html`
2. Digite `Teste` no campo **Nome da API**
3. Digite `item` no campo **Tabela Progress**
4. Digite `item.it-codigo` no campo **Campo Chave**
5. Clique **"+ Adicionar Campo"** uma vez
6. Digite `desc-item` no campo **Campo**
7. Observe o preview atualizar automaticamente à direita
8. Clique nas 3 abas para ver os 3 arquivos gerados
9. Clique **📋 Copiar** para copiar o código

---

## Problemas Conhecidos

| Problema | Solução |
|---|---|
| Botão "Download ZIP" não funciona | O JSZip precisa de internet na primeira vez (CDN). Use o botão "Copiar" como alternativa |
| Arquivo abre como texto no browser | Clique com botão direito → "Abrir com" → Chrome/Edge |
| Caracteres especiais no preview | Normal — o highlight de sintaxe usa HTML entities |

---

## Estrutura de Pastas do Projeto

```
C:\Tools_Progress_2026\api-generator\
├── api-generator.html      ← A ferramenta (duplo clique para abrir)
├── PRD.md                  ← Requisitos do produto
├── README.md               ← Documentação geral
├── PLANO_TECNICO.md        ← Especificação técnica
└── INSTRUCOES_TESTE.md     ← Este arquivo
```
