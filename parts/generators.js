/* ===== GENERATORS (imported by app.js) ===== */
function getter(t){return{CHARACTER:'getCharacter',INTEGER:'getInteger',DECIMAL:'getDecimal',LOGICAL:'getLogical',DATE:'getCharacter',INT64:'getInt64'}[t]||'getCharacter'}
function toCamelLocal(s){return s.replace(/[-_](.)/g,function(_,c){return c.toUpperCase()})}

function renderTemplate(templateStr, s) {
    if (!templateStr) return '';
    var lowerApiName = s.apiName ? toCamelLocal(s.apiName).charAt(0).toLowerCase() + toCamelLocal(s.apiName).slice(1) : 'nome';
    
    // 1. Process conditionals: {{#if var}} ... {{/if}}
    templateStr = templateStr.replace(/\{\{#if\s+([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, function(match, varName, content) {
        var condition = s.opts && s.opts[varName] ? true : false;
        if (s[varName]) condition = true;
        return condition ? content : '';
    });

    // 2. Process loops: {{#each fields}} ... {{/each}}
    templateStr = templateStr.replace(/\{\{#each\s+fields\}\}([\s\S]*?)\{\{\/each\}\}/g, function(match, content) {
        var result = '';
        if (s.fields && s.fields.length > 0) {
            s.fields.forEach(function(f, i) {
                var row = content;
                row = row.replace(/\{\{name\}\}/g, f.name || 'campo');
                row = row.replace(/\{\{type\}\}/g, f.type || 'CHARACTER');
                row = row.replace(/\{\{sn\}\}/g, f.sn);
                row = row.replace(/\{\{getter\}\}/g, getter(f.type || 'CHARACTER'));
                row = row.replace(/\{\{namePad\}\}/g, (f.name || 'campo').padEnd(30));
                row = row.replace(/\{\{typePad\}\}/g, (f.type || 'CHARACTER').padEnd(12));
                row = row.replace(/\{\{namePadShort\}\}/g, (f.name || 'campo').padEnd(28));
                row = row.replace(/\{\{pad\}\}/g, i === 0 ? '' : '           ');
                result += row;
            });
        }
        return result;
    });

    // 3. Process variables
    var vars = {
        'apiName': s.apiName || 'Nome',
        'lowerApiName': lowerApiName,
        'module': s.module || 'enp',
        'version': s.version || '2.00.00.000',
        'table': s.table || 'tabela',
        'keyField': s.keyField || (s.table + '.id'),
        'filterField': s.filterField || s.keyField
    };

    templateStr = templateStr.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, function(match, varName) {
        return vars[varName] !== undefined ? vars[varName] : match;
    });

    return templateStr;
}

function getDefaultTemplates() {
    return [
        {
            id: 'tpl-default',
            name: 'Padrão TOTVS (3 arquivos)',
            files: [
                {
                    id: 'f-include',
                    tabName: '*V1.i',
                    fileName: 'custom{{apiName}}V1.i',
                    content: "DEFINE TEMP-TABLE tt-{{lowerApiName}} NO-UNDO SERIALIZE-NAME '{{lowerApiName}}':U\n{{#each fields}}    FIELD {{namePad}} AS {{typePad}} INITIAL ? SERIALIZE-NAME '{{sn}}':U\n{{/each}}    FIELD r-rowid                          AS CHARACTER    INITIAL ? SERIALIZE-NAME 'rRowid':U\n    ."
                },
                {
                    id: 'f-rules',
                    tabName: '*Rules.p',
                    fileName: 'custom{{apiName}}Rules.p',
                    content: "BLOCK-LEVEL ON ERROR UNDO, THROW.\n\nUSING PROGRESS.json.*.\nUSING PROGRESS.json.ObjectModel.*.\nUSING com.totvs.framework.api.*.\nUSING com.totvs.po.*.\n\n{include/i-prgvrs.i custom{{apiName}}Rules {{version}} }\n{include/i-license-manager.i custom{{apiName}}Rules {{module}}}\n\n{utp/ut-glob.i}\n{METHOD/dbotterr.i}\n{APIs/{{module}}/rules/custom{{apiName}}V1.i}\n\n{cdp/utils.i}\n\nDEFINE TEMP-TABLE RowErrorsInfo NO-UNDO LIKE RowErrors.\n\n/*:T--- FUNCTIONS ---*/\n\nFUNCTION fn-has-row-errors RETURNS LOGICAL ():\n    FOR EACH RowErrors WHERE UPPER(RowErrors.ErrorType) = 'INTERNAL':U:\n        DELETE RowErrors.\n    END.\n    RETURN CAN-FIND(FIRST RowErrors WHERE UPPER(RowErrors.ErrorSubType) = 'ERROR':U).\nEND FUNCTION.\n\n{{#if pathParams}}\nFUNCTION fn-get-id-from-path RETURNS CHARACTER (INPUT oReq AS JsonAPIRequestParser):\n    DEFINE VARIABLE cId AS CHARACTER NO-UNDO.\n    ASSIGN cId = oReq:getPathParams():getCharacter(1) NO-ERROR.\n    RETURN cId.\nEND FUNCTION.\n{{/if}}\n\n{{#if action}}\n/*:T--- ACTION PROCEDURES V1 ---*/\n\nPROCEDURE pi-action-v1:\n\n    DEFINE INPUT  PARAM oInput      AS JsonObject NO-UNDO.\n    DEFINE OUTPUT PARAM oOutput     AS JsonObject NO-UNDO.\n    DEFINE OUTPUT PARAM TABLE FOR RowErrors.\n\n    DEFINE VARIABLE oRequest AS JsonAPIRequestParser NO-UNDO.\n    DEFINE VARIABLE oPayload AS JsonObject           NO-UNDO.\n\n    EMPTY TEMP-TABLE RowErrors.\n    EMPTY TEMP-TABLE RowErrorsInfo.\n\n    ASSIGN oRequest = NEW JsonAPIRequestParser(oInput)\n           oPayload = oInput:GetJsonObject(\"payload\").\n\n    CREATE tt-{{lowerApiName}}.\n    ASSIGN {{#each fields}}{{pad}}tt-{{lowerApiName}}.{{namePadShort}} = oPayload:{{getter}}('{{sn}}':U) WHEN oPayload:has('{{sn}}':U)\n{{/each}}           .\n\n    //Executar validacoes e regras de negocio.\n\n    IF NOT fn-has-row-errors() THEN DO:\n        oOutput = NEW JsonObject().\n        oOutput:ADD(\"sucess\", TRUE).\n        IF CAN-FIND(FIRST RowErrorsInfo) THEN\n            oOutput:ADD(\"_messages\", NEW Messages(INPUT TABLE RowErrorsInfo):toJsonArray()).\n    END.\n\n    CATCH eSysError AS PROGRESS.Lang.SysError:\n        CREATE RowErrors.\n        ASSIGN RowErrors.ErrorNumber      = 17006\n               RowErrors.ErrorDescription = eSysError:getMessage(1)\n               RowErrors.ErrorSubType     = \"ERROR\".\n    END.\n    FINALLY:\n        IF fn-has-row-errors() THEN DO:\n            UNDO, RETURN 'NOK':U.\n        END.\n    END FINALLY.\n\nEND PROCEDURE.\n\n{{/if}}\n/*:T--- QUERY PROCEDURES V1 ---*/\n\nPROCEDURE pi-query-v1:\n\n    DEFINE INPUT  PARAM oInput      AS JsonObject NO-UNDO.\n    DEFINE OUTPUT PARAM aOutput     AS JsonArray  NO-UNDO.\n    DEFINE OUTPUT PARAM lHasNext    AS LOGICAL    NO-UNDO INITIAL FALSE.\n    DEFINE OUTPUT PARAM iTotalHits  AS INTEGER    NO-UNDO.\n    DEFINE OUTPUT PARAM TABLE FOR RowErrors.\n\n    DEFINE VARIABLE oRequest    AS JsonAPIRequestParser  NO-UNDO.\n    DEFINE VARIABLE iCount      AS INTEGER INITIAL 0     NO-UNDO.\n    DEFINE VARIABLE cExcept     AS CHARACTER             NO-UNDO.\n    DEFINE VARIABLE cQuery      AS CHARACTER             NO-UNDO.\n    DEFINE VARIABLE cBy         AS CHARACTER             NO-UNDO.\n{{#if totalCount}}\n    DEFINE VARIABLE lTotalCount AS LOGICAL               NO-UNDO INITIAL FALSE.\n{{/if}}\n    DEFINE VARIABLE pfilter     AS CHARACTER             NO-UNDO.\n\n    EMPTY TEMP-TABLE RowErrors.\n    EMPTY TEMP-TABLE tt-{{lowerApiName}}.\n\n    ASSIGN oRequest = NEW JsonAPIRequestParser(oInput).\n\n    ASSIGN cExcept = JsonAPIUtils:getTableExceptFieldsBySerializedFields(\n        TEMP-TABLE tt-{{lowerApiName}}:HANDLE, oRequest:getFields()).\n\n{{#if totalCount}}\n    IF oRequest:getQueryParams():has(\"totalCount\") THEN\n        ASSIGN lTotalCount = LOGICAL(oRequest:getQueryParams():getJsonArray(\"totalCount\"):getCharacter(1)).\n{{/if}}\n\n    ASSIGN cQuery = ' FOR EACH {{table}} NO-LOCK ':U.\n\n    IF oRequest:getQueryParams():has(\"filter\") THEN DO:\n        ASSIGN pfilter = JsonAPIUtils:getPropertyJsonObject(oRequest:getQueryParams(),'filter').\n        ASSIGN cQuery = cQuery + \" WHERE {{filterField}} BEGINS '\" + pfilter + \"'\".\n    END.\n\n    ASSIGN cQuery = buildWhere(TEMP-TABLE tt-{{lowerApiName}}:HANDLE, oRequest:getQueryParams(), \"\", cQuery)\n           cBy    = buildBy(TEMP-TABLE tt-{{lowerApiName}}:HANDLE, oRequest:getOrder())\n           cQuery = cQuery + cBy.\n\n    DEFINE QUERY findQuery FOR {{table}} SCROLLING.\n    QUERY findQuery:QUERY-PREPARE(cQuery).\n    QUERY findQuery:QUERY-OPEN().\n    QUERY findQuery:REPOSITION-TO-ROW(oRequest:getStartRow()).\n\n    REPEAT:\n        GET NEXT findQuery.\n        IF QUERY findQuery:QUERY-OFF-END THEN LEAVE.\n        IF oRequest:getPageSize() EQ iCount THEN DO:\n            ASSIGN lHasNext = TRUE.\n            LEAVE.\n        END.\n        CREATE tt-{{lowerApiName}}.\n        TEMP-TABLE tt-{{lowerApiName}}:HANDLE:DEFAULT-BUFFER-HANDLE:BUFFER-COPY(\n            BUFFER {{table}}:HANDLE, cExcept).\n        ASSIGN tt-{{lowerApiName}}.r-rowid = STRING(ROWID({{table}})).\n        ASSIGN iCount = iCount + 1.\n    END.\n\n    ASSIGN aOutput = JsonAPIUtils:convertTempTableToJsonArray(\n        TEMP-TABLE tt-{{lowerApiName}}:HANDLE, (LENGTH(TRIM(cExcept)) > 0)).\n\n    iTotalHits = iCount.\n\n{{#if totalCount}}\n    IF lTotalCount EQ YES THEN DO:\n        DO WHILE NOT QUERY findQuery:QUERY-OFF-END:\n            iTotalHits = iTotalHits + 1.\n            GET NEXT findQuery.\n        END.\n    END.\n{{/if}}\n\n    CATCH eSysError AS PROGRESS.Lang.SysError:\n        CREATE RowErrors.\n        ASSIGN RowErrors.ErrorNumber      = 17006\n               RowErrors.ErrorDescription = eSysError:getMessage(1)\n               RowErrors.ErrorSubType     = \"ERROR\".\n    END.\n    FINALLY:\n        IF fn-has-row-errors() THEN DO:\n            UNDO, RETURN 'NOK':U.\n        END.\n    END FINALLY.\n\nEND PROCEDURE.\n\n{{#if pathParams}}\n/*:T--- GET PROCEDURES V1 ---*/\n\nPROCEDURE pi-get-v1:\n\n    DEFINE INPUT  PARAM oInput  AS JsonObject NO-UNDO.\n    DEFINE OUTPUT PARAM oOutput AS JsonObject NO-UNDO.\n    DEFINE OUTPUT PARAM TABLE FOR RowErrors.\n\n    DEFINE VARIABLE oRequest    AS JsonAPIRequestParser NO-UNDO.\n    DEFINE VARIABLE cExcept     AS CHARACTER            NO-UNDO.\n    DEFINE VARIABLE tableKey    AS CHARACTER            NO-UNDO.\n\n    ASSIGN oRequest = NEW JsonAPIRequestParser(oInput).\n    ASSIGN tableKey = fn-get-id-from-path(oRequest).\n\n    ASSIGN cExcept = JsonAPIUtils:getTableExceptFieldsBySerializedFields(\n        TEMP-TABLE tt-{{lowerApiName}}:HANDLE, oRequest:getFields()).\n\n    FOR FIRST {{table}} NO-LOCK WHERE {{keyField}} EQ tableKey:\n        CREATE tt-{{lowerApiName}}.\n        TEMP-TABLE tt-{{lowerApiName}}:HANDLE:DEFAULT-BUFFER-HANDLE:BUFFER-COPY(\n            BUFFER {{table}}:HANDLE, cExcept).\n        ASSIGN tt-{{lowerApiName}}.r-rowid = STRING(ROWID({{table}})).\n        ASSIGN oOutput = JsonAPIUtils:convertTempTableFirstItemToJsonObject(\n            TEMP-TABLE tt-{{lowerApiName}}:HANDLE, (LENGTH(TRIM(cExcept)) > 0)).\n    END.\n\n    CATCH eSysError AS PROGRESS.Lang.SysError:\n        CREATE RowErrors.\n        ASSIGN RowErrors.ErrorNumber      = 17006\n               RowErrors.ErrorDescription = eSysError:getMessage(1)\n               RowErrors.ErrorSubType     = \"ERROR\".\n    END.\n    FINALLY:\n        IF fn-has-row-errors() THEN DO:\n            UNDO, RETURN 'NOK':U.\n        END.\n    END FINALLY.\n\nEND PROCEDURE.\n{{/if}}\n"
                },
                {
                    id: 'f-controller',
                    tabName: '*.p (Controller)',
                    fileName: 'custom{{apiName}}.p',
                    content: "USING Progress.Lang.Error.\nUSING com.totvs.framework.api.JsonApiResponseBuilder.\n\n{utp/ut-api.i}\n{utp/ut-api-utils.i}\n\n{include/i-prgvrs.i custom{{apiName}} {{version}} }\n{include/i-license-manager.i custom{{apiName}} {{module}}}\n\n{{#if pathParams}}\n{utp/ut-api-action.i pi-get         GET /~*/}\n{{/if}}\n{utp/ut-api-action.i pi-query       GET /~*}\n{{#if action}}\n{utp/ut-api-action.i pi-action      POST /~*}\n{{/if}}\n\n{utp/ut-api-notfound.i}\n{utils/ParseJsonResponseAddTotalHits.i}\n\n&global-define API_RULES \"APIs/{{module}}/rules/custom{{apiName}}Rules.p\"\n\nDEFINE VARIABLE apiHandler AS HANDLE NO-UNDO.\n\n/*:T--- PROCEDURES V1 ---*/\n\n{include/customApi.i2 pi-query  pi-query-v1}\n{{#if pathParams}}\n{include/customApi.i1 pi-get    pi-get-v1}\n{{/if}}\n{{#if action}}\n{include/customApi.i1 pi-action pi-action-v1}\n{{/if}}\n"
                }
            ]
        }
    ];
}

