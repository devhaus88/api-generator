/* ===== STATE ===== */
var apis=[];var currentApi=0;var activeTab='f-include';var editMode=false;
var editedCode={};var dfData={tables:[]};var templates=[];
var SAVE_KEY='apigen_state_v3';

/* ===== AUTO-SAVE / AUTO-LOAD ===== */
function autoSave(){
 try{
  var data={apis:apis,currentApi:currentApi,activeTab:activeTab,editedCode:editedCode,templates:templates,savedAt:new Date().toISOString()};
  localStorage.setItem(SAVE_KEY,JSON.stringify(data));
  var el=document.getElementById('saveStatus');
  if(el){el.textContent='Salvo '+new Date().toLocaleTimeString();el.style.opacity='1';setTimeout(function(){el.style.opacity='.5'},2000)}
 }catch(e){}
}

function autoLoad(){
 try{
  var raw=localStorage.getItem(SAVE_KEY);
  if(raw){
   var data=JSON.parse(raw);
   templates=data.templates||[];
  }
 }catch(e){}
 if(templates.length===0) templates=getDefaultTemplates();
 return false;
}

function clearSaved(){
 if(confirm('Tem certeza que deseja limpar todos os dados salvos?')){
  localStorage.removeItem(SAVE_KEY);
  apis=[];editedCode={};currentApi=0;
  apis.push(newApiState());loadApiToForm(0);renderApiList();render();
  toast('Dados salvos foram limpos');
 }
}

function toCamel(s){return s.replace(/[-_](.)/g,function(_,c){return c.toUpperCase()})}
function toast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show')},2000)}
function mapType(t){var m={CHARACTER:'CHARACTER',INTEGER:'INTEGER',DECIMAL:'DECIMAL',LOGICAL:'LOGICAL',DATE:'DATE',INT64:'INT64',RECID:'INTEGER',DATETIME:'CHARACTER'};return m[t.toUpperCase()]||'CHARACTER'}

function newApiState(){return{apiName:'',module:'',version:'',table:'',keyField:'',filterField:'',fields:[],opts:{action:true,pathParams:true,totalCount:true},templateId:templates.length>0?templates[0].id:'tpl-default'}}

function ensureApi(){if(apis.length===0){apis.push(newApiState());currentApi=0}}

/* ===== DF PARSER ===== */
function parseDF(text){
 var tables=[];var ct=null,cf=null,ci=null;
 var lines=text.split(/\r?\n/);
 for(var i=0;i<lines.length;i++){
  var ln=lines[i].trimEnd();
  var m1=ln.match(/^ADD TABLE "([^"]+)"/i);
  if(m1){ct={name:m1[1],label:'',fields:[],indexes:[]};tables.push(ct);cf=null;ci=null;continue}
  if(ct&&!cf&&!ci){var ml=ln.match(/^\s+LABEL "([^"]*)"/i);if(ml)ct.label=ml[1];var md=ln.match(/^\s+DESCRIPTION "([^"]*)"/i);if(md&&!ct.label)ct.label=md[1]}
  var m2=ln.match(/^ADD FIELD "([^"]+)" OF "([^"]+)" AS (\w+)/i);
  if(m2){cf={name:m2[1],type:m2[3].toUpperCase(),label:''};if(ct&&m2[2]===ct.name)ct.fields.push(cf);ci=null;continue}
  if(cf){var ml2=ln.match(/^\s+LABEL "([^"]*)"/i);if(ml2)cf.label=ml2[1];if(ln.trim()===''||ln.match(/^ADD /))cf=null}
  var m3=ln.match(/^ADD INDEX "([^"]+)" ON "([^"]+)"/i);
  if(m3){ci={name:m3[1],unique:false,primary:false,fields:[]};if(ct&&m3[2]===ct.name)ct.indexes.push(ci);cf=null;continue}
  if(ci){if(/UNIQUE/i.test(ln))ci.unique=true;if(/PRIMARY/i.test(ln))ci.primary=true;var mif=ln.match(/INDEX-FIELD "([^"]+)"/i);if(mif)ci.fields.push(mif[1]);if(ln.trim()===''||ln.match(/^ADD /))ci=null}
 }
 return tables;
}

function loadDF(input){
 var file=input.files[0];if(!file)return;
 var reader=new FileReader();
 reader.onload=function(e){
  dfData.tables=parseDF(e.target.result);
  if(dfData.tables.length===0){toast('Nenhuma tabela encontrada');return}
  showDFModal();
 };
 reader.readAsText(file,'latin1');input.value='';
}

function showDFModal(){
 var c=document.getElementById('dfTablesContainer');c.innerHTML='';
 dfData.tables.forEach(function(tbl,ti){
  var card=document.createElement('div');card.className='table-card';
  var hdr=document.createElement('div');hdr.className='table-header';
  hdr.innerHTML='<input type="checkbox" checked data-ti="'+ti+'"><span class="tname">'+tbl.name+(tbl.label?' - '+tbl.label:'')+'</span><span class="tcount">'+tbl.fields.length+' campos</span><span class="tarrow">&#9654;</span>';
  hdr.onclick=function(e){if(e.target.type==='checkbox')return;var fl=card.querySelector('.table-fields');var ar=card.querySelector('.tarrow');fl.classList.toggle('open');ar.classList.toggle('open')};
  var fl=document.createElement('div');fl.className='table-fields';
  var sa=document.createElement('div');sa.className='select-all';
  sa.innerHTML='<input type="checkbox" checked onchange="toggleTableFields(this,'+ti+')"><label style="margin:0;text-transform:none;font-weight:400;color:var(--txt)">Todos</label>';
  fl.appendChild(sa);
  tbl.fields.forEach(function(f,fi){
   var r=document.createElement('div');r.className='field-row';
   r.innerHTML='<input type="checkbox" checked data-ti="'+ti+'" data-fi="'+fi+'"><span class="fname">'+f.name+'</span><span class="ftype">'+f.type+'</span><span class="flabel">'+(f.label||'')+'</span>';
   fl.appendChild(r);
  });
  if(tbl.indexes.length>0){
   var idx=document.createElement('div');idx.className='idx-info';
   var html='<strong>Indices:</strong><br>';
   tbl.indexes.forEach(function(ix){html+='&bull; '+ix.name+(ix.primary?' PRIMARY':'')+(ix.unique?' UNIQUE':'')+' - '+ix.fields.join(', ')+'<br>'});
   var pk=tbl.indexes.find(function(x){return x.primary});
   if(pk&&pk.fields.length>0)html+='<br><strong>Campo chave sugerido:</strong> '+tbl.name+'.'+pk.fields[0];
   idx.innerHTML=html;fl.appendChild(idx);
  }
  card.appendChild(hdr);card.appendChild(fl);c.appendChild(card);
 });
 document.getElementById('dfModal').classList.add('show');
 toast(dfData.tables.length+' tabela(s) encontrada(s)');
}

function toggleTableFields(cb,ti){
 document.querySelectorAll('#dfTablesContainer input[data-ti="'+ti+'"][data-fi]').forEach(function(x){x.checked=cb.checked});
}

function closeModal(){document.getElementById('dfModal').classList.remove('show')}

function toggleAllTables(checked){
 document.querySelectorAll('.table-header input[type=checkbox]').forEach(function(cb){cb.checked=checked});
 document.querySelectorAll('.table-fields input[type=checkbox]').forEach(function(cb){cb.checked=checked});
}

function applyDF(){
 apis=[];editedCode={};
 document.querySelectorAll('.table-header input[type=checkbox]:checked').forEach(function(tcb){
  var ti=parseInt(tcb.dataset.ti);var tbl=dfData.tables[ti];
  var s=newApiState();
  s.table=tbl.name;
  var apiN=toCamel(tbl.name);s.apiName=apiN.charAt(0).toUpperCase()+apiN.slice(1);
  var pk=tbl.indexes.find(function(x){return x.primary});
  if(pk&&pk.fields.length>0){s.keyField=tbl.name+'.'+pk.fields[0];s.filterField=tbl.name+'.'+pk.fields[0]}
  document.querySelectorAll('#dfTablesContainer input[data-ti="'+ti+'"][data-fi]:checked').forEach(function(fcb){
   var f=tbl.fields[parseInt(fcb.dataset.fi)];
   s.fields.push({name:f.name,type:mapType(f.type),sn:toCamel(f.name)});
  });
  apis.push(s);
 });
 if(apis.length===0){toast('Selecione ao menos uma tabela');return}
 currentApi=0;closeModal();loadApiToForm(0);renderApiList();
 toast(apis.length+' API(s) gerada(s)!');
 autoSave();
}

/* ===== API LIST ===== */
function renderApiList(){
 var sec=document.getElementById('apiListSection');
 var list=document.getElementById('apiList');
 if(apis.length<=1){sec.style.display='none';return}
 sec.style.display='block';
 document.getElementById('apiCount').textContent=apis.length;
 list.innerHTML='';
 apis.forEach(function(a,i){
  var c=document.createElement('div');c.className='api-card'+(i===currentApi?' active':'');
  c.innerHTML='<div><div class="api-name">custom'+(a.apiName||'Nome')+'</div><div class="api-table">'+a.table+'</div></div><button class="api-del" onclick="event.stopPropagation();removeApi('+i+')">&times;</button>';
  c.onclick=function(){saveFormToApi();currentApi=i;loadApiToForm(i);renderApiList();render()};
  list.appendChild(c);
 });
}

function removeApi(i){
 apis.splice(i,1);delete editedCode[i];
 if(apis.length===0){apis.push(newApiState())}
 if(currentApi>=apis.length)currentApi=apis.length-1;
 loadApiToForm(currentApi);renderApiList();render();autoSave();
}

/* ===== FORM <-> STATE ===== */
function loadApiToForm(i){
 var s=apis[i];if(!s)return;
 var tplSel=document.getElementById('apiTemplate');
 if(tplSel){
  tplSel.innerHTML='';
  templates.forEach(function(t){var o=document.createElement('option');o.value=t.id;o.textContent=t.name;if(t.id===s.templateId)o.selected=true;tplSel.appendChild(o)});
  if(!s.templateId&&templates.length>0) tplSel.value=templates[0].id;
 }
 document.getElementById('apiName').value=s.apiName;
 document.getElementById('module').value=s.module;
 document.getElementById('version').value=s.version;
 document.getElementById('table').value=s.table;
 document.getElementById('keyField').value=s.keyField;
 document.getElementById('filterField').value=s.filterField;
 document.getElementById('optAction').checked=s.opts.action;
 document.getElementById('optPath').checked=s.opts.pathParams;
 document.getElementById('optTotal').checked=s.opts.totalCount;
 var fd=document.getElementById('fields');fd.innerHTML='';
 s.fields.forEach(function(f){addFieldWithData(f.name,f.type,f.sn)});
 render();
}

function saveFormToApi(){
 if(!apis[currentApi])return;var s=apis[currentApi];
 var tplSel=document.getElementById('apiTemplate');
 if(tplSel) s.templateId=tplSel.value;
 s.apiName=document.getElementById('apiName').value;
 s.module=document.getElementById('module').value;
 s.version=document.getElementById('version').value;
 s.table=document.getElementById('table').value;
 s.keyField=document.getElementById('keyField').value;
 s.filterField=document.getElementById('filterField').value;
 s.opts.action=document.getElementById('optAction').checked;
 s.opts.pathParams=document.getElementById('optPath').checked;
 s.opts.totalCount=document.getElementById('optTotal').checked;
 s.fields=[];
 document.querySelectorAll('.field-card').forEach(function(c){
  s.fields.push({name:c.querySelector('.fn').value,type:c.querySelector('.ft').value,sn:c.querySelector('.fs').value});
 });
}

function sync(){ensureApi();saveFormToApi();renderApiList();render();autoSave()}

/* ===== FIELDS ===== */
function addField(){addFieldWithData('','CHARACTER','')}
function addFieldWithData(name,type,sn){
 var d=document.getElementById('fields');var c=document.createElement('div');c.className='field-card';
 c.draggable=true;
 c.ondragstart=function(e){
  c.classList.add('dragging');
 };
 c.ondragend=function(){
  c.classList.remove('dragging');
  sync();
 };
 c.ondragover=function(e){
  e.preventDefault();
  var afterElement=getDragAfterElement(d,e.clientY);
  var draggable=document.querySelector('.dragging');
  if(draggable && draggable !== c){
   if(afterElement==null){
    d.appendChild(draggable);
   }else{
    d.insertBefore(draggable,afterElement);
   }
  }
 };
 c.innerHTML='<div style="cursor:grab;padding-right:10px;display:flex;align-items:center;color:#666">&#9776;</div><button class="del-btn" onclick="this.parentElement.remove();sync()">&#10005;</button><div class="row"><div><label>Campo</label><input class="fn" value="'+name+'" placeholder="desc-item" oninput="autoSN(this);sync()"></div><div><label>Tipo</label><select class="ft" onchange="sync()"><option'+(type==='CHARACTER'?' selected':'')+'>CHARACTER</option><option'+(type==='INTEGER'?' selected':'')+'>INTEGER</option><option'+(type==='DECIMAL'?' selected':'')+'>DECIMAL</option><option'+(type==='LOGICAL'?' selected':'')+'>LOGICAL</option><option'+(type==='DATE'?' selected':'')+'>DATE</option><option'+(type==='INT64'?' selected':'')+'>INT64</option></select></div><div><label>JSON</label><input class="fs" value="'+sn+'" placeholder="descItem" oninput="sync()"></div></div>';
 d.appendChild(c);
}
function getDragAfterElement(container,y){
 var draggableElements=[].slice.call(container.querySelectorAll('.field-card:not(.dragging)'));
 return draggableElements.reduce(function(closest,child){
  var box=child.getBoundingClientRect();
  var offset=y-box.top-box.height/2;
  if(offset<0 && offset>closest.offset){
   return{offset:offset,element:child};
  }else{
   return closest;
  }
 },{offset:Number.NEGATIVE_INFINITY}).element;
}
function autoSN(el){var card=el.closest('.field-card');var sn=card.querySelector('.fs');sn.value=toCamel(el.value)}

/* ===== EDIT MODE ===== */
function toggleEdit(){
 editMode=document.getElementById('editMode').checked;
 document.getElementById('code-area').style.display=editMode?'none':'block';
 document.getElementById('code-editor').style.display=editMode?'block':'none';
 render();
}

function onCodeEdit(){
 if(!editedCode[currentApi])editedCode[currentApi]={};
 editedCode[currentApi][activeTab]=document.getElementById('code-editor').value;
 autoSave();
}

function getCode(apiIdx,tab){
 if(editedCode[apiIdx]&&editedCode[apiIdx][tab])return editedCode[apiIdx][tab];
 var s=apis[apiIdx];if(!s)return '';
 var tpl=templates.find(function(t){return t.id===s.templateId})||templates[0];
 if(!tpl)return '';
 var file=tpl.files.find(function(f){return f.id===tab});
 if(!file)return '';
 return renderTemplate(file.content, s);
}

/* ===== HIGHLIGHT ===== */
function hl(code){
 var KW=['DEFINE','TEMP-TABLE','FIELD','AS','CHARACTER','INTEGER','DECIMAL','LOGICAL','DATE','INT64','NO-UNDO','INITIAL','SERIALIZE-NAME','PROCEDURE','END','USING','FOR','EACH','FIRST','NO-LOCK','WHERE','BEGINS','ASSIGN','CREATE','BUFFER','HANDLE','QUERY','SCROLLING','REPEAT','GET','NEXT','LEAVE','IF','THEN','DO','RETURN','CATCH','FINALLY','FUNCTION','RETURNS','INPUT','OUTPUT','PARAM','TABLE','TRUE','FALSE','BLOCK-LEVEL','ON','ERROR','UNDO','THROW','WHEN','NOT','EQ','AND','OR','NEW','EMPTY','LIKE'];
 return code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/(\/\/.*$|\/\*.*?\*\/)/gm,'<span class="cmt">$1</span>').replace(/('[^']*')/g,'<span class="str">$1</span>').replace(/("[^"]*")/g,'<span class="str">$1</span>').replace(/(\{[^}]+\})/g,'<span class="fn">$1</span>').replace(new RegExp('\\b('+KW.join('|')+')\\b','gi'),'<span class="kw">$1</span>').replace(/\b(\d+)\b/g,'<span class="num">$1</span>');
}

/* ===== RENDER ===== */
function switchTab(tab){activeTab=tab;render()}
function render(){
 ensureApi();
 var s=apis[currentApi];
 var tpl=templates.find(function(t){return t.id===s.templateId})||templates[0];
 var tabsContainer=document.querySelector('.preview .tabs');
 if(tabsContainer&&tpl){
  tabsContainer.innerHTML='';
  var foundActive=false;
  tpl.files.forEach(function(f){
   var btn=document.createElement('div');
   btn.className='tab'+(f.id===activeTab?' active':'');
   btn.dataset.tab=f.id;
   btn.textContent=renderTemplate(f.tabName,s);
   btn.onclick=function(){switchTab(f.id)};
   tabsContainer.appendChild(btn);
   if(f.id===activeTab) foundActive=true;
  });
  if(!foundActive&&tpl.files.length>0){activeTab=tpl.files[0].id; render(); return;}
 }

 var code=getCode(currentApi,activeTab);
 if(editMode){document.getElementById('code-editor').value=code}
 else{document.getElementById('code-area').innerHTML=hl(code)}
 document.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('active',t.dataset.tab===activeTab)});
}

/* ===== TEMPLATE MANAGER ===== */
var currentEditTplId = null;

function openTemplateManager(){
 document.getElementById('tplModal').classList.add('show');
 if(!currentEditTplId && templates.length>0) currentEditTplId=templates[0].id;
 renderTemplateManager();
}

function closeTemplateManager(){
 document.getElementById('tplModal').classList.remove('show');
 loadApiToForm(currentApi);
 render();
}

function renderTemplateManager(){
 var list=document.getElementById('tplList');
 list.innerHTML='';
 templates.forEach(function(t){
  var btn=document.createElement('div');
  btn.className='api-card'+(t.id===currentEditTplId?' active':'');
  btn.innerHTML='<div class="api-name" style="margin-bottom:0">'+t.name+'</div>';
  btn.style.cursor='pointer';
  btn.onclick=function(){selectTemplateEdit(t.id)};
  list.appendChild(btn);
 });
 
 var editor=document.getElementById('tplEditor');
 if(!currentEditTplId){
  editor.style.display='none';
  return;
 }
 editor.style.display='flex';
 var tpl=templates.find(function(t){return t.id===currentEditTplId});
 if(!tpl)return;
 
 document.getElementById('tplEditName').value=tpl.name;
 
 var flist=document.getElementById('tplFilesList');
 flist.innerHTML='';
 tpl.files.forEach(function(f){
  var card=document.createElement('div');
  card.style.background='var(--bg)';
  card.style.padding='10px';
  card.style.borderRadius='4px';
  card.style.border='1px solid var(--brd)';
  
  var hdr=document.createElement('div');
  hdr.style.display='flex';
  hdr.style.gap='10px';
  hdr.style.marginBottom='10px';
  hdr.innerHTML='<input value="'+f.tabName+'" onchange="updateFileFromTemplate(\''+f.id+'\',\'tabName\',this.value)" placeholder="Nome da Aba" style="flex:1;margin:0"><input value="'+f.fileName+'" onchange="updateFileFromTemplate(\''+f.id+'\',\'fileName\',this.value)" placeholder="Nome do Arquivo" style="flex:2;margin:0"><button class="btn-del" onclick="removeFileFromTemplate(\''+f.id+'\')" style="background:var(--red);color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer">&#10005;</button>';
  
  var txt=document.createElement('textarea');
  txt.value=f.content;
  txt.style.width='100%';
  txt.style.height='150px';
  txt.style.fontFamily='monospace';
  txt.style.fontSize='12px';
  txt.style.background='var(--bg2)';
  txt.style.color='var(--txt)';
  txt.style.border='1px solid var(--brd)';
  txt.style.borderRadius='4px';
  txt.style.padding='10px';
  txt.style.whiteSpace='pre';
  txt.onchange=function(){updateFileFromTemplate(f.id,'content',this.value)};
  
  card.appendChild(hdr);
  card.appendChild(txt);
  flist.appendChild(card);
 });
}

function newTemplate(){
 var id='tpl-'+Date.now();
 var base=templates.length>0?JSON.parse(JSON.stringify(templates[templates.length-1])):null;
 var nt={id:id,name:'Novo Template',files:[]};
 if(base){
  nt.files=base.files.map(function(f){return{id:'f-'+Date.now()+Math.random(),tabName:f.tabName,fileName:f.fileName,content:f.content}});
 }
 templates.push(nt);
 currentEditTplId=id;
 renderTemplateManager();
 autoSave();
}

function selectTemplateEdit(id){
 currentEditTplId=id;
 renderTemplateManager();
}

function deleteCurrentTemplate(){
 if(templates.length<=1){toast('Deve haver pelo menos um template');return;}
 if(!confirm('Excluir este template?'))return;
 templates=templates.filter(function(t){return t.id!==currentEditTplId});
 currentEditTplId=templates[0].id;
 renderTemplateManager();
 autoSave();
}

function saveCurrentTemplate(){
 var tpl=templates.find(function(t){return t.id===currentEditTplId});
 if(tpl){
  tpl.name=document.getElementById('tplEditName').value;
  renderTemplateManager();
  autoSave();
 }
}

function addFileToTemplate(){
 var tpl=templates.find(function(t){return t.id===currentEditTplId});
 if(tpl){
  tpl.files.push({id:'f-'+Date.now(),tabName:'Nova Aba',fileName:'arquivo_{{apiName}}.p',content:'// novo arquivo'});
  renderTemplateManager();
  autoSave();
 }
}

function removeFileFromTemplate(fId){
 var tpl=templates.find(function(t){return t.id===currentEditTplId});
 if(tpl){
  tpl.files=tpl.files.filter(function(f){return f.id!==fId});
  renderTemplateManager();
  autoSave();
 }
}

function updateFileFromTemplate(fId, field, value){
 var tpl=templates.find(function(t){return t.id===currentEditTplId});
 if(tpl){
  var f=tpl.files.find(function(x){return x.id===fId});
  if(f){
   f[field]=value;
   autoSave();
  }
 }
}

/* ===== ACTIONS ===== */
function copyCode(){navigator.clipboard.writeText(getCode(currentApi,activeTab));toast('Copiado!')}

function downloadZip(){
 if(typeof JSZip==='undefined'){toast('JSZip nao disponivel');return}
 ensureApi();saveFormToApi();
 var z=new JSZip();
 var fileCount=0;
 apis.forEach(function(s,i){
  var tpl=templates.find(function(t){return t.id===s.templateId})||templates[0];
  if(!tpl)return;
  tpl.files.forEach(function(f){
   var resolvedName=renderTemplate(f.fileName,s);
   var code=getCode(i,f.id);
   z.file(resolvedName,code);
   fileCount++;
  });
 });
 var zipName=apis.length===1?'custom'+(apis[0].apiName||'Nome')+'_api.zip':'apis_generated.zip';
 z.generateAsync({type:'base64'}).then(function(b64){
  var a=document.createElement('a');a.href='data:application/zip;base64,'+b64;a.download=zipName;
  a.style.display='none';document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a)},500);
  toast('ZIP: '+zipName+' ('+fileCount+' arquivos)');
 });
}

document.addEventListener('DOMContentLoaded',function(){
 if(templates.length===0) templates=getDefaultTemplates();
 var restored=autoLoad();
 if(restored){
  loadApiToForm(currentApi);renderApiList();render();
  toast('Sessao anterior restaurada ('+apis.length+' API(s))');
 }else{
  ensureApi();loadApiToForm(0);render();
 }
});
