'use strict';
const assert=require('node:assert/strict'),F=require('../dist/math.js');
assert.equal(F.presetCatalog.length,24);assert.equal(new Set(F.presetCatalog.map(p=>p.id)).size,24);
for(const item of F.presetCatalog){
 const raw=F.preset(item.id);assert(raw.length>=3,item.id+' has enough vertices');assert(raw.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),item.id+' has finite points');
 const p=F.normalize(F.resample(raw)),spectrum=F.dft(p),low=F.select(spectrum,31),high=F.select(spectrum,5000);
 assert.equal(p.length,8192);assert(p.every(p=>Math.abs(p.x)<=1.0000001&&Math.abs(p.y)<=1.0000001));
 assert(F.error(p,high)<=F.error(p,low)+1e-8,item.id+' converges with more terms');assert(F.error(p,high)<.1,item.id+' reconstructs accurately at 5,000 terms');
 const q=F.reconstruct(high);assert(q.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),item.id+' produces an exportable path');
}
// Topology-specific cases: a crossing star, a fractal boundary, and a ribbon
// with short end joins rather than an accidental line across the spiral.
assert.equal(F.preset('pentagram').length,5);assert.equal(F.preset('koch').length,192);
const spiral=F.preset('spiral');assert(Math.hypot(spiral[0].x-spiral.at(-1).x,spiral[0].y-spiral.at(-1).y)<.08);
const circle=F.normalize(F.resample(F.preset('circle')));assert(F.error(circle,F.select(F.dft(circle),3))<.001);
console.log('PASS: 24 unique preset paths, finite normalized samples, Fourier convergence, 5,000-term reconstruction and closed spiral/fractal/star topology.');
