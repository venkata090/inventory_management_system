const test = require('node:test');
const assert = require('node:assert/strict');
const {hashPassword,verifyPassword,validateProduct,validateMovement,csvEscape} = require('../lib');
test('password hashing and checking',()=>{
 const hash=hashPassword('a good secret');
 assert.equal(verifyPassword('a good secret',hash),true);
 assert.equal(verifyPassword('wrong',hash),false);
});
test('validates products and normalizes SKU',()=>{
 const p=validateProduct({name:'Test Mouse',sku:'el-100',category:'Electronics',price:109.2,quantity:5,reorderLevel:2});
 assert.equal(p.sku,'EL-100');
 assert.equal(p.price,109.2);
});
test('rejects negative product quantities',()=>{
 assert.throws(()=>validateProduct({name:'Widget',sku:'W-111',category:'Other',price:1,quantity:-1}));
});
test('prevents stock from going negative',()=>{
 assert.throws(()=>validateMovement({type:'OUT',quantity:6},5),/Insufficient stock/);
 assert.equal(validateMovement({type:'IN',quantity:3},5).next,8);
 assert.equal(validateMovement({type:'OUT',quantity:2},5).next,3);
});
test('rejects fractional movements',()=>{
 assert.throws(()=>validateMovement({type:'IN',quantity:1.5},5));
});
test('escapes spreadsheet formulas',()=>{
 assert.equal(csvEscape('=HYPERLINK("evil")'), '"\'=HYPERLINK(""evil"")"');
});
