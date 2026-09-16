const MONTHS=["","Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const $=s=>document.querySelector(s); let tab="despesas"; let db=JSON.parse(localStorage.getItem("tcesp-data")||"null")||window.SEED_DATA;
function save(){localStorage.setItem("tcesp-data",JSON.stringify(db))}
for(let i=1;i<=12;i++)$("#mes").insertAdjacentHTML("beforeend",`<option value="${i}">${MONTHS[i]}</option>`);
function brl(v){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0)}
function filt(arr){let m=+$("#mes").value,q=$("#q").value.toLowerCase();return arr.filter(x=>x.ano==+$("#ano").value&&(!m||x.mesNum==m)&&(!q||JSON.stringify(x).toLowerCase().includes(q)))}
function render(){
 let d=filt(db.despesas),r=filt(db.receitas),ev={};d.forEach(x=>ev[x.evento]=(ev[x.evento]||0)+x.valor);
 $("#cards").innerHTML=[["Receita",r.reduce((a,x)=>a+x.valor,0)],["Empenhado",ev["Empenhado"]],["Reforço",ev["Reforço"]],["Anulação",ev["Anulação"]],["Liquidado",ev["Valor Liquidado"]],["Pago",ev["Valor Pago"]]].map(x=>`<div class="metric card"><small>${x[0]}</small><strong>${brl(x[1])}</strong></div>`).join("");
 let rows=[],heads=[];
 if(tab==="despesas"){heads=["Valor","Mês","Evento","Empenho","Data","Órgão","Fornecedor","Identificação"];rows=d.sort((a,b)=>b.valor-a.valor).map(x=>[brl(x.valor),x.mes,x.evento,x.empenho,x.data,x.orgao,x.fornecedor,x.fornecedorId])}
 if(tab==="receitas"){heads=["Valor","Mês","Fonte","Aplicação","Natureza / alínea","Subalínea"];rows=r.sort((a,b)=>b.valor-a.valor).map(x=>[brl(x.valor),x.mes,x.fonte,x.aplicacao,x.alinea,x.subalinea])}
 if(tab==="fornecedores"){heads=["Fornecedor","Empenhado","Reforço","Anulação","Liquidado","Pago"];let g={};d.forEach(x=>{let k=x.fornecedor||"(sem nome)";g[k]??={};g[k][x.evento]=(g[k][x.evento]||0)+x.valor});rows=Object.entries(g).map(([k,v])=>[k,brl(v.Empenhado),brl(v.Reforço),brl(v["Anulação"]),brl(v["Valor Liquidado"]),brl(v["Valor Pago"])]).sort((a,b)=>parseBRL(b[1])-parseBRL(a[1]))}
 $("#thead").innerHTML="<tr>"+heads.map(h=>`<th>${h}</th>`).join("")+"</tr>";$("#tbody").innerHTML=rows.map(r=>"<tr>"+r.map((v,i)=>`<td class="${(i==0||tab==='fornecedores'&&i>0)?'num':''}">${esc(v??"")}</td>`).join("")+"</tr>").join("");
 $("#status").textContent=`${rows.length.toLocaleString("pt-BR")} linhas exibidas • dados armazenados neste aparelho`;
}
function parseBRL(s){return +(s||"").replace(/[^\d,-]/g,"").replace(".","").replace(",",".")}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");tab=b.dataset.tab;render()});
["mes","ano","q"].forEach(id=>$("#"+id).addEventListener(id==="q"?"input":"change",render));
async function importData(raw,mesNum){
 let a=typeof raw==="string"?JSON.parse(raw.replace(/^```(?:json)?\s*/,"").replace(/\s*```$/,"")):raw;if(!a.length)return;
 if("evento" in a[0])a.forEach(x=>db.despesas.push({ano:+$("#ano").value,mesNum,mes:x.mes||MONTHS[mesNum],orgao:x.orgao||"",evento:x.evento||"",empenho:x.nr_empenho||"",fornecedorId:x.id_fornecedor||"",fornecedor:x.nm_fornecedor||"",data:x.dt_emissao_despesa||"",valor:+String(x.vl_despesa||0).replace(/\./g,"").replace(",",".")}));
 else a.forEach(x=>db.receitas.push({ano:+$("#ano").value,mesNum,mes:x.mes||MONTHS[mesNum],orgao:x.orgao||"",fonte:x.ds_fonte_recurso||"",aplicacao:x.ds_cd_aplicacao_fixo||"",alinea:x.ds_alinea||"",subalinea:x.ds_subalinea||"",valor:+String(x.vl_arrecadacao||0).replace(/\./g,"").replace(",",".")}));
 dedupe();save();render();
}
function dedupe(){let seen=new Set();db.despesas=db.despesas.filter(x=>{let k=JSON.stringify(x);if(seen.has(k))return false;seen.add(k);return true});seen=new Set();db.receitas=db.receitas.filter(x=>{let k=JSON.stringify(x);if(seen.has(k))return false;seen.add(k);return true})}
$("#file").onchange=async e=>{let m=+$("#mes").value;if(!m)return alert("Selecione um mês.");for(let f of e.target.files)await importData(await f.text(),m);alert("Importação concluída.")};
$("#apiBtn").onclick=async()=>{let m=+$("#mes").value;if(!m)return alert("Selecione um mês.");let base=`https://transparencia.tce.sp.gov.br/api/json`;try{let [d,r]=await Promise.all([fetch(`${base}/despesas/mendonca/${$("#ano").value}/${m}`).then(x=>x.json()),fetch(`${base}/receitas/mendonca/${$("#ano").value}/${m}`).then(x=>x.json())]);await importData(d,m);await importData(r,m);alert("Mês atualizado.")}catch(e){alert("O navegador bloqueou ou a API não respondeu. Use Importar JSON. Detalhe: "+e.message)}};
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
let deferred;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;$("#installBtn").hidden=false});$("#installBtn").onclick=async()=>{if(deferred){deferred.prompt();deferred=null}};
render();