const fs=require('fs');
const p='src/pages/ProductDetailPage.tsx';
let s=fs.readFileSync(p,'utf8');
const start=s.indexOf('      <section className="product-detail__reviews"');
const end=s.indexOf('    </main>', start);
if(start===-1||end===-1){ console.log('markers not found'); process.exit(1); }
s=s.slice(0,start)+'      <ProductFeedback productId={product.id} />\n    </main>'+s.slice(end+10);
fs.writeFileSync(p,s);
console.log('done');
