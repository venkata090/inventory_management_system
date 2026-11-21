'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('integration: authenticate, create, update stock, export, archive, logout',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ims-integration-'));
 const port=35000+(process.pid%20000);
 const server=spawn(process.execPath,[path.resolve(__dirname,'../server.js')],{env:{...process.env,PORT:String(port),IMS_DATA_DIR:dir},stdio:'ignore'});
 const base=`http://127.0.0.1:${port}/api`;
 async function request(url,method='GET',body,cookie=''){
  const response=await fetch(base+url,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
  const text=await response.text();return {status:response.status,body:response.headers.get('content-type')?.includes('application/json')?JSON.parse(text):text,headers:response.headers};
 }
 try {
  let ready=false;
  for(let i=0;i<40;i++){
    try { const status=await request('/health'); if(status.status===200){ready=true;break;} }catch{}
    await wait(100);
  }
  assert.equal(ready,true,'server should start');
  assert.equal((await request('/products')).status,401);
  const login=await request('/login','POST',{username:'admin',password:'Admin@123'});
  assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const create=await request('/products','POST',{sku:'TST-001',name:'Test Keyboard',category:'Electronics',price:299,quantity:10,reorderLevel:5},cookie);
  assert.equal(create.status,201);
  const id=create.body.id;
  const duplicate=await request('/products','POST',{sku:'TST-001',name:'Duplicate',category:'Electronics',price:99,quantity:1},cookie);
  assert.equal(duplicate.status,409);
  const overdraw=await request(`/products/${id}/movements`,'POST',{type:'OUT',quantity:11},cookie);
  assert.equal(overdraw.status,400);
  const move=await request(`/products/${id}/movements`,'POST',{type:'OUT',quantity:7,note:'test'},cookie);
  assert.equal(move.status,201);assert.equal(move.body.newQuantity,3);
  const list=await request('/products','GET',undefined,cookie);
  const newProduct=list.body.products.find(p=>p.id===id);
  assert.equal(newProduct.quantity,3);assert.equal(newProduct.lowStock,1);
  const movementHistory=await request('/movements','GET',undefined,cookie);
  assert.ok(movementHistory.body.movements.some(m=>m.productId===id&&m.type==='OUT'));
  const report=await request('/export','GET',undefined,cookie);
  assert.equal(report.status,200);assert.ok(report.body.includes('TST-001'));
  assert.equal((await request(`/products/${id}`,'DELETE',undefined,cookie)).status,200);
  const afterDelete=await request('/products','GET',undefined,cookie);
  assert.ok(!afterDelete.body.products.some(p=>p.id===id));
  assert.equal((await request('/logout','POST',undefined,cookie)).status,200);
  assert.equal((await request('/products','GET',undefined,cookie)).status,401);
 } finally {
  server.kill();
  await new Promise(resolve=>{if(server.exitCode!==null||server.signalCode!==null)resolve();else server.once('exit',resolve)});
  fs.rmSync(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100});
 }
});
