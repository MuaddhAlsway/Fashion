const fs = require('fs');
const path = require('path');
function walk(dir){let r=[];for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())r=r.concat(walk(p));else if(/\.(tsx|ts)$/.test(f.name))r.push(p)}return r}
let n=0;
for(const f of walk('src')){
  let s=fs.readFileSync(f,'utf8');
  const before=s;
  s=s.replace(/<img\b(?![^>]*\bloading=)/g, '<img loading="lazy" decoding="async"');
  if(s!==before){fs.writeFileSync(f,s);n++}
}
console.log('updated',n,'files');
