'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { hashPassword, verifyPassword, validateProduct, validateMovement, csvEscape } = require('./lib');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = process.env.IMS_DATA_DIR ? path.resolve(process.env.IMS_DATA_DIR) : path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'inventory.db'));
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
 id INTEGER PRIMARY KEY, sku TEXT UNIQUE NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL,
 price REAL NOT NULL CHECK(price>=0), quantity INTEGER NOT NULL CHECK(quantity>=0),
 reorder_level INTEGER NOT NULL DEFAULT 5 CHECK(reorder_level>=0),
 active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')),
 updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS movements (
 id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id),
 type TEXT NOT NULL CHECK(type IN ('IN','OUT')),
 quantity INTEGER NOT NULL CHECK(quantity>0), before_qty INTEGER NOT NULL,
 after_qty INTEGER NOT NULL, note TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_movements_time ON movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active, name);
`);
const defaultPassword = process.env.IMS_ADMIN_PASSWORD || 'Admin@123';
if (!db.prepare('SELECT 1 FROM users LIMIT 1').get()) {
  db.prepare('INSERT INTO users(username,password_hash) VALUES (?,?)').run('admin', hashPassword(defaultPassword));
}
if (!db.prepare('SELECT 1 FROM products LIMIT 1').get()) {
  const sample = [
    ['ELEC-101','Wireless Mouse','Electronics',799,42,10],
    ['ELEC-102','Mechanical Keyboard','Electronics',2499,18,8],
    ['ELEC-103','USB-C Hub','Electronics',1499,6,10],
    ['ELEC-104','Webcam 1080p','Electronics',1899,11,6],
    ['OFF-201','A4 Notebook','Stationery',85,120,30],
    ['OFF-202','Gel Pen Pack','Stationery',149,8,15],
    ['OFF-203','Desk Organizer','Stationery',349,24,10],
    ['HOME-301','Water Bottle','Lifestyle',399,35,12],
    ['HOME-302','Travel Mug','Lifestyle',599,4,10],
    ['ACC-401','Laptop Sleeve','Accessories',899,15,8],
    ['ACC-402','Phone Stand','Accessories',299,0,10],
    ['ACC-403','HDMI Cable','Accessories',450,50,12]
  ];
  const insert = db.prepare('INSERT INTO products (sku,name,category,price,quantity,reorder_level) VALUES (?,?,?,?,?,?)');
  const movement = db.prepare('INSERT INTO movements(product_id,type,quantity,before_qty,after_qty,note) VALUES (?,?,?,?,?,?)');
  db.exec('BEGIN');
  try {
    for (const [sku,name,category,price,quantity,reorder] of sample) {
      const id = Number(insert.run(sku,name,category,price,quantity,reorder).lastInsertRowid);
      if (quantity > 0) movement.run(id,'IN',quantity,0,quantity,'Opening inventory');
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

const sessions = new Map();
function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(x => x.trim()).filter(Boolean).map(x => {
    const i = x.indexOf('='); return [x.slice(0,i),x.slice(i+1)];
  }));
}
function sessionUser(req) {
  const token = cookies(req).ims_session;
  const info = token && sessions.get(token);
  if (!info) return null;
  if (info.expires < Date.now()) { sessions.delete(token); return null; }
  return info.username;
}
function send(res,status,body,headers={}) {
  const isString = typeof body === 'string';
  const payload = isString ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': isString ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff',
    ...headers
  });
  res.end(payload);
}
async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw Object.assign(new Error('Request too large.'),{status:413});
  }
  try { return raw ? JSON.parse(raw) : {}; } catch { throw Object.assign(new Error('Invalid JSON.'),{status:400}); }
}
function safeRoute(handler) {
  return async (req,res) => {
    try { await handler(req,res); }
    catch (error) {
      let status = error.status || 400;
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint failed: products\.sku/i.test(error.message)) { status = 409; error.message = 'This SKU already exists.'; }
      if (error.code && status === 400 && (error.code.startsWith('SQLITE_') || error.code === 'ERR_SQLITE_ERROR')) {
        console.error('Database error:',error); status = 500; error.message='Database operation failed.';
      }
      send(res,status,{ error: status === 500 ? 'Internal server error.' : error.message });
    }
  };
}
const productFields = `id, sku, name, category, price, quantity, reorder_level AS reorderLevel,
 CASE WHEN quantity <= reorder_level THEN 1 ELSE 0 END AS lowStock,
 created_at AS createdAt, updated_at AS updatedAt`;
function movements(limit) {
  return db.prepare(`SELECT m.id, m.product_id AS productId, p.name AS productName, p.sku,
    m.type, m.quantity, m.before_qty AS beforeQty, m.after_qty AS afterQty,
    m.note, m.created_at AS createdAt FROM movements m
    JOIN products p ON p.id=m.product_id ORDER BY m.id DESC LIMIT ?`).all(limit);
}
function routeApi(req,res,url) {
  const {pathname,searchParams} = url;
  const method = req.method;
  if (pathname === '/api/health' && method === 'GET') return send(res,200,{status:'ok'});
  if (pathname === '/api/me' && method === 'GET') return send(res,200,{loggedIn:!!sessionUser(req),username:sessionUser(req)});
  if (pathname === '/api/login' && method === 'POST') return safeRoute(async () => {
    const {username,password} = await readBody(req);
    const user = db.prepare('SELECT * FROM users WHERE username=?').get(String(username || '').trim());
    if (!user || !verifyPassword(password,user.password_hash)) return send(res,401,{error:'Invalid username or password.'});
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token,{username:user.username,expires:Date.now()+8*60*60*1000});
    return send(res,200,{username:user.username},{'Set-Cookie':`ims_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`});
  })(req,res);
  if (!sessionUser(req)) return send(res,401,{error:'Please sign in first.'});
  if (pathname === '/api/logout' && method === 'POST') {
    const token = cookies(req).ims_session;
    if (token) sessions.delete(token);
    return send(res,200,{ok:true},{'Set-Cookie':'ims_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});
  }
  if (pathname === '/api/overview' && method === 'GET') return safeRoute(() => {
    const stats = db.prepare(`SELECT COUNT(*) AS totalProducts, COALESCE(SUM(quantity),0) AS totalUnits,
      ROUND(COALESCE(SUM(price*quantity),0),2) AS inventoryValue,
      SUM(CASE WHEN quantity<=reorder_level THEN 1 ELSE 0 END) AS lowStockCount
      FROM products WHERE active=1`).get();
    const categories = db.prepare(`SELECT category, COUNT(*) AS count, SUM(quantity) AS units
      FROM products WHERE active=1 GROUP BY category ORDER BY count DESC`).all();
    const lowStock = db.prepare(`SELECT ${productFields} FROM products WHERE active=1 AND quantity<=reorder_level ORDER BY quantity ASC, name LIMIT 8`).all();
    const recent = movements(6);
    const activity = db.prepare(`SELECT substr(created_at,1,10) AS day,
      SUM(CASE WHEN type='IN' THEN quantity ELSE 0 END) AS stockIn,
      SUM(CASE WHEN type='OUT' THEN quantity ELSE 0 END) AS stockOut
      FROM movements WHERE created_at>=datetime('now','-6 days') GROUP BY substr(created_at,1,10) ORDER BY day`).all();
    send(res,200,{stats,categories,lowStock,recent,activity});
  })(req,res);
  if (pathname === '/api/products' && method === 'GET') return safeRoute(() => {
    const search = String(searchParams.get('search') || '').trim().slice(0,100);
    const category = String(searchParams.get('category') || '').trim();
    const lowOnly = searchParams.get('low') === '1';
    const terms = ['active=1']; const args=[];
    if (search) { terms.push('(name LIKE ? OR sku LIKE ?)'); args.push(`%${search}%`,`%${search}%`); }
    if (category) { terms.push('category=?'); args.push(category); }
    if (lowOnly) terms.push('quantity<=reorder_level');
    const products = db.prepare(`SELECT ${productFields} FROM products WHERE ${terms.join(' AND ')} ORDER BY id DESC`).all(...args);
    send(res,200,{products});
  })(req,res);
  if (pathname === '/api/products' && method === 'POST') return safeRoute(async () => {
    const product = validateProduct(await readBody(req));
    db.exec('BEGIN');
    try {
      const insert = db.prepare('INSERT INTO products(sku,name,category,price,quantity,reorder_level) VALUES(?,?,?,?,?,?)')
        .run(product.sku,product.name,product.category,product.price,product.quantity,product.reorderLevel);
      const id = Number(insert.lastInsertRowid);
      if (product.quantity > 0) db.prepare(`INSERT INTO movements(product_id,type,quantity,before_qty,after_qty,note)
        VALUES(?,'IN',?,0,?,'Initial stock')`).run(id,product.quantity,product.quantity);
      db.exec('COMMIT'); send(res,201,{id,...product});
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  })(req,res);
  const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
  if (productMatch && method === 'PUT') return safeRoute(async () => {
    const id = Number(productMatch[1]);
    const old = db.prepare('SELECT * FROM products WHERE id=? AND active=1').get(id);
    if (!old) return send(res,404,{error:'Product not found.'});
    const input = await readBody(req);
    const p = validateProduct({...input,quantity:old.quantity});
    db.prepare(`UPDATE products SET sku=?, name=?, category=?, price=?, reorder_level=?, updated_at=datetime('now') WHERE id=?`)
      .run(p.sku,p.name,p.category,p.price,p.reorderLevel,id);
    send(res,200,{ok:true});
  })(req,res);
  if (productMatch && method === 'DELETE') return safeRoute(() => {
    const result = db.prepare(`UPDATE products SET active=0, updated_at=datetime('now') WHERE id=? AND active=1`).run(Number(productMatch[1]));
    if (!result.changes) return send(res,404,{error:'Product not found.'});
    send(res,200,{ok:true});
  })(req,res);
  const stockMatch = pathname.match(/^\/api\/products\/(\d+)\/movements$/);
  if (stockMatch && method === 'POST') return safeRoute(async () => {
    const id = Number(stockMatch[1]);
    const input = await readBody(req);
    db.exec('BEGIN IMMEDIATE');
    try {
      const product = db.prepare('SELECT * FROM products WHERE id=? AND active=1').get(id);
      if (!product) { db.exec('ROLLBACK'); return send(res,404,{error:'Product not found.'}); }
      const movement = validateMovement(input,product.quantity);
      db.prepare(`UPDATE products SET quantity=?,updated_at=datetime('now') WHERE id=?`).run(movement.next,id);
      const insert = db.prepare(`INSERT INTO movements(product_id,type,quantity,before_qty,after_qty,note) VALUES(?,?,?,?,?,?)`).run(
        id,movement.type,movement.quantity,product.quantity,movement.next,movement.note);
      db.exec('COMMIT'); send(res,201,{id:Number(insert.lastInsertRowid),newQuantity:movement.next});
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  })(req,res);
  if (pathname === '/api/movements' && method === 'GET') return safeRoute(() => {
    const limit = Math.min(250,Math.max(1,Number(searchParams.get('limit') || 100) || 100));
    send(res,200,{movements:movements(limit)});
  })(req,res);
  if (pathname === '/api/export' && method === 'GET') return safeRoute(() => {
    const products = db.prepare(`SELECT sku,name,category,price,quantity,reorder_level AS reorderLevel FROM products WHERE active=1 ORDER BY name`).all();
    const rows = [['SKU','Name','Category','Unit Price INR','Quantity','Reorder Level'],
      ...products.map(p=>[p.sku,p.name,p.category,p.price,p.quantity,p.reorderLevel])];
    const csv = rows.map(row=>row.map(csvEscape).join(',')).join('\r\n');
    send(res,200, '\uFEFF'+csv,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="inventory-report.csv"'});
  })(req,res);
  return send(res,404,{error:'Unknown API endpoint.'});
}
const publicDir = path.join(__dirname,'public');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const server = http.createServer((req,res) => {
  const url = new URL(req.url,`http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) return routeApi(req,res,url);
  if (req.method !== 'GET') return send(res,405,{error:'Method not allowed.'});
  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^([.][.][/\\])+/, '');
  const requested = path.resolve(publicDir, '.'+safePath);
  const filename = requested.startsWith(publicDir+path.sep) && fs.existsSync(requested) && fs.statSync(requested).isFile()
    ? requested : path.join(publicDir,'index.html');
  fs.readFile(filename,(err,buf)=>{
    if (err) return send(res,404,'Not found');
    res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
    res.end(buf);
  });
});
server.listen(PORT,HOST,()=> console.log(`Inventory Management System running at http://${HOST}:${PORT}`));
module.exports = { server, db };
