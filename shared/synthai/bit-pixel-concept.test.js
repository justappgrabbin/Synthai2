import test from "node:test";
import assert from "node:assert/strict";
import {sixBit,createField,region,sample,render,trainNeural,representationStats} from "./bit-pixel-concept.js";
test("six-bit encodes 64 configurations",()=>{assert.deepEqual(sixBit(0),[0,0,0,0,0,0]);assert.deepEqual(sixBit(63),[1,1,1,1,1,1]);assert.throws(()=>sixBit(64));});
test("pixel, vector and neural regions can coexist",()=>{
 const data=new Uint8ClampedArray(4*4*4);
 for(let i=0;i<16;i++)data.set([i*10,20,30,255],i*4);
 const f=createField(4,4,data);
 assert.deepEqual(sample(f,0,0),[0,20,30]);
 const v=region(f,{x:0,y:0,width:2,height:2,mode:"vector",spacing:1});
 assert.deepEqual(sample(f,0,0),[0,20,30]);
 const n=region(f,{x:2,y:0,width:2,height:2,mode:"neural",spacing:1});
 const result=trainNeural(f,n,{epochs:10});
 assert.ok(Number.isFinite(result.mse));
 assert.equal(render(f).length,64);
 assert.deepEqual(representationStats(f).byMode,{pixel:0,vector:1,neural:1});
});
test("invalid inputs fail rather than silently corrupt",()=>{
 assert.throws(()=>createField(2,2,new Uint8Array(3)));
 const f=createField(1,1,new Uint8Array([1,2,3,255]));
 assert.throws(()=>region(f,{x:1,width:1}));
 assert.throws(()=>sample(f,1,0));
});
