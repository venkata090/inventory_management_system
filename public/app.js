'use strict';
const $ = s => document.querySelector(s);
const currency = n => '₹' + Number(n || 0).toLocaleString('en-IN',{maximumFractionDigits:2,minimumFractionDigits:0});
const num = n => Number(n || 0).toLocaleString('en-IN');
const escapeHtml = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateText = v => v ? new Date(v.includes('T') ? v : v.replace(' ','T')+'Z').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const shortTime = v => v ? new Date(v.replace(' ','T')+'Z').toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '';
const icons = {
 grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 package:'<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
 arrows:'<path d="M7 7h14m0 0-4-4m4 4-4 4M17 17H3m0 0 4-4m-4 4 4 4"/>',
 chart:'<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8" width="3" height="10" rx="1"/><rect x="17" y="5" width="3" height="13" rx="1"/>',
 shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
 logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 download:'<path d="M12 3v12m0 0 5-5m-5 5-5-5M4 17v3h16v-3"/>',
 alert:'<path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/>',
 boxes:'<rect x="2" y="7" width="9" height="9" rx="1"/><rect x="13" y="7" width="9" height="9" rx="1"/><path d="M7 7V4h10v3M7 16v4h10v-4"/>',
 rupee:'<path d="M6 3h12M6 8h12m-12-5c7 0 10 10 0 10l9 8"/>',
 edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 10v7m4-7v7"/>',
 rotate:'<path d="M3 12a9 9 0 1 1 2.6 6.4M3 17v-5h5"/>',
 arrowRight:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
 layers:'<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5m-18 5 9 5 9-5"/>',
 filter:'<path d="M3 5h18M6 12h12m-9 7h6"/>'
};
function icon(name,size=18){return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.package}</svg>`;}
function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});}
let state={page:'overview',products:[],overview:null,movements:[],category:'',search:'',low:false};
async function api(endpoint,{method='GET',body}={}){
 const r=await fetch('/api'+endpoint,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,credentials:'same-origin'});
 let data;
 try{data=await r.json();}catch{throw new Error('Could not read the server response.');}
 if(!r.ok){if(r.status===401 && endpoint!=='/login')showLogin();throw new Error(data.error || 'Request failed.');}
 return data;
}
function toast(message,isError=false){const wrap=$('#toast-root'),t=document.createElement('div');t.className='toast'+(isError?' error':'');t.textContent=message;wrap.appendChild(t);setTimeout(()=>t.remove(),3500);}
function showLogin(){$('#app-view').classList.add('hidden');$('#login-view').classList.remove('hidden');}
function showApp(){$('#login-view').classList.add('hidden');$('#app-view').classList.remove('hidden');navigate('overview');}
const pageTitles={overview:'Overview',products:'Products',movements:'Stock movements',reports:'Reports'};
function navigate(page){
 if(!pageTitles[page])page='overview';
 state.page=page;$('#topbar-title').textContent=pageTitles[page];
 document.querySelectorAll('[data-page]').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
 $('#sidebar').classList.remove('open');
 history.replaceState({},'',`#${page}`);
 renderPage();
}
function heading(title,desc,actions=''){return `<div class="page-heading"><div><span class="eyebrow">INVENTORY WORKSPACE</span><h1>${title}</h1><p>${desc}</p></div><div class="heading-actions">${actions}</div></div>`;}
const actionButton=(label,id,iconName='plus',type='primary')=>`<button class="btn ${type}" id="${id}">${icon(iconName,15)} ${label}</button>`;
function status(product){if(product.quantity===0)return '<span class="status-pill danger"><span class="status-dot"></span>Out of stock</span>';if(product.quantity<=product.reorderLevel)return '<span class="status-pill warning"><span class="status-dot"></span>Low stock</span>';return '<span class="status-pill"><span class="status-dot"></span>In stock</span>';}
function productMark(p){return ['Stationery','Accessories','Lifestyle'].includes(p.category)?{Stationery:'✎',Accessories:'⌘',Lifestyle:'◈'}[p.category]:'▣';}
function productCell(p){return `<div class="product-name-flex"><div class="product-symbol">${productMark(p)}</div><div><div class="name-cell">${escapeHtml(p.name)}</div><div class="sku">${escapeHtml(p.sku)}</div></div></div>`;}
function formatProductRows(products,actions=false){return products.map(p=>`<tr><td>${productCell(p)}</td><td>${escapeHtml(p.category)}</td><td>${currency(p.price)}</td><td><strong>${num(p.quantity)}</strong> units</td><td>${status(p)}</td>${actions?`<td><div class="actions"><button class="icon-button" title="Stock in or out" data-action="stock" data-id="${p.id}">${icon('arrows',15)}</button><button class="icon-button" title="Edit product" data-action="edit" data-id="${p.id}">${icon('edit',15)}</button><button class="icon-button" title="Archive product" data-action="delete" data-id="${p.id}">${icon('trash',15)}</button></div></td>`:''}</tr>`).join('');}
function productTable(products,actions=false){return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Product</th><th>Category</th><th>Unit price</th><th>Quantity</th><th>Status</th>${actions?'<th>Actions</th>':''}</tr></thead><tbody>${products.length?formatProductRows(products,actions):`<tr><td colspan="${actions?6:5}" class="empty">No products found for this view.</td></tr>`}</tbody></table></div>`;}
function moveType(m){return m.type==='IN'?'<span class="status-pill">Stock in</span>':'<span class="status-pill warning">Stock out</span>';}
function movementTable(moves){return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Product</th><th>Type</th><th>Change</th><th>Stock after</th><th>Date</th></tr></thead><tbody>${moves.length?moves.map(m=>`<tr><td><div class="name-cell">${escapeHtml(m.productName)}</div><div class="sku">${escapeHtml(m.sku)}</div></td><td>${moveType(m)}</td><td style="font-weight:800;color:${m.type==='IN'?'#1ca47d':'#d88738'}">${m.type==='IN'?'+':'−'}${num(m.quantity)}</td><td>${num(m.afterQty)}</td><td>${dateText(m.createdAt)} <span class="muted" style="font-size:10px">${shortTime(m.createdAt)}</span></td></tr>`).join(''):'<tr><td colspan="5" class="empty">No movements yet.</td></tr>'}</tbody></table></div>`;}
function kpi(title,value,detail,iconName,tone){return `<div class="kpi-card"><div class="kpi-top"><span class="kpi-name">${title}</span><div class="kpi-icon tone-${tone}">${icon(iconName,18)}</div></div><div class="kpi-value">${value}</div><div class="kpi-sub">${detail}</div></div>`;}
async function renderPage(){
 const root=$('#main-content');root.innerHTML='<div class="loading-panel">Loading your workspace…</div>';
 try{
   if(state.page==='overview') {state.overview=await api('/overview');if(state.page==='overview')renderOverview();}
   if(state.page==='products') {const response=await api('/products');state.products=response.products;if(state.page==='products')renderProducts();}
   if(state.page==='movements'){state.movements=(await api('/movements?limit=150')).movements;if(state.page==='movements')renderMovements();}
   if(state.page==='reports'){state.overview=await api('/overview');if(state.page==='reports')renderReports();}
 }catch(error){root.innerHTML=`<div class="loading-panel">${escapeHtml(error.message)}</div>`;toast(error.message,true);}
}
function renderOverview(){
 const {stats,categories,lowStock,recent,activity}=state.overview;
 const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().slice(0,10);});
 const values=days.map(day=>activity.find(a=>a.day===day)||{stockIn:0,stockOut:0});
 // Use a steady minimum visual scale for very small sample datasets.
 const max=Math.max(10,...values.flatMap(a=>[a.stockIn,a.stockOut]));
 const total=categories.reduce((v,c)=>v+c.count,0)||1;
 const shades=['#6978ed','#24b38e','#f2a960','#a39be4','#84b8ed'];
 $('#main-content').innerHTML=heading('Good to see you again 👋','Here’s what’s happening with your inventory today.',actionButton('Add new product','open-add'))+`
 <div class="kpis">${kpi('Total products',num(stats.totalProducts),'Active products in catalog','package','purple')}${kpi('Units in stock',num(stats.totalUnits),'Across all categories','boxes','blue')}${kpi('Inventory value',currency(stats.inventoryValue),'Value of available stock','rupee','green')}${kpi('Low-stock alerts',num(stats.lowStockCount),'Products needing attention','alert','orange')}</div>
 <div class="dashboard-grid"><section class="panel chart-panel"><div class="panel-header"><div><h2>Inventory activity</h2><p>Stock in and out over the last 7 days</p></div><div class="chart-legend"><span><i class="legend-dot in"></i>Stock in</span><span><i class="legend-dot out"></i>Stock out</span></div></div><div class="chart-body"><div class="chart-grid">${days.map((day,i)=>`<div class="chart-col"><div class="chart-bar in" title="In: ${values[i].stockIn}" style="height:${Math.max(2,(values[i].stockIn/max)*100)}%"></div><div class="chart-bar out" title="Out: ${values[i].stockOut}" style="height:${Math.max(2,(values[i].stockOut/max)*100)}%"></div><span class="chart-label">${new Date(day+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short'})}</span></div>`).join('')}</div></div></section>
 <section class="panel"><div class="panel-header"><div><h2>Product categories</h2><p>Distribution of your product catalog</p></div></div><div class="category-list">${categories.map((c,i)=>`<div><div class="category-row"><span>${escapeHtml(c.category)}</span><span>${c.count} products</span></div><div class="progress"><div class="progress-fill" style="width:${Math.round(c.count/total*100)}%;background:${shades[i%shades.length]}"></div></div></div>`).join('')||'<p class="muted">No categories yet.</p>'}</div></section></div>
 <div class="lower-grid"><section class="panel"><div class="panel-header"><div><h2>Recent stock movements</h2><p>Latest additions and withdrawals</p></div><button class="text-link" data-go="movements">View all →</button></div>${movementTable(recent)}</section>
 <section class="panel"><div class="panel-header"><div><h2>Needs your attention</h2><p>Products at or below minimum stock</p></div><button class="text-link" data-go="products-low">View all →</button></div><div class="alert-list">${lowStock.length?lowStock.map(p=>`<div class="alert-item"><div class="product-symbol">${productMark(p)}</div><div><strong>${escapeHtml(p.name)}</strong><small>Reorder at ${p.reorderLevel} units</small></div><span class="badge-count ${p.quantity===0?'zero':''}">${p.quantity} left</span></div>`).join(''):'<p class="muted">All products are well stocked.</p>'}</div></section></div>`;
}
function renderProducts(){
 const cats=[...new Set(state.products.map(p=>p.category))].sort();
 const filtered=state.products.filter(p=>{
   const s=state.search.toLowerCase();return (!s||p.name.toLowerCase().includes(s)||p.sku.toLowerCase().includes(s))&&(!state.category||p.category===state.category)&&(!state.low||p.quantity<=p.reorderLevel);
 });
 $('#main-content').innerHTML=heading('Products','Manage your catalog, stock levels, and pricing.',actionButton('Add new product','open-add'))+`
 <div class="toolbar"><div class="toolbar-left"><input aria-label="Search products" id="product-search" class="search-field" placeholder="Search products or SKU..." value="${escapeHtml(state.search)}"><select id="category-filter" class="select-field"><option value="">All categories</option>${cats.map(c=>`<option ${c===state.category?'selected':''} value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select><button id="low-filter" class="filter-toggle ${state.low?'active':''}">${icon('filter',15)} Low stock only</button></div><button class="btn secondary" id="export-products">${icon('download',15)} Export CSV</button></div>
 <section class="panel table-panel">${productTable(filtered,true)}<div class="table-footer">Showing ${filtered.length} of ${state.products.length} active products • Inventory quantities update automatically with stock movements.</div></section>`;
 $('#product-search').addEventListener('input',e=>{const start=e.target.selectionStart;state.search=e.target.value;renderProducts();const field=$('#product-search');field.focus();field.setSelectionRange(start,start);});
 $('#category-filter').addEventListener('change',e=>{state.category=e.target.value;renderProducts();});
 $('#low-filter').addEventListener('click',()=>{state.low=!state.low;renderProducts();});
 $('#export-products').addEventListener('click',downloadReport);
}
function renderMovements(){
 const incoming=state.movements.filter(m=>m.type==='IN').reduce((sum,m)=>sum+m.quantity,0);
 const outgoing=state.movements.filter(m=>m.type==='OUT').reduce((sum,m)=>sum+m.quantity,0);
 $('#main-content').innerHTML=heading('Stock movements','An audit trail of every recorded inventory change.',actionButton('Manage products','go-products','package','secondary'))+`
 <div class="top-summary"><div class="summary-tile"><label>Recorded movements</label><strong>${num(state.movements.length)}</strong></div><div class="summary-tile"><label>Units received (shown records)</label><strong>${num(incoming)}</strong></div><div class="summary-tile"><label>Units issued (shown records)</label><strong>${num(outgoing)}</strong></div></div>
 <section class="panel table-panel"><div class="panel-header"><div><h2>Movement history</h2><p>Most recent 150 entries</p></div></div>${movementTable(state.movements)}</section>`;
}
function renderReports(){
 const {stats,categories,lowStock,recent}=state.overview;
 $('#main-content').innerHTML=heading('Inventory reports','Review stock value, catalog health, and export current data.',actionButton('Download inventory CSV','export-report','download'))+`
 <div class="kpis">${kpi('Stock valuation',currency(stats.inventoryValue),'Quantity × unit price','rupee','green')}${kpi('Product catalog',num(stats.totalProducts),'Active SKUs','package','purple')}${kpi('Available units',num(stats.totalUnits),'Across all products','boxes','blue')}${kpi('Reorder needed',num(stats.lowStockCount),'At/below reorder point','alert','orange')}</div>
 <div class="report-grid"><section class="panel"><div class="panel-header"><div><h2>Category breakdown</h2><p>Products and units by category</p></div></div><div class="report-actions">${categories.map(c=>`<div class="mini-stat"><span>${escapeHtml(c.category)}</span><strong>${num(c.count)} products · ${num(c.units)} units</strong></div>`).join('')||'<p>No records yet.</p>'}</div></section>
 <section class="panel"><div class="panel-header"><div><h2>Low-stock summary</h2><p>Take action before products run out</p></div></div><div class="report-actions">${lowStock.map(p=>`<div class="mini-stat"><span>${escapeHtml(p.name)}</span><strong>${p.quantity} / ${p.reorderLevel}</strong></div>`).join('')||'<p>Nothing needs reordering.</p>'}</div></section></div>
 <div class="report-note"><strong>About reports:</strong> The CSV export includes active SKU, product name, category, price (INR), current quantity, and reorder threshold. Revenue, profitability, purchasing, and supplier management are outside the scope of this MVP. Stock-out records represent inventory withdrawals, not necessarily completed sales.</div>`;
 $('#export-report').addEventListener('click',downloadReport);
}
function downloadReport(){window.location.href='/api/export';toast('Preparing your inventory CSV report.');}
function modal(html){$('#modal-root').innerHTML=`<div class="modal-scrim"><div class="modal-card" role="dialog" aria-modal="true">${html}</div></div>`;$('#modal-root .modal-scrim').addEventListener('click',e=>{if(e.target.classList.contains('modal-scrim'))closeModal();});$('#modal-root .modal-close')?.addEventListener('click',closeModal);$('#modal-root [data-dismiss]')?.addEventListener('click',closeModal);}
function closeModal(){$('#modal-root').innerHTML='';}
function modalTitle(title,desc){return `<div class="modal-head"><div><h2>${title}</h2><p>${desc}</p></div><button class="modal-close" aria-label="Close">×</button></div>`;}
function productModal(p=null){
 const edit=!!p;
 modal(modalTitle(edit?'Edit product':'Add new product',edit?'Update the catalog details for this product.':'Add an item to your inventory catalog.')+`
 <form id="product-form"><div class="modal-body"><div class="form-grid">
 <label class="wide">Product name<input name="name" placeholder="e.g. USB-C Hub" maxlength="120" required value="${escapeHtml(p?.name||'')}"></label>
 <label>SKU / Product code<input name="sku" placeholder="e.g. ELEC-001" maxlength="30" required value="${escapeHtml(p?.sku||'')}"></label>
 <label>Category<input name="category" placeholder="e.g. Electronics" maxlength="60" required value="${escapeHtml(p?.category||'')}"></label>
 <label>Unit price (₹)<input name="price" type="number" min="0" step="0.01" required value="${p?.price??''}"></label>
 <label>Reorder alert at (units)<input name="reorderLevel" type="number" min="0" step="1" required value="${p?.reorderLevel??5}"></label>
 ${edit?'':`<label class="wide">Opening stock quantity<input name="quantity" type="number" min="0" step="1" value="0" required></label>`}
 </div><p class="form-error" id="product-error" role="alert"></p></div>
 <div class="modal-actions"><button type="button" class="btn secondary" data-dismiss>Cancel</button><button type="submit" class="btn primary">${edit?'Save changes':'Add product'}</button></div></form>`);
 $('#product-form').addEventListener('submit',async e=>{
 e.preventDefault();const form=e.currentTarget;const fields=Object.fromEntries(new FormData(form).entries());
 try{await api(edit?`/products/${p.id}`:'/products',{method:edit?'PUT':'POST',body:fields});closeModal();toast(edit?'Product updated successfully.':'New product created successfully.');renderPage();}
 catch(err){$('#product-error').textContent=err.message;}
 });
}
function stockModal(p){
 modal(modalTitle('Update stock',`${escapeHtml(p.name)} • ${escapeHtml(p.sku)}`)+`
 <form id="stock-form"><div class="modal-body"><div class="stock-note"><strong>Current stock:</strong> ${num(p.quantity)} units</div>
 <div class="radio-options"><label class="radio-option"><input type="radio" name="type" value="IN" checked> ${icon('plus',16)} Stock in</label><label class="radio-option"><input type="radio" name="type" value="OUT"> ${icon('arrows',16)} Stock out</label></div>
 <div class="form-grid"><label class="wide">Quantity<input type="number" min="1" step="1" name="quantity" placeholder="How many units?" required></label>
 <label class="wide">Note (optional)<input name="note" maxlength="240" placeholder="e.g. Restock from supplier"></label></div>
 <p class="form-error" id="stock-error" role="alert"></p></div><div class="modal-actions"><button type="button" class="btn secondary" data-dismiss>Cancel</button><button class="btn primary" type="submit">Save stock movement</button></div></form>`);
 $('#stock-form').addEventListener('submit',async e=>{
 e.preventDefault();const fields=Object.fromEntries(new FormData(e.currentTarget).entries());
 try{const res=await api(`/products/${p.id}/movements`,{method:'POST',body:fields});closeModal();toast(`Stock updated. New quantity: ${res.newQuantity}`);renderPage();}
 catch(err){$('#stock-error').textContent=err.message;}
 });
}
async function deleteProduct(p){
 if(!confirm(`Archive "${p.name}"? It will disappear from the active catalog, but movement history will remain.`))return;
 try{await api(`/products/${p.id}`,{method:'DELETE'});toast('Product archived.');renderPage();}catch(e){toast(e.message,true);}
}
document.addEventListener('click',e=>{
 const item=e.target.closest('[data-action]');
 if(item){const p=state.products.find(p=>p.id===Number(item.dataset.id));if(!p)return;
 if(item.dataset.action==='edit')productModal(p);
 if(item.dataset.action==='stock')stockModal(p);
 if(item.dataset.action==='delete')deleteProduct(p);return;}
 if(e.target.closest('#open-add'))productModal();
 if(e.target.closest('#go-products'))navigate('products');
 const link=e.target.closest('[data-go]');if(link){if(link.dataset.go==='products-low'){state.low=true;navigate('products');}else navigate(link.dataset.go);}
 const page=e.target.closest('[data-page]');if(page)navigate(page.dataset.page);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
$('#login-form').addEventListener('submit',async e=>{
 e.preventDefault();$('#login-error').textContent='';const data=Object.fromEntries(new FormData(e.currentTarget));
 try{await api('/login',{method:'POST',body:data});e.currentTarget.reset();showApp();}catch(err){$('#login-error').textContent=err.message;}
});
$('#logout-btn').addEventListener('click',async()=>{try{await api('/logout',{method:'POST'});}catch{}showLogin();toast('Signed out.');});
$('#menu-btn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#current-date').textContent=new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
hydrateIcons();
(async()=>{try{const me=await api('/me');if(me.loggedIn)showApp();else showLogin();}catch{showLogin();toast('Server not available.',true);}})();
