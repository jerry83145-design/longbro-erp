const STORE = 'longbroSalesCalculation:v1';
const money = value => Number(String(value).replace(/,/g, '').trim());
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function parseSalesSheet(sheet, XLSX) {
  const rows = XLSX.utils.sheet_to_json(sheet, {header:1,defval:'',blankrows:true});
  const heads = rows[0].map(x => String(x).trim());
  const required = ['訂單編號','訂單狀態','付款狀態','商品貨號','訂單總金額','商品價格','購買數量','商品名稱','商品規格','顧客姓名','團拆暱稱(會顯示在直播表單上)'];
  for (const key of required) if (!heads.includes(key)) throw new Error('缺少欄位：'+key);
  const at = (row,key) => row[heads.indexOf(key)] ?? '';
  const orders = []; const seen = new Set(); let current;
  rows.slice(1).forEach((row,index) => {
    const sourceRow = index+2;
    if (row.every(x=>x==='')) return;
    const id = String(at(row,'訂單編號')).trim();
    if (id) {
      if (seen.has(id)) throw new Error(`訂單 ${id} 重複出現，請先確認來源。`);
      seen.add(id);
      const raw=at(row,'訂單總金額');
      if (raw==='' || !Number.isFinite(money(raw))) throw new Error(`第 ${sourceRow} 列訂單金額缺漏或無效。`);
      current={id,status:String(at(row,'訂單狀態')).trim(),payment:String(at(row,'付款狀態')).trim(),customer:String(at(row,'顧客姓名')),nickname:String(at(row,'團拆暱稱(會顯示在直播表單上)')),original:money(raw),row:sourceRow,items:[],override:'',date:'',method:'',note:''};
      orders.push(current);
    } else {
      const col=heads.indexOf('訂單編號');
      const merged=(sheet['!merges']||[]).some(m=>m.s.c<=col && m.e.c>=col && m.s.r<sourceRow-1 && m.e.r>=sourceRow-1);
      if (!current || !merged) throw new Error(`第 ${sourceRow} 列沒有訂單編號，且不在合併範圍內。`);
    }
    const price=at(row,'商品價格'),quantity=at(row,'購買數量');
    if(price===''||quantity===''||!Number.isFinite(money(price))||!Number.isFinite(money(quantity)))throw Error(`第 ${sourceRow} 列商品價格或數量缺漏／無效。`);
    current.items.push({sku:String(at(row,'商品貨號')),name:String(at(row,'商品名稱')),spec:String(at(row,'商品規格')),price:money(price),quantity:money(quantity),override:'',row:sourceRow});
  });
  return orders;
}
export const isCancelled = o => ['已取消','取消'].includes(o.status);
export const needsSalesReview = o => o.payment==='未付款'||o.original===0;
export function allocatedAmount(o,i){
  if(o.payment!=='已付款'||o.original===0)return null;
  const weights=o.items.map(x=>x.price*x.quantity);
  if(o.items.some(x=>typeof x.price!=='number'||typeof x.quantity!=='number')||weights.some(x=>!Number.isFinite(x)||x<0))return null;
  const sum=weights.reduce((a,b)=>a+b,0),index=o.items.indexOf(i);
  if(sum<=0||index<0)return null;
  const before=weights.slice(0,index).reduce((a,b)=>a+b,0);
  const cents=Math.round(o.original*100);
  return (Math.round(cents*(before+weights[index])/sum)-Math.round(cents*before/sum))/100;
}
export function itemAmount(o,i) {
  if(i.override!==undefined && i.override!=='')return Number(i.override);
  return allocatedAmount(o,i);
}
export const effectiveAmount = o => Math.round(o.items.reduce((n,i)=>n+(itemAmount(o,i)??0),0)*100)/100;
export function salesTotals(orders){
  const skus=new Map();let total=0,pending=0;
  for(const o of orders.filter(o=>!isCancelled(o)))for(const i of o.items){
    const a=itemAmount(o,i);const key=i.sku||'未提供貨號';
    const entry=skus.get(key)||{sku:key,names:[],amount:0,pending:0};
    if(i.name&&!entry.names.includes(i.name))entry.names.push(i.name);
    if(a===null){entry.pending++;pending++;}else{entry.amount=Math.round((entry.amount+a)*100)/100;total=Math.round((total+a)*100)/100;}skus.set(key,entry);
  }
  return {total,pending,skus:[...skus.values()].sort((a,b)=>a.sku.localeCompare(b.sku))};
}
function skuSummary(stats){
  return `<table class="sales-sku-table"><thead><tr><th>品名</th><th>貨號</th><th>金額</th><th>待補填列數</th></tr></thead><tbody>${stats.skus.map(s=>`<tr><td>${s.names.map(esc).join('<br>')||'未提供品名'}</td><td>${esc(s.sku)}</td><td>${s.amount.toLocaleString('zh-TW',{minimumFractionDigits:0,maximumFractionDigits:0})}</td><td>${s.pending}</td></tr>`).join('')}</tbody></table>`;
}
export function initSalesCalculation() {
  const root=document.querySelector('#salesView'); if(!root)return;
  let batches=[]; let active='';
  const status=root.querySelector('[data-sales-status]');
  try {batches=JSON.parse(localStorage.getItem(STORE)||'[]');if(!Array.isArray(batches))throw Error();active=batches.at(-1)?.id||'';}catch{status.textContent='保存紀錄無法讀取，請勿清除瀏覽器資料。';}
  for(const batch of batches)if(batch.savedAt&&!batch.savedOrders)batch.savedOrders=structuredClone(batch.orders);
  const current=()=>batches.find(b=>b.id===active);
  const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(batches));status.textContent='已自動保存於此瀏覽器。';return true;}catch{status.textContent='保存失敗，請立即匯出備份，避免關閉後遺失。';return false;}};
  const filtered=()=>current()?.orders.filter(o=>!isCancelled(o))||[];
  function render(){
    root.querySelector('[data-sales-history]').innerHTML='<option value="">選擇紀錄</option>'+batches.map(b=>`<option value="${esc(b.id)}" ${b.id===active?'selected':''}>${esc(b.name)} — ${esc(b.created)}</option>`).join('');
    const rows=filtered(), stats=salesTotals(rows), total=stats.total;
    const cancelled=current()?.orders.filter(isCancelled).length||0;
    const legacy=rows.some(o=>o.items.some(i=>typeof i.price!=='number'));
    const differences=rows.filter(o=>o.payment==='已付款'&&o.items.every(i=>typeof i.price==='number')&&Math.abs(o.items.reduce((n,i)=>n+i.price*i.quantity,0)-o.original)>0.005);
    const expanded=root.querySelector('[data-sales-skus]')?.open||false;
    root.querySelector('[data-sales-summary]').innerHTML=`<div class="sales-total"><span>該表商品合計${stats.pending?'（待補填未計入）':''}</span><strong>${total.toLocaleString('zh-TW')}</strong></div><p>保留訂單 ${rows.length} 筆　已取消 ${cancelled} 筆　未付款 ${rows.filter(o=>o.payment==='未付款').length} 筆　待補填商品 ${stats.pending} 列</p>${legacy?'<p class="sales-warning">舊版紀錄缺少商品價格與顧客資料，請重新匯入原始 Excel。舊版訂單修正金額保留在備註提示，需按商品列重新分配。</p>':''}<details data-sales-skus ${expanded?'open':''}><summary>展開各貨號金額（${stats.skus.length} 種）</summary>${skuSummary(stats)}</details><p>已付款商品原價加總與官網訂單金額不同：${differences.length} 筆${differences.length?'（請核對下方差額）':''}</p>`;
    const unpaidOnly=root.querySelector('[data-sales-unpaid]').checked;
    root.querySelector('[data-sales-items]').innerHTML=rows.filter(o=>!unpaidOnly||needsSalesReview(o)).flatMap(o=>o.items.map(i=>{
      const amount=itemAmount(o,i),diff=o.items.every(i=>typeof i.price==='number')?o.items.reduce((n,i)=>n+i.price*i.quantity,0)-o.original:null;
      const field=(label,value)=>`<div class="sales-item-field"><span>${label}</span><div>${esc(value)}</div></div>`;
      return `<article class="sales-item-card ${o.original===0?'sales-zero':''}">
        <header><strong>${esc(i.sku)} · ${esc(i.spec)}</strong><span>${esc(o.status)}／${esc(o.payment)}</span></header>
        <div class="sales-item-name">${esc(i.name)}</div>
        <div class="sales-item-grid">
          ${field('訂單編號',o.id)}${field('顧客姓名',o.customer??'待重新匯入')}${field('團拆暱稱',o.nickname??'待重新匯入')}
          ${field('商品價格',i.price===undefined?'待重新匯入':i.price.toLocaleString('zh-TW'))}${field('數量',i.quantity)}${field('官網分攤金額（本列）',allocatedAmount(o,i)===null?'待補填':allocatedAmount(o,i).toLocaleString('zh-TW'))}
        </div>
        <div class="sales-item-calculation">
          <label>本列修正後金額<input aria-label="${esc(o.id)} 商品列 ${i.row} 修正後金額" data-order="${esc(o.id)}" data-item="${i.row}" data-field="override" type="number" step="0.01" value="${esc(i.override??'')}" placeholder="${allocatedAmount(o,i)!==null?'未填採官網分攤金額':'請填本列商品總額'}"></label>
          ${field('本列計算金額',amount===null?'待補填':amount.toLocaleString('zh-TW'))}${field('原價與官網差額（整張）',diff===null?'待重新匯入':diff.toLocaleString('zh-TW'))}
        </div>
        <small>來源列 ${i.row}　官網整張訂單總額：${o.original.toLocaleString('zh-TW')}（僅供核對，不逐列加總）${o.original===0?'　原始零元':''}</small>${o.override!==''?`<p>舊版訂單修正：${esc(o.override)}（待按商品分配）</p>`:''}
      </article>`;
    })).join('')||'<p>目前沒有符合條件的訂單。</p>';
    root.querySelector('[data-sales-export]').disabled=!current();root.querySelector('[data-sales-copy]').disabled=!current();root.querySelector('[data-sales-save]').disabled=!current();
    root.querySelector('[data-sales-saved-at]').textContent=current()?.savedAt ? '最後手動儲存：'+new Date(current().savedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})+(current().modifiedSinceSave?'（儲存後有修改，請再按儲存紀錄）':'') : (current()?'填寫內容已自動保存；填完可按「儲存紀錄」。':'');
    root.querySelector('[data-sales-editor-title]').textContent=current()?.savedAt?'銷售計算控台｜修改紀錄':'銷售計算控台';
    root.querySelector('[data-sales-save]').textContent=current()?.savedAt?'儲存修改':'儲存紀錄';
    root.querySelector('[data-sales-records]').innerHTML=batches.filter(b=>b.savedAt).slice().reverse().map(b=>{
      const s=salesTotals(b.savedOrders);
      return `<article class="sales-item-card"><header><strong>${esc(b.name)}</strong><span>${esc(new Date(b.savedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}))}</span></header><p>已儲存合計：<strong>${s.total.toLocaleString('zh-TW')}</strong>　貨號 ${s.skus.length} 種　待補填 ${s.pending} 列${b.modifiedSinceSave?'　另有未儲存修改':''}</p><div class="sales-record-actions"><button type="button" class="secondary-button" data-sales-record-view="${esc(b.id)}">查看明細</button><button type="button" data-sales-record-edit="${esc(b.id)}">修改</button><button type="button" class="secondary-button" data-sales-record-delete="${esc(b.id)}">刪除</button><button type="button" class="secondary-button" data-sales-record-rename="${esc(b.id)}">修改名稱</button></div></article>`;
    }).join('')||'<p>尚無已儲存紀錄。填寫完成後按上方「儲存紀錄」。</p>';
  }
  root.querySelector('[data-sales-file]').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try {
      if(!window.XLSX)throw Error('Excel 元件尚未載入，請重新整理。');
      const wb=window.XLSX.read(await file.arrayBuffer(),{type:'array'});
      const sheetName=wb.SheetNames.find(n=>{const h=window.XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1})[0]||[];return h.includes('訂單編號')&&h.includes('付款狀態');});
      if(!sheetName)throw Error('找不到訂單工作表。');
      const orders=parseSalesSheet(wb.Sheets[sheetName],window.XLSX);
      const id=crypto.randomUUID(); batches.push({id,name:file.name,sheet:sheetName,created:new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}),orders});active=id;save();render();
    }catch(error){status.textContent=error.message;}finally{event.target.value='';}
  });
  root.querySelector('[data-sales-history]').addEventListener('change',e=>{active=e.target.value;render();});
  root.querySelector('[data-sales-unpaid]').addEventListener('change',render);
  root.addEventListener('change',e=>{
    const field=e.target.dataset.field;if(!field)return;
    const o=current()?.orders.find(o=>o.id===e.target.dataset.order);if(!o)return;
    const value=e.target.value;
    if(field==='override' && (e.target.validity.badInput || (value!==''&&!Number.isFinite(Number(value))))){status.textContent='請輸入有效金額。';return;}
    if(field==='override'){
      const item=o.items.find(i=>String(i.row)===e.target.dataset.item);if(!item)return;item.override=value;
    }else o[field]=value;
    current().modifiedSinceSave=true;save();render();
  });
  root.querySelector('[data-sales-save]').addEventListener('click',()=>{
    const batch=current();if(!batch)return;
    const previous={savedAt:batch.savedAt,modifiedSinceSave:batch.modifiedSinceSave,savedOrders:batch.savedOrders};
    batch.savedAt=new Date().toISOString();batch.modifiedSinceSave=false;batch.savedOrders=structuredClone(batch.orders);
    if(!save()){Object.assign(batch,previous);render();return;}
    render();
    const pending=salesTotals(filtered()).pending;
    root.querySelector('[data-sales-record-detail]').hidden=true;
    status.textContent=`紀錄已儲存，已列在下方「已儲存紀錄」。${pending?`仍有 ${pending} 列待補填，已保留目前內容。`:''}`;
  });
  root.addEventListener('click',event=>{
    const rename=event.target.closest('[data-sales-record-rename]');
    if(rename){
      const batch=batches.find(b=>b.id===rename.dataset.salesRecordRename);if(!batch)return;
      const input=window.prompt('請輸入紀錄名稱',batch.name);if(input===null)return;
      const name=input.trim();if(!name){status.textContent='紀錄名稱不能空白。';return;}
      const previousName=batch.name,previousSource=batch.sourceName;
      batch.sourceName=batch.sourceName||batch.name;batch.name=name;
      if(!save()){batch.name=previousName;batch.sourceName=previousSource;render();return;}
      root.querySelector('[data-sales-record-detail]').hidden=true;render();status.textContent='紀錄名稱已更新。';return;
    }
    const remove=event.target.closest('[data-sales-record-delete]');
    if(remove){
      const id=remove.dataset.salesRecordDelete,batch=batches.find(b=>b.id===id);if(!batch)return;
      if(!window.confirm(`確定刪除「${batch.name}」？\n這會刪除該筆已儲存紀錄及其草稿，無法復原。`))return;
      const previous=batches,previousActive=active;
      batches=batches.filter(b=>b.id!==id);
      if(active===id)active=batches.at(-1)?.id||'';
      if(!save()){batches=previous;active=previousActive;render();return;}
      root.querySelector('[data-sales-record-detail]').hidden=true;render();
      status.textContent='紀錄已刪除。';return;
    }
    const edit=event.target.closest('[data-sales-record-edit]');
    if(edit){
      active=edit.dataset.salesRecordEdit;render();root.querySelector('[data-sales-record-detail]').hidden=true;
      status.textContent='已載入紀錄供修改，完成後按「儲存修改」。';
      root.querySelector('[data-sales-editor-title]').scrollIntoView({behavior:'smooth',block:'start'});return;
    }
    if(event.target.closest('[data-sales-detail-close]')){root.querySelector('[data-sales-record-detail]').hidden=true;return;}
    const view=event.target.closest('[data-sales-record-view]');if(!view)return;
    const batch=batches.find(b=>b.id===view.dataset.salesRecordView);if(!batch)return;
    const s=salesTotals(batch.savedOrders),detail=root.querySelector('[data-sales-record-detail]');
    const line=(label,value)=>`<div class="sales-item-field"><span>${label}</span><div>${esc(value)}</div></div>`;
    detail.innerHTML=`<div class="panel-heading"><h3>${esc(batch.name)}｜已儲存明細</h3><button class="secondary-button" type="button" data-sales-detail-close>收起明細</button></div><p>合計 ${s.total.toLocaleString('zh-TW')}　待補填 ${s.pending} 列</p>${skuSummary(s)}<div class="sales-item-list">${batch.savedOrders.filter(o=>!isCancelled(o)).flatMap(o=>o.items.map(i=>`<article class="sales-item-card"><header><strong>${esc(i.sku)} · ${esc(i.spec)}</strong><span>${esc(o.payment)}</span></header><p>${esc(i.name)}</p><div class="sales-item-grid">${line('訂單編號',o.id)}${line('顧客姓名',o.customer??'待重新匯入')}${line('團拆暱稱',o.nickname??'待重新匯入')}${line('商品價格',i.price??'待重新匯入')}${line('數量',i.quantity)}${line('官網分攤金額（本列）',allocatedAmount(o,i)??'待補填')}${line('官網總額（整張，僅供核對）',o.original)}${line('本列修正後金額',i.override??'')}${line('本列計算金額',itemAmount(o,i)??'待補填')}${line('來源列',i.row)}</div></article>`)).join('')}</div>`;
    detail.hidden=false;detail.scrollIntoView({behavior:'smooth',block:'start'});
  });
  root.querySelector('[data-sales-copy]').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(String(filtered().reduce((n,o)=>n+effectiveAmount(o),0)));status.textContent='已複製計算總額。';}catch{status.textContent='複製失敗，請手動複製上方總額。';}
  });
  root.querySelector('[data-sales-export]').addEventListener('click',()=>{
    try{
      const X=window.XLSX;if(!X)throw Error('Excel 元件尚未載入。');const wb=X.utils.book_new();
      const rows=filtered();
      const stats=salesTotals(rows);
      const head=['訂單編號','訂單狀態','付款狀態','商品貨號','商品名稱','商品規格','商品價格','數量','顧客姓名','團拆暱稱','官網訂單總金額（不可按商品列加總）','本列修正後金額','本列計算金額','收款日期','收款方式','原因／備註','來源列號'];
      const detail=(o,i)=>[o.id,o.status,o.payment,i.sku,i.name,i.spec,i.price??'',i.quantity,o.customer??'',o.nickname??'',o.original,i.override===''||i.override===undefined?'':Number(i.override),itemAmount(o,i)??'待補填',o.date,o.method,o.note,i.row];
      const add=(name,data)=>{const s=X.utils.aoa_to_sheet(data);s['!cols']=data[0].map(()=>({wch:24}));for(const cell of Object.values(s))if(cell?.t==='n')cell.z='#,##0;[Red](#,##0);-';X.utils.book_append_sheet(wb,s,name);};
      add('統計摘要',[['項目','內容'],['紀錄名稱',current().name],['商品計算合計',stats.total],['待補填商品列',stats.pending],['保留訂單數',rows.length],['剔除已取消',current().orders.length-rows.length],['來源檔案',current().sourceName||current().name],['來源工作表',current().sheet],['金額規則','商品列修正優先；已付款按價格×數量比例分攤官網總額；未付款或官網零元待補填']]);
      add('貨號統計',[['品名','貨號','商品合計','待補填列數'],...stats.skus.map(s=>[s.names.join('；'),s.sku,s.amount,s.pending])]);
      add('訂單明細',[['訂單編號','付款狀態','官網訂單總金額','商品計算合計','待補填列數','商品原價與官網金額差額','舊版訂單修正金額（未分配）'],...rows.map(o=>[o.id,o.payment,o.original,effectiveAmount(o),o.items.filter(i=>itemAmount(o,i)===null).length,o.items.every(i=>typeof i.price==='number')?o.items.reduce((n,i)=>n+i.price*i.quantity,0)-o.original:'待重新匯入',o.override])]);
      add('待補填明細',[head,...rows.filter(needsSalesReview).flatMap(o=>o.items.map(i=>detail(o,i)))]);
      add('商品明細',[head,...rows.flatMap(o=>o.items.map(i=>detail(o,i)))]);
      X.writeFile(wb,`銷售計算_${Date.now()}.xlsx`);status.textContent='已匯出，未新增收入紀錄。';
    }catch(error){status.textContent='匯出失敗：'+error.message;}
  });render();
}
