#!/usr/bin/env node
// tools/fix-on-primary.js
// Scans common override files for primary color declarations and suggests accessible on-primary colors.
const fs = require('fs');
const path = require('path');

function hexToRgb(hex) {
  const h = hex.replace('#','');
  const bigint = parseInt(h.length===3? h.split('').map(c=>c+c).join(''): h,16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return {r,g,b};
}

function luminance({r,g,b}){
  const srgb = [r,g,b].map(v=>v/255).map(v=> v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4));
  return 0.2126*srgb[0]+0.7152*srgb[1]+0.0722*srgb[2];
}

function contrast(rgbA, rgbB){
  const L1 = luminance(rgbA);
  const L2 = luminance(rgbB);
  return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
}

function mix(rgb, target, t){
  return {r: Math.round(rgb.r*(1-t)+target.r*t), g: Math.round(rgb.g*(1-t)+target.g*t), b: Math.round(rgb.b*(1-t)+target.b*t)};
}

function toHex({r,g,b}){
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

const files = [
  'c:/repos/craft-fusion/apps/craft-web/src/styles/_md3-tokens-overrides.scss',
  'c:/repos/craft-fusion/apps/craft-web/src/styles/_patriotic-overrides.scss'
];

const suggestions = [];

for(const fp of files){
  if(!fs.existsSync(fp)) continue;
  const src = fs.readFileSync(fp,'utf8');
  // find hex color occurrences for primary keys
  const primaryRegexes = [/(?:primary:\s*)(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))/g, /--md-sys-color-primary:\s*(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))/g];
  const found = new Set();
  for(const rx of primaryRegexes){
    let m;
    while((m = rx.exec(src))){
      found.add(m[1]);
    }
  }
  for(const hex of Array.from(found)){
    const rgb = hexToRgb(hex);
    const white = {r:255,g:255,b:255};
    const black = {r:0,g:0,b:0};
    const contrastWhite = contrast(rgb, white);
    const contrastBlack = contrast(rgb, black);
    let pick = null;
    if(contrastWhite>=4.5) pick = {color:'#ffffff', contrast: Number(contrastWhite.toFixed(2))};
    else if(contrastBlack>=4.5) pick = {color:'#000000', contrast: Number(contrastBlack.toFixed(2))};
    else {
      // try mixing with white/dark to find a candidate
      let candidate=null;
      for(let t=0.1;t<=0.9;t+=0.05){
        const cW = mix(white, rgb, t); // closer to rgb
        const contr = contrast(cW, rgb);
        if(contr>=4.5){ candidate = {color: toHex(cW), contrast: Number(contr.toFixed(2))}; break; }
        const cB = mix(black, rgb, t);
        const contrb = contrast(cB, rgb);
        if(contrb>=4.5){ candidate = {color: toHex(cB), contrast: Number(contrb.toFixed(2))}; break; }
      }
      if(candidate) pick = candidate; else pick = {color: '#ffffff', contrast: Number(contrastWhite.toFixed(2))};
    }
    suggestions.push({file: fp, primary: hex, suggestion: pick});
  }
}

console.log(JSON.stringify(suggestions, null, 2));
process.exit(0);
