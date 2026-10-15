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
// The gallery contract: exactly half of the previous catalog is replaced,
// including eight identifiable drawings and four advanced geometric patterns.
const previous=['moore','heart','flower','star','circle','triangle','square','hexagon','octagon','pentagram','rounded-square','rose-5','rose-8','infinity','lissajous-32','lissajous-45','lissajous-57','spiral','astroid','deltoid','cardioid','epitrochoid','hypotrochoid','koch'];
assert.equal(F.presetCatalog.filter(p=>previous.includes(p.id)).length,12);
const illustrations=F.presetCatalog.filter(p=>p.category==='illustrations');
assert.deepEqual(illustrations.map(p=>p.id),['butterfly','owl','koi','seahorse','dragon','stag','lotus','scarab']);
for(const {id} of illustrations){
 const raw=F.preset(id);
 assert(raw.length>1000,id+' includes sampled internal detail');
 assert(Math.hypot(raw[0].x-raw.at(-1).x,raw[0].y-raw.at(-1).y)<1e-6,id+' forms a closed continuous walk');
 const before=raw[0].x;raw[0].x=99999;
 assert.equal(F.preset(id)[0].x,before,id+' cached vectors are not mutated by callers');
}
// Retained primitives and dense fractal/star topology.
assert.equal(F.preset('pentagram').length,5);assert.equal(F.preset('star-17').length,17);
assert.equal(F.preset('koch').length,192);assert.equal(F.preset('koch-5').length,3072);
const spiral=F.preset('spiral');assert(Math.hypot(spiral[0].x-spiral.at(-1).x,spiral[0].y-spiral.at(-1).y)<.08);
const circle=F.normalize(F.resample(F.preset('circle')));assert(F.error(circle,F.select(F.dft(circle),3))<.001);
console.log('PASS: exactly 12 replacements, 8 closed detailed illustrations, immutable vector cache, 24 finite presets, Fourier convergence and 5,000-term accuracy.');
