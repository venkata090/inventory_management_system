'use strict';
const crypto = require('node:crypto');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}
function verifyPassword(password, stored) {
  if (!stored || typeof password !== 'string') return false;
  const [salt, storedHash] = stored.split(':');
  if (!salt || !storedHash || storedHash.length !== 128) return false;
  const a = Buffer.from(storedHash, 'hex');
  const b = crypto.scryptSync(password, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function validateProduct(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid product information.');
  const name = String(input.name ?? '').trim();
  const sku = String(input.sku ?? '').trim().toUpperCase();
  const category = String(input.category ?? 'Other').trim();
  const price = Number(input.price);
  const quantity = Number(input.quantity ?? 0);
  const reorderLevel = Number(input.reorderLevel ?? 5);
  if (name.length < 2 || name.length > 120) throw new Error('Product name must be 2–120 characters.');
  if (!/^[A-Z0-9_-]{3,30}$/.test(sku)) throw new Error('SKU must be 3–30 letters, digits, hyphens or underscores.');
  if (!category || category.length > 60) throw new Error('Category must be 1–60 characters.');
  if (!Number.isFinite(price) || price < 0 || price > 1e9) throw new Error('Enter a valid non-negative price.');
  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 1e7) throw new Error('Quantity must be a non-negative whole number.');
  if (!Number.isSafeInteger(reorderLevel) || reorderLevel < 0 || reorderLevel > 1e7) throw new Error('Reorder level must be a non-negative whole number.');
  return { name, sku, category, price: Math.round(price * 100) / 100, quantity, reorderLevel };
}
function validateMovement(input, stock) {
  const type = String(input?.type ?? '').toUpperCase();
  const quantity = Number(input?.quantity);
  const note = String(input?.note ?? '').trim().slice(0, 240);
  if (!['IN','OUT'].includes(type)) throw new Error('Movement must be IN or OUT.');
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 1e7) throw new Error('Quantity must be a positive whole number.');
  const next = stock + (type === 'IN' ? quantity : -quantity);
  if (next < 0) throw new Error(`Insufficient stock. Only ${stock} units available.`);
  if (next > 1e7) throw new Error('Stock maximum exceeded.');
  return { type, quantity, note, next };
}
function csvEscape(s) {
  const v = String(s ?? '');
  // Prevent spreadsheet formula injection on export.
  const protectedValue = /^[=+@\-\t\r]/.test(v) ? `'${v}` : v;
  return `"${protectedValue.replace(/"/g, '""')}"`;
}
module.exports = { hashPassword, verifyPassword, validateProduct, validateMovement, csvEscape };
