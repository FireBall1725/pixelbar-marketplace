// @ts-nocheck: the simulator is plain JavaScript; type-checking it pulls in every CodeMirror type for nothing.
import { makeEditor } from './editor.js';
import { problem as v2problem, route as v2route } from './v2schema.js';
(() => {
"use strict";
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const mix=(a,b,t)=>{t=clamp(t,0,1);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];};
const hsv=(h,s,v)=>{h=(((h%360)+360)%360)/60;const i=Math.floor(h),f=h-i,p=v*(1-s),q=v*(1-s*f),u=v*(1-s*(1-f));const m=[[v,u,p],[q,v,p],[p,v,u],[p,q,v],[u,p,v],[v,p,q]][i%6];return [m[0]*255,m[1]*255,m[2]*255];};
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const ease=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
const p2=n=>String(n).padStart(2,"0");
let H12=false;
const h12=h=>((h+11)%12)+1,ampm=d=>d.getHours()<12?"A":"P",hourLbl=h=>H12?h12(h)+(h<12?"A":"P"):p2(h);
/* Example times in fixed text are written as @HH:MM and follow the clock setting when drawn. */
const fmtT=str=>str.indexOf("@")<0?str:str.replace(/@(\d\d):(\d\d)/g,(m,h,mi)=>H12?h12(+h)+":"+mi+(+h<12?"A":"P"):h+":"+mi);
const hm=d=>H12?h12(d.getHours())+":"+p2(d.getMinutes())+ampm(d):p2(d.getHours())+":"+p2(d.getMinutes());
const mmss=s=>{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+":"+p2(s%60);};
const DAYS=["SUN","MON","TUE","WED","THU","FRI","SAT"],MONS=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const dstr=d=>DAYS[d.getDay()]+" "+d.getDate()+" "+MONS[d.getMonth()];
const clockStr=S=>(H12?String(h12(S.now.getHours())):p2(S.now.getHours()))+((S.t%1)<0.55?":":"|")+p2(S.now.getMinutes());
/* The big clock, with a small AM/PM beside it in 12-hour mode. Positions by left edge, right edge or centre. */
function bigClock(fb,S,x,y,col,o={}){const style=o.style||CLOCK_STYLE;
  if((style==="retro64"||style==="comicoro")){const F=TITLE_FONTS[style],str=H12?String(h12(S.now.getHours()))+":"+p2(S.now.getMinutes()):p2(S.now.getHours())+":"+p2(S.now.getMinutes()),ap=H12?ampm(S.now):"",aw=ap?fb.tw(F3,ap)+2:0,w=fb.tw(F,str,2)+aw,x0=o.right!=null?o.right-w:o.center!=null?Math.round(o.center-w/2):x,dr=o.outline?(...q)=>fb.textO(...q):(...q)=>fb.text(...q);
    dr(F,str,x0,y-2,col,2,o.a||1);if(ap)fb.text(F3,ap,x0+w-aw+2,y,[200,200,210],1,o.a||1);return w;}
  if(style==="space"||style==="alagard"||style==="celtic"){const SF=TITLE_FONTS[style],str=H12?String(h12(S.now.getHours()))+":"+p2(S.now.getMinutes()):p2(S.now.getHours())+":"+p2(S.now.getMinutes()),ap=H12?ampm(S.now):"",aw=ap?fb.tw(F3,ap)+2:0,w=fb.tw(SF,str)+aw,x0=o.right!=null?o.right-w:o.center!=null?Math.round(o.center-w/2):x,dr=o.outline?(...q)=>fb.textO(...q):(...q)=>fb.text(...q);
    dr(SF,str,x0,y-1,col,1,o.a||1);if(ap)fb.text(F3,ap,x0+w-aw+2,y,[200,200,210],1,o.a||1);return w;}
  if(style==="flip"||style==="nixie"||style==="segment"){const hh=H12?String(h12(S.now.getHours())):p2(S.now.getHours()),str=hh+":"+p2(S.now.getMinutes()),ap=H12?ampm(S.now):"",aw=ap?fb.tw(F3,ap)+2:0,w=(style==="flip"?flipW(str):style==="segment"?segW(str):nixieW(str))+aw,x0=o.right!=null?o.right-w:o.center!=null?Math.round(o.center-w/2):x;
    if(style==="flip")flipText(fb,str,x0,y-1,{key:(S.id||"d")+":clk:"+x0,t:S.t,a:o.a});else if(style==="segment")segText(fb,str,x0,y-1,{a:o.a});else nixieText(fb,str,x0,y-1,{t:S.t,a:o.a});if(ap)fb.text(F3,ap,x0+w-aw+2,y,[200,200,210],1,o.a||1);return w;}
  const str=o.steady?clockStr({now:S.now,t:0}):clockStr(S),tw=fb.tw(BIG,str),ap=H12?ampm(S.now):"",aw=ap?fb.tw(F3,ap)+2:0,total=tw+aw;
  const x0=o.right!=null?o.right-total:o.center!=null?Math.round(o.center-total/2):x,draw=o.outline?(...q)=>fb.textO(...q):(...q)=>fb.text(...q);
  draw(BIG,str,x0,y,col,1,o.a||1);if(ap)draw(F3,ap,x0+tw+2,y,col,1,o.a||1);return total;}

/* ---------- pixel fonts ---------- */
function mkFont(h,map){const g={};for(const k in map){const rows=map[k].split("/");const w=Math.max(...rows.map(r=>r.length));while(rows.length<h)rows.push(".".repeat(w));g[k]={w,rows:rows.map(r=>r.padEnd(w,"."))};}return {h,g};}
const F5=mkFont(7,{
A:".###./#...#/#...#/#####/#...#/#...#/#...#",B:"####./#...#/#...#/####./#...#/#...#/####.",C:".###./#...#/#..../#..../#..../#...#/.###.",
D:"####./#...#/#...#/#...#/#...#/#...#/####.",E:"#####/#..../#..../####./#..../#..../#####",F:"#####/#..../#..../####./#..../#..../#....",
G:".###./#...#/#..../#.###/#...#/#...#/.####",H:"#...#/#...#/#...#/#####/#...#/#...#/#...#",I:"###/.#./.#./.#./.#./.#./###",
J:"..###/...#./...#./...#./...#./#..#./.##..",K:"#...#/#..#./#.#../##.../#.#../#..#./#...#",L:"#..../#..../#..../#..../#..../#..../#####",
M:"#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#",N:"#...#/#...#/##..#/#.#.#/#..##/#...#/#...#",O:".###./#...#/#...#/#...#/#...#/#...#/.###.",
P:"####./#...#/#...#/####./#..../#..../#....",Q:".###./#...#/#...#/#...#/#.#.#/#..#./.##.#",R:"####./#...#/#...#/####./#.#../#..#./#...#",
S:".####/#..../#..../.###./....#/....#/####.",T:"#####/..#../..#../..#../..#../..#../..#..",U:"#...#/#...#/#...#/#...#/#...#/#...#/.###.",
V:"#...#/#...#/#...#/#...#/#...#/.#.#./..#..",W:"#...#/#...#/#...#/#.#.#/#.#.#/#.#.#/.#.#.",X:"#...#/#...#/.#.#./..#../.#.#./#...#/#...#",
Y:"#...#/#...#/.#.#./..#../..#../..#../..#..",Z:"#####/....#/...#./..#../.#.../#..../#####",
"0":".###./#...#/#..##/#.#.#/##..#/#...#/.###.","1":"..#../.##../..#../..#../..#../..#../.###.","2":".###./#...#/....#/...#./..#../.#.../#####",
"3":"#####/...#./..#../...#./....#/#...#/.###.","4":"...#./..##./.#.#./#..#./#####/...#./...#.","5":"#####/#..../####./....#/....#/#...#/.###.",
"6":"..##./.#.../#..../####./#...#/#...#/.###.","7":"#####/....#/...#./..#../.#.../.#.../.#...","8":".###./#...#/#...#/.###./#...#/#...#/.###.",
"9":".###./#...#/#...#/.####/....#/...#./.##..",
" ":"...",",":"../../../../../.#/#.",":":"./#/#/./#/#/.","-":"..../..../..../####",
"%":"##.../##..#/...#./..#../.#.../#..##/...##","°":".#./#.#/.#.","/":"....#/....#/...#./..#../.#.../#..../#....",
"!":"#/#/#/#/#/./#","'":"#/#","•":".../.../.#./###/.#.","?":".###./#...#/....#/...#./..#../...../..#..",
"+":"...../..#../..#../#####/..#../..#..","(":".#/#./#./#./#./#./.#",")":"#./.#/.#/.#/.#/.#/#."
});
F5.g["."]={w:1,rows:[".",".",".",".",".",".","#"]};F5.g["_"]={w:5,rows:[".....",".....",".....",".....",".....",".....","#####"]};
const F3=mkFont(5,{
"0":"###/#.#/#.#/#.#/###","1":".#./##./.#./.#./###","2":"###/..#/###/#../###","3":"###/..#/.##/..#/###","4":"#.#/#.#/###/..#/..#",
"5":"###/#../###/..#/###","6":"###/#../###/#.#/###","7":"###/..#/..#/.#./.#.","8":"###/#.#/###/#.#/###","9":"###/#.#/###/..#/###",
A:".#./#.#/###/#.#/#.#",B:"##./#.#/##./#.#/##.",C:".##/#../#../#../.##",D:"##./#.#/#.#/#.#/##.",E:"###/#../##./#../###",F:"###/#../##./#../#..",
G:".##/#../#.#/#.#/.##",H:"#.#/#.#/###/#.#/#.#",I:"###/.#./.#./.#./###",J:"..#/..#/..#/#.#/.#.",K:"#.#/#.#/##./#.#/#.#",L:"#../#../#../#../###",
M:"#.#/###/###/#.#/#.#",N:"##./#.#/#.#/#.#/#.#",O:".#./#.#/#.#/#.#/.#.",P:"##./#.#/##./#../#..",Q:".#./#.#/#.#/##./.##",R:"##./#.#/##./#.#/#.#",
S:".##/#../.#./..#/##.",T:"###/.#./.#./.#./.#.",U:"#.#/#.#/#.#/#.#/###",V:"#.#/#.#/#.#/#.#/.#.",W:"#.#/#.#/###/###/#.#",X:"#.#/#.#/.#./#.#/#.#",
Y:"#.#/#.#/.#./.#./.#.",Z:"###/..#/.#./#../###",
" ":"..","%":"#.#/..#/.#./#../#.#","°":"##/##",":":"./#/./#/.","-":".../.../###","/":"..#/..#/.#./#../#..","+":".../.#./###/.#./...",",":"./././#/#","'":"#/#"
});
F3.g["."]={w:1,rows:[".",".",".",".","#"]};F3.g["_"]={w:3,rows:["...","...","...","...","###"]};
const BIG=mkFont(13,{
"0":".#####./##...##/##...##/##...##/##...##/##...##/##...##/##...##/##...##/##...##/##...##/##...##/.#####.",
"1":"...##../..###../.####../...##../...##../...##../...##../...##../...##../...##../...##../...##../.######",
"2":".#####./##...##/.....##/.....##/.....##/....##./...##../..##.../.##..../##...../##...../##...../#######",
"3":".#####./##...##/.....##/.....##/.....##/..####./.....##/.....##/.....##/.....##/.....##/##...##/.#####.",
"4":"....##./...###./..####./.##.##./##..##./##..##./##..##./#######/....##./....##./....##./....##./....##.",
"5":"#######/##...../##...../##...../######./.....##/.....##/.....##/.....##/.....##/.....##/##...##/.#####.",
"6":"..####./.##..../##...../##...../##...../######./##...##/##...##/##...##/##...##/##...##/##...##/.#####.",
"7":"#######/.....##/.....##/....##./....##./...##../...##../..##.../..##.../..##.../..##.../..##.../..##...",
"8":".#####./##...##/##...##/##...##/##...##/.#####./##...##/##...##/##...##/##...##/##...##/##...##/.#####.",
"9":".#####./##...##/##...##/##...##/##...##/##...##/.######/.....##/.....##/.....##/.....##/....##./.####..",
":":"../../../##/##/../../../##/##/../../..","|":"../../../../../../../../../../../../.."
});

/* ---------- framebuffer ---------- */
/* Where a halo is drawn, as the offsets of its copies: all round, or one side. */
const HALO_AT={around:[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]],below:[[0,1]],above:[[0,-1]],left:[[-1,0]],right:[[1,0]]};
/* A face without a glyph for an accented letter draws the plain letter (the 3 × 5 face has no room for marks); unknown characters are a space. */
const gl=(f,ch)=>f.g[ch]||f.g[ch.normalize("NFD")[0]]||f.g[" "];
class FB{
  constructor(W,H){this.W=W;this.H=H;this.d=new Float32Array(W*H*3);this.noClip();}
  noClip(){this.x0=0;this.y0=0;this.x1=this.W;this.y1=this.H;this.cs=[];}
  pushClip(x,y,w,h){this.cs.push([this.x0,this.y0,this.x1,this.y1]);this.x0=Math.max(this.x0,Math.floor(x));this.y0=Math.max(this.y0,Math.floor(y));this.x1=Math.min(this.x1,Math.floor(x+w));this.y1=Math.min(this.y1,Math.floor(y+h));}
  popClip(){const c=this.cs.pop();if(c)[this.x0,this.y0,this.x1,this.y1]=c;}
  clear(){this.d.fill(0);}
  px(x,y,c,a=1){x=Math.floor(x);y=Math.floor(y);if(x<this.x0||y<this.y0||x>=this.x1||y>=this.y1||!(a>0))return;if(typeof c==="function")c=c(x,y);if(a>1)a=1;const i=(y*this.W+x)*3,d=this.d;d[i]+=(c[0]-d[i])*a;d[i+1]+=(c[1]-d[i+1])*a;d[i+2]+=(c[2]-d[i+2])*a;}
  add(x,y,c,a=1){x=Math.floor(x);y=Math.floor(y);if(x<this.x0||y<this.y0||x>=this.x1||y>=this.y1||!(a>0))return;const i=(y*this.W+x)*3,d=this.d;d[i]=Math.min(255,d[i]+c[0]*a);d[i+1]=Math.min(255,d[i+1]+c[1]*a);d[i+2]=Math.min(255,d[i+2]+c[2]*a);}
  rect(x,y,w,h,c,a=1){x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)this.px(i,j,c,a);}
  vgrad(x,y,w,h,c0,c1,a=1){x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);for(let j=0;j<h;j++){const c=mix(c0,c1,h>1?j/(h-1):0);for(let i=0;i<w;i++)this.px(x+i,y+j,c,a);}}
  frame(x0,y0,x1,y1,c,a=1){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);for(let x=x0;x<=x1;x++){this.px(x,y0,c,a);this.px(x,y1,c,a);}for(let y=y0+1;y<y1;y++){this.px(x0,y,c,a);this.px(x1,y,c,a);}}
  disc(cx,cy,r,c,a=1){const ys=Math.max(this.y0,Math.floor(cy-r-1)),ye=Math.min(this.y1-1,Math.ceil(cy+r+1)),xs=Math.max(this.x0,Math.floor(cx-r-1)),xe=Math.min(this.x1-1,Math.ceil(cx+r+1));for(let y=ys;y<=ye;y++)for(let x=xs;x<=xe;x++){const v=clamp(r-Math.hypot(x+.5-cx,y+.5-cy)+.5,0,1);if(v>0)this.px(x,y,c,a*v);}}
  ring(cx,cy,r,w,c,a=1){const R=r+w,ys=Math.max(this.y0,Math.floor(cy-R-1)),ye=Math.min(this.y1-1,Math.ceil(cy+R+1)),xs=Math.max(this.x0,Math.floor(cx-R-1)),xe=Math.min(this.x1-1,Math.ceil(cx+R+1));for(let y=ys;y<=ye;y++)for(let x=xs;x<=xe;x++){const v=clamp(w/2-Math.abs(Math.hypot(x+.5-cx,y+.5-cy)-r)+.5,0,1);if(v>0)this.px(x,y,c,a*v);}}
  line(x0,y0,x1,y1,c,a0=1,a1=a0){const n=Math.max(1,Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))));for(let i=0;i<=n;i++){const t=i/n;this.px(x0+(x1-x0)*t,y0+(y1-y0)*t,c,a0+(a1-a0)*t);}}
  poly(P,c,a=1){let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9;for(const [x,y] of P){mnx=Math.min(mnx,x);mny=Math.min(mny,y);mxx=Math.max(mxx,x);mxy=Math.max(mxy,y);}
    const ys=Math.max(this.y0,Math.floor(mny)),ye=Math.min(this.y1-1,Math.ceil(mxy)),xs=Math.max(this.x0,Math.floor(mnx)),xe=Math.min(this.x1-1,Math.ceil(mxx));
    for(let y=ys;y<=ye;y++)for(let x=xs;x<=xe;x++){const X=x+.5,Y=y+.5;let ins=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if((yi>Y)!==(yj>Y)&&X<(xj-xi)*(Y-yi)/(yj-yi)+xi)ins=!ins;}if(ins)this.px(x,y,c,a);}}
  /* A joining glyph (box drawing, blocks) has no gap after it, so lines and bars meet the next one. */
  tw(f,s,sc=1){s=fmtT(s);let w=0,gap=0;for(const ch of s){const g=gl(f,ch);gap=g.j?0:sc;w+=g.w*sc+gap;}return Math.max(0,w-gap);}
  /* halo: unset, text is plain and textO outlines in black; {c, at} outlines all text in colour c, all round or on one side; false draws every outline plain.
     A screen's outline sets it. */
  text(f,s,x,y,c,sc=1,a=1){if(this.halo&&!this._h)return this.textO(f,s,x,y,c,sc,a);s=fmtT(s);x=Math.round(x);y=Math.round(y);let cx=x,gap=sc;for(const ch of s){const g=gl(f,ch);if(cx<this.x1&&cx+g.w*sc>=this.x0){for(let r=0;r<f.h;r++){const row=g.rows[r];for(let k=0;k<g.w;k++){if(row[k]!=="#")continue;for(let sy=0;sy<sc;sy++)for(let sx=0;sx<sc;sx++)this.px(cx+k*sc+sx,y+r*sc+sy,c,a);}}}gap=g.j?0:sc;cx+=g.w*sc+gap;}return cx-x-gap;}
  /* haloTo: where the halo copies go, when this buffer is merged by brightness (a dark halo there would lose to the sky under it). */
  textO(f,s,x,y,c,sc=1,a=1){if(this.halo===false)return this.text(f,s,x,y,c,sc,a);const h=this.halo||{c:[0,0,0],at:"around"},hb=this.haloTo||this;this._h=hb._h=true;
    for(const [dx,dy] of HALO_AT[h.at]||HALO_AT.around)hb.text(f,s,x+dx,y+dy,h.c,sc,0.85*a);const r=this.text(f,s,x,y,c,sc,a);this._h=hb._h=false;return r;}
  /* A small shape with the same halo as the words beside it (like a ticker's arrow): draw(fb, dx, dy, colour or null, alpha) is called for each halo copy, then for the shape. */
  haloShape(draw){const h=this.halo;if(h&&!this._h){const hb=this.haloTo||this;for(const [dx,dy] of HALO_AT[h.at]||HALO_AT.around)draw(hb,dx,dy,h.c,0.85);}draw(this,0,0,null,1);}
  blit(src,x,y,w,h,dy){const W=this.W,xs=Math.max(0,x),xe=Math.min(W,x+w);for(let yy=Math.max(0,y);yy<Math.min(this.H,y+h);yy++){const sy=Math.round(yy-dy);if(sy<y||sy>=y+h||sy<0||sy>=this.H)continue;for(let xx=xs;xx<xe;xx++){const di=(yy*W+xx)*3,si=(sy*W+xx)*3;this.d[di]=src.d[si];this.d[di+1]=src.d[si+1];this.d[di+2]=src.d[si+2];}}}
  maxFrom(src){const d=this.d,s=src.d;for(let i=0;i<d.length;i++)if(s[i]>d[i])d[i]=s[i];}
  /* src over this: what src drew sits on top, so words stay in front of a bright sky; where it drew next to nothing (its dark gaps), the brighter wins as before. */
  overFrom(src,thr=24){const d=this.d,s=src.d;for(let j=0;j<d.length;j+=3){if(Math.max(s[j],s[j+1],s[j+2])>thr){d[j]=s[j];d[j+1]=s[j+1];d[j+2]=s[j+2];}else for(let c=0;c<3;c++)if(s[j+c]>d[j+c])d[j+c]=s[j+c];}}
  scaleRect(x,y,w,h,k){for(let yy=Math.max(0,y);yy<Math.min(this.H,y+h);yy++)for(let xx=Math.max(0,x);xx<Math.min(this.W,x+w);xx++){const i=(yy*this.W+xx)*3;this.d[i]*=k;this.d[i+1]*=k;this.d[i+2]*=k;}}
  mixFrom(src,p){const d=this.d,s=src.d;for(let i=0;i<d.length;i++)d[i]+=(s[i]-d[i])*p;}
}
/* ---------- the rest of the 5 × 7 face: lowercase, all of printable ASCII, Latin accents and half-width katakana ----------
   Drawn for PixelBar in the usual 5 × 7 shapes. Lowercase sits on rows 2-6, with g, j, p, q and y lifted so their tails fit. */
const addG=(F,map)=>{for(const k in map){const rows=map[k].split("|");F.g[k]={w:rows[0].length,rows};}};
addG(F5,{"a":".....|.....|.###.|....#|.####|#...#|.####","b":"#....|#....|#.##.|##..#|#...#|#...#|####.","c":".....|.....|.###.|#....|#....|#...#|.###.","d":"....#|....#|.##.#|#..##|#...#|#...#|.####","e":".....|.....|.###.|#...#|#####|#....|.###.","f":"..##.|.#..#|.#...|###..|.#...|.#...|.#...","g":".....|.....|.####|#...#|.####|....#|.###.","h":"#....|#....|#.##.|##..#|#...#|#...#|#...#","i":".#.|...|##.|.#.|.#.|.#.|###","j":"...#|....|..##|...#|...#|#..#|.##.","k":"#...|#...|#..#|#.#.|##..|#.#.|#..#","l":"##.|.#.|.#.|.#.|.#.|.#.|###","m":".....|.....|##.#.|#.#.#|#.#.#|#...#|#...#","n":".....|.....|#.##.|##..#|#...#|#...#|#...#","o":".....|.....|.###.|#...#|#...#|#...#|.###.","p":".....|.....|####.|#...#|####.|#....|#....","q":".....|.....|.####|#...#|.####|....#|....#","r":".....|.....|#.##.|##..#|#....|#....|#....","s":".....|.....|.####|#....|.###.|....#|####.","t":".#...|.#...|###..|.#...|.#...|.#..#|..##.","u":".....|.....|#...#|#...#|#...#|#..##|.##.#","v":".....|.....|#...#|#...#|#...#|.#.#.|..#..","w":".....|.....|#...#|#...#|#.#.#|#.#.#|.#.#.","x":".....|.....|#...#|.#.#.|..#..|.#.#.|#...#","y":".....|.....|#...#|#...#|.####|....#|.###.","z":".....|.....|#####|...#.|..#..|.#...|#####","ı":"...|...|##.|.#.|.#.|.#.|###","ȷ":"....|....|..##|...#|...#|#..#|.##.","ß":".###.|#...#|#..#.|#.#..|#..#.|#...#|#.##.","æ":".......|.......|.##.##.|...#..#|.######|#..#...|.##.###","œ":".......|.......|.##.##.|#..#..#|#..####|#..#...|.##.###","ø":".....|.....|.###.|#..##|#.#.#|##..#|.###.","ł":".##.|..#.|..#.|..##|.##.|..#.|.###","đ":"....#|..###|.##.#|#..##|#...#|#...#|.####","ð":".##..|...#.|.####|#...#|#...#|#...#|.###.","þ":"#....|#....|####.|#...#|####.|#....|#....","Æ":".######|#..#...|#..#...|#######|#..#...|#..#...|#..####","Œ":".######|#..#...|#..#...|#..####|#..#...|#..#...|.######","Ø":".###.|#..##|#..##|#.#.#|##..#|##..#|.###.","Ł":"#....|#....|#.#..|##...|#....|#....|#####","Đ":"####.|.#..#|.#..#|###.#|.#..#|.#..#|####.","Ð":"####.|.#..#|.#..#|###.#|.#..#|.#..#|####.","Þ":"#....|####.|#...#|#...#|####.|#....|#....","ħ":".#...|###..|.#.##|.##.#|.#..#|.#..#|.#..#","Ħ":".#...#.|#######|.#...#.|.#####.|.#...#.|.#...#.|.#...#."});
addG(F5,{"\"":"#.#|#.#|...|...|...|...|...","#":".#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.","$":"..#..|.####|#.#..|.###.|..#.#|####.|..#..","&":".##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#","*":".....|..#..|#.#.#|.###.|#.#.#|..#..|.....",";":"..|..|.#|..|.#|.#|#.","<":"...#|..#.|.#..|#...|.#..|..#.|...#","=":".....|.....|#####|.....|#####|.....|.....",">":"#...|.#..|..#.|...#|..#.|.#..|#...","@":".###.|#...#|#.###|#.#.#|#.###|#....|.###.","[":"###|#..|#..|#..|#..|#..|###","\\":"#....|#....|.#...|..#..|...#.|....#|....#","]":"###|..#|..#|..#|..#|..#|###","^":"..#..|.#.#.|#...#|.....|.....|.....|.....","`":"#.|.#|..|..|..|..|..","{":"..#|.#.|.#.|#..|.#.|.#.|..#","|":"#|#|#|#|#|#|#","}":"#..|.#.|.#.|..#|.#.|.#.|#..","~":".....|.....|.#...|#.#.#|...#.|.....|.....","¡":"#|.|#|#|#|#|#","¿":"..#..|.....|..#..|..#..|.#...|#...#|.###.","«":".....|..#.#|.#.#.|#.#..|.#.#.|..#.#|.....","»":".....|#.#..|.#.#.|..#.#|.#.#.|#.#..|.....","€":"..###|.#...|####.|.#...|####.|.#...|..###","£":"..##.|.#..#|.#...|###..|.#...|.#..#|#.##.","¥":"#...#|.#.#.|#####|..#..|#####|..#..|..#..","¢":"..#..|.####|#.#..|#.#..|#.#..|.####|..#..","©":"..###..|.#...#.|#..##.#|#.#...#|#..##.#|.#...#.|..###..","®":"..###..|.#...#.|#.##..#|#.#.#.#|#.##..#|.#.#.#.|..###..","±":"..#..|..#..|#####|..#..|..#..|.....|#####","×":".....|#...#|.#.#.|..#..|.#.#.|#...#|.....","÷":".....|..#..|.....|#####|.....|..#..|.....","µ":".....|.....|#...#|#...#|#..##|###.#|#....","·":".|.|.|#|.|.|.","²":"##.|..#|.#.|###|...|...|...","³":"##.|.##|..#|##.|...|...|...","§":".###|#...|.##.|#..#|.##.|...#|###.","｡":"...|...|...|...|.#.|#.#|.#.","｢":"###|#..|#..|#..|...|...|...","｣":"...|...|...|..#|..#|..#|###","､":"...|...|...|...|#..|.#.|..#","･":".|.|.|#|.|.|.","ｦ":"#####|....#|#####|....#|...#.|..#..|.#...","ｧ":"....|....|####|...#|.##.|.#..|#...","ｨ":"....|....|...#|..#.|.##.|#.#.|..#.","ｩ":"....|....|..#.|####|#..#|...#|..#.","ｪ":"....|....|....|####|.#..|.#..|####","ｫ":"....|....|..#.|####|.##.|#.#.|..#.","ｬ":"....|....|.#..|####|.#.#|.#..|.#..","ｭ":"....|....|....|###.|..#.|..#.|####","ｮ":"....|....|####|...#|####|...#|####","ｯ":"....|....|....|#.#.|#.#.|...#|..#.","ｰ":".....|.....|.....|#####|.....|.....|.....","ｱ":"#####|....#|..#.#|..##.|..#..|..#..|.#...","ｲ":"....#|...#.|..#..|.##..|#.#..|..#..|..#..","ｳ":"..#..|#####|#...#|#...#|....#|...#.|..#..","ｴ":".....|#####|..#..|..#..|..#..|..#..|#####","ｵ":"...#.|#####|...#.|..##.|.#.#.|#..#.|...#.","ｶ":"..#..|#####|..#.#|..#.#|.#..#|.#..#|#..#.","ｷ":"..#..|#####|..#..|#####|..#..|..#..|..#..","ｸ":".#...|.####|#...#|....#|...#.|..#..|.#...","ｹ":".#...|.####|#..#.|...#.|...#.|..#..|.#...","ｺ":".....|#####|....#|....#|....#|....#|#####","ｻ":".#.#.|#####|.#.#.|.#.#.|...#.|..#..|.#...","ｼ":".....|#...#|.#..#|....#|...#.|..#..|##...","ｽ":".....|#####|....#|...#.|..#..|.#.#.|#...#","ｾ":".#...|.#...|#####|.#..#|.#.#.|.#...|..###","ｿ":"#...#|#...#|.#..#|....#|...#.|..#..|.#...","ﾀ":".#...|.####|#...#|#.#.#|...#.|..#..|.#...","ﾁ":"...#.|###..|..#..|#####|..#..|..#..|.#...","ﾂ":".....|#.#.#|#.#.#|....#|...#.|..#..|.#...","ﾃ":".###.|.....|#####|..#..|..#..|..#..|.#...","ﾄ":".#...|.#...|.##..|.#.#.|.#...|.#...|.#...","ﾅ":"..#..|..#..|#####|..#..|..#..|..#..|.#...","ﾆ":".....|.###.|.....|.....|.....|.....|#####","ﾇ":".....|#####|....#|.#.#.|..#..|.#.#.|#....","ﾈ":"..#..|#####|...#.|..#..|.###.|#.#.#|..#..","ﾉ":"....#|....#|...#.|...#.|..#..|.#...|#....","ﾊ":".....|.#.#.|.#.#.|.#..#|#...#|#...#|#....","ﾋ":"#....|#....|#..##|###..|#....|#....|.####","ﾌ":".....|#####|....#|....#|...#.|..#..|##...","ﾍ":".....|.#...|#.#..|#..#.|....#|....#|.....","ﾎ":"..#..|#####|..#..|#.#.#|#.#.#|..#..|..#..","ﾏ":".....|#####|....#|...#.|#.#..|.#...|..#..","ﾐ":".###.|.....|.###.|.....|####.|....#|.....","ﾑ":"..#..|..#..|.#...|.#.#.|#...#|#####|....#","ﾒ":"....#|....#|#..#.|.##..|..#..|.#.#.|#....","ﾓ":"#####|..#..|#####|..#..|..#..|..#..|..###","ﾔ":".#...|.#...|#####|.#..#|.#.#.|.#...|.#...","ﾕ":".....|.###.|...#.|...#.|...#.|...#.|#####","ﾖ":"#####|....#|....#|#####|....#|....#|#####","ﾗ":".###.|.....|#####|....#|...#.|..#..|.#...","ﾘ":"#...#|#...#|#...#|#...#|....#|...#.|..#..","ﾙ":".....|.#.#.|.#.#.|.#.#.|.#.#.|.#.##|#.#..","ﾚ":"#....|#....|#....|#...#|#..#.|#.#..|##...","ﾛ":".....|#####|#...#|#...#|#...#|#...#|#####","ﾜ":".....|#####|#...#|....#|...#.|..#..|.#...","ﾝ":".....|#....|.#..#|....#|...#.|..#..|##...","ﾞ":"#.#|#.#|...|...|...|...|...","ﾟ":".#.|#.#|.#.|...|...|...|..."});
const MARKS = {
  "́": "acute", "̀": "grave", "̂": "circ", "̈": "diaer", "̃": "tilde", "̊": "ring", "̌": "caron",
  "̄": "macron", "̆": "breve", "̇": "dot", "̋": "dacute", "̧": "cedilla", "̨": "ogonek", "̦": "comma",
};
const BELOW = new Set(["cedilla", "ogonek", "comma"]);
/* A mark as two rows of w columns, centred on column c. */
function mark(name, w, c, thick) {
  const r0 = Array(w).fill("."), r1 = Array(w).fill("."), on = (r, i) => { if (i >= 0 && i < w) r[i] = "#"; };
  switch (name) {
    case "acute": on(r0, c + 1); on(r1, c); break;
    case "grave": on(r0, c - 1); on(r1, c); break;
    case "circ": on(r0, c); on(r1, c - 1); on(r1, c + 1); break;
    case "caron": on(r0, c - 1); on(r0, c + 1); on(r1, c); break;
    case "diaer": on(r0, c - (thick ? 2 : 1)); on(r0, c + 1); break;
    case "tilde": if (w >= 5) { on(r0, c - 1); on(r0, c); on(r0, c + 2); on(r1, c - 2); on(r1, c + 1); } else { on(r0, c); on(r0, c + 1); on(r1, c - 1); } break;
    case "ring": on(r0, c - 1); on(r0, c); on(r0, c + 1); on(r1, c - 1); on(r1, c + 1); break;
    case "macron": on(r0, c - 1); on(r0, c); on(r0, c + 1); break;
    case "breve": if (w >= 5) { on(r0, c - 2); on(r0, c + 2); on(r1, c - 1); on(r1, c); on(r1, c + 1); } else { on(r0, c - 1); on(r0, c + 1); on(r1, c); } break;
    case "dot": on(r0, c); break;
    case "dacute": if (thick) { on(r0, c - 1); on(r0, c + 2); on(r1, c - 2); on(r1, c + 1); } else { on(r0, c); on(r0, c + 2); on(r1, c - 1); on(r1, c + 1); } break;
    case "cedilla": on(r0, c); on(r1, c - 1); on(r1, c); break;
    case "ogonek": on(r0, c + 1); on(r1, c + 1); on(r1, c + 2); break;
    case "comma": on(r0, c); on(r1, c - 1); break;
  }
  return [r0.join(""), r1.join("")];
}
/* Rows dropped until n are left: one from the longest run of identical rows each time, else the row most like its neighbour. */
function squash(rows, n) {
  rows = [...rows];
  while (rows.length > n) {
    let best = -1, bestLen = 1;
    for (let i = 0; i < rows.length;) { let j = i; while (j + 1 < rows.length && rows[j + 1] === rows[i]) j++; const len = j - i + 1; if (len > bestLen) { bestLen = len; best = i + (len >> 1); } i = j + 1; }
    if (best < 0) {
      const diff = (a, b) => [...a].filter((c, k) => c !== b[k]).length;
      let bd = 1e9; for (let i = 1; i < rows.length - 1; i++) { const d = diff(rows[i], rows[i - 1]) + diff(rows[i], rows[i + 1]); if (d < bd) { bd = d; best = i; } }
    }
    rows.splice(best, 1);
  }
  return rows;
}
const LOWER_I = { i: "ı", j: "ȷ" };
/* Every accented Latin letter the font's bases and marks can make, as glyph rows. over: hand-made squashed capitals. */
function accents(g, m, over = {}) {
  const out = {}, chars = [];
  for (const [a, b] of [[0xC0, 0x17F], [0x386, 0x3CE], [0x400, 0x45F]]) for (let cp = a; cp <= b; cp++) chars.push(String.fromCodePoint(cp));
  chars.push("Ș", "ș", "Ț", "ț");
  for (const ch of chars) {
    const d = ch.normalize("NFD");
    if (d.length !== 2 || !MARKS[d[1]]) continue;
    let base = d[0]; const name = MARKS[d[1]], below = BELOW.has(name), lower = base !== base.toUpperCase();
    if (lower && !below && LOWER_I[base]) base = LOWER_I[base];
    const bg = g[base]; if (!bg) continue;
    const w = bg.rows[0].length, c = w >> 1;
    // A big face's marks are 2 LEDs wide; two dots (or two acutes) start one further apart so they don't run together.
    let mk = mark(name, w, c, m.thick);
    if (m.thick) mk = mk.map(r => [...r].map((x, i) => (x === "#" || r[i - 1] === "#" ? "#" : ".")).join(""));
    let rows;
    // A face with room under the baseline (m.base rows above it) hangs a mark below there, and keeps its descender rows as they are.
    const bh = m.base || m.h, pad = r => [...r, ...Array(Math.max(0, m.h - r.length)).fill(".".repeat(w))].slice(0, m.h);
    if (below && bh < m.h) rows = pad([...bg.rows.slice(0, bh), ...(m.gap ? [] : []), ...mk]);
    else if (!lower) {
      // A gap row between mark and letter where there's room (the big face).
      const gap = m.gap ? [".".repeat(w)] : [], body = over[base] ? over[base] : squash(bg.rows.slice(0, bh), bh - 2 - gap.length);
      rows = below ? [...body, ...gap, ...mk, ...bg.rows.slice(bh)] : [...mk, ...gap, ...body, ...bg.rows.slice(bh)];
    } else if (!below) {
      // Ascender letters (d, l, t) keep their shape; the mark goes beside (ď ľ ť) as an apostrophe.
      const asc = bg.rows.slice(0, m.xTop).some(r => r.includes("#"));
      if (asc) { if (name !== "caron") continue; rows = bg.rows.map((r, i) => r + (i < 2 ? "#" : ".")); }
      else rows = [...mk, ...(m.gap ? [".".repeat(w)] : []), ...bg.rows.slice(m.xTop)].slice(-m.h);
      if (rows.length < m.h) rows = [...Array(m.h - rows.length).fill(".".repeat(w)), ...rows];
    } else {
      const xb = squash(bg.rows.slice(m.xTop), m.h - m.xTop - 1);
      rows = [...bg.rows.slice(0, m.xTop), ...xb, mk[1]];
    }
    out[ch] = { w: rows[0].length, rows };
  }
  return out;
}
/* Symbols (stars, hearts, suits, arrows, weather, music) and box drawing and blocks, which join the next cell. */
addG(F5,{"★":"..#..|..#..|#####|.###.|.#.#.|#...#|.....","☆":"..#..|.#.#.|##.##|#...#|.#.#.|#.#.#|.....","♥":".....|.#.#.|#####|#####|.###.|..#..|.....","♡":".....|.#.#.|#.#.#|#...#|.#.#.|..#..|.....","♠":"..#..|.###.|#####|#####|..#..|.###.|.....","♣":"..#..|.###.|..#..|##.##|#####|..#..|.###.","♦":"..#..|.###.|#####|.###.|..#..|.....|.....","♢":"..#..|.#.#.|#...#|.#.#.|..#..|.....|.....","●":".....|.###.|#####|#####|#####|.###.|.....","○":".....|.###.|#...#|#...#|#...#|.###.|.....","■":".....|#####|#####|#####|#####|#####|.....","□":".....|#####|#...#|#...#|#...#|#####|.....","▲":".....|..#..|..#..|.###.|.###.|#####|.....","▼":".....|#####|.###.|.###.|..#..|..#..|.....","◀":"....#|...##|..###|.####|..###|...##|....#","▶":"#....|##...|###..|####.|###..|##...|#....","←":".....|..#..|.#...|#####|.#...|..#..|.....","→":".....|..#..|...#.|#####|...#.|..#..|.....","↑":"..#..|.###.|#.#.#|..#..|..#..|..#..|..#..","↓":"..#..|..#..|..#..|..#..|#.#.#|.###.|..#..","↔":".....|.#.#.|#...#|#####|#...#|.#.#.|.....","↕":"..#..|.###.|#.#.#|..#..|#.#.#|.###.|..#..","♪":"..##.|..#.#|..#..|..#..|.##..|###..|.#...","♫":".####|.#..#|.#..#|.#..#|##.##|##.##|.....","✓":".....|....#|...##|#.##.|###..|.#...|.....","✗":".....|#...#|##.##|.###.|##.##|#...#|.....","☀":"#.#.#|.###.|##.##|#...#|##.##|.###.|#.#.#","☁":".....|.##..|#..##|#...#|#####|.....|.....","☂":"..#..|.###.|#####|..#..|..#..|#.#..|.#...","☺":".###.|#...#|#.#.#|#...#|#.#.#|#...#|.###.","⌂":".....|..#..|.#.#.|#...#|#...#|#####|.....","♀":".###.|#...#|#...#|.###.|..#..|.###.|..#..","♂":"..###|...##|.##.#|#..#.|#..#.|.##..|.....","∞":".....|.....|.#.#.|#.#.#|.#.#.|.....|.....","⚡":"...#.|..#..|.#...|#####|...#.|..#..|.#..."});
addG(F5,{"─":"......|......|......|######|......|......|......","│":"..#...|..#...|..#...|..#...|..#...|..#...|..#...","┌":"......|......|......|..####|..#...|..#...|..#...","┐":"......|......|......|###...|..#...|..#...|..#...","└":"..#...|..#...|..#...|..####|......|......|......","┘":"..#...|..#...|..#...|###...|......|......|......","├":"..#...|..#...|..#...|..####|..#...|..#...|..#...","┤":"..#...|..#...|..#...|###...|..#...|..#...|..#...","┬":"......|......|......|######|..#...|..#...|..#...","┴":"..#...|..#...|..#...|######|......|......|......","┼":"..#...|..#...|..#...|######|..#...|..#...|..#...","╭":"......|......|......|...###|..#...|..#...|..#...","╮":"......|......|......|##....|..#...|..#...|..#...","╰":"..#...|..#...|..#...|...###|......|......|......","╯":"..#...|..#...|..#...|##....|......|......|......","═":"......|......|######|......|######|......|......","║":".#.#..|.#.#..|.#.#..|.#.#..|.#.#..|.#.#..|.#.#..","╔":"......|......|.#####|.#....|.#.###|.#.#..|.#.#..","╗":"......|......|####..|...#..|##.#..|.#.#..|.#.#..","╚":".#.#..|.#.#..|.#.###|.#....|.#####|......|......","╝":".#.#..|.#.#..|##.#..|...#..|####..|......|......","╱":".....#|....#.|...#..|..#...|.#....|#.....|......","╲":"#.....|.#....|..#...|...#..|....#.|.....#|......","█":"######|######|######|######|######|######|######","▀":"######|######|######|######|......|......|......","▄":"......|......|......|######|######|######|######","▌":"###...|###...|###...|###...|###...|###...|###...","▐":"...###|...###|...###|...###|...###|...###|...###","░":"#.....|...#..|#.....|...#..|#.....|...#..|#.....","▒":"#.#.#.|.#.#.#|#.#.#.|.#.#.#|#.#.#.|.#.#.#|#.#.#.","▓":"######|#.#.#.|######|.#.#.#|######|#.#.#.|######","▖":"......|......|......|###...|###...|###...|###...","▗":"......|......|......|...###|...###|...###|...###","▘":"###...|###...|###...|......|......|......|......","▝":"...###|...###|...###|......|......|......|......"});for(const k of ["─","│","┌","┐","└","┘","├","┤","┬","┴","┼","╭","╮","╰","╯","═","║","╔","╗","╚","╝","╱","╲","█","▀","▄","▌","▐","░","▒","▓","▖","▗","▘","▝"])F5.g[k].j=1;
/* Cyrillic (Russian, Ukrainian, Belarusian, Serbian basics) and Greek: their own shapes, and letters drawn like Latin ones copied from those. */
addG(F5,{"Б":"#####|#....|#....|####.|#...#|#...#|####.","Г":"#####|#....|#....|#....|#....|#....|#....","Д":"..##.|.#.#.|.#.#.|.#.#.|.#.#.|#####|#...#","Ж":"#.#.#|#.#.#|.###.|..#..|.###.|#.#.#|#.#.#","З":".###.|#...#|....#|..##.|....#|#...#|.###.","И":"#...#|#...#|#..##|#.#.#|##..#|#...#|#...#","Л":"..###|.#..#|.#..#|.#..#|.#..#|.#..#|#...#","П":"#####|#...#|#...#|#...#|#...#|#...#|#...#","У":"#...#|#...#|#...#|.####|....#|#...#|.###.","Ф":"..#..|.###.|#.#.#|#.#.#|#.#.#|.###.|..#..","Ц":"#..#.|#..#.|#..#.|#..#.|#..#.|#####|....#","Ч":"#...#|#...#|#...#|.####|....#|....#|....#","Ш":"#.#.#|#.#.#|#.#.#|#.#.#|#.#.#|#.#.#|#####","Щ":"#.#.#.|#.#.#.|#.#.#.|#.#.#.|#.#.#.|######|.....#","Ъ":"##...|.#...|.#...|.###.|.#..#|.#..#|.###.","Ы":"#...#|#...#|#...#|##..#|#.#.#|#.#.#|##..#","Ь":"#....|#....|#....|####.|#...#|#...#|####.","Э":".###.|#...#|....#|..###|....#|#...#|.###.","Ю":"#..#.|#.#.#|#.#.#|###.#|#.#.#|#.#.#|#..#.","Я":".####|#...#|#...#|.####|..#.#|.#..#|#...#","Є":".###.|#...#|#....|###..|#....|#...#|.###.","Ґ":"....#|#####|#....|#....|#....|#....|#....","б":"..###|.#...|#....|####.|#...#|#...#|.###.","в":".....|.....|####.|#...#|####.|#...#|####.","г":".....|.....|#####|#....|#....|#....|#....","д":".....|.....|..##.|.#.#.|.#.#.|#####|#...#","ж":".....|.....|#.#.#|.###.|..#..|.###.|#.#.#","з":".....|.....|.###.|....#|..##.|....#|.###.","и":".....|.....|#...#|#..##|#.#.#|##..#|#...#","к":".....|.....|#..#.|#.#..|##...|#.#..|#..#.","л":".....|.....|..###|.#..#|.#..#|.#..#|#...#","м":".....|.....|#...#|##.##|#.#.#|#...#|#...#","н":".....|.....|#...#|#...#|#####|#...#|#...#","п":".....|.....|#####|#...#|#...#|#...#|#...#","т":".....|.....|#####|..#..|..#..|..#..|..#..","ф":"..#..|..#..|.###.|#.#.#|#.#.#|.###.|..#..","ц":".....|.....|#..#.|#..#.|#..#.|#####|....#","ч":".....|.....|#...#|#...#|.####|....#|....#","ш":".....|.....|#.#.#|#.#.#|#.#.#|#.#.#|#####","щ":"......|......|#.#.#.|#.#.#.|#.#.#.|######|.....#","ъ":".....|.....|##...|.#...|.###.|.#..#|.###.","ы":".....|.....|#...#|#...#|##..#|#.#.#|##..#","ь":".....|.....|#....|#....|####.|#...#|####.","э":".....|.....|.###.|#...#|..###|#...#|.###.","ю":".....|.....|#..#.|#.#.#|###.#|#.#.#|#..#.","я":".....|.....|.####|#...#|.####|.#..#|#...#","є":".....|.....|.###.|#....|###..|#....|.###.","ґ":".....|....#|#####|#....|#....|#....|#....","Δ":"..#..|..#..|.#.#.|.#.#.|#...#|#...#|#####","Θ":".###.|#...#|#...#|#####|#...#|#...#|.###.","Λ":"..#..|..#..|.#.#.|.#.#.|#...#|#...#|#...#","Ξ":"#####|.....|.....|.###.|.....|.....|#####","Σ":"#####|#....|.#...|..#..|.#...|#....|#####","Ψ":"#.#.#|#.#.#|#.#.#|.###.|..#..|..#..|..#..","Ω":".###.|#...#|#...#|#...#|.#.#.|.#.#.|##.##","α":".....|.....|.##.#|#..#.|#..#.|#..#.|.##.#","β":".###.|#...#|####.|#...#|####.|#....|#....","γ":".....|.....|#...#|.#.#.|..#..|..#..|..#..","δ":".###.|#....|.###.|#...#|#...#|#...#|.###.","ε":".....|.....|.####|#....|.###.|#....|.####","ζ":"#####|...#.|..#..|.#...|#....|.###.|....#","η":".....|.....|#.##.|##..#|#...#|#...#|....#","θ":"..#..|.#.#.|#...#|#####|#...#|.#.#.|..#..","ι":"...|...|##.|.#.|.#.|.#.|..#","λ":"#....|.#...|.#...|..#..|.#.#.|#...#|#...#","ξ":"#####|.#...|..##.|.#...|#....|.###.|....#","π":".....|.....|#####|.#.#.|.#.#.|.#.#.|.#..#","σ":".....|.....|.####|#..#.|#...#|#...#|.###.","ς":".....|.....|.####|#....|.###.|....#|..##.","τ":".....|.....|#####|..#..|..#..|..#..|...##","υ":".....|.....|#...#|#...#|#...#|#...#|.###.","φ":"..#..|..#..|.###.|#.#.#|#.#.#|.###.|..#..","ψ":".....|.....|#.#.#|#.#.#|#.#.#|.###.|..#..","ω":".....|.....|.#.#.|#...#|#.#.#|#.#.#|.#.#."});
for(const [k,v] of Object.entries({"А":"A","В":"B","Е":"E","К":"K","М":"M","Н":"H","О":"O","Р":"P","С":"C","Т":"T","Х":"X","І":"I","Ј":"J","Ѕ":"S","а":"a","е":"e","о":"o","р":"p","с":"c","у":"y","х":"x","і":"i","ј":"j","ѕ":"s","Α":"A","Β":"B","Γ":"Г","Ε":"E","Ζ":"Z","Η":"H","Ι":"I","Κ":"K","Μ":"M","Ν":"N","Ο":"O","Π":"П","Ρ":"P","Τ":"T","Υ":"Y","Φ":"Ф","Χ":"X","κ":"к","μ":"µ","ν":"v","ο":"o","ρ":"p","χ":"x"}))F5.g[k]={...F5.g[v]};
/* Accented letters for the 5 × 7 face: capitals squashed to 5 rows under (or over) their mark, lowercase with the mark over the x-height. */
Object.assign(F5.g,accents(F5.g,{h:7,xTop:2}));
/* The small face's punctuation, so every printable ASCII character has a glyph there too (its letters stay capitals). */
addG(F3,{"!":"#|#|#|.|#","\"":"#.#|#.#|...|...|...","#":"#.#|###|#.#|###|#.#","$":".##|#..|.#.|..#|##.","&":".#.|#.#|.#.|#.#|.##","(":".#|#.|#.|#.|.#",")":"#.|.#|.#|.#|#.","*":"...|#.#|.#.|#.#|...",";":"..|.#|..|.#|#.","<":"..#|.#.|#..|.#.|..#","=":"...|###|...|###|...",">":"#..|.#.|..#|.#.|#..","?":"##.|..#|.#.|...|.#.","@":".#.|#.#|###|#..|.##","[":"##|#.|#.|#.|##","\\":"#..|#..|.#.|..#|..#","]":"##|.#|.#|.#|##","^":".#.|#.#|...|...|...","`":"#.|.#|..|..|..","{":".##|.#.|#..|.#.|.##","|":"#|#|#|#|#","}":"##.|.#.|..#|.#.|##.","~":"...|.##|##.|...|...","•":"..|##|##|..|.."});
/* ---------- letters for the big face, drawn from the 5 × 7 ones in its style ---------- */
/* A 5 × 7 glyph drawn in the big face's style at h rows: outer columns 2 LEDs wide (inner ones 1), bars 1 row tall,
   rounded corners, the other rows sharing what's left. */
function upscale(rows, h, all = rows) {
  const w = rows[0].length, n0 = all.length;
  // An upright (a column lit in most rows) is 2 LEDs wide wherever it is; so are the outer columns of a wide glyph.
  const upright = i => all.filter(r => r[i] === "#").length >= Math.ceil(n0 * 0.55);
  const wide = i => upright(i) || w <= 1 || (w >= 5 && (i === 0 || i === w - 1) && all.some(r => r[i] === "#" && (i === 0 ? r[1] : r[w - 2]) === "."));
  const isBar = r => /###/.test(r) || (w <= 3 && /##/.test(r) && w > 1);
  const n = rows.length, bars = rows.map(isBar), free = h - bars.filter(Boolean).length, flex = bars.filter(b => !b).length;
  // Share the free rows among the others, the extra ones from the middle out.
  const hts = bars.map(b => (b ? 1 : Math.floor(free / Math.max(1, flex))));
  let extra = h - hts.reduce((a, b) => a + b, 0); const order = [...hts.keys()].filter(i => !bars[i]).sort((a, b) => Math.abs(a - (n - 1) / 2) - Math.abs(b - (n - 1) / 2));
  for (let k = 0; extra > 0 && order.length; k++, extra--) hts[order[k % order.length]]++;
  if (!flex) { /* all bars: stretch the last */ hts[n - 1] += h - hts.reduce((a, b) => a + b, 0); }
  const out = [];
  rows.forEach((r, j) => {
    const cells = [...r].map((c, i) => { const on = c === "#"; if (!wide(i)) return on ? "#" : "."; if (on) return "##";
      // A bar ending next to an empty outer column rounds into it.
      if (bars[j] && r[i + 1] === "#" && !(r[i - 1] === "#")) return ".#"; if (bars[j] && r[i - 1] === "#" && !(r[i + 1] === "#")) return "#."; if (bars[j] && r[i - 1] === "#" && r[i + 1] === "#") return "##"; return ".."; });
    const full = cells.join("");
    for (let k = 0; k < hts[j]; k++) {
      if (k === 0 || !bars[j]) { out.push(full); continue; }
      out.push(full);
    }
  });
  return out.slice(0, h);
}
/* Every 5 × 7 character the big face hasn't drawn by hand (its digits and colon stay), then its accents with 2-LED marks over a gap. */
for(const [ch,g] of Object.entries(F5.g)){
  if(BIG.g[ch]||ch==="\uFFFD"||(/[\u00C0-\u017F\u0218-\u021B\u0370-\u03FF\u0400-\u045F]/.test(ch)&&ch.normalize("NFD").length===2))continue;
  const lower=ch!==ch.toUpperCase()||"ıȷ".includes(ch),rows=lower&&g.rows.length===7?[...upscale(g.rows.slice(0,2),4,g.rows),...upscale(g.rows.slice(2),9,g.rows)]:upscale(g.rows,13);
  BIG.g[ch]={w:rows[0].length,rows,j:g.j};}
Object.assign(BIG.g,accents(BIG.g,{h:13,xTop:4,gap:true,thick:true}));
/* ---------- Space: a heavy, rounded geometric face for words and numbers, 18 rows (capitals 14, x-height 11, descenders) ----------
   Each glyph is strokes (lines and elliptical arcs) 3 LEDs thick, drawn small then scaled, so the round letters are true ellipses. */
const SPACE=(()=>{
  const R = 1.55;
  const L = (x1, y1, x2, y2) => ({ t: "l", x1, y1, x2, y2 });
  const A = (cx, cy, rx, ry, a0, a1) => ({ t: "a", cx, cy, rx, ry, a0, a1 });   // degrees, y down: 270 is the top
  const O = (cx, cy, rx, ry) => A(cx, cy, rx, ry, 0, 360);
  const D = (x, y) => L(x, y, x, y);
  const dSeg = (px, py, s) => { const dx = s.x2 - s.x1, dy = s.y2 - s.y1, l = dx * dx + dy * dy; let t = l ? ((px - s.x1) * dx + (py - s.y1) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - s.x1 - t * dx, py - s.y1 - t * dy); };
  function dArc(px, py, s) { let best = 1e9; const n = Math.max(24, Math.ceil(Math.abs(s.a1 - s.a0) / 4)); let prev = null;
    for (let i = 0; i <= n; i++) { const a = (s.a0 + (s.a1 - s.a0) * i / n) * Math.PI / 180, p = [s.cx + s.rx * Math.cos(a), s.cy + s.ry * Math.sin(a)];
      if (prev) best = Math.min(best, dSeg(px, py, { x1: prev[0], y1: prev[1], x2: p[0], y2: p[1] })); prev = p; } return best; }
  function raster(w, strokes, h = 16) {
    const rows = [];
    for (let j = 0; j < h; j++) { let r = ""; for (let i = 0; i < w; i++) { const px = i + 0.5, py = j + 0.5; r += strokes.some(s => (s.t === "l" ? dSeg(px, py, s) : dArc(px, py, s)) <= (s.r || R)) ? "#" : "."; } rows.push(r); }
    return rows;
  }
  const T = 1.5, B = 10.5, M = 6, X = 4.5;   // cap top, baseline, cap middle, x-height top (stroke centres)
  const G = {
    A: [11, [A(5.5, 5.5, 4, 4, 180, 360), L(1.5, 5.5, 1.5, B), L(9.5, 5.5, 9.5, B), L(1.5, 7.5, 9.5, 7.5)]],
    B: [10, [L(1.5, T, 1.5, B), L(1.5, T, 5.5, T), A(5.5, 3.75, 2.25, 2.25, -90, 90), L(5.5, M, 1.5, M), L(1.5, M, 6, M), A(6, 8.25, 2.25, 2.25, -90, 90), L(6, B, 1.5, B)]],
    C: [11, [A(5.5, M, 4, 4.5, 40, 320)]],
    D: [11, [L(1.5, T, 1.5, B), L(1.5, T, 5, T), A(5, M, 4.5, 4.5, -90, 90), L(5, B, 1.5, B)]],
    E: [9, [L(1.5, T, 1.5, B), L(1.5, T, 7.5, T), L(1.5, M, 6.5, M), L(1.5, B, 7.5, B)]],
    F: [9, [L(1.5, T, 1.5, B), L(1.5, T, 7.5, T), L(1.5, M, 6.5, M)]],
    G: [11, [A(5.5, M, 4, 4.5, 40, 360), L(6, M, 9.5, M), L(9.5, M, 9.5, 8)]],
    H: [11, [L(1.5, T, 1.5, B), L(9.5, T, 9.5, B), L(1.5, M, 9.5, M)]],
    I: [3, [L(1.5, T, 1.5, B)]],
    J: [9, [L(7.5, T, 7.5, 7), A(4.5, 7, 3, 3.5, 0, 180)]],
    K: [10, [L(1.5, T, 1.5, B), L(8.5, T, 1.5, 7), L(4.5, 4.8, 8.5, B)]],
    L: [9, [L(1.5, T, 1.5, B), L(1.5, B, 7.5, B)]],
    M: [14, [L(1.5, T, 1.5, B), L(12.5, T, 12.5, B), L(1.5, T, 7, 8), L(12.5, T, 7, 8)]],
    N: [11, [L(1.5, T, 1.5, B), L(9.5, T, 9.5, B), L(1.5, T, 9.5, B)]],
    O: [12, [O(6, M, 4.5, 4.5)]],
    P: [10, [L(1.5, T, 1.5, B), L(1.5, T, 5.5, T), A(5.5, 4, 2.5, 2.5, -90, 90), L(5.5, 6.5, 1.5, 6.5)]],
    Q: [12, [O(6, M, 4.5, 4.5), L(7, 7.5, 10.5, 11)]],
    R: [10, [L(1.5, T, 1.5, B), L(1.5, T, 5.5, T), A(5.5, 4, 2.5, 2.5, -90, 90), L(5.5, 6.5, 1.5, 6.5), L(5, 6.5, 8.5, B)]],
    S: [10, [A(5, 3.75, 3.5, 2.25, 330, 90), A(5, 8.25, 3.5, 2.25, 270, 510)]],
    T: [11, [L(1.5, T, 9.5, T), L(5.5, T, 5.5, B)]],
    U: [11, [L(1.5, T, 1.5, 6.5), L(9.5, T, 9.5, 6.5), A(5.5, 6.5, 4, 4, 0, 180)]],
    V: [11, [L(1.5, T, 5.5, B), L(9.5, T, 5.5, B)]],
    W: [15, [L(1.5, T, 4.5, B), L(4.5, B, 7.5, 3.5), L(7.5, 3.5, 10.5, B), L(10.5, B, 13.5, T)]],
    X: [11, [L(1.5, T, 9.5, B), L(9.5, T, 1.5, B)]],
    Y: [11, [L(1.5, T, 5.5, M), L(9.5, T, 5.5, M), L(5.5, M, 5.5, B)]],
    Z: [10, [L(1.5, T, 8.5, T), L(8.5, T, 1.5, B), L(1.5, B, 8.5, B)]],
    a: [10, [O(4.5, 7.5, 3, 3), L(7.5, X, 7.5, B)]],
    b: [10, [L(1.5, T, 1.5, B), O(4.5, 7.5, 3, 3)]],
    c: [9, [A(4.5, 7.5, 3, 3, 40, 320)]],
    d: [10, [L(7.5, T, 7.5, B), O(4.5, 7.5, 3, 3)]],
    e: [10, [A(4.5, 7.5, 3, 3, 360, 45), L(1.5, 7.5, 7.5, 7.5)]],
    f: [7, [L(2.5, 3.5, 2.5, B), A(4.5, 3.5, 2, 2, 180, 300), L(0.5, X, 5, X)]],
    g: [10, [O(4.5, 7.5, 3, 3), L(7.5, X, 7.5, 12.5), A(4.5, 12.5, 3, 2, 0, 160)]],
    h: [10, [L(1.5, T, 1.5, B), A(4.5, 7.5, 3, 3, 180, 360), L(7.5, 7.5, 7.5, B)]],
    i: [3, [L(1.5, X, 1.5, B), D(1.5, T)]],
    j: [5, [L(3.5, X, 3.5, 12.5), A(1.5, 12.5, 2, 2, 0, 120), D(3.5, T)]],
    k: [9, [L(1.5, T, 1.5, B), L(7, X, 1.5, 8.5), L(3.5, 7, 7.5, B)]],
    l: [3, [L(1.5, T, 1.5, B)]],
    m: [15, [L(1.5, X, 1.5, B), A(4.5, 7.5, 3, 3, 180, 360), L(7.5, 7.5, 7.5, B), A(10.5, 7.5, 3, 3, 180, 360), L(13.5, 7.5, 13.5, B)]],
    n: [10, [L(1.5, X, 1.5, B), A(4.5, 7.5, 3, 3, 180, 360), L(7.5, 7.5, 7.5, B)]],
    o: [10, [O(4.5, 7.5, 3, 3)]],
    p: [10, [L(1.5, X, 1.5, 14.5), O(4.5, 7.5, 3, 3)]],
    q: [10, [L(7.5, X, 7.5, 14.5), O(4.5, 7.5, 3, 3)]],
    r: [8, [L(1.5, X, 1.5, B), A(4.5, 7.5, 3, 3, 180, 290)]],
    s: [8, [A(4, 6, 2.5, 1.5, 330, 90), A(4, 9, 2.5, 1.5, 270, 510)]],
    t: [8, [L(2.5, 2.5, 2.5, 8), A(4.5, 8, 2, 2.5, 180, 90), L(0.5, X, 5.5, X)]],
    u: [10, [L(1.5, X, 1.5, 7.5), A(4.5, 7.5, 3, 3, 0, 180), L(7.5, X, 7.5, B)]],
    v: [10, [L(1.5, X, 4.5, B), L(7.5, X, 4.5, B)]],
    w: [14, [L(1.5, X, 4, B), L(4, B, 6.5, 6), L(6.5, 6, 9, B), L(9, B, 11.5, X)]],
    x: [9, [L(1.5, X, 7.5, B), L(7.5, X, 1.5, B)]],
    y: [10, [L(1.5, X, 1.5, 7.5), A(4.5, 7.5, 3, 3, 0, 180), L(7.5, X, 7.5, 12.5), A(4.5, 12.5, 3, 2, 0, 160)]],
    z: [9, [L(1.5, X, 7.5, X), L(7.5, X, 1.5, B), L(1.5, B, 7.5, B)]],
    "0": [10, [O(5, M, 3.5, 4.5)]],
    "1": [8, [L(5, T, 5, B), L(5, T, 2, 3.5)]],
    "2": [10, [A(4.5, 4.25, 3.5, 2.75, 190, 380), L(7.8, 5.3, 1.5, B), L(1.5, B, 8, B)]],
    "3": [10, [A(4.5, 3.75, 3.5, 2.25, 200, 450), A(4.5, 8.25, 3.5, 2.25, 270, 520)]],
    "4": [10, [L(6.5, T, 1.5, 7.5), L(1.5, 7.5, 8.5, 7.5), L(6.5, T, 6.5, B)]],
    "5": [10, [L(2, T, 7.5, T), L(2, T, 2, 5.5), A(4.6, 7.8, 3.4, 2.7, 215, 520)]],
    "6": [10, [O(4.75, 7.75, 3.25, 2.75), A(6.5, 6.5, 5, 5, 180, 285)]],
    "7": [10, [L(1.5, T, 8.5, T), L(8.5, T, 3.5, B)]],
    "8": [10, [O(4.75, 3.75, 2.75, 2.25), O(4.75, 8.25, 3.25, 2.25)]],
    "9": [10, [O(4.75, 4.25, 3.25, 2.75), A(3, 5.5, 5, 5, 0, 105)]],
    "!": [3, [L(1.5, T, 1.5, 7), D(1.5, B)]],
    '"': [6, [L(1.5, T, 1.5, 3), L(4.5, T, 4.5, 3)]],
    "'": [3, [L(1.5, T, 1.5, 3)]],
    ",": [4, [L(2, B, 1, 12.5)]],
    ".": [3, [D(1.5, B)]],
    ":": [3, [D(1.5, 5), D(1.5, B)]],
    ";": [4, [D(2, 5), L(2, B, 1, 12.5)]],
    "?": [9, [A(4.5, 4, 3, 2.5, 190, 450), L(4.5, 6.5, 4.5, 7.5), D(4.5, B)]],
    "-": [8, [L(1.5, 6.5, 6.5, 6.5)]],
    "+": [9, [L(1.5, 6.5, 7.5, 6.5), L(4.5, 3.5, 4.5, 9.5)]],
    "=": [9, [L(1.5, 5, 7.5, 5), L(1.5, 8.5, 7.5, 8.5)]],
    "/": [8, [L(6.5, T, 1.5, B)]],
    "\\": [8, [L(1.5, T, 6.5, B)]],
    "(": [5, [A(4.5, M, 3, 5, 120, 240)]],
    ")": [5, [A(0.5, M, 3, 5, -60, 60)]],
    "[": [5, [L(1.5, T, 1.5, B), L(1.5, T, 3.5, T), L(1.5, B, 3.5, B)]],
    "]": [5, [L(3.5, T, 3.5, B), L(1.5, T, 3.5, T), L(1.5, B, 3.5, B)]],
    "*": [9, [L(4.5, T, 4.5, 6.5), L(1.5, 2.5, 7.5, 5.5), L(7.5, 2.5, 1.5, 5.5)]],
    "_": [9, [L(1.5, 12.5, 7.5, 12.5)]],
    "%": [12, [O(3, 3.5, 1.5, 2), O(9, 8.5, 1.5, 2), L(9.5, T, 2.5, B)]],
    "#": [11, [L(4, T, 3, B), L(8, T, 7, B), L(1.5, 4.5, 9.5, 4.5), L(1.5, 8, 9.5, 8)]],
    "&": [11, [A(4.5, 3.5, 2, 2, 120, 400), L(5.5, 5.5, 9.5, B), A(4.5, 8.5, 3, 2, 210, 420)]],
    "@": [12, [O(6, 6.5, 4.5, 4.5), O(6, 6.5, 1.5, 1.5)]],
    "$": [10, [A(5, 3.75, 3.5, 2.25, 330, 90), A(5, 8.25, 3.5, 2.25, 270, 510), L(5, 0, 5, 12)]],
    "<": [8, [L(6.5, 3, 1.5, 6.5), L(1.5, 6.5, 6.5, 10)]],
    ">": [8, [L(1.5, 3, 6.5, 6.5), L(6.5, 6.5, 1.5, 10)]],
    "^": [8, [L(1.5, 4, 4, T), L(4, T, 6.5, 4)]],
    "`": [4, [L(1, T, 2.5, 2.5)]],
    "{": [6, [A(4.5, 3.5, 2, 2, 180, 270), L(2.5, 3.5, 2.5, 5), L(2.5, 5, 1, 6.5), L(1, 6.5, 2.5, 8), L(2.5, 8, 2.5, 9), A(4.5, 9, 2, 2, 90, 180)]],
    "|": [3, [L(1.5, 0, 1.5, 14)]],
    "}": [6, [A(1.5, 3.5, 2, 2, 270, 360), L(3.5, 3.5, 3.5, 5), L(3.5, 5, 5, 6.5), L(5, 6.5, 3.5, 8), L(3.5, 8, 3.5, 9), A(1.5, 9, 2, 2, 0, 90)]],
    "~": [10, [A(3, 6.5, 1.5, 1, 180, 360), A(6, 6.5, 1.5, 1, 0, 180)]],
    "°": [6, [O(3, 3, 1.5, 1.5)]],
  };
  /* Drawn small, then scaled to the face's real size: capitals 14 rows (top 1.5 to baseline 12.5), lowercase 11 (4.5 to 12.5),
     descenders to 16.5, everything 15% wider; stroke centres snap to half-LEDs so every stroke is exactly 3 wide. */
  const snap = v => Math.round(v * 2) / 2, H = 18;
  function scale(ch, w, st) {
    const lower = ch !== ch.toUpperCase() || /[,;_jgpqy]/.test(ch);
    const Y = y => snap(lower ? (y <= 4.5 ? y : y <= 10.5 ? 4.5 + (y - 4.5) * 8 / 6 : y + 2) : (y <= 10.5 ? 1.5 + (y - 1.5) * 11 / 9 : y + 2)), ky = lower ? 8 / 6 : 11 / 9;
    const Xs = x => snap(1.5 + (x - 1.5) * 1.15);
    return [Math.ceil(w * 1.15), st.map(o => o.t === "l" ? { ...o, x1: Xs(o.x1), y1: Y(o.y1), x2: Xs(o.x2), y2: Y(o.y2) } : { ...o, cx: Xs(o.cx), cy: Y(o.cy), rx: o.rx * 1.15, ry: o.ry * ky })];
  }
  /* Drawn at full size: the ones scaling packs too tight (three strokes need a row between each). */
  const FULL = {
    // e's bar is 2 rows, so both its eyes stay open.
    e: [12, [A(5.5, 8.5, 4.5, 4, 360, 40), { ...L(1.5, 8, 10, 8), r: 1.05 }]],
    s: [11, [A(5.5, 6.5, 4, 2, 330, 90), A(5.5, 10.5, 4, 2, 270, 510)]],
    "=": [11, [L(1.5, 5.5, 9.5, 5.5), L(1.5, 9.5, 9.5, 9.5)]],
    G: [13, [A(6.5, 7, 5, 5.5, 40, 360), L(7.5, 7.5, 11.5, 7.5), L(11.5, 7.5, 11.5, 10)]],
    "@": [14, [A(7, 7.5, 5.5, 5.5, 20, 340), { ...O(6.5, 7.5, 2, 2), r: 1.05 }, { ...L(9, 5, 9, 10.5), r: 1.05 }]],
    "#": [13, [L(4.5, T, 3.5, 12.5), L(9.5, T, 8.5, 12.5), L(1.5, 4.5, 11.5, 4.5), L(1.5, 9.5, 11.5, 9.5)]],
    "*": [11, [L(5.5, 2.5, 5.5, 10.5), L(1.5, 4.5, 9.5, 8.5), L(9.5, 4.5, 1.5, 8.5)]],
    "%": [13, [L(10.5, T, 2.5, 12.5), D(2.5, 2.5), D(10.5, 11.5)]],
    "$": [11, [A(5.5, 4.25, 4, 2.75, 330, 90), A(5.5, 9.75, 4, 2.75, 270, 510), L(5.5, 0, 5.5, 1.5), L(5.5, 12.5, 5.5, 15)]],
    "&": [13, [A(5, 4, 2.5, 2.5, 60, 400), L(5, 6.5, 11, 12.5), A(5, 9.5, 3.5, 3, 140, 400)]],
  };
  const out = { " ": Array(H).fill(".....") };
  for (const [ch, [w0, st0]] of Object.entries(G)) { const [w, st] = FULL[ch] || scale(ch, w0, st0); out[ch] = raster(w, st, H); }
  const F={h:H,g:{}};for(const [k,rows] of Object.entries(out))F.g[k]={w:rows[0].length,rows};
  Object.assign(F.g,accents(F.g,{h:H,xTop:3,base:14,gap:true,thick:true}));
  // Symbols and box drawing: the 5 × 7 ones at double size, capital height, joining where they join.
  for(const k of ["★","☆","♥","♡","♠","♣","♦","♢","●","○","■","□","▲","▼","◀","▶","←","→","↑","↓","↔","↕","♪","♫","✓","✗","☀","☁","☂","☺","⌂","♀","♂","∞","⚡","─","│","┌","┐","└","┘","├","┤","┬","┴","┼","╭","╮","╰","╯","═","║","╔","╗","╚","╝","╱","╲","█","▀","▄","▌","▐","░","▒","▓","▖","▗","▘","▝"]){const g=F5.g[k];if(!g||F.g[k])continue;const rows=[];for(const r of g.rows){const d=[...r].map(c=>c+c).join("");rows.push(d,d);}while(rows.length<H)rows.push(".".repeat(g.w*2));F.g[k]={w:g.w*2,rows,j:g.j};}
  F.g["\uFFFD"]={w:9,rows:[".........","#########",...Array(12).fill("#.......#"),"#########",".........",".........","........."]};
  return F;})();
/* ---------- Retro64: an 8 × 8 face in the style of the '80s home computers ----------
   Drawn by eye for PixelBar, not copied from any ROM: 2-LED uprights and 1-LED bars, 7 rows and a descender row. */
const R64_CELLS={"0":"..####..|.##..##.|.##.###.|.###.##.|.##..##.|.##..##.|..####..|........","1":"...##...|..###...|...##...|...##...|...##...|...##...|.######.|........","2":"..####..|.##..##.|.....##.|....##..|..##....|.##.....|.######.|........","3":"..####..|.##..##.|.....##.|...###..|.....##.|.##..##.|..####..|........","4":".....##.|....###.|...####.|.##..##.|.#######|.....##.|.....##.|........","5":".######.|.##.....|.#####..|.....##.|.....##.|.##..##.|..####..|........","6":"..####..|.##..##.|.##.....|.#####..|.##..##.|.##..##.|..####..|........","7":".######.|.##..##.|....##..|...##...|...##...|...##...|...##...|........","8":"..####..|.##..##.|.##..##.|..####..|.##..##.|.##..##.|..####..|........","9":"..####..|.##..##.|.##..##.|..#####.|.....##.|.##..##.|..####..|........","A":"...##...|..####..|.##..##.|.######.|.##..##.|.##..##.|.##..##.|........","B":".#####..|.##..##.|.##..##.|.#####..|.##..##.|.##..##.|.#####..|........","C":"..####..|.##..##.|.##.....|.##.....|.##.....|.##..##.|..####..|........","D":".####...|.##.##..|.##..##.|.##..##.|.##..##.|.##.##..|.####...|........","E":".######.|.##.....|.##.....|.####...|.##.....|.##.....|.######.|........","F":".######.|.##.....|.##.....|.####...|.##.....|.##.....|.##.....|........","G":"..####..|.##..##.|.##.....|.##.###.|.##..##.|.##..##.|..####..|........","H":".##..##.|.##..##.|.##..##.|.######.|.##..##.|.##..##.|.##..##.|........","I":"..####..|...##...|...##...|...##...|...##...|...##...|..####..|........","J":"...####.|....##..|....##..|....##..|....##..|.##.##..|..###...|........","K":".##..##.|.##.##..|.####...|.###....|.####...|.##.##..|.##..##.|........","L":".##.....|.##.....|.##.....|.##.....|.##.....|.##.....|.######.|........","M":".##...##|.###.###|.#######|.##.#.##|.##...##|.##...##|.##...##|........","N":".##..##.|.###.##.|.######.|.######.|.##.###.|.##..##.|.##..##.|........","O":"..####..|.##..##.|.##..##.|.##..##.|.##..##.|.##..##.|..####..|........","P":".#####..|.##..##.|.##..##.|.#####..|.##.....|.##.....|.##.....|........","Q":"..####..|.##..##.|.##..##.|.##..##.|.##..##.|..####..|....###.|........","R":".#####..|.##..##.|.##..##.|.#####..|.####...|.##.##..|.##..##.|........","S":"..####..|.##..##.|.##.....|..####..|.....##.|.##..##.|..####..|........","T":".######.|...##...|...##...|...##...|...##...|...##...|...##...|........","U":".##..##.|.##..##.|.##..##.|.##..##.|.##..##.|.##..##.|..####..|........","V":".##..##.|.##..##.|.##..##.|.##..##.|.##..##.|..####..|...##...|........","W":".##...##|.##...##|.##...##|.##.#.##|.#######|.###.###|.##...##|........","X":".##..##.|.##..##.|..####..|...##...|..####..|.##..##.|.##..##.|........","Y":".##..##.|.##..##.|.##..##.|..####..|...##...|...##...|...##...|........","Z":".######.|.....##.|....##..|...##...|..##....|.##.....|.######.|........","a":"........|........|..####..|.....##.|..#####.|.##..##.|..#####.|........","b":"........|.##.....|.##.....|.#####..|.##..##.|.##..##.|.#####..|........","c":"........|........|..#####.|.##.....|.##.....|.##.....|..#####.|........","d":"........|.....##.|.....##.|..#####.|.##..##.|.##..##.|..#####.|........","e":"........|........|..####..|.##..##.|.######.|.##.....|..####..|........","f":"........|....###.|...##...|..#####.|...##...|...##...|...##...|........","g":"........|........|..#####.|.##..##.|.##..##.|..#####.|.....##.|.#####..","h":"........|.##.....|.##.....|.#####..|.##..##.|.##..##.|.##..##.|........","i":"........|...##...|........|..###...|...##...|...##...|..####..|........","j":"........|.....##.|........|.....##.|.....##.|.....##.|.....##.|..####..","k":"........|.##.....|.##.....|.##.##..|.####...|.##.##..|.##..##.|........","l":"........|..###...|...##...|...##...|...##...|...##...|..####..|........","m":"........|........|.##..##.|.#######|.#######|.##.#.##|.##...##|........","n":"........|........|.#####..|.##..##.|.##..##.|.##..##.|.##..##.|........","o":"........|........|..####..|.##..##.|.##..##.|.##..##.|..####..|........","p":"........|........|.#####..|.##..##.|.##..##.|.#####..|.##.....|.##.....","q":"........|........|..#####.|.##..##.|.##..##.|..#####.|.....##.|.....##.","r":"........|........|.#####..|.##..##.|.##.....|.##.....|.##.....|........","s":"........|........|..#####.|.##.....|..####..|.....##.|.#####..|........","t":"........|...##...|.######.|...##...|...##...|...##...|....###.|........","u":"........|........|.##..##.|.##..##.|.##..##.|.##..##.|..#####.|........","v":"........|........|.##..##.|.##..##.|.##..##.|..####..|...##...|........","w":"........|........|.##...##|.##.#.##|.#######|..#####.|..##.##.|........","x":"........|........|.##..##.|..####..|...##...|..####..|.##..##.|........","y":"........|........|.##..##.|.##..##.|.##..##.|..#####.|....##..|.####...","z":"........|........|.######.|....##..|...##...|..##....|.######.|........","!":"...##...|...##...|...##...|...##...|........|........|...##...|........","\"":".##..##.|.##..##.|.##..##.|........|........|........|........|........","#":".##..##.|.##..##.|.#######|.##..##.|.#######|.##..##.|.##..##.|........","$":"...##...|..#####.|.##.....|..####..|.....##.|.#####..|...##...|........","%":".##...#.|.##..##.|....##..|...##...|..##....|.##..##.|.#...##.|........","&":"..####..|.##..##.|..####..|..###...|.##..###|.##..##.|..#####.|........","'":".....##.|....##..|...##...|........|........|........|........|........","(":"....##..|...##...|..##....|..##....|..##....|...##...|....##..|........",")":"..##....|...##...|....##..|....##..|....##..|...##...|..##....|........","*":"........|.##..##.|..####..|.#######|..####..|.##..##.|........|........","+":"........|...##...|...##...|.######.|...##...|...##...|........|........",",":"........|........|........|........|........|...##...|...##...|..##....","-":"........|........|........|.######.|........|........|........|........",".":"........|........|........|........|........|...##...|...##...|........","/":"........|......##|.....##.|....##..|...##...|..##....|.##.....|........",":":"........|........|...##...|........|........|...##...|........|........",";":"........|........|...##...|........|........|...##...|...##...|..##....","<":"....###.|...###..|..###...|.###....|..###...|...###..|....###.|........","=":"........|........|.######.|........|.######.|........|........|........",">":".###....|..###...|...###..|....###.|...###..|..###...|.###....|........","?":"..####..|.##..##.|.....##.|....##..|...##...|........|...##...|........","@":"..####..|.##..##.|.##.###.|.##.###.|.##.....|.##...#.|..####..|........","[":"..####..|..##....|..##....|..##....|..##....|..##....|..####..|........","\\":"........|.##.....|..##....|...##...|....##..|.....##.|......##|........","]":"..####..|....##..|....##..|....##..|....##..|....##..|..####..|........","^":"...##...|..####..|.##..##.|........|........|........|........|........","_":"........|........|........|........|........|........|........|########","`":"..##....|...##...|........|........|........|........|........|........","{":"....###.|...##...|...##...|.###....|...##...|...##...|....###.|........","|":"...##...|...##...|...##...|...##...|...##...|...##...|...##...|...##...","}":".###....|...##...|...##...|....###.|...##...|...##...|.###....|........","~":"........|........|.###..##|##.####.|........|........|........|........","°":"..###...|.##.##..|..###...|........|........|........|........|........","•":"........|........|...##...|..####..|..####..|...##...|........|........","♥":".##..##.|########|########|########|.######.|..####..|...##...|........","♠":"...##...|..####..|.######.|########|########|...##...|..####..|........","♣":"...##...|..####..|..####..|##.##.##|########|##.##.##|...##...|..####..","♦":"...##...|..####..|.######.|########|.######.|..####..|...##...|........","●":"........|..####..|.######.|.######.|.######.|..####..|........|........","■":"........|.######.|.######.|.######.|.######.|.######.|........|........","★":"...##...|...##...|########|.######.|..####..|.##..##.|##....##|........","↑":"...##...|..####..|.######.|...##...|...##...|...##...|...##...|........","↓":"...##...|...##...|...##...|...##...|.######.|..####..|...##...|........","←":"........|..##....|.##.....|########|.##.....|..##....|........|........","→":"........|....##..|.....##.|########|.....##.|....##..|........|........"};
const R64_BOX={"─":"........|........|........|########|########|........|........|........","│":"...##...|...##...|...##...|...##...|...##...|...##...|...##...|...##...","┌":"........|........|........|...#####|...#####|...##...|...##...|...##...","┐":"........|........|........|#####...|#####...|...##...|...##...|...##...","└":"...##...|...##...|...##...|...#####|...#####|........|........|........","┘":"...##...|...##...|...##...|#####...|#####...|........|........|........","├":"...##...|...##...|...##...|...#####|...#####|...##...|...##...|...##...","┤":"...##...|...##...|...##...|#####...|#####...|...##...|...##...|...##...","┬":"........|........|........|########|########|...##...|...##...|...##...","┴":"...##...|...##...|...##...|########|########|........|........|........","┼":"...##...|...##...|...##...|########|########|...##...|...##...|...##...","█":"########|########|########|########|########|########|########|########","▀":"########|########|########|########|........|........|........|........","▄":"........|........|........|........|########|########|########|########","▌":"####....|####....|####....|####....|####....|####....|####....|####....","▐":"....####|....####|....####|....####|....####|....####|....####|....####","░":"#...#...|..#...#.|#...#...|..#...#.|#...#...|..#...#.|#...#...|..#...#.","▒":"#.#.#.#.|.#.#.#.#|#.#.#.#.|.#.#.#.#|#.#.#.#.|.#.#.#.#|#.#.#.#.|.#.#.#.#","▓":"###.###.|.#.#.#.#|###.###.|.#.#.#.#|###.###.|.#.#.#.#|###.###.|.#.#.#.#"};
function retroFace(){
  const F={h:8,g:{}};
  // A row's cell is 8 columns; column 0 is the gap before it.
  for(const [k,v] of Object.entries(R64_CELLS)){const rows=v.split("|").map(r=>r.slice(1)),w=Math.max(...rows.map(r=>r.length));F.g[k]={w,rows:rows.map(r=>r.padEnd(w,"."))};}
  for(const [k,v] of Object.entries(R64_BOX))F.g[k]={w:8,rows:v.split("|"),j:1};
  F.g[" "]={w:6,rows:Array(8).fill("......")};
  // The other symbols and signs from the 5 × 7 face, with a row under them.
  for(const [k,g] of Object.entries(F5.g))if(!F.g[k]&&!/[A-Za-z0-9\u00C0-\u024F\uFF61-\uFF9F]/.test(k))F.g[k]={w:g.w,rows:[...g.rows,".".repeat(g.w)],j:g.j};
  Object.assign(F.g,accents(F.g,{h:8,xTop:2,base:7,thick:true}));
  F.g["\uFFFD"]={w:6,rows:["######","#....#","#....#","#....#","#....#","#....#","######","......"]};
  return F;}
const R64=retroFace();
/* ---------- Alagard, Celtic Bit and Comicoro: pixel fonts by other people, read from their own pixel grids ----------
   Alagard by Hewett Tsoi (dafont.com/alagard.font): free to use, "give credit if used". 15 rows, 12 above the baseline.
   Celtic Bit by Mirz (scriptmonkeys.us): personal and commercial use inside a project, credit kept, name unchanged. 11 rows, 8 above the baseline.
   Comicoro by jeti (dafont.com/comicoro.font): CC BY 4.0 (creativecommons.org/licenses/by/4.0). 10 rows, 8 above the baseline. */
function gridFace(cells,h,base,xTop){const F={h,g:{}};for(const [k,v] of Object.entries(cells)){const rows=v.split("|");F.g[k]={w:rows[0].length,rows};}
  Object.assign(F.g,accents(F.g,{h,xTop,base,thick:h>12}));
  // Symbols the face hasn't got, from the 5 × 7 one, sitting on its baseline.
  for(const [k,g] of Object.entries(F5.g))if(!F.g[k]&&!/[A-Za-z0-9\u00C0-\u024F\u0370-\u04FF\uFF61-\uFF9F]/.test(k)){const top=Math.max(0,base-7);F.g[k]={w:g.w,rows:[...Array(top).fill(".".repeat(g.w)),...g.rows,...Array(Math.max(0,h-top-7)).fill(".".repeat(g.w))].slice(0,h),j:g.j};}
  F.g["\uFFFD"]={w:5,rows:Array.from({length:h},(_,j)=>j<base-6||j>=base?".....":j===base-6||j===base-1?"#####":"#...#")};
  return F;}
const ALAGARD=gridFace({"0":".......|..###..|.#.###.|##..###|##...##|##..###|##.#.##|###..##|##...##|###..##|.###.#.|..###..|.......|.......|.......","1":"....|..#.|.##.|###.|.##.|.##.|.##.|.##.|.##.|.##.|.##.|####|....|....|....","2":"......|.####.|##.###|#...##|....##|....#.|...#..|..#...|.#....|##....|######|#####.|......|......|......","3":".......|..###..|.#####.|#...###|.....##|.....#.|...###.|....###|.....##|##...##|###..#.|.####..|.......|.......|.......","4":".........|.....##..|....###..|...#.##..|..#..##..|.#...##..|##...##..|#########|########.|.....##..|.....##..|.....##..|.........|.........|.........","5":".......|#######|##.....|##.....|##.##..|######.|##..###|#....##|.....##|##...##|###..#.|.####..|.......|.......|.......","6":"........|...####.|..#..###|.#....##|##......|##.###..|###.###.|##...###|##....##|###...##|.###..#.|..####..|........|........|........","7":"........|..######|.#######|#.....#.|.....#..|....#...|...##...|...##...|...##...|...##...|...###..|...##...|........|........|........","8":"........|..#####.|.#...###|##....##|###...##|.###..#.|..####..|.#..###.|##...###|###...##|.###..#.|..####..|........|........|........","9":"........|..####..|.#..###.|##...###|##....##|###...##|.###..##|..######|......##|##....#.|###..#..|.####...|........|........|........"," ":"....|....|....|....|....|....|....|....|....|....|....|....|....|....|....","!":"....|..#.|.##.|###.|.##.|.##.|.##.|.###|.##.|....|.###|.##.|....|....|....","\"":".......|.##..##|###.###|.##..##|.##..##|.#...#.|.......|.......|.......|.......|.......|.......|.......|.......|.......","#":"..........|..........|...#...#..|..##..##..|..##..##..|##########|..##..##..|..##..##..|##########|..##..##..|..##..##..|..#...#...|..........|..........|..........","$":"....#...|..#####.|.#..####|##..#.##|##..#...|######..|.######.|...#.###|...#..##|##.#..##|####..#.|.#####..|...#....|...#....|........","%":"............|..##........|.#.##.....#.|##..##...#..|##..##..#...|.##.#..#....|..##..#.....|.....#..##..|....#..#.##.|...#..##..##|..#...##..##|.#.....##.#.|........##..|............|............","&":"...........|.####......|##..##.....|##...##....|##...##....|.##..#..###|..###...##.|.####...#..|##..##.#...|##...##....|##...###..#|.####..###.|...........|...........|...........","'":"...|.##|###|.##|.##|.#.|...|...|...|...|...|...|...|...|...","(":"......|...##.|..####|.##.##|##....|##....|##....|##....|##....|##....|##....|##....|###...|.####.|..##..",")":"......|..#...|.###..|#.###.|...###|....##|....##|....##|....##|....##|....##|....##|....#.|...#..|..#...","*":"......|..#...|..##..|######|.###..|##.##.|#...#.|......|......|......|......|......|......|......|......","+":"..........|..........|.....#....|....##....|...###....|....##....|....##....|##########|....##....|....##....|....###...|....##....|..........|..........|..........",",":"...|...|...|...|...|...|...|...|...|...|.##|###|.##|.#.|#..","-":"......|......|......|......|......|......|......|......|######|......|......|......|......|......|......",".":"..|..|..|..|..|..|..|..|..|..|##|##|..|..|..","/":"..........|..........|.........#|........#.|.......#..|......#...|.....#....|....#.....|...#......|..#.......|.#........|#.........|..........|..........|..........",":":"..|..|..|..|..|##|##|..|..|..|##|##|..|..|..",";":"...|...|...|...|...|.##|.##|...|...|...|.##|###|.##|.#.|#..","<":".....|.....|.....|....#|...#.|..#..|.#...|#....|##...|.##..|..##.|...##|.....|.....|.....","=":".......|.......|.......|.......|.......|.......|#######|.......|.......|#######|.......|.......|.......|.......|.......",">":".....|.....|.....|##...|.##..|..##.|...##|....#|...#.|..#..|.#...|#....|.....|.....|.....","?":".......|.......|..###..|.#.###.|#...###|.....##|.....#.|....#..|...#...|.......|..##...|..##...|.......|.......|.......","@":"............|............|...#######..|..#.....###.|.#...##..###|##..####..##|##.#...##.##|##...####.##|##..#..##.##|##.##..##.#.|##.##..###..|##..#####...|###........#|.###......#.|..########..","A":"........|...##...|..####..|.#..###.|##...##.|##...##.|##..###.|##.#.##.|###..##.|##...##.|###..###|##...##.|........|........|........","B":"........|..####..|.##.###.|###..###|.##...#.|.##..#..|.##.###.|.##..###|.##...##|.##...##|###...#.|.#####..|........|........|........","C":"........|...###.#|..#.####|.#...###|##......|##......|##......|##......|##......|###....#|.###..#.|..####..|........|........|........","D":".........|..#####..|.##..###.|###...###|.##....##|.##....##|.##....##|.##....##|.##....#.|.##...#..|.##..#...|.####....|.........|.........|.........","E":".........|..#.###.#|.###.####|###...##.|.##......|.##......|.#####...|.##......|.##......|.##......|.###...#.|..#####..|.........|.........|.........","F":".........|..#.###.#|.###.####|###...##.|.##......|.##......|.#####...|.##......|.##......|.##......|.###.....|.##......|.........|.........|.........","G":"........|...####.|..#..###|.#....##|##......|##......|##......|##...###|##....##|###...##|.###..#.|..####..|........|........|........","H":".........|..#....#.|.##...##.|###...##.|.##...##.|.##...##.|.#######.|.##...##.|.##...##.|.##...##.|.##...###|.##...##.|.........|.........|.........","I":"....|..#.|.##.|###.|.##.|.##.|.##.|.##.|.##.|.##.|.###|.##.|....|....|....","J":"...|..#|.##|###|.##|.##|.##|.##|.##|.##|.##|.##|.#.|#..|...","K":".........|..#....#.|.##...##.|###...##.|.##..##..|.##.##...|.######..|.###.###.|.##...##.|.##...##.|.###..###|.##...##.|.........|.........|.........","L":".......|..#....|.##....|###....|.##....|.##....|.##....|.##....|.##....|.##....|.##...#|.#####.|.......|.......|.......","M":"............|..#..##..##.|.##.###.###.|####.###.##.|.##..##..##.|.##..##..##.|.##..##..##.|.##..##..##.|.##..##..##.|.##..##..##.|.###.###.###|.##..##..##.|............|............|............","N":"..........|..#.....#.|.##....##.|###....##.|.###...##.|.##.#..##.|.##..#.##.|.##...###.|.##....##.|.##....##.|.###...###|.##....##.|..........|..........|..........","O":"........|...###..|..#.###.|.#...###|##....##|##....##|##....##|##....##|##....##|###...#.|.###.#..|..###...|........|........|........","P":"........|..#.###.|.###.###|###...##|.##...##|.##...##|.##...#.|.#####..|.####...|.##.....|.###....|.##.....|........|........|........","Q":".........|...###...|..#.###..|.#...###.|##....##.|##....##.|##....##.|##....##.|##....##.|###...#..|.###.#...|..#####.#|.....###.|......#..|.........","R":".........|..#.###..|.###.###.|###...##.|.##...#..|.##..##..|.##.####.|.###..##.|.##...##.|.##...##.|.###..###|.##...##.|.........|.........|.........","S":"........|...###..|..#.####|.#...##.|##......|######..|.######.|.....###|......##|##....#.|###..#..|.####...|........|........|........","T":".........|..#####.#|.#..#.###|#..##..##|...##....|...##....|...##....|...##....|...##....|...##...#|...###.#.|....###..|.........|.........|.........","U":"..........|..#.....#.|.##....##.|###...###.|.##....##.|.##....##.|.##....##.|.##....##.|.##....##.|.##....##.|.###...###|..#######.|..........|..........|..........","V":".........|..#.....#|.##....##|###....##|.##....##|.##....##|.##....##|.##....##|.###...##|..###..#.|...####..|....##...|.........|.........|.........","W":"...........|..#.......#|.##......##|###......##|.##...#..##|.##..##..##|.##..##..##|.##..##..##|.##..##..##|.###.##..#.|..#####.#..|...#.###...|...........|...........|...........","X":".........|..#....#.|.##...##.|###...##.|.###..##.|..###.#..|...###...|..#.###..|.##..###.|.##...##.|###...###|.##...##.|.........|.........|.........","Y":".........|..#.....#|.##....##|###....##|.##....##|.###...#.|..###.#..|...###...|....##...|....##...|....###..|....##...|.........|.........|.........","Z":"........|..#####.|.#######|#.....#.|.....#..|....#...|.#####..|..#.....|.#......|##.....#|#######.|.#####..|........|........|........","[":"....|####|##..|##..|##..|##..|##..|##..|##..|##..|##..|##..|##..|####|....","\\":"..........|..........|##........|###.......|.###......|..###.....|...###....|....###...|.....###..|......###.|.......###|........##|..........|..........|..........","]":"....|####|..##|..##|..##|..##|..##|..##|..##|..##|..##|..##|..##|####|....","^":"........|....#...|...###..|..#.###.|.#...###|#.....##|........|........|........|........|........|........|........|........|........","_":"..........|..........|..........|..........|..........|..........|..........|..........|..........|..........|..........|##########|..........|..........|..........","`":"...|##.|###|.##|...|...|...|...|...|...|...|...|...|...|...","a":".......|.......|.......|.......|..###..|.#####.|#...##.|..####.|.#..##.|##..##.|##..###|.#####.|.......|.......|.......","b":"........|..#.....|.##.....|###.....|.##..##.|.##.####|.###..##|.##...##|.##...##|.##...##|.##...#.|.#####..|........|........|........","c":".......|.......|.......|.......|..###.#|.#..###|##...##|##.....|##.....|###....|.###..#|..####.|.......|.......|.......","d":"........|.....##.|....###.|.....##.|.###.##.|##.####.|##..###.|##...##.|##...##.|###..##.|.#######|..##.##.|........|........|........","e":".......|.......|.......|.......|..####.|.#..###|##...#.|##..#..|##.#...|###....|###...#|.#####.|.......|.......|.......","f":".......|...##.#|..#.###|.##..##|.##....|.##....|#####..|.##....|.##....|.##....|.###...|.##....|.......|.......|.......","g":"........|........|........|........|..##.##.|.#.#####|##..###.|##...##.|##...##.|##...##.|.##.###.|..##.##.|##...##.|###..#..|.####...","h":".........|..#......|.##......|###......|.##..##..|.##.####.|.###..##.|.##...##.|.##...##.|.##...##.|.##...###|.##...##.|.........|.........|.........","i":"....|..#.|.##.|.#..|....|..#.|.##.|###.|.##.|.##.|.###|.##.|....|....|....","j":"...|..#|.##|.#.|...|..#|.##|###|.##|.##|.##|.##|.##|.#.|#..","k":".........|..#......|.##......|###..##..|.##..##..|.##.##...|.######..|.###.###.|.##...##.|.##...##.|.###..###|.##...##.|.........|.........|.........","l":"....|..#.|.##.|###.|.##.|.##.|.##.|.##.|.##.|.##.|.###|.##.|....|....|....","m":"............|............|............|............|..#..##..##.|.##.###.###.|####.###.##.|.##..##..##.|.##..##..##.|.##..##..##.|.##..##..###|.##..##..##.|............|............|............","n":".........|.........|.........|.........|..#..###.|.##.#.##.|####..##.|.##...##.|.##...##.|.##...##.|.###..###|.##...##.|.........|.........|.........","o":".......|.......|.......|.......|..###..|.#.###.|##..###|##...##|##...##|###..##|.###.#.|..###..|.......|.......|.......","p":"........|........|........|........|...###..|..#.###.|.##..###|###...##|.##...##|.###..##|.####.#.|.##.##..|.##.....|.###....|.##.....","q":"........|........|........|........|..##.##.|.#.####.|##..###.|##...##.|##...##.|###..##.|.######.|..##.##.|.....##.|.....###|.....##.","r":".......|.......|.......|.......|..#..#.|.##.###|####.##|.##....|.##....|.##....|.###...|.##....|.......|.......|.......","s":"......|......|......|......|.####.|##..##|###...|.###..|..###.|#..###|##..##|.####.|......|......|......","t":".....|..#..|.##..|###..|.##..|#####|.##..|.##..|.##..|.##.#|.###.|.##..|.....|.....|.....","u":".........|.........|.........|.........|..#....#.|.##...##.|###...##.|.##...##.|.##...##.|.##..###.|.####.###|..##..##.|.........|.........|.........","v":"........|........|........|........|..#....#|.##...##|###...##|.##...##|.##...##|.###..#.|..####..|...##...|........|........|........","w":"...........|...........|...........|...........|..#.......#|.##......##|###...#..##|.##..##..##|.##..##..##|.###.##..##|..######.#.|...##..##..|...........|...........|...........","x":"..........|..........|..........|..........|.##....#..|####..###.|..####.##.|...###....|....###...|##..####..|####..####|.##....##.|..........|..........|..........","y":".......|.......|.......|.......|..#...#|.##..##|###..##|.##..##|.##..##|.##.###|.###.##|..#..##|#....#.|##..#..|.###...","z":".......|.......|.......|.......|..#####|.#####.|#...#..|...#...|..#....|.#....#|######.|#####..|.......|.......|.......","{":"....|....|...#|..#.|.##.|.##.|.##.|.##.|##..|.##.|.##.|.##.|.##.|.###|..##","|":"..|.#|##|##|##|##|##|##|##|##|##|##|##|##|#.","}":"....|....|##..|###.|.##.|.##.|.##.|.##.|..##|.##.|.##.|.##.|.##.|.#..|#...","~":"........|........|........|........|........|........|..##....|.####..#|#..####.|....##..|........|........|........|........|........","¢":".......|.......|....#..|....#..|..###.#|.#..###|##.#.##|##.#...|##.#...|###....|.###..#|..####.|..#....|..#....|.......","£":".......|.......|.####.#|##..###|##...##|##.....|.##....|#####..|.##....|.##....|####..#|##..##.|.......|.......|.......","¥":".........|..#.....#|.##....##|###....##|.##....##|.###...#.|..###.#..|.########|....##...|..######.|....##...|....##...|.........|.........|.........","€":".........|....###.#|...#.####|..#...###|.##......|######...|.##......|######...|.##......|.###....#|..###..#.|...####..|.........|.........|........."},15,12,4);
const CELTIC=gridFace({"0":"..####..|.##..##.|##...###|##..#.##|##.#..##|###...##|.##..##.|..####..|........|........|........","1":"..#.|.##.|###.|.##.|.##.|.##.|.##.|####|....|....|....","2":".#####.|#...###|.....##|...###.|.##....|##.....|#######|######.|.......|.......|.......","3":"######|#...##|...##.|.####.|....##|.....#|##..##|.####.|......|......|......","4":"....##...|...###...|..####...|.##.##...|##..###.#|########.|....##...|....##...|....##...|.........|.........","5":"..#####|.#####.|##.....|######.|.##..##|......#|###..##|.#####.|.......|.......|.......","6":"...####|..####.|.##....|######.|##..###|#....##|##..##.|.####..|.......|.......|.......","7":"#######|.######|.....##|....##.|...##..|..##...|.##....|.#.....|.......|.......|.......","8":".######.|###..###|##....##|###.####|.###.##.|##....##|###..###|.######.|........|........|........","9":"..####..|.##..##.|##....##|###..###|.#######|......##|.....##.|.#####..|........|........|........","!":"####|.###|..##|..##|..##|....|..##|..##|....|....|....","\"":"##..##.|###.###|.##..##|..#...#|.#...#.|.......|.......|.......|.......|.......|.......","#":"..###..###...|...##...##...|######..##...|...##.#######|...##...##...|######..##...|...##.#######|...##...##...|.............|.............|.............","$":"...##...|.##.###.|###.####|###.#...|.######.|....#.##|###.#.##|..#####.|...##...|........|........","%":"........|##..#...|##..##..|...###..|...##...|..##....|..##..##|...#..##|........|........|........","&":"..###...|.##.##..|.##.##..|..###..#|.##.####|##...#..|###..###|.####..#|........|........|........","'":".##|.##|.##|.#.|#..|...|...|...|...|...|...","(":"..##|.##.|##..|##..|##..|##..|.##.|..##|....|....|....",")":"##..|.##.|..##|..##|..##|..##|.##.|##..|....|....|....","*":"....#...|.#.##.#.|..####..|########|.######.|..####..|.#.##.#.|...#....|........|........|........","+":"....#...|...##...|...##...|########|.######.|...##...|...##...|...#....|........|........|........",",":"..|..|..|..|..|##|##|.#|##|#.|..","-":"......|......|......|#####.|.#####|......|......|......|......|......|......",".":"..|..|..|..|..|..|##|##|..|..|..","/":"..#.|..##|..##|.##.|.##.|##..|##..|.#..|....|....|....",":":"...|...|##.|###|...|##.|###|...|...|...|...",";":"...|...|##.|###|...|##.|##.|.#.|##.|#..|...","<":"...##|..##.|.##..|##...|##...|.##..|..##.|...##|.....|.....|.....","=":"......|......|#####.|.#####|......|#####.|.#####|......|......|......|......",">":"##...|.##..|..##.|...##|...##|..##.|.##..|##...|.....|.....|.....","?":".######.|###..###|.....###|....###.|...##...|........|...##...|...##...|........|........|........","@":"..#####..|.##...##.|##.###.##|###...###|###....##|##.#####.|.#.......|..#######|.........|.........|.........","A":"..####.#.|.##..###.|##....##.|##....##.|##....##.|##....##.|.##..###.|..####.##|.........|.........|.........","B":"##.####.|###...##|##....##|##...##.|##.####.|###...##|##....##|######..|........|........|........","C":"..###..#|.##..###|##....##|##......|##......|##.....#|.##..###|..####..|........|........|........","D":"######..|..#####.|.##...##|##....##|##....##|##....##|.##..##.|..####..|........|........|........","E":"..#####.|.##...##|##......|#######.|##......|##......|.##....#|..#####.|........|........|........","F":"########|.##....#|.##.....|.######.|.##.....|.##.....|.##.....|.##.....|.#......|#.......|........","G":"..####.#|.##...##|##......|##......|##......|##....##|.##..###|..####.#|.......#|......#.|........","H":"###..###|.##...##|.##...##|.##.####|.###..##|.##...##|.##...##|.##...##|......#.|.....#..|........","I":"####|.###|..##|..##|..##|..##|..##|..##|....|....|....","J":"####|.###|..##|..##|..##|..##|..##|..##|..#.|.#..|....","K":"###.....|.##...#.|.##..##.|.##.##..|.####...|.####...|.##.##..|.##..###|........|........|........","L":"###....|.##....|.##....|.##....|.##....|.##....|.##...#|.######|......#|.......|.......","M":"..####..####..|.##..####..##.|##....##....##|##....##....##|##....##....##|##....##....##|.##...##...##.|..##..##..##..|..............|..............|..............","N":"##.####.|###..###|##....##|##....##|##....##|##....##|##....##|##...##.|........|........|........","O":"..#####..|.##...##.|##.....##|##.....##|##.....##|##.....##|.##...##.|..#####..|.........|.........|.........","P":"##.####..|.###..##.|.##....##|.##....##|.##....##|.###..##.|.######..|.##......|.#.......|#........|.........","Q":"..#####...|.##...##..|##.....##.|##.....##.|##.....##.|##.....##.|.##...##..|..#####...|..######.#|.#.....##.|..........","R":"##.####..|###...##.|##....##.|##...##..|##.###...|###.##...|##...##..|##....###|.........|.........|.........","S":".######.|###..###|###.....|.####...|....###.|.....###|###..###|..#####.|........|........|........","T":"#########.|#..##....#|..##......|..##......|..##......|..##.....#|...##...##|....#####.|..........|..........|..........","U":"###...###.|.##....##.|##.....##.|##.....##.|##.....##.|##.....##.|.##...###.|..####.###|..........|..........|..........","V":"###....###|.##.....##|.##.....##|.##.....##|..##....##|..##...##.|...##.##..|....###...|..........|..........|..........","W":"###..###...###.|.##...##....##.|##....##....##.|##....##....##.|##....##....##.|##....##....##.|.##..####..###.|..###....###..#|...............|...............|...............","X":"###.....##|..##...##.|...##.##..|....###...|....##....|...####...|..##..##..|###....###|..........|..........|..........","Y":"###...###|.##....##|##.....##|##.....##|##.....##|##.....##|.##...###|..#######|.......##|###...##.|.######..","Z":"########|##...###|#....##.|....##..|..##....|.##....#|###...##|########|........|........|........","[":"####|###.|##..|##..|##..|##..|###.|####|....|....|....","\\":".#..|##..|##..|.##.|.##.|..##|..##|..#.|....|....|....","]":"####|.###|..##|..##|..##|..##|.###|####|....|....|....","^":"..#..|.###.|##.##|#...#|.....|.....|.....|.....|.....|.....|.....","_":"......|......|......|......|......|......|#####.|.#####|......|......|......","`":"##.|##.|##.|.#.|..#|...|...|...|...|...|...","a":"........|........|.#####.#|###..###|##....##|##....##|###..###|.#####.#|........|........|........","b":"##.......|.##......|.######..|.###..##.|.##....##|.##....##|.###..##.|..#####..|.........|.........|.........","c":".......|.......|.#####.|###..##|##.....|##.....|.##...#|..####.|.......|.......|.......","d":"........|######..|..#####.|.##..###|##....##|##....##|.##..##.|..####..|........|........|........","e":".......|.......|.#####.|##...##|##.###.|###....|##....#|.#####.|.......|.......|.......","f":"...####.|..##...#|..##....|..##....|..##..#.|#######.|..##....|..##....|..##....|..#.....|.#......","g":"........|........|.#####.#|###..###|##....##|##....##|.##..###|..######|.##...##|##...###|.######.","h":"###........|.##........|.##.#####..|.####..###.|.###....##.|.##.....##.|.##....##..|.##...#####|...........|...........|...........","i":"..##|....|####|.###|..##|..##|..##|..##|....|....|....","j":"..##|....|####|.###|..##|..##|..##|..##|..##|..#.|.#..","k":"###....|.##..##|.##..##|.##.##.|.####..|.#####.|.##..##|.##..##|.......|.......|.......","l":"###...|.###..|..##..|..##..|..##..|..##..|..##.#|...##.|......|......|......","m":"...............|...............|######.######..|.##..####..###.|.##...##....##.|.##...##....##.|.##...##...##..|####..##..#####|...............|...............|...............","n":"..........|..........|########..|.###..###.|.##....##.|.##....##.|.##....#..|###...####|..........|..........|..........","o":"........|........|.######.|###..###|##....##|##....##|###..###|.######.|........|........|........","p":".........|.........|##.#####.|.###..###|.##....##|.##....##|.###..###|.#######.|.##......|.##......|..#......","q":".........|.........|.#####.##|###..###.|##....##.|##....##.|###..###.|.#######.|......##.|......##.|.......#.","r":"........|........|#.####..|###..##.|##..###.|######..|##...##.|##....##|........|........|........","s":"........|........|.######.|###...##|.###....|....###.|###..###|..#####.|........|........|........","t":"...##..|..##...|#######|..##...|..##...|..##...|..##..#|....##.|.......|.......|.......","u":".........|.........|####..###|.##...##.|##....##.|##....##.|##...###.|.####.###|.........|.........|.........","v":".........|.........|####..###|.##....##|.##....##|..#...##.|...#.##..|....#....|.........|.........|.........","w":"..............|..............|#####.##..##..|.##...##...##.|##....##....##|##...###....##|##..#####..###|.####..######.|..............|..............|..............","x":"........|........|###...##|.##..##.|...###..|...##...|..###...|###.###.|........|........|........","y":".......|.......|###..##|.##..##|..##.#.|..##.#.|...##..|#..##..|#..##..|.###...|.......","z":".......|.......|#######|#...##.|...##..|..##...|.##...#|#######|.......|.......|.......","{":"..###|.###.|.##..|###..|.##..|.##..|.###.|..###|.....|.....|.....","|":".#|##|##|##|##|##|##|#.|..|..|..","}":"###..|.###.|..##.|..###|..##.|..##.|.###.|###..|.....|.....|.....","~":".##....|####..#|#..####|....##.|.......|.......|.......|.......|.......|.......|.......","À":".|.|.|.|.|.|.|.|#|.|.","É":".|.|.|.|.|.|.|.|#|.|.","Î":".|.|.|.|.|.|.|.|#|.|.","Õ":".|.|.|.|.|.|.|.|#|.|.","Ü":".|.|.|.|.|.|.|.|#|.|.","à":".|.|.|.|.|.|.|.|#|.|.","é":".|.|.|.|.|.|.|.|#|.|.","î":".|.|.|.|.|.|.|.|#|.|.","õ":".|.|.|.|.|.|.|.|#|.|.","ü":".|.|.|.|.|.|.|.|#|.|.","ç":".|.|.|.|.|.|.|.|#|.|.","ñ":".|.|.|.|.|.|.|.|#|.|.","ß":".|.|.|.|.|.|.|.|#|.|.","¡":".|.|.|.|.|.|.|.|#|.|.","¿":".|.|.|.|.|.|.|.|#|.|.","€":".|.|.|.|.|.|.|.|#|.|.","£":".|.|.|.|.|.|.|.|#|.|."," ":"..|..|..|..|..|..|..|..|..|..|.."},11,8,2);
const COMICORO=gridFace({"0":".....|..##.|.#..#|#...#|#...#|#...#|#...#|.###.|.....|.....","1":"..|.#|##|.#|.#|.#|.#|.#|..|..","2":".....|.###.|#...#|....#|...#.|..#..|.#...|#####|.....|.....","3":".....|.###.|....#|....#|..##.|....#|#...#|.###.|.....|.....","4":".....|.#..#|#...#|#...#|.###.|...#.|...#.|...#.|.....|.....","5":".....|.####|.#...|#....|####.|....#|....#|.###.|.....|.....","6":".....|..##.|.#...|#....|####.|#...#|#...#|.###.|.....|.....","7":".....|#####|....#|...#.|..#..|.#...|.#...|.#...|.....|.....","8":".....|..##.|.#..#|.#..#|.###.|#...#|#...#|.###.|.....|.....","9":".....|.###.|#...#|#...#|.####|...#.|...#.|...#.|.....|....."," ":"....|....|....|....|....|....|....|....|....|....","!":"..|.#|.#|#.|#.|#.|..|#.|..|..","\"":"#.#|#.#|...|...|...|...|...|...|...|...","#":"......|...#.#|.#####|..#.#.|..#.#.|######|.#.#..|.#.#..|......|......","$":"..#..|..###|.##..|#.#..|.###.|..#.#|..#.#|####.|..#..|..#..","%":".........|.##...#..|#..#.#...|#..#.#...|.##.#.##.|....##..#|...#.#..#|...#..##.|.........|.........","&":"......|..#...|.#.#..|..#...|.#.#.#|#...#.|#...#.|.###.#|......|......","'":"#|#|.|.|.|.|.|.|.|.","(":"..#|.#.|#..|#..|#..|#..|#..|#..|.#.|..#",")":"#..|.#.|..#|..#|..#|..#|..#|..#|.#.|#..","*":".....|..#..|#####|.###.|.#.#.|.....|.....|.....|.....|.....","+":".....|.....|..#..|..#..|#####|..#..|..#..|.....|.....|.....",",":"..|..|..|..|..|..|.#|.#|#.|..","-":"...|...|...|...|...|###|...|...|...|...",".":".|.|.|.|.|.|.|#|.|.","/":"..#|..#|..#|.#.|.#.|.#.|#..|#..|#..|...",":":".|.|.|.|#|.|#|.|.|.",";":"..|..|..|..|.#|..|.#|.#|#.|..","<":"....|....|...#|.##.|#...|.##.|...#|....|....|....","=":"....|....|....|####|....|####|....|....|....|....",">":"....|....|#...|.##.|...#|.##.|#...|....|....|....","?":"....|###.|...#|...#|.##.|#...|....|#...|....|....","@":"........|........|..####..|.#....#.|#..##..#|#.#..#.#|#.#.##.#|#..#.##.|.#......|..###...","A":"......|...##.|..#..#|..#..#|.#...#|.#####|#....#|#....#|......|......","B":"......|.####.|.#...#|.#...#|#####.|#....#|#....#|#####.|......|......","C":".....|...##|..#..|.#...|#....|#....|#....|.####|.....|.....","D":"......|.####.|.#...#|.#...#|#....#|#....#|#...#.|####..|......|......","E":".....|.####|.#...|#....|####.|#....|#....|.####|.....|.....","F":".....|.####|.#...|#....|####.|#....|#....|#....|.....|.....","G":".......|...####|..#....|.#.....|#..####|#.....#|#....#.|.####..|.......|.......","H":"......|.#...#|.#...#|#....#|######|#...#.|#...#.|#...#.|......|......","I":"..|.#|.#|.#|#.|#.|#.|#.|..|..","J":"......|..####|.....#|.....#|.....#|....#.|#...#.|.###..|......|......","K":"......|#.....|#....#|#...#.|#..#..|.##...|.###..|.#..##|......|......","L":".....|.#...|.#...|#....|#....|#....|#....|.####|.....|.....","M":".......|.#...##|.##.#.#|.#.##.#|#..#..#|#.....#|#.....#|#.....#|.......|.......","N":".......|.....#.|.#....#|.##...#|.#.#..#|.#.#..#|#...#.#|#....##|.......|.......","O":".......|...###.|..#...#|.#....#|#.....#|#.....#|#....#.|.####..|.......|.......","P":"......|.####.|.#...#|.#...#|.#.##.|###...|#.....|#.....|......|......","Q":".......|...###.|..#...#|.#....#|#.....#|#.....#|#....#.|.####..|...#...|....##.","R":"......|.####.|.#...#|.#...#|.#..#.|####..|#...#.|#....#|......|......","S":".....|..###|.#...|#....|.###.|....#|....#|####.|.....|.....","T":"......|######|...#..|...#..|..#...|..#...|..#...|..#...|......|......","U":"......|.#...#|.#...#|.#...#|#....#|#....#|#...#.|.###..|......|......","V":"......|#....#|#....#|#...#.|#...#.|#..#..|.#.#..|.##...|......|......","W":".......|.#....#|.#....#|#.....#|#..#..#|#.##.#.|##..##.|#....#.|.......|.......","X":"......|#....#|#...#.|.#.#..|..#...|..##..|.#..#.|#....#|......|......","Y":"......|#....#|#....#|#...#.|.#..#.|..##..|...#..|...#..|......|......","Z":"......|###...|...###|....#.|...#..|..#...|.#....|######|......|......","[":"##|#.|#.|#.|#.|#.|#.|#.|#.|##","\\":"#..|#..|#..|.#.|.#.|.#.|..#|..#|..#|...","]":"##|.#|.#|.#|.#|.#|.#|.#|.#|##","^":"...|.#.|#.#|...|...|...|...|...|...|...","_":"......|......|......|......|......|......|......|......|......|######","`":"..|#.|.#|..|..|..|..|..|..|..","a":".....|.....|.....|..##.|.#..#|#...#|#..##|.##.#|.....|.....","b":".....|#....|#....|###..|#..#.|#...#|#...#|.###.|.....|.....","c":".....|.....|.....|..##.|.#...|#....|#...#|.###.|.....|.....","d":".....|....#|....#|..###|.#..#|#...#|#..##|.##.#|.....|.....","e":"....|....|....|.##.|#..#|###.|#...|.###|....|....","f":"...|..#|.#.|###|.#.|.#.|.#.|.#.|...|...","g":".....|.....|.....|..##.|.#..#|#...#|.####|....#|.#..#|..##.","h":".....|.#...|.#...|.#...|####.|#...#|#...#|#...#|.....|.....","i":".|.|#|.|#|#|#|#|.|.","j":"...|...|..#|...|..#|..#|..#|..#|..#|##.","k":".....|#....|#....|#...#|#..#.|.##..|.##..|.#.#.|.....|.....","l":".|#|#|#|#|#|#|#|.|.","m":".......|.......|.......|#.####.|##.#..#|#..#..#|#..#..#|#..#..#|.......|.......","n":".....|.....|.....|####.|#...#|#...#|#...#|#...#|.....|.....","o":".....|.....|.....|.###.|#...#|#...#|#...#|.###.|.....|.....","p":".....|.....|.....|#.##.|##..#|#...#|####.|#....|#....|#....","q":".....|.....|.....|..###|.#..#|#...#|.####|....#|....#|....#","r":"...|...|...|#.#|##.|#..|#..|#..|...|...","s":"....|....|....|.###|#...|.##.|...#|###.|....|....","t":"...|...|.#.|###|.#.|.#.|.#.|.#.|...|...","u":".....|.....|.....|#...#|#...#|#...#|#...#|.###.|.....|.....","v":".....|.....|.....|#...#|#...#|#..#.|.#.#.|.##..|.....|.....","w":"......|......|......|#....#|#..#.#|#.##.#|##.##.|#...#.|......|......","x":".....|.....|.....|#..#.|.##..|.##..|#..#.|#...#|.....|.....","y":".....|.....|.....|.#..#|#...#|#...#|.####|....#|...#.|.##..","z":"....|....|....|####|...#|..#.|.#..|####|....|....","{":"..#|.#.|.#.|.#.|#..|.#.|.#.|.#.|.#.|..#","|":".|#|#|#|#|#|#|#|#|#","}":"#..|.#.|.#.|.#.|..#|.#.|.#.|.#.|.#.|#..","~":"......|......|......|.##..#|#..##.|......|......|......|......|......","¡":"..|..|..|.#|..|.#|.#|.#|#.|#.","¢":".....|.....|..#..|..##.|.##..|#.#..|#.#.#|.###.|..#..|.....","£":"......|..##..|.#..#.|.#....|###...|.#....|###..#|#..##.|......|......","¤":".....|.....|#...#|.###.|.#.#.|.###.|#...#|.....|.....|.....","¥":".....|#...#|#...#|.#.#.|#####|..#..|#####|..#..|.....|.....","¦":".|#|#|#|#|.|#|#|#|#","§":"....|.##.|#..#|.#..|#.#.|#..#|.#.#|..#.|#..#|.##.","¨":"...|#.#|...|...|...|...|...|...|...|...","©":".......|..####.|.#....#|#..##.#|#.#...#|#.###.#|#....#.|.####..|.......|.......","ª":".#.|..#|###|###|...|###|...|...|...|...","«":".....|.....|.....|.....|.#..#|#..#.|.#..#|.....|.....|.....","¬":".....|.....|.....|#####|....#|....#|.....|.....|.....|.....","®":".......|..####.|.#....#|#.###.#|#.##..#|#.#.#.#|#....#.|.####..|.......|.......","°":".##.|#..#|#..#|.##.|....|....|....|....|....|....","±":".....|.....|..#..|..#..|#####|..#..|..#..|#####|.....|.....","²":"##.|..#|.#.|###|...|...|...|...|...|...","³":"###|..#|.##|###|...|...|...|...|...|...","´":".#|#.|..|..|..|..|..|..|..|..","µ":".....|.....|.....|#...#|#...#|#...#|#...#|#####|#....|#....","¶":"......|.#####|####.#|####.#|.###.#|...#.#|...#.#|...#.#|...#.#|...#.#","·":".|.|.|.|#|.|.|.|.|.","¸":"...|...|...|...|...|...|...|...|.#.|..#","¹":".#|##|.#|.#|..|..|..|..|..|..","º":".#.|#.#|#.#|.#.|...|###|...|...|...|...","»":".....|.....|.....|.....|#..#.|.#..#|#..#.|.....|.....|.....","¼":".#...#...|##...#...|.#..#....|.#..#....|...#..#.#|...#..#.#|..#...###|..#.....#|.........|.........","½":".#...#...|##...#...|.#..#....|.#..#....|...#..##.|...#....#|..#....#.|..#...###|.........|.........","¾":"###...#...|..#...#...|.##..#....|###..#....|....#..#.#|....#..#.#|...#...###|...#.....#|..........|..........","¿":"....|....|....|...#|....|...#|.##.|#...|#...|.###","À":"......|...##.|..#..#|..#..#|.#...#|.#####|#....#|#....#|......|......","Á":"......|...##.|..#..#|..#..#|.#...#|.#####|#....#|#....#|......|......","Â":"......|...##.|..#..#|..#..#|.#...#|.#####|#....#|#....#|......|......","Ã":"......|...##.|..#..#|..#..#|.#...#|.#####|#....#|#....#|......|......","Ä":"......|...##.|..#..#|..#..#|.#...#|.#####|#....#|#....#|......|......","Å":"....#.|...##.|..#..#|..#..#|.#...#|.#####|#....#|#....#|......|......","Æ":"..........|...###.###|..#..##...|..#..#....|.#...####.|.#####....|#....#....|#....#####|..........|..........","Ç":".....|...##|..#..|.#...|#....|#....|#....|.####|..#..|...#.","È":".....|.####|.#...|#....|####.|#....|#....|.####|.....|.....","É":".....|.####|.#...|#....|####.|#....|#....|.####|.....|.....","Ê":".....|.####|.#...|#....|####.|#....|#....|.####|.....|.....","Ë":".....|.####|.#...|#....|####.|#....|#....|.####|.....|.....","Ì":"..|.#|.#|.#|#.|#.|#.|#.|..|..","Í":"...|.#.|.#.|.#.|#..|#..|#..|#..|...|...","Î":"...|.#.|.#.|.#.|#..|#..|#..|#..|...|...","Ï":"...|.#.|.#.|.#.|#..|#..|#..|#..|...|...","Ð":".......|..####.|..#...#|..#...#|#####.#|.#....#|.#...#.|.####..|.......|.......","Ñ":".......|.....#.|.#....#|.##...#|.#.#..#|.#.#..#|#...#.#|#....##|.......|.......","Ò":".......|...###.|..#...#|.#....#|#.....#|#.....#|#....#.|.####..|.......|.......","Ó":".......|...###.|..#...#|.#....#|#.....#|#.....#|#....#.|.####..|.......|.......","Ô":".......|...###.|..#...#|.#....#|#.....#|#.....#|#....#.|.####..|.......|.......","Õ":".......|...###.|..#...#|.#....#|#.....#|#.....#|#....#.|.####..|.......|.......","Ö":".......|...###.|..#...#|.#....#|#.....#|#.....#|#....#.|.####..|.......|.......","×":".....|.....|#...#|.#.#.|..#..|.#.#.|#...#|.....|.....|.....","Ø":"......#|..####.|.#...##|#...#.#|#..#..#|#.#...#|##...#.|.####..|#......|.......","Ù":"......|.#...#|.#...#|.#...#|#....#|#....#|#...#.|.###..|......|......","Ú":"......|.#...#|.#...#|.#...#|#....#|#....#|#...#.|.###..|......|......","Û":"......|.#...#|.#...#|.#...#|#....#|#....#|#...#.|.###..|......|......","Ü":"......|.#...#|.#...#|.#...#|#....#|#....#|#...#.|.###..|......|......","Ý":"......|#....#|#....#|#...#.|.#..#.|..##..|...#..|...#..|......|......","Þ":".....|#....|#.##.|##..#|#...#|##..#|#.##.|#....|.....|.....","ß":"....|.##.|#..#|#..#|#.#.|#..#|#..#|#..#|..#.|....","à":"..#..|...#.|.....|..##.|.#..#|#...#|#..##|.##.#|.....|.....","á":"...#.|..#..|.....|..##.|.#..#|#...#|#..##|.##.#|.....|.....","â":"...#.|..#.#|.....|..##.|.#..#|#...#|#..##|.##.#|.....|.....","ã":".##.#|#.##.|.....|..##.|.#..#|#...#|#..##|.##.#|.....|.....","ä":".....|..#.#|.....|..##.|.#..#|#...#|#..##|.##.#|.....|.....","å":"..#.#|...#.|.....|..##.|.#..#|#...#|#..##|.##.#|.....|.....","æ":"........|........|........|.###.##.|....#..#|.######.|#..##...|.##.####|........|........","ç":".....|.....|.....|..##.|.#...|#....|#...#|.###.|..#..|...#.","è":".#..|..#.|....|.##.|#..#|###.|#...|.###|....|....","é":"..#.|.#..|....|.##.|#..#|###.|#...|.###|....|....","ê":"..#.|.#.#|....|.##.|#..#|###.|#...|.###|....|....","ë":"....|.#.#|....|.##.|#..#|###.|#...|.###|....|....","ì":"..|#.|.#|..|.#|.#|.#|.#|..|..","í":"..|.#|#.|..|#.|#.|#.|#.|..|..","î":"...|.#.|#.#|...|.#.|.#.|.#.|.#.|...|...","ï":"...|...|#.#|...|.#.|.#.|.#.|.#.|...|...","ð":".....|..#..|.####|...#.|.####|#...#|#...#|.###.|.....|.....","ñ":".##.#|#.##.|.....|####.|#...#|#...#|#...#|#...#|.....|.....","ò":".#...|..#..|.....|.###.|#...#|#...#|#...#|.###.|.....|.....","ó":"...#.|..#..|.....|.###.|#...#|#...#|#...#|.###.|.....|.....","ô":"..#..|.#.#.|.....|.###.|#...#|#...#|#...#|.###.|.....|.....","õ":".##.#|#.##.|.....|.###.|#...#|#...#|#...#|.###.|.....|.....","ö":".....|.#.#.|.....|.###.|#...#|#...#|#...#|.###.|.....|.....","÷":".....|.....|..#..|.....|#####|.....|..#..|.....|.....|.....","ø":".....|.....|....#|.####|#..##|#.#.#|##..#|####.|#....|.....","ù":".#...|..#..|.....|#...#|#...#|#...#|#...#|.###.|.....|.....","ú":"...#.|..#..|.....|#...#|#...#|#...#|#...#|.###.|.....|.....","û":"..#..|.#.#.|.....|#...#|#...#|#...#|#...#|.###.|.....|.....","ü":".....|.#.#.|.....|#...#|#...#|#...#|#...#|.###.|.....|.....","ý":"...#.|..#..|.....|.#..#|#...#|#...#|.####|....#|...#.|.##..","þ":".....|#....|#....|#.##.|##..#|#...#|##..#|#.##.|#....|#....","ÿ":".....|.#.#.|.....|.#..#|#...#|#...#|.####|....#|...#.|.##..","Ā":"......|...##.|..#..#|..#..#|.#...#|.#####|#....#|#....#|......|......","ā":".....|.####|.....|..##.|.#..#|#...#|#..##|.##.#|.....|.....","Ă":"......|...##.|..#..#|..#..#|.#...#|.#####|#....#|#....#|......|......","ă":".#..#|..##.|.....|..##.|.#..#|#...#|#..##|.##.#|.....|.....","Ą":"......|...##.|..#..#|..#..#|.#...#|.#####|#....#|#....#|.....#|....#.","ą":".....|.....|.....|..##.|.#..#|#...#|#..##|.##.#|....#|...#.","Ć":".....|...##|..#..|.#...|#....|#....|#....|.####|.....|.....","ć":"...#.|..#..|.....|..##.|.#...|#....|#...#|.###.|.....|.....","Ĉ":".....|...##|..#..|.#...|#....|#....|#....|.####|.....|.....","ĉ":"..#..|.#.#.|.....|..##.|.#...|#....|#...#|.###.|.....|.....","Ċ":".....|...##|..#..|.#...|#....|#....|#....|.####|.....|.....","ċ":".....|..#..|.....|..##.|.#...|#....|#...#|.###.|.....|.....","Č":".....|...##|..#..|.#...|#....|#....|#....|.####|.....|.....","č":".#.#.|..#..|.....|..##.|.#...|#....|#...#|.###.|.....|.....","Ď":"......|.####.|.#...#|.#...#|#....#|#....#|#...#.|####..|......|......","ď":"......#|....#.#|....#..|..###..|.#..#..|#...#..|#..##..|.##.#..|.......|.......","Đ":".......|..####.|..#...#|..#...#|#####.#|.#....#|.#...#.|.####..|.......|.......","đ":"......|..####|....#.|..###.|.#..#.|#...#.|#..##.|.##.#.|......|......","Ē":".....|.####|.#...|#....|####.|#....|#....|.####|.....|.....","ē":"....|.###|....|.##.|#..#|###.|#...|.###|....|....","Ĕ":".....|.####|.#...|#....|####.|#....|#....|.####|.....|.....","ĕ":"#..#|.##.|....|.##.|#..#|###.|#...|.###|....|....","Ė":".....|.####|.#...|#....|####.|#....|#....|.####|.....|.....","ė":"....|..#.|....|.##.|#..#|###.|#...|.###|....|....","Ę":".....|.####|.#...|#....|####.|#....|#....|.####|....#|...#.","ę":"....|....|....|.##.|#..#|###.|#...|.###|..#.|.#..","Ě":".....|.####|.#...|#....|####.|#....|#....|.####|.....|.....","ě":".#.#|..#.|....|.##.|#..#|###.|#...|.###|....|....","Ĝ":".......|...####|..#....|.#.....|#..####|#.....#|#....#.|.####..|.......|.......","ĝ":"...#.|..#.#|.....|..##.|.#..#|#...#|.####|....#|.#..#|..##.","Ğ":".......|...####|..#....|.#.....|#..####|#.....#|#....#.|.####..|.......|.......","ğ":".#..#|..##.|.....|..##.|.#..#|#...#|.####|....#|.#..#|..##.","Ġ":".......|...####|..#....|.#.....|#..####|#.....#|#....#.|.####..|.......|.......","ġ":".....|...#.|.....|..##.|.#..#|#...#|.####|....#|.#..#|..##.","Ģ":".......|...####|..#....|.#.....|#..####|#.....#|#....#.|.####..|.......|...#...","ģ":"..#..|..#..|.....|..##.|.#..#|#...#|.####|....#|.#..#|..##.","Ĥ":"......|.#...#|.#...#|#....#|######|#...#.|#...#.|#...#.|......|......","ĥ":".....|.#...|.#...|.#...|####.|#...#|#...#|#...#|.....|.....","Ħ":".......|.#...#.|#######|#....#.|######.|#...#..|#...#..|#...#..|.......|.......","ħ":".....|####.|.#...|.#...|####.|#...#|#...#|#...#|.....|.....","Ĩ":".....|..#..|..#..|..#..|.#...|.#...|.#...|.#...|.....|.....","ĩ":".....|.##.#|#.##.|.....|..#..|..#..|..#..|..#..|.....|.....","Ī":"...|.#.|.#.|.#.|#..|#..|#..|#..|...|...","ī":"...|...|###|...|.#.|.#.|.#.|.#.|...|...","Ĭ":"...|.#.|.#.|.#.|#..|#..|#..|#..|...|...","ĭ":"...|#.#|.#.|...|.#.|.#.|.#.|.#.|...|...","Į":"...|..#|..#|..#|.#.|.#.|.#.|.#.|.#.|#..","į":"..|..|.#|..|.#|.#|.#|.#|.#|#.","İ":"..|.#|.#|.#|#.|#.|#.|#.|..|..","ı":".|.|.|.|#|#|#|#|.|.","Ĳ":"......|.#.###|.#...#|#....#|#....#|.....#|#...#.|.###..|......|......","ĳ":"...|...|#.#|...|#.#|#.#|#.#|.##|..#|##.","Ĵ":"......|..####|.....#|.....#|.....#|....#.|#...#.|.###..|......|......","ĵ":"....|..#.|.#.#|....|..#.|..#.|..#.|..#.|..#.|##..","Ķ":"......|#.....|#....#|#...#.|#..#..|.##...|.###..|.#..##|......|...#..","ķ":".....|#....|#....|#...#|#..#.|.##..|.##..|.#.#.|.....|..#..","ĸ":".....|.....|.....|#..#.|#.#..|##...|###..|#..##|.....|.....","Ĺ":".....|.#...|.#...|#....|#....|#....|#....|.####|.....|.....","ĺ":"..|#.|#.|#.|#.|#.|#.|#.|..|..","Ļ":".....|.#...|.#...|#....|#....|#....|#....|.####|.....|..#..","ļ":"..|.#|.#|.#|.#|.#|.#|.#|..|.#","Ľ":"...#.|.#.#.|.#...|#....|#....|#....|#....|.####|.....|.....","ľ":"..#|#.#|#..|#..|#..|#..|#..|#..|...|...","Ŀ":".....|.#...|.#...|#....|#..#.|#....|#....|.####|.....|.....","ŀ":"...|#..|#..|#..|#.#|#..|#..|#..|...|...","Ł":"......|..#...|..#...|.#..#.|.#.#..|.##...|##....|..####|......|......","ł":"...|.#.|.#.|.##|.#.|##.|.#.|.#.|...|...","Ń":".......|.....#.|.#....#|.##...#|.#.#..#|.#.#..#|#...#.#|#....##|.......|.......","ń":"...#.|..#..|.....|####.|#...#|#...#|#...#|#...#|.....|.....","Ņ":".......|.....#.|.#....#|.##...#|.#.#..#|.#.#..#|#...#.#|#....##|.......|...#...","ņ":".....|.....|.....|####.|#...#|#...#|#...#|#...#|.....|..#..","Ň":".......|.....#.|.#....#|.##...#|.#.#..#|.#.#..#|#...#.#|#....##|.......|.......","ň":".#.#.|..#..|.....|####.|#...#|#...#|#...#|#...#|.....|.....","ŉ":".#....|#.....|......|.####.|.#...#|.#...#|.#...#|.#...#|......|......","Ŋ":".......|.....#.|.#....#|.##...#|.#.#..#|.#.#..#|#...#.#|#....##|......#|......#","ŋ":".....|.....|.....|####.|#...#|#...#|#...#|#...#|....#|....#","Ō":".......|...###.|..#...#|.#....#|#.....#|#.....#|#....#.|.####..|.......|.......","ō":".....|.###.|.....|.###.|#...#|#...#|#...#|.###.|.....|.....","Ŏ":".......|...###.|..#...#|.#....#|#.....#|#.....#|#....#.|.####..|.......|.......","ŏ":".#..#|..##.|.....|.###.|#...#|#...#|#...#|.###.|.....|.....","Ő":".......|...###.|..#...#|.#....#|#.....#|#.....#|#....#.|.####..|.......|.......","ő":".#..#|#..#.|.....|.###.|#...#|#...#|#...#|.###.|.....|.....","Œ":"...........|...###.####|..#...##...|.#....#....|#.....####.|#.....#....|#....##....|.####..####|...........|...........","œ":"........|........|........|.###.##.|#...#..#|#...###.|#...#...|.###.###|........|........","Ŕ":"......|.####.|.#...#|.#...#|.#..#.|####..|#...#.|#....#|......|......","ŕ":"..#|.#.|...|#.#|##.|#..|#..|#..|...|...","Ŗ":"......|.####.|.#...#|.#...#|.#..#.|####..|#...#.|#....#|......|...#..","ŗ":"....|....|....|.#.#|.##.|.#..|.#..|.#..|....|.#..","Ř":"......|.####.|.#...#|.#...#|.#..#.|####..|#...#.|#....#|......|......","ř":"#.#|.#.|...|#.#|##.|#..|#..|#..|...|...","Ś":".....|..###|.#...|#....|.###.|....#|....#|####.|.....|.....","ś":"...#|..#.|....|.###|#...|.##.|...#|###.|....|....","Ŝ":".....|..###|.#...|#....|.###.|....#|....#|####.|.....|.....","ŝ":"..#.|.#.#|....|.###|#...|.##.|...#|###.|....|....","Ş":".....|..###|.#...|#....|.###.|....#|....#|####.|..#..|...#.","ş":"....|....|....|.###|#...|.##.|...#|###.|..#.|...#","Š":".....|..###|.#...|#....|.###.|....#|....#|####.|.....|.....","š":".#.#|..#.|....|.###|#...|.##.|...#|###.|....|....","Ţ":"......|######|...#..|...#..|..#...|..#...|..#...|..#...|..#...|...#..","ţ":"...|...|.#.|###|.#.|.#.|.#.|.#.|.#.|..#","Ť":"......|######|...#..|...#..|..#...|..#...|..#...|..#...|......|......","ť":"...#|...#|.#..|###.|.#..|.#..|.#..|.#..|....|....","Ŧ":"......|######|...#..|...#..|.####.|..#...|..#...|..#...|......|......","ŧ":"...|...|.#.|###|.#.|###|.#.|.#.|...|...","Ũ":"......|.#...#|.#...#|.#...#|#....#|#....#|#...#.|.###..|......|......","ũ":".##.#|#.##.|.....|#...#|#...#|#...#|#...#|.###.|.....|.....","Ū":"......|.#...#|.#...#|.#...#|#....#|#....#|#...#.|.###..|......|......","ū":".....|.###.|.....|#...#|#...#|#...#|#...#|.###.|.....|.....","Ŭ":"......|.#...#|.#...#|.#...#|#....#|#....#|#...#.|.###..|......|......","ŭ":".#..#|..##.|.....|#...#|#...#|#...#|#...#|.###.|.....|.....","Ů":"......|.#...#|.#...#|.#...#|#....#|#....#|#...#.|.###..|......|......","ů":".#.#.|..#..|.....|#...#|#...#|#...#|#...#|.###.|.....|.....","Ű":"......|.#...#|.#...#|.#...#|#....#|#....#|#...#.|.###..|......|......","ű":".#..#|#..#.|.....|#...#|#...#|#...#|#...#|.###.|.....|.....","Ų":"......|.#...#|.#...#|.#...#|#....#|#....#|#...#.|.###..|...#..|..#...","ų":".....|.....|.....|#...#|#...#|#...#|#...#|.####|....#|...#.","Ŵ":".......|.#....#|.#....#|#.....#|#..#..#|#.##.#.|##..##.|#....#.|.......|.......","ŵ":"...#..|..#.#.|......|#....#|#..#.#|#.##.#|##.##.|#...#.|......|......","Ŷ":"......|#....#|#....#|#...#.|.#..#.|..##..|...#..|...#..|......|......","ŷ":"..#..|.#.#.|.....|.#..#|#...#|#...#|.####|....#|...#.|.##..","Ÿ":"......|#....#|#....#|#...#.|.#..#.|..##..|...#..|...#..|......|......","Ź":"......|##....|..####|....#.|...#..|..#...|.#....|.#####|......|......","ź":"..#.|.#..|....|####|...#|..#.|.#..|####|....|....","Ż":"......|##....|..####|....#.|...#..|..#...|.#....|.#####|......|......","ż":"....|..#.|....|####|...#|..#.|.#..|####|....|....","Ž":"......|##....|..####|....#.|...#..|..#...|.#....|.#####|......|......","ž":".#.#|..#.|....|####|...#|..#.|.#..|####|....|....","ſ":"..|.#|#.|#.|#.|#.|#.|#.|..|..","Ș":".....|..###|.#...|#....|.###.|....#|....#|####.|.....|..#..","ș":"....|....|....|.###|#...|.##.|...#|###.|....|.#..","Ț":"......|######|...#..|...#..|..#...|..#...|..#...|..#...|......|..#...","ț":"...|...|.#.|###|.#.|.#.|.#.|.#.|...|.#.","Ḃ":"......|.####.|.#...#|.#...#|#####.|#....#|#....#|#####.|......|......","ḃ":".....|#.#..|#....|###..|#..#.|#...#|#...#|.###.|.....|.....","Ḋ":"......|.####.|.#...#|.#...#|#....#|#....#|#...#.|####..|......|......","ḋ":".....|..#.#|....#|..###|.#..#|#...#|#..##|.##.#|.....|.....","Ḟ":".....|.####|.#...|#....|####.|#....|#....|#....|.....|.....","ḟ":"...|..#|.#.|###|.#.|.#.|.#.|.#.|...|...","Ṁ":".......|.#...##|.##.#.#|.#.##.#|#..#..#|#.....#|#.....#|#.....#|.......|.......","ṁ":".......|...#...|.......|#.####.|##.#..#|#..#..#|#..#..#|#..#..#|.......|.......","Ṗ":"......|.####.|.#...#|.#...#|.#.##.|###...|#.....|#.....|......|......","ṗ":".....|..#..|.....|#.##.|##..#|#...#|####.|#....|#....|#....","Ṡ":".....|..###|.#...|#....|.###.|....#|....#|####.|.....|.....","ṡ":"....|..#.|....|.###|#...|.##.|...#|###.|....|....","Ṫ":"......|######|...#..|...#..|..#...|..#...|..#...|..#...|......|......","ṫ":".#.|...|.#.|###|.#.|.#.|.#.|.#.|...|...","–":"......|......|......|......|......|######|......|......|......|......","—":".........|.........|.........|.........|.........|#########|.........|.........|.........|.........","‘":"#.|.#|..|..|..|..|..|..|..|..","’":".#|#.|..|..|..|..|..|..|..|..","‚":"..|..|..|..|..|..|..|.#|#.|..","“":"#.#.|.#.#|....|....|....|....|....|....|....|....","”":".#.#|#.#.|....|....|....|....|....|....|....|....","„":"....|....|....|....|....|....|....|.#.#|#.#.|....","…":".....|.....|.....|.....|.....|.....|.....|#.#.#|.....|.....","‰":"............|.##...#.....|#..#.#......|#..#.#......|.##.#.##.##.|....##..#..#|...#.#..#..#|...#..##.##.|............|............","‹":"..|..|..|..|.#|#.|.#|..|..|..","›":"..|..|..|..|#.|.#|#.|..|..|..","€":".....|..###|.#...|####.|.#...|####.|.#...|..###|.....|.....","™":".........|###.##.##|.#..#####|.#..#.#.#|.........|.........|.........|.........|.........|........."},10,8,3);
/* The faces a text card's title (its font field) can be drawn in, besides the usual 5 × 7. */
const TITLE_FONTS={space:SPACE,retro64:R64,alagard:ALAGARD,celtic:CELTIC,comicoro:COMICORO};const titleFont=k=>TITLE_FONTS[k]||null;
/* A few symbols in the small face too. */
addG(F3,{"♥":"#.#|###|###|.#.|...","★":".#.|###|.#.|#.#|...","↑":".#.|###|.#.|.#.|.#.","↓":".#.|.#.|.#.|###|.#.","←":"....|.#..|####|.#..|....","→":"....|..#.|####|..#.|...."});
addG(F3,{"●":".#.|###|.#.|...|...","■":"###|###|###|...|...","▲":".#.|###|...|...|...","▼":"###|.#.|...|...|...","✓":"..#|#.#|.#.|...|...","✗":"#.#|.#.|#.#|...|...","♦":".#.|###|.#.|...|..."});
/* A character a font hasn't got shows as a hollow box, so it's plain what's missing. */
addG(F5,{"\uFFFD":"....|####|#..#|#..#|#..#|#..#|####"});addG(F3,{"\uFFFD":"###|#.#|#.#|#.#|###"});
addG(BIG,{"\uFFFD":".......|#######|#.....#|#.....#|#.....#|#.....#|#.....#|#.....#|#.....#|#.....#|#.....#|#.....#|#######"});
/* Text as a font can draw it: in capitals unless asked to keep it as written, quotes and dashes made plain, kana as half-width cells,
   and a character the font hasn't got as its capital, then without its accent, then a hollow box. */
const TYPO={"\u2018":"'","\u2019":"'","\u201C":'"',"\u201D":'"',"\u2013":"-","\u2014":"-","\u2026":"...","\u00A0":" "};
const KANA_FULL="ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン。「」、・",KANA_HALF="ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ｡｢｣､･";
const KANA=Object.fromEntries([...KANA_FULL].map((c,i)=>[c,KANA_HALF[i]]).concat([["ヮ","ﾜ"],["ヵ","ｶ"],["ヶ","ｹ"],["\u3099","ﾞ"],["\u309A","ﾟ"],["\u309B","ﾞ"],["\u309C","ﾟ"]]));
const PLAIN={"Ł":"L","ł":"l","Ø":"O","ø":"o","Đ":"D","đ":"d","Ð":"D","ð":"d","Ħ":"H","ħ":"h","Æ":"AE","æ":"ae","Œ":"OE","œ":"oe","Þ":"TH","þ":"th","ı":"i","ȷ":"j","ß":"ss"};
function fitCh(ch,f){
  if(f.g[ch])return ch;
  if(TYPO[ch]!==undefined&&TYPO[ch]!==ch)return [...TYPO[ch]].map(c=>fitCh(c,f)).join("");
  // Hiragana reads as katakana; a voiced kana is its kana and the voicing mark, two cells as on a character LCD.
  const cp=ch.codePointAt(0);if(cp>=0x3041&&cp<=0x3096)return fitCh(String.fromCodePoint(cp+0x60),f);
  if(KANA[ch])return f.g[KANA[ch]]?KANA[ch]:"\uFFFD";
  const nfd=ch.normalize("NFD");if(nfd!==ch&&/[\u30A0-\u30FF]/.test(nfd[0]))return [...nfd].map(c=>fitCh(c,f)).join("");
  const up=ch.toUpperCase();if(up!==ch&&[...up].every(c=>f.g[c]))return up;
  // Letters drawn with a stroke have no accent to drop: their plain letters stand in.
  if(PLAIN[ch])return [...PLAIN[ch]].map(c=>fitCh(c,f)).join("");
  const bare=nfd.replace(/[\u0300-\u036f]/g,"");if(bare&&bare!==ch)return [...bare].map(c=>fitCh(c,f)).join("");
  return /\s/.test(ch)?" ":"\uFFFD";}
function fitText(s,f,upper=true){s=String(s==null?"":s).normalize("NFC");if(upper)s=s.toUpperCase();let o="";for(const ch of s)o+=fitCh(ch,f);return o.replace(/\s+/g," ");}
/* A font's characters in groups, as the Fonts page shows and spells them out. */
const crange=(a,b)=>Array.from({length:b-a+1},(_,i)=>String.fromCodePoint(a+i)).join("");
function charGroups(F){const has=s=>[...s].filter(c=>F.g[c]).join(""),acc=Object.keys(F.g).filter(c=>c.codePointAt(0)>=0xC0&&c.codePointAt(0)<0x250&&!"×÷".includes(c));
  return [["ASCII",has(crange(0x21,0x7E))],["Signs",has("¡¿«»€£¥¢©®±×÷µ·²³§°•")],["Accented capitals",acc.filter(c=>c===c.toUpperCase()&&c!==c.toLowerCase()).join("")],
    ["Accented lowercase",acc.filter(c=>c!==c.toUpperCase()||"ıȷß".includes(c)).join("")],["Cyrillic",has(crange(0x400,0x45F)+"ҐґЎў")],["Greek",has(crange(0x386,0x3CE))],["Symbols",has("★☆♥♡♠♣♦♢●○■□▲▼◀▶←→↑↓↔↕♪♫✓✗☀☁☂☺⌂♀♂∞⚡")],
    ["Box drawing and blocks",has("─│┌┐└┘├┤┬┴┼╭╮╰╯═║╔╗╚╝╱╲█▀▄▌▐░▒▓▖▗▘▝")],["Katakana",has(crange(0xFF61,0xFF9F))]].filter(g=>g[1]);}
const charsText=F=>charGroups(F).map(([l,c])=>l+": "+c).join("   ");
/* ---------- display fonts: split-flap and nixie, for the clock, big numbers and readings ---------- */
let CLOCK_STYLE="pixel";
const FONTS=["pixel","flip","nixie","segment","space","retro64","alagard","celtic","comicoro"];
/* Nixie numerals: thin 7 × 13 cathodes. */
const NIX=Object.fromEntries(Object.entries({
  "0":"..###../.#...#./#.....#/#.....#/#.....#/#.....#/#.....#/#.....#/#.....#/#.....#/#.....#/.#...#./..###..",
  "1":"...#.../..##.../.#.#.../...#.../...#.../...#.../...#.../...#.../...#.../...#.../...#.../...#.../..###..",
  "2":"..###../.#...#./#.....#/......#/......#/.....#./....#../...#.../..#..../.#...../#....../#....../#######",
  "3":"#######/.....#./....#../...#.../..###../.....#./......#/......#/......#/#.....#/#.....#/.#...#./..###..",
  "4":"....#../...##../..#.#../.#..#../#...#../#...#../#######/....#../....#../....#../....#../....#../....#..",
  "5":"#######/#....../#....../#....../####.../....#../.....#./......#/......#/......#/#.....#/.#...#./..###..",
  "6":"...###./..#..../.#...../#....../#....../#.###../##...#./#.....#/#.....#/#.....#/#.....#/.#...#./..###..",
  "7":"#######/......#/.....#./.....#./....#../....#../...#.../...#.../..#..../..#..../..#..../..#..../..#....",
  "8":"..###../.#...#./#.....#/#.....#/.#...#./..###../.#...#./#.....#/#.....#/#.....#/#.....#/.#...#./..###..",
  "9":"..###../.#...#./#.....#/#.....#/#.....#/#.....#/.#...##/..###.#/......#/......#/.....#./....#../.###..."}).map(([k,v])=>[k,v.split("/")]));
/* A character on a split-flap tile: BIG for digits when every character has one, otherwise the 5 × 7 face doubled. */
function flipGlyph(ch,big){if(big&&BIG.g[ch]){const g=BIG.g[ch];return {w:g.w,h:13,at:(i,j)=>g.rows[j]&&g.rows[j][i]==="#"};}const g=F5.g[ch]||F5.g[" "];return {w:g.w*2,h:14,at:(i,j)=>g.rows[j>>1]&&g.rows[j>>1][i>>1]==="#"};}
const flipBig=s=>[...s].every(c=>BIG.g[c]||c===" "||c==="-"||c===":");
/* Every tile in a line of split-flap is the same width: the widest glyph in it, never narrower than a digit. Only a colon is narrow. */
function flipTile(str,big){let w=big?BIG.g["0"].w:10;for(const c of str)if(c!==":"&&c!==" "&&c!=="-")w=Math.max(w,flipGlyph(c,big).w);return w;}
function flipW(str){str=String(str);const big=flipBig(str),tw=flipTile(str,big);let w=0;for(const c of str)w+=c===":"?5:tw+3;return Math.max(0,w-1);}
const FLIPS={};
/* Split-flap text. When a character changes, the top flap falls (old top folding down to the split), then the new bottom flips down over the old one. */
function flipText(fb,str,x,y,o={}){str=String(str);const t=o.t||0,big=flipBig(str),gh=big?13:14,th=gh+2,hh=Math.floor(th/2),col=o.col||[240,234,214],a=o.a==null?1:o.a;
  const st=o.key?(FLIPS[o.key]||(FLIPS[o.key]={s:str,prev:[],t0:[]})):null;
  if(st&&st.s!==str){const old=[...st.s];[...str].forEach((c,i)=>{if(old[i]!==c){st.prev[i]=old[i]||" ";st.t0[i]=t;}});st.s=str;}
  const tw=flipTile(str,big),blank={w:0,at:()=>false};
  let cx=x;[...str].forEach((c,i)=>{
    if(c===":"){fb.rect(cx+1,y+4,2,2,col,a);fb.rect(cx+1,y+th-6,2,2,col,a);cx+=5;return;}
    // A space is a blank tile and a minus a bar on one, so the tiles stay in step as the words change.
    const dash=g=>({w:Math.min(tw,big?5:8),at:(ii,j)=>j>=hh-2&&j<hh}),gl=ch=>ch===" "?blank:ch==="-"?dash():flipGlyph(ch,big);
    const G=gl(c),w=tw+2,gy=y+1,p=st&&st.t0[i]!=null?clamp((t-st.t0[i])/0.34,0,1):1,P=p<1?gl(st.prev[i]||" "):null;
    // Each glyph sits in the middle of its tile.
    const band=(Gl,y0,y1,dy0,dh,bg,sh)=>{if(dh<=0)return;fb.rect(cx,dy0,w,dh,mix(bg,[0,0,0],sh),a);const gx=cx+1+Math.floor((tw-Gl.w)/2);for(let k=0;k<dh;k++){const sy=y0+Math.floor(k*(y1-y0)/dh),j=sy-gy;for(let ii=0;ii<Gl.w;ii++)if(Gl.at(ii,j))fb.px(gx+ii,dy0+k,mix(col,[0,0,0],sh),a);}};
    const TOP=[46,46,52],BOT=[36,36,42];
    if(!P){band(G,y,y+hh,y,hh,TOP,0);band(G,y+hh,y+th,y+hh,th-hh,BOT,0);}
    else if(p<0.5){const q=p/0.5;band(G,y,y+hh,y,hh,TOP,0);band(P,y+hh,y+th,y+hh,th-hh,BOT,0);const fh=Math.round(hh*(1-q));band(P,y,y+hh,y+hh-fh,fh,TOP,q*0.5);}
    else{const q=(p-0.5)/0.5;band(G,y,y+hh,y,hh,TOP,0);band(P,y+hh,y+th,y+hh,th-hh,BOT,0);const fh=Math.round((th-hh)*q);band(G,y+hh,y+th,y+hh,fh,BOT,(1-q)*0.5);}
    /* The hinge: dark across the tile, but a stroke crossing it stays lit (a little dimmer), so 3, 5, 6, 8 and 9 don't look broken. */
    const H=p<1?null:G,hj=hh-1,hx=1+Math.floor((tw-G.w)/2);for(let ii=0;ii<w;ii++){const on=H&&ii>=hx&&H.at(ii-hx,hj);fb.px(cx+ii,y+hh,on?mix(col,[0,0,0],0.35):[8,8,10],a);}
    fb.px(cx,y+hh-1,[70,70,78],a);fb.px(cx+w-1,y+hh-1,[70,70,78],a);cx+=w+1;});
  return cx-x-1;}
/* Every tube is the same width, a space being an unlit one; only a colon's two neon dots are narrow. */
function nixieW(str,sc=1){let w=0;for(const c of String(str))w+=(c===":"?4:10)*sc;return Math.max(0,w-sc);}
/* Nixie tubes: dark glass with a fine mesh, the other cathodes ghosting behind, and the lit numeral glowing orange. A colon is two neon dots that blink. */
function nixieText(fb,str,x,y,o={}){const sc=o.sc||1,t=o.t||0,a=o.a==null?1:o.a;let cx=x;
  for(const c of String(str)){
    if(c===":"){const on=o.blink===false||(t%1)<0.55;for(const yy of [5,10]){fb.disc(cx+1.5*sc,y+yy*sc,1.1*sc,[255,120,40],(on?0.95:0.25)*a);if(on)fb.disc(cx+1.5*sc,y+yy*sc,2.4*sc,[255,90,20],0.15*a);}cx+=4*sc;continue;}
    const tw=9*sc,th=15*sc;fb.rect(cx,y,tw,th,[22,11,7],a);fb.frame(cx,y,cx+tw-1,y+th-1,[64,42,30],0.7*a);for(let yy=y+2;yy<y+th-1;yy+=2)for(let xx=cx+1+((yy>>1)&1);xx<cx+tw-1;xx+=2)fb.px(xx,yy,[40,24,15],a);
    const lit=(G,col,al,glow)=>{G.forEach((row,j)=>[...row].forEach((v,i)=>{if(v!=="#")return;const px=cx+sc+i*sc,py=y+sc+j*sc;fb.rect(px,py,sc,sc,col,al*a);if(glow)for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])fb.add(px+dx*sc,py+dy*sc,[255,80,15],0.2*a);}));};
    lit(NIX["8"],[255,120,40],0.07,false);lit(NIX["0"],[255,120,40],0.05,false);
    if(NIX[c]){const fl=0.92+0.08*Math.sin(t*37+cx);lit(NIX[c],mix([255,150,60],[255,205,130],0.4),fl,true);}
    else if(c==="-")fb.rect(cx+2*sc,y+7*sc,5*sc,sc,[255,170,80],a);else if(c===".")fb.rect(cx+7*sc,y+13*sc,sc,sc,[255,170,80],a);
    cx+=tw+sc;}
  return cx-x-sc;}
/* A big number in the chosen font, right-aligned at xr. Returns its width. */
/* 7-segment: a cell of 2-LED segments for each character, the unlit ones faintly there, in the card's colour (red by default).
   Every cell is the same width; a point lights in the gap after its digit, and a colon is two narrow dots. Letters a segment display can make show too. */
const SEG={"0":"abcdef","1":"bc","2":"abdeg","3":"abcdg","4":"bcfg","5":"acdfg","6":"acdefg","7":"abc","8":"abcdefg","9":"abcdfg","A":"abcefg","B":"cdefg","C":"adef","D":"bcdeg","E":"adefg","F":"aefg","G":"acdef",
  "H":"bcefg","I":"ef","J":"bcde","L":"def","N":"ceg","O":"cdeg","P":"abefg","Q":"abcfg","R":"eg","S":"acdfg","T":"defg","U":"bcdef","V":"cde","Y":"bcdfg","-":"g","_":"d","=":"dg","°":"abfg","'":"b",'"':"bf"," ":""};
const SEG_LOWER={c:"deg",h:"cefg",u:"cde",o:"cdeg"};
const SEG_RECT={a:[2,0,5,2],b:[7,2,2,5],c:[7,9,2,5],d:[2,14,5,2],e:[0,9,2,5],f:[0,2,2,5],g:[2,7,5,2]};
const segOf=c=>SEG_LOWER[c]!==undefined?SEG_LOWER[c]:SEG[c.toUpperCase()];
function segW(str){let w=0;for(const c of String(str))if(c!==".")w+=c===":"?4:11;return Math.max(0,w-2);}
function segText(fb,str,x,y,o={}){const col=o.col||[255,46,32],a=o.a==null?1:o.a,ghost=mix(col,[0,0,0],0.82);let cx=x;const cs=[...String(str)];
  cs.forEach((c,i)=>{
    if(c==="."){fb.rect(cx-2,y+14,2,2,col,a);return;}
    if(c===":"){fb.rect(cx,y+4,2,2,col,a);fb.rect(cx,y+10,2,2,col,a);cx+=4;return;}
    const on=segOf(c)||"";
    for(const [k,[rx,ry,rw,rh]] of Object.entries(SEG_RECT))fb.rect(cx+rx,y+ry,rw,rh,on.includes(k)?col:ghost,a);
    // The point after this digit, unlit unless a "." follows.
    if(cs[i+1]!==".")fb.rect(cx+9,y+14,2,2,ghost,a);
    cx+=11;});
  return Math.max(0,cx-x-2);}
/* A big number from the left in a card's font: flip and nixie draw the digits their own way (a trailing ° in pixels), anything else is the pixel font at sc. Gives back the width. */
function fontNum(fb,font,str,x,y,col,sc,key,t){str=String(str);const deg=str.endsWith("°"),core=deg?str.slice(0,-1):str;
  if(font==="flip"){const w=flipText(fb,core,x,y-1,{key,t,col:mix(col,[240,234,214],0.5)});return w+(deg?fb.text(F5,"°",x+w+1,y,col)+1:0);}
  if(font==="nixie"){const w=nixieText(fb,core,x,y-1,{t});return w+(deg?fb.text(F5,"°",x+w+1,y,col)+1:0);}
  if(font==="segment"){return segText(fb,str,x,y-1,{col});}
  if(font==="space")return fb.text(SPACE,fitText(str,SPACE,false),x,y-2,col);
  if(font==="alagard")return fb.text(ALAGARD,fitText(str,ALAGARD,false),x,y-2,col);
  if(font==="celtic")return fb.text(CELTIC,fitText(str,CELTIC,false),x,y+2,col);
  if((font==="retro64"||font==="comicoro")){const F=TITLE_FONTS[font];return fb.text(F,fitText(str,F,false),x,y-1,col,2);}
  return fb.text(F5,str,x,y,col,sc);}
function bigNum(fb,font,str,xr,y,col,key,t){if(font==="flip"){const w=flipW(str);flipText(fb,str,xr-w,y-1,{key,t,col:mix(col,[240,234,214],0.6)});return w;}
  if(font==="nixie"){const w=nixieW(str);nixieText(fb,str,xr-w,y-1,{t});return w;}
  if(font==="segment"){const w=segW(str);segText(fb,str,xr-w,y-1,{col});return w;}
  if(font==="space"||font==="alagard"||font==="celtic"){const F=TITLE_FONTS[font],t2=fitText(str,F,false),w=fb.tw(F,t2);fb.text(F,t2,xr-w,y-1,col);return w;}
  if((font==="retro64"||font==="comicoro")){const F=TITLE_FONTS[font],t2=fitText(str,F,false),w=fb.tw(F,t2,2);fb.text(F,t2,xr-w,y-2,col,2);return w;}const w=fb.tw(BIG,str);fb.text(BIG,str,xr-w,y,col);return w;}
/* The scrolling speed of the card being drawn, in LEDs a second (its speed field); null is the usual 16. */
let MQ_SPEED=null;
function marquee(fb,f,str,x,y,w,c,t,sc=1,outline=false){const tw=fb.tw(f,str,sc),draw=outline?(...q)=>fb.textO(...q):(...q)=>fb.text(...q);fb.pushClip(x,y-1,w,f.h*sc+2);
  const sp=MQ_SPEED!=null?MQ_SPEED:16;
  if(tw<=w||sp<=0)draw(f,str,x,y,c,sc);
  else{const over=tw-w,hold=1.6,run=over/sp,cyc=2*(hold+run),ph=t%cyc;let off;
    if(ph<hold)off=0;else if(ph<hold+run)off=(ph-hold)*sp;else if(ph<2*hold+run)off=over;else off=over-(ph-2*hold-run)*sp;
    draw(f,str,x-Math.round(off),y,c,sc);}
  fb.popClip();}

/* ---------- example data ---------- */
const TEMPS=[14,14,13,12,11,10,9,9,8,8,7,7], POPS=[0,10,30,70,90,60,30,10,0,0,0,0];
const ROOMS=[["LIVING",[255,170,80],1],["KITCHEN",[255,236,210],1],["OFFICE",[170,90,255],1],["SHELVES",null,1],["PORCH",[255,190,110],1],["BEDROOM",[255,150,80],0],["HALL",[255,200,140],0],["DESK",[80,200,255],1],["BATH",[240,240,255],0],["GARAGE",[220,220,200],0],["BASEMENT",[255,220,180],0],["YARD",[180,255,200],0]];
const NP={title:"STAR TREK: STRANGE NEW WORLDS",sub:"S2 E5   LIVING ROOM",dur:2952};
/* Example sunrise and sunset, used for the sun sensor and to pick a day or night sky when the page opens. */
const SUNT={rise:[7,12],set:[19,2]};
const atHM=(d,[h,m])=>{const x=new Date(d);x.setHours(h,m,0,0);return x;},isDaytime=d=>d>=atHM(d,SUNT.rise)&&d<atHM(d,SUNT.set);
const SEV={adv:[255,206,60],watch:[255,140,40],warn:[255,48,48]};
function tempCol(T){const st=[[-10,[170,120,255]],[0,[90,150,255]],[8,[80,225,215]],[14,[255,205,90]],[22,[255,120,50]],[34,[255,60,40]]];if(T<=st[0][0])return st[0][1];for(let i=1;i<st.length;i++){if(T<=st[i][0])return mix(st[i-1][1],st[i][1],(T-st[i-1][0])/(st[i][0]-st[i-1][0]));}return st[st.length-1][1];}

/* ---------- icons ---------- */
function sun(fb,cx,cy,r,t,rc=[255,200,60],al=1){for(let k=0;k<8;k++){const a=t*0.4+k*Math.PI/4,r0=r*1.4,r1=r*1.8+(r>4?Math.sin(t*3+k)*r*0.1:0);fb.line(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0,cx+Math.cos(a)*r1,cy+Math.sin(a)*r1,rc,0.9*al,0.35*al);}
  fb.disc(cx,cy,r,(X,Y)=>mix([255,238,130],[255,150,30],(Y-(cy-r))/(2*r)),al);}
function cloud(fb,x,y,s,t,dark,al=1){const dx=Math.sin(t*0.6)*s*0.03,C=[[.30,.64,.17],[.50,.54,.22],[.71,.64,.16],[.50,.70,.18]],top=y+s*0.3,bot=y+s*0.82;
  const ys=Math.max(fb.y0,Math.floor(top)),ye=Math.min(fb.y1-1,Math.ceil(bot)),xs=Math.max(fb.x0,Math.floor(x)),xe=Math.min(fb.x1-1,Math.ceil(x+s));
  const c0=dark?[175,184,202]:[255,255,255],c1=dark?[88,96,116]:[165,178,204];
  for(let py=ys;py<=ye;py++)for(let px=xs;px<=xe;px++){const X=px+.5,Y=py+.5;let cov=0;for(const c of C)cov=Math.max(cov,clamp(c[2]*s-Math.hypot(X-(x+c[0]*s+dx),Y-(y+c[1]*s))+.5,0,1));cov*=clamp(bot-Y+.5,0,1);if(cov>0)fb.px(px,py,mix(c0,c1,(Y-top)/(bot-top)),cov*al);}}
function iconPC(fb,x,y,s,t){sun(fb,x+s*0.64,y+s*0.34,s*0.19,t);cloud(fb,x,y,s,t,false);}
function iconCloud(fb,x,y,s,t){cloud(fb,x,y-s*0.08,s,t,true);}
function iconRain(fb,x,y,s,t){cloud(fb,x,y-s*0.14,s,t,true);for(let k=0;k<3;k++){const ph=(t*1.6+k*0.37)%1,dx=x+s*(0.32+k*0.2),dy=y+s*(0.66+ph*0.26);fb.line(dx,dy,dx-s*0.05,dy+s*0.12,[110,170,255],1-ph*0.6,0.3);}}
function iconStorm(fb,x,y,s,t){cloud(fb,x,y-s*0.14,s,t,true);const on=(t%2.2)<1.4?1:0.35;fb.poly([[x+s*0.52,y+s*0.62],[x+s*0.4,y+s*0.82],[x+s*0.5,y+s*0.82],[x+s*0.42,y+s],[x+s*0.64,y+s*0.74],[x+s*0.53,y+s*0.74],[x+s*0.6,y+s*0.62]],[255,220,80],on);}
function iconSnow(fb,x,y,s,t){cloud(fb,x,y-s*0.14,s,t,true);for(let k=0;k<3;k++){const ph=(t*0.5+k*0.33)%1,fx=x+s*(0.3+k*0.2)+Math.sin(t*2+k)*s*0.04,fy=y+s*(0.66+ph*0.3);fb.px(fx,fy,[235,242,255],1-ph*0.5);if(s>14){fb.px(fx-1,fy,[200,215,245],0.4);fb.px(fx+1,fy,[200,215,245],0.4);}}}
function iconHot(fb,x,y,s,t){sun(fb,x+s/2,y+s/2,s*0.24,t,[255,150,40]);}
const iconFor=p=>p>=50?iconRain:p>=20?iconCloud:iconPC;
function iconSun(fb,x,y,s,t){sun(fb,x+s/2,y+s/2,s*0.22,t);}
function iconFog(fb,x,y,s,t){cloud(fb,x,y-s*0.18,s,t,true);for(let k=0;k<3;k++){const yy=y+s*(0.6+k*0.13),o=(k%2)*s*0.12;fb.line(x+s*0.12+o,yy,x+s*0.78+o,yy,[200,205,215],0.85);}}
function iconHail(fb,x,y,s,t){cloud(fb,x,y-s*0.14,s,t,true);for(let k=0;k<3;k++){const ph=(t*1.8+k*0.33)%1;fb.disc(x+s*(0.3+k*0.2),y+s*(0.66+ph*0.28),Math.max(0.8,s*0.06),[235,242,255],1-ph*0.5);}}
function iconStormRain(fb,x,y,s,t){iconRain(fb,x,y,s,t);const on=(t%2.2)<1.4?1:0.35;fb.poly([[x+s*0.52,y+s*0.55],[x+s*0.42,y+s*0.75],[x+s*0.5,y+s*0.75],[x+s*0.44,y+s*0.92],[x+s*0.62,y+s*0.68],[x+s*0.54,y+s*0.68],[x+s*0.6,y+s*0.55]],[255,220,80],on);}
function iconPour(fb,x,y,s,t){cloud(fb,x,y-s*0.14,s,t,true);for(let k=0;k<5;k++){const ph=(t*2.4+k*0.23)%1,dx=x+s*(0.22+k*0.14),dy=y+s*(0.62+ph*0.3);fb.line(dx,dy,dx-s*0.06,dy+s*0.14,[100,160,255],1-ph*0.5,0.3);}}
function iconSleet(fb,x,y,s,t){cloud(fb,x,y-s*0.14,s,t,true);for(let k=0;k<3;k++){const ph=(t*(k%2?0.6:1.6)+k*0.37)%1,dx=x+s*(0.32+k*0.2),dy=y+s*(0.66+ph*0.26);if(k%2)fb.px(dx,dy,[235,242,255],1-ph*0.5);else fb.line(dx,dy,dx-s*0.05,dy+s*0.12,[110,170,255],1-ph*0.6,0.3);}}
function iconWind(fb,x,y,s,t){const c=[205,218,238];for(let k=0;k<3;k++){const yy=y+s*(0.3+k*0.2),L=s*(0.5+0.22*(k%2)),o=Math.sin(t*3+k)*s*0.05,x1=x+s*0.1+L+o;fb.line(x+s*0.1+o,yy,x1,yy,c,0.9);fb.px(x1+1,yy-1,c,0.8);}}
function iconWindCloud(fb,x,y,s,t){cloud(fb,x,y-s*0.22,s*0.9,t,true);iconWind(fb,x,y+s*0.22,s*0.8,t);}
function iconCold(fb,x,y,s,t){flake(fb,x+s*0.5,y+s*0.45,s*0.3,[170,215,255]);fb.px(x+s*0.85,y+s*0.15,[255,255,255],0.5+0.5*Math.sin(t*3));}
function iconSmoke(fb,x,y,s,t){for(let k=0;k<3;k++){const ph=(t*0.3+k/3)%1;fb.disc(x+s*(0.3+k*0.2),y+s*(0.7-ph*0.4),s*(0.12+ph*0.08),[170,140,110],1-ph*0.6);}fb.disc(x+s*0.72,y+s*0.25,s*0.1,[220,80,50]);}
function iconFreezing(fb,x,y,s,t){iconRain(fb,x,y-s*0.06,s,t);fb.line(x+s*0.2,y+s*0.95,x+s*0.8,y+s*0.95,[190,225,255]);}
function iconBlizzard(fb,x,y,s,t){cloud(fb,x,y-s*0.16,s,t,true);for(let k=0;k<4;k++){const ph=(t*1.4+k*0.25)%1;fb.px(x+s*(0.2+k*0.18)+ph*s*0.2,y+s*(0.62+ph*0.3),[235,242,255],1-ph*0.4);}}
function iconDrizzle(fb,x,y,s,t){cloud(fb,x,y-s*0.14,s,t,true);for(let k=0;k<4;k++){const ph=(t*0.9+k*0.25)%1;fb.px(x+s*(0.25+k*0.16),y+s*(0.66+ph*0.26),[130,180,255],1-ph*0.6);}}
function iconRainbow(fb,x,y,s,t){const B=[[255,70,60],[255,200,50],[80,210,90],[70,150,255]];B.forEach((c,i)=>{fb.pushClip(x,y,s,s*0.62);fb.ring(x+s*0.5,y+s*0.62,s*0.42-i*1.1,1,c);fb.popClip();});}
function iconAurora(fb,x,y,s,t){for(let i=0;i<s;i++){const yy=y+s*(0.45+0.15*Math.sin(i*0.5+t*1.5));for(let j=0;j<s*0.3;j++)fb.px(x+i,yy-j,mix([60,255,160],[170,90,255],j/(s*0.3)),0.7*(1-j/(s*0.3)));}}
function iconExc(fb,x,y,s,t){tri(fb,x+s/2,y+s/2,Math.max(8,s*0.75),[255,170,60]);}
function iconPCN(fb,x,y,s,t){iconMoon(fb,x+s*0.3,y-s*0.12,s*0.8,t);cloud(fb,x,y,s,t,true);}
function dropIcon(fb,x,y,c){fb.px(x+1,y,c);fb.px(x+1,y+1,c);fb.rect(x,y+2,3,2,c);fb.px(x+1,y+4,c);}
function isoBox(fb,cx,cy,s){const h=s/2,q=s/4;
  fb.poly([[cx-h,cy-q],[cx,cy],[cx,cy+h],[cx-h,cy+q]],[196,134,72]);
  fb.poly([[cx,cy],[cx+h,cy-q],[cx+h,cy+q],[cx,cy+h]],[150,94,48]);
  fb.poly([[cx,cy-h],[cx+h,cy-q],[cx,cy],[cx-h,cy-q]],[236,188,128]);
  fb.line(cx-q,cy-q*1.5,cx+q,cy-q*0.5,[250,226,180]);fb.line(cx-q,cy-q*0.5+0.5,cx-q,cy+q*1.4,[235,205,150],0.8);}
function bell(fb,cx,cy,s,t){const ph=t%2.4,sw=Math.sin(ph*16)*Math.max(0,1-ph/1.1)*3*s;
  const g=(X,Y)=>mix([255,238,150],[214,126,28],(Y-(cy-10*s))/(16*s));
  fb.disc(cx+sw*0.3,cy-10*s,1.3*s,[230,170,60]);fb.disc(cx+sw*0.3,cy-5*s,4.5*s,g);
  fb.poly([[cx-4.5*s+sw*0.3,cy-5*s],[cx+4.5*s+sw*0.3,cy-5*s],[cx+7*s+sw*0.6,cy+5*s],[cx-7*s+sw*0.6,cy+5*s]],g);
  fb.rect(cx-8*s+sw*0.6,cy+5*s,16*s,Math.max(1,1.5*s),[255,212,96]);fb.disc(cx-sw*0.4,cy+7.6*s,1.6*s,[255,222,130]);}
/* Warning triangle. The "!" is 2 px wide on big triangles and 1 px on small ones, so the triangle is centred on the line
   between two columns (big) or on the middle of one column (small), and the "!" is always dead centre. */
function tri(fb,cx,cy,s,c){const big=s>=16,ic=Math.round(cx),mx=big?ic:ic+0.5,cols=big?[ic-1,ic]:[ic];
  fb.poly([[mx,cy-s/2],[mx+s/2+0.5,cy+s/2],[mx-s/2-0.5,cy+s/2]],(X,Y)=>mix(mix(c,[255,255,255],0.35),c,(Y-(cy-s/2))/s));
  for(const X of cols){for(let y=Math.round(cy-s*0.14);y<=Math.round(cy+s*0.2);y++)fb.px(X,y,[0,0,0]);fb.px(X,Math.round(cy+s*0.36),[0,0,0]);}}
function funnel(fb,cx,cy,s,t,c){const top=cy-s*0.5,hgt=s*1.0;
  for(let j=0;j<hgt;j++){const u=j/hgt,half=Math.pow(1-u,1.9)*s*0.44+0.6,ox=(Math.sin(t*2.6+u*4)*0.1+u*u*0.3)*s*u-s*0.05,xc=cx+ox;
    for(let x=Math.floor(xc-half);x<=Math.ceil(xc+half);x++){const edge=clamp(half-Math.abs(x+.5-xc)+.5,0,1),band=0.5+0.5*Math.sin((x-xc)*0.9-t*8+j*0.9);fb.px(x,top+j,mix([105,108,122],mix([240,240,248],c,0.1),band),edge);}}}
function art(fb,x,y,s,t){fb.vgrad(x,y,s,s,[24,34,96],[96,32,120]);for(let i=0;i<7;i++)fb.px(x+hash(i*3.3)*s,y+hash(i*5.1)*s*0.55,[255,255,255],0.45+0.45*Math.sin(t*2+i));
  fb.pushClip(x,y,s,s);fb.disc(x+s*0.7,y+s*1.05,s*0.55,(X,Y)=>mix([255,190,120],[190,70,60],(Y-(y+s*0.5))/(s*0.5)));fb.line(x+s*0.18,y+s*0.4,x+s*0.34,y+s*0.34,[235,240,255],0.9);fb.popClip();}
function progressBar(fb,x,y,w,h,f,t){fb.rect(x,y,w,h,[40,44,58]);const fw=Math.round(w*f);for(let i=0;i<fw;i++){const c=hsv(200+90*i/w,0.65,1);for(let j=0;j<h;j++)fb.px(x+i,y+j,c);}fb.disc(x+fw,y+h/2,h*0.9+0.4,[255,255,255],0.6+0.4*Math.sin(t*2.2));}
function tag(fb,label,x,y,c){const w=fb.tw(F3,label);fb.rect(x,y,w+2,7,c);fb.text(F3,label,x+1,y+1,[0,0,0]);}

/* A stylised porch camera frame, like a Protect snapshot with a detection box. */
function cam(fb,x,y,w,h,kind,S){
  fb.pushClip(x,y,w,h);
  fb.vgrad(x,y,w,h,[40,46,56],[18,20,26]);
  const lx=x+w*0.14,ly=y+h*0.16,R=h*0.38;
  for(let yy=Math.floor(y);yy<y+h;yy++)for(let xx=Math.floor(x);xx<x+w;xx++){const d2=((xx+.5-lx)**2+(yy+.5-ly)**2)/(R*R);fb.add(xx,yy,[255,176,96],0.5*Math.exp(-d2));}
  fb.disc(lx,ly,Math.max(1,h*0.035),[255,238,196]);
  const dW=h*0.42,dx=x+w*0.64-dW/2,dy=y+h*0.12,dH=h*0.72;
  fb.rect(dx-1,dy-1,dW+2,dH+1,[100,74,52]);fb.rect(dx,dy,dW,dH,[66,40,28]);fb.rect(dx+dW*0.2,dy+dH*0.1,dW*0.6,dH*0.24,[42,60,84]);fb.px(dx+dW*0.8,dy+dH*0.55,[226,192,120]);
  const fy=y+h*0.84;fb.vgrad(x,fy,w,y+h-fy+1,[72,66,60],[36,33,30]);
  if(kind==="person"){
    const px=x+w*0.36,hr=h*0.095,hy=y+h*0.34,skin=(X)=>X<px-h*0.07?[92,66,52]:[30,27,33];
    fb.poly([[px-h*0.22,y+h],[px+h*0.22,y+h],[px+h*0.16,hy+h*0.22],[px-h*0.16,hy+h*0.22]],skin);
    fb.disc(px,hy+h*0.27,h*0.16,skin);fb.disc(px,hy,hr,skin);
    const bx0=px-h*0.27,by0=hy-hr-2;fb.frame(bx0,by0,px+h*0.27,y+h-1,[90,245,140]);
    if(by0-7>=y)tag(fb,"PERSON",bx0,by0-7,[90,245,140]);else tag(fb,"PERSON",bx0+1,by0+1,[90,245,140]);
  }else{
    const bs=h*0.3,bcx=x+w*0.36,bcy=y+h*0.74;isoBox(fb,bcx,bcy,bs);
    const bx0=bcx-bs/2-2,by0=bcy-bs/2-2;fb.frame(bx0,by0,bcx+bs/2+2,bcy+bs/2+2,[255,212,60]);
    if(by0-7>=y)tag(fb,"PACKAGE",bx0,by0-7,[255,212,60]);else tag(fb,"PACKAGE",bx0+1,by0+1,[255,212,60]);
  }
  fb.rect(x,Math.floor(y+((S.t*18)%h)),w,1,[255,255,255],0.07);
  fb.popClip();
}

/* ---------- weather layers (used as full scenes and as the ambient layer behind the strip) ---------- */
function rainDrops(fb,S,k,dens=55,heavy=1){const {W,H,t}=S,N=Math.floor(W*H/dens),sc=Math.sqrt(H/32);
  for(let i=0;i<N;i++){const r1=hash(i*3.1+1),r2=hash(i*7.7+2),r3=hash(i*1.3+3),r4=hash(i*5.9+4);
    const sp=(34+r2*36)*sc*1.6*heavy,L=(3+r3*5)*sc*heavy,P=(H+L)/sp,sd=0.5,Pt=P+sd,local=(t+r4*Pt*7)%Pt,x=r1*(W+H*0.25),near=r3>0.6,sl=0.22*heavy;
    if(local<P){const yh=local*sp;for(let j=0;j<L;j++){const yy=yh-j;if(yy<0||yy>=H-2)continue;fb.px(x-yy*sl,yy,mix([175,215,255],[50,100,220],j/L),(1-j/L)*(near?0.95:0.55)*k);}}
    else{const age=(local-P)/sd,xi=x-(H-2)*sl,R=0.5+age*(3+r3*3)*sc,a=(1-age)*k;
      fb.px(xi-R,H-2,[120,180,255],a*0.8);fb.px(xi+R,H-2,[120,180,255],a*0.8);
      if(age<0.5){const up=Math.sin(age*Math.PI*2)*2.5*sc;fb.px(xi-age*5,H-3-up,[190,225,255],(0.5-age)*1.6*k);fb.px(xi+age*5,H-3-up,[190,225,255],(0.5-age)*1.6*k);}}}}
/* Snow. heavy (0 to 1) adds more flakes, big 2 x 2 flakes in front that fall faster, a wind drift and a deeper line of settled snow. */
function snowFlakes(fb,S,k,dens=40,heavy=0,cols){const {W,H,t}=S,N=Math.floor(W*H/dens),drift=1.5+heavy*14;
  for(let i=0;i<N;i++){const r1=hash(i*2.9+1),r2=hash(i*6.3+2),r3=hash(i*4.1+3),big=heavy>0&&r3>1-0.14*heavy,near=big||r3>0.72,sp=(4+r2*6)*(near?1.6:1)*(1+heavy*(big?1.2:0.6));
    const y=((t*sp+r1*97)%(H+4))-2,xx=(((r1*977%1)*W+Math.sin(t*(0.6+r3)+i)*(near?3:1.6)+t*drift*(near?1.3:1))%W+W)%W,c=cols?(near?cols[0]:cols[1]||mix(cols[0],[0,0,0],0.3)):near?[238,244,255]:[165,180,212];
    if(big){fb.px(xx,y,c,k);fb.px(xx+1,y,c,k*0.9);fb.px(xx,y+1,c,k*0.9);fb.px(xx+1,y+1,c,k*0.75);continue;}
    fb.px(xx,y,c,k*(near?1:0.65));if(near){fb.px(xx+1,y,c,k*0.35);fb.px(xx,y+1,c,k*0.35);}}
  const base=1.6+heavy*2.2;for(let x=0;x<W;x++){const g=base+(0.8+heavy*0.6)*Math.sin(x*0.2)+0.5*Math.sin(x*0.07+1);for(let j=0;j<g;j++)fb.px(x,H-1-j,[205,218,242],k*(j+1>g?g-j:1)*0.9);}}
function lightning(fb,S,k){const {W,H,t}=S,P=4.7,n=Math.floor(t/P),ph=t-n*P;if(ph>0.45)return;const a=(1-ph/0.45)*k,x0=12+hash(n*3.7)*(W-24);
  for(let x=Math.max(0,Math.floor(x0-60));x<Math.min(W,x0+60);x++){const g=Math.exp(-(((x-x0)/26)**2));for(let y=0;y<H*0.6;y++)fb.add(x,y,[120,110,210],0.22*g*a*(1-y/(H*0.6)));}
  if(ph<0.25){let x=x0,y=0;while(y<H*0.85){const nx=x+(hash(n*13+y)*2-1)*3,ny=y+2+hash(n*7+y)*2;fb.line(x,y,nx,ny,[235,230,255],a);x=nx;y=ny;}}}
function aurora(fb,S,k){const {W,H,t}=S;
  for(let x=0;x<W;x++){const c=H*(0.62+0.14*Math.sin(x*0.03+t*0.3)+0.07*Math.sin(x*0.011-t*0.2)),ray=(0.72+0.28*Math.sin(x*0.09+Math.sin(t*0.5+x*0.017)*2.2))*(0.55+0.45*Math.sin(x*0.008+t*0.12));
    for(let y=0;y<H;y++){const I=(y<=c?Math.exp(-(c-y)/(H*0.55)):Math.exp(-(((y-c)/(H*0.06))**2)))*ray;fb.px(x,y,mix([40,255,150],[160,70,255],(c-y)/(H*0.6)),0.55*I*k);}}
  const ns=Math.floor(W*H/140);for(let i=0;i<ns;i++){const tw=0.5+0.5*Math.sin(t*(1+hash(i)*2)+i);fb.add(Math.floor(hash(i*9.1)*W),Math.floor(hash(i*4.3+7)*H*0.8),[200,210,255],0.35*tw*k);}}
/* Day and night skies for every condition. The night rain, snow and storm skies and the clear-night aurora are the originals;
   day skies stay mid-bright so outlined text still reads, and with the strip showing (media playing) only weather that moves is drawn, faintly. */
const CONDS=["clear","pcloudy","overcast","fog","windy","windyc","rain","pouring","lightning","storm","hail","snow","sleet","heavysnow","hot","exceptional","cold","smoke","freezing","blizzard","drizzle","rainbow","aurora"],PRECIP=new Set(["rain","pouring","storm","hail","snow","sleet","heavysnow","freezing","blizzard","drizzle"]);
/* Home Assistant's weather states and the sky each one draws. sunny and clear-night are the same sky by day and by night. */
const HA_WX=[["sunny","clear",1],["clear-night","clear",0],["partlycloudy","pcloudy"],["cloudy","overcast"],["fog","fog"],["windy","windy"],["windy-variant","windyc"],["rainy","rain"],["pouring","pouring"],
  ["lightning","lightning"],["lightning-rainy","storm"],["hail","hail"],["snowy","snow"],["snowy-rainy","sleet"],["exceptional","exceptional"]];
/* PixelBar extras: not Home Assistant states, forced by an automation with "extra" in the weather message. */
const EXTRAS=[["heavysnow","heavy snow"],["hot","extreme heat"],["cold","extreme cold"],["smoke","wildfire smoke"],["freezing","freezing rain"],["blizzard","blizzard"],["drizzle","drizzle"],["rainbow","rainbow"],["aurora","aurora"]];
const kBase=k=>String(k||"").replace(/-day$/,""),kDay=k=>/-day$/.test(k||""),isSnow=k=>/snow$|blizzard/.test(kBase(k));
const SKY={clear:[[[22,78,170],[74,146,220]],null],pcloudy:[[[28,84,168],[82,150,214]],[[4,6,16],[10,14,30]]],overcast:[[[88,96,110],[140,148,160]],[[10,11,16],[20,21,28]]],
  rain:[[[52,62,80],[96,106,122]],[[4,8,22],[8,20,46]]],storm:[[[36,40,50],[70,74,82]],[[6,6,16],[16,12,30]]],snow:[[[84,92,108],[124,132,148]],[[10,14,28],[20,26,44]]],
  heavysnow:[[[96,102,116],[136,142,156]],[[12,16,30],[24,30,50]]],hot:[[[120,72,40],[226,142,58]],[[14,8,18],[46,22,22]]],
  fog:[[[118,124,136],[164,168,178]],[[14,16,22],[34,36,44]]],hail:[[[44,50,64],[80,88,104]],[[8,10,20],[20,22,36]]],lightning:[[[30,32,44],[58,60,72]],[[6,6,16],[18,14,34]]],
  pouring:[[[34,42,58],[58,68,86]],[[3,6,18],[6,16,38]]],sleet:[[[70,78,94],[112,120,136]],[[8,12,26],[18,24,42]]],windy:[[[40,110,200],[110,170,225]],[[4,8,20],[12,18,36]]],
  windyc:[[[70,90,120],[130,150,175]],[[8,10,20],[20,24,36]]],exceptional:[[[90,40,70],[190,100,60]],[[26,10,24],[60,24,26]]],
  cold:[[[110,160,215],[196,222,245]],[[6,12,30],[18,32,60]]],smoke:[[[120,72,44],[196,132,76]],[[26,12,10],[58,28,18]]],freezing:[[[76,92,112],[126,142,158]],[[6,10,24],[16,24,44]]],
  blizzard:[[[140,150,166],[186,192,204]],[[16,20,34],[34,40,60]]],drizzle:[[[92,102,118],[136,146,160]],[[6,10,22],[12,22,44]]],rainbow:[[[50,110,190],[130,180,225]],[[6,10,24],[16,22,40]]],
  aurora:[[[20,34,70],[60,80,120]],[[2,6,14],[6,20,26]]]};
/* Cloud cover hangs from the top, a shade darker than the brighter sky near the horizon, so its lower edge reads as a cloud base. */
const BAND={overcast:[[[100,108,122],[78,86,100],.6],[[26,27,34],[16,17,22],.6]],rain:[[[62,70,86],[42,50,64],.55],null],storm:[[[36,38,46],[20,22,28],.6],null],
  snow:[[[98,104,118],[78,84,98],.5],null],heavysnow:[[[108,114,126],[86,92,104],.55],null],
  hail:[[[62,68,84],[40,46,60],.55],[[20,22,32],[12,13,20],.5]],lightning:[[[36,38,48],[20,22,30],.6],[[16,14,28],[8,8,16],.55]],pouring:[[[50,58,74],[32,38,52],.62],null],
  sleet:[[[88,96,110],[68,74,88],.52],null],freezing:[[[92,106,124],[70,82,100],.5],null],drizzle:[[[104,112,126],[84,92,106],.5],null],blizzard:[[[170,176,188],[150,156,170],.6],[[36,40,56],[24,28,42],.6]],windyc:[[[120,132,150],[92,104,124],.5],[[24,26,36],[14,15,22],.5]]};
function cloudBand(fb,S,k,cov,c0,c1,sp){const {W,H,t}=S;for(let x=0;x<W;x++){const u=x*0.045+t*sp,n=0.25*Math.sin(u*1.7)+0.15*Math.sin(u*3.1+1.3)+0.1*Math.sin(u*6.3+0.7),e=H*(cov+0.45*n),tex=0.5+0.5*Math.sin(x*0.21+t*sp*9+Math.sin(x*0.05)*3);
  for(let y=0;y<Math.min(H,e+1);y++)fb.px(x,y,mix(c0,c1,clamp(y/Math.max(1,e),0,1)*0.8+tex*0.2),clamp(e-y,0,1)*k);}}
function puffs(fb,S,k,n,day,spm=1){const {W,t}=S;for(let i=0;i<n;i++){const s=20+hash(i*4.7)*16,span=W+s*2,x=((hash(i*9.3)*span+t*(1.2+hash(i)*1.4)*spm)%span)-s,y=-5+hash(i*2.1)*8;cloud(fb,x,y,s,t,!day,day?k:k*0.35);}}
/* Fog: three soft bands drifting sideways at different speeds. */
function fogBands(fb,S,k,day){const {W,H,t}=S,c=day?[238,240,244]:[112,120,138];for(let j=0;j<3;j++){const yc=H*(0.25+j*0.28),sp=2+j*1.5;
  for(let x=0;x<W;x++){const u=x*0.03+t*sp*0.05+j*2,th=3+2*Math.sin(u*1.3)+1.2*Math.sin(u*3.1+j);for(let y=Math.floor(yc-th);y<=yc+th;y++){const a=(1-Math.abs(y+.5-yc)/(th+0.5))*0.34*k;if(a>0)fb.px(x,y,c,a);}}}}
/* Hail: fast white pellets that bounce off the bottom edge and fade. */
function hailStones(fb,S,k){const {W,H,t}=S,N=Math.floor(W*H/70);for(let i=0;i<N;i++){const r1=hash(i*2.3+1),r2=hash(i*5.7+2),r3=hash(i*8.9+3),sp=70+r2*40,fall=(H+4)/sp,P=fall+0.45,ph=(t+r3*P*5)%P,x=r1*W;
  let y,a=1;if(ph<fall)y=ph*sp-4;else{const b=(ph-fall)/0.45;y=H-2-Math.sin(b*Math.PI)*5*(1-b);a=1-b;}
  fb.px(x,y,[235,242,255],k*a);fb.px(x+1,y,[200,212,235],k*a*0.7);fb.px(x,y+1,[200,212,235],k*a*0.7);}}
/* Wind: long wavy streaks racing right to left, and a few leaves tumbling with them. */
function windStreaks(fb,S,k,day){const {W,H,t}=S,N=Math.max(6,Math.floor(W/14)),c=day?[255,255,255]:[150,165,200];
  for(let i=0;i<N;i++){const r1=hash(i*3.1+7),r2=hash(i*6.7+1),sp=90+r2*80,L=10+r1*22,span=W+L,x0=W-((t*sp+r1*span*3)%span),y0=3+hash(i*9.2)*(H-8);
    for(let j=0;j<L;j++){const x=x0+j,yy=y0+Math.sin((x+t*40)*0.08+i)*1.6;fb.px(x,yy,c,k*0.55*(1-j/L)*Math.min(1,j/3));}}
  for(let i=0;i<Math.max(2,Math.floor(W/60));i++){const sp=60+hash(i)*40,x=W-((t*sp+hash(i*4.4)*W*2)%(W+20)),y=H*0.3+Math.sin(t*3+i)*H*0.25+hash(i*1.7)*8,cc=i%2?[230,150,50]:[140,190,70];
    fb.px(x,y,cc,k);fb.px(x+1,y+((Math.floor(t*8+i)%2)?1:-1),cc,k*0.6);}}
/* Exceptional: slow amber bands moving diagonally across a warning-tinted sky. It moves; it never flashes. */
function exceptionalSky(fb,S,k,day){const {W,H,t}=S,c=day?[255,196,110]:[210,120,70];for(let x=0;x<W;x++)for(let y=0;y<H;y++){const v=0.5+0.5*Math.sin((x+y*1.4)*0.11-t*0.7);if(v>0.8)fb.px(x,y,c,(v-0.8)*1.8*k);}}
/* Extreme cold: frost creeping in from the edges, with a few crystals glinting. */
function frostEdges(fb,S,k){const {W,H,t}=S,grow=0.9+0.1*Math.sin(t*0.3);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const e=Math.min(x/30,(W-1-x)/30,(H-1-y)/11,y/7)/grow;if(e>1.2)continue;
  const v=hash(x*13.1+y*7.7),vv=0.5*v+0.5*hash(Math.floor(x/2)*3.3+Math.floor(y/2)*9.9);if(vv<e)continue;const tw=hash(x*1.9+y*5.3)>0.97?0.5+0.5*Math.sin(t*4+x):0;
  fb.px(x,y,mix([170,210,250],[240,250,255],vv),k*clamp(0.35+(1-e)*0.5+tw*0.4,0,1));}}
/* Wildfire smoke: brown-orange haze drifting over everything, and ash falling slowly. */
function smokeHaze(fb,S,k,day){const {W,H,t}=S,c=day?[210,150,90]:[110,60,36];for(let j=0;j<2;j++)for(let x=0;x<W;x++){const u=x*0.02+t*0.03*(j+1)+j*3,yc=H*(0.35+j*0.35),th=6+3*Math.sin(u*1.7);
  for(let y=Math.floor(yc-th);y<=yc+th;y++){const a=(1-Math.abs(y+.5-yc)/(th+0.5))*0.3*k;if(a>0)fb.px(x,y,c,a);}}
  const n=Math.floor(W*H/160);for(let i=0;i<n;i++){const sp=2+hash(i*3.3)*3,y=((t*sp+hash(i*7.1)*60)%(H+2))-1,x=(hash(i*1.7)*W+Math.sin(t+i)*2)%W;fb.px(x,y,[170,160,150],k*0.6);}}
/* Freezing rain: icicles along the top edge and a glaze of ice along the bottom that glints. */
function iceGlaze(fb,S,k){const {W,H,t}=S;for(let x=0;x<W;x++){const L=hash(x*4.7)>0.8?1+Math.floor(hash(x*2.3)*4):hash(x*8.1)>0.5?1:0;for(let j=0;j<L;j++)fb.px(x,j,[200,230,255],k*(1-j/(L+1))*0.9);
  const g=hash(x*6.1+Math.floor(t*3))>0.93?1:0;fb.px(x,H-1,[180,215,245],k*0.8);fb.px(x,H-2,[210,235,255],k*(0.35+0.6*g));}}
/* Blizzard: visibility comes and goes in slow white-outs. */
function whiteout(fb,S,k,day){const {W,H,t}=S,a=(0.5+0.5*Math.sin(t*0.9))*(0.5+0.5*Math.sin(t*0.37+1)),c=day?[228,232,240]:[120,128,150];fb.rect(0,0,W,H,c,a*0.38*k);}
/* Rainbow: seven bands on an arc whose centre sits below the strip. At night it's a faint white moonbow. */
function rainbowArc(fb,S,k,day){const {W,H,t}=S,R=Math.min(110,W*0.42),cx=W*0.56,cy=R+3,B=[[255,70,60],[255,150,40],[255,230,60],[80,210,90],[70,150,255],[90,90,220],[160,90,220]];
  for(let y=0;y<H;y++)for(let x=Math.max(0,Math.floor(cx-R-1));x<Math.min(W,cx+R+1);x++){const d=R-Math.hypot(x+.5-cx,y+.5-cy);if(d<0||d>=7)continue;
    const c=day?B[Math.floor(d)]:[210,215,230],sh=0.75+0.25*Math.sin(t*0.8+x*0.05);fb.px(x,y,c,k*(day?0.6:0.25)*sh);}}
function sunGlow(fb,S,k,cx,cy,r,c){const R=r*5;for(let y=0;y<S.H;y++)for(let x=Math.max(0,Math.floor(cx-R));x<Math.min(S.W,cx+R);x++){const d=Math.hypot(x+.5-cx,y+.5-cy);if(d<R)fb.add(x,y,c,k*0.35*(1-d/R)**2);}}
function stars(fb,S,k,n){const {W,H,t}=S;for(let i=0;i<n;i++){const tw=0.5+0.5*Math.sin(t*(1+hash(i)*2)+i);fb.add(Math.floor(hash(i*9.1)*W),Math.floor(hash(i*4.3+7)*H*0.8),[200,210,255],0.35*tw*k);}}
function heatHaze(fb,S,k){const {W,H,t}=S;for(let x=0;x<W;x++){for(let j=0;j<3;j++){const yy=(H+4)-((t*5+j*11+Math.sin(x*0.13+t*1.7+j)*2.5)%(H+8));fb.px(x,yy,[255,200,120],0.16*k);}
  for(let y=H-4;y<H;y++)fb.add(x,y,[255,170,80],k*0.14*(0.6+0.4*Math.sin(x*0.35+t*5+y)));}}
function sky(fb,S,k,kind,strip){const c=kBase(kind),day=kDay(kind),{W,H,t}=S,hot=c==="hot",sx=Math.round(W*(W>=256?0.6:0.5));if(!SKY[c])return;
  if(strip){if(!PRECIP.has(c)){if(hot&&day)heatHaze(fb,S,k*0.5);if(c==="cold")frostEdges(fb,S,k*0.4);if(c==="smoke")smokeHaze(fb,S,k*0.5,day);if(c==="windy"||c==="windyc")windStreaks(fb,S,k*0.4,day);if(c==="lightning")lightning(fb,S,k*0.5);if(c==="fog")fogBands(fb,S,k*0.35,day);return;}fb.vgrad(0,0,W,H,...SKY[c][day?0:1],k*(day?0.22:0.7));}
  else if(!day&&c==="clear"){aurora(fb,S,k);return;}
  else{const g=SKY[c][day?0:1];fb.vgrad(0,0,W,H,g[0],g[1],k);
    if(day&&(c==="clear"||c==="pcloudy"||hot||c==="windy")){sunGlow(fb,S,k,sx,hot?10:9,hot?7:5,hot?[255,190,90]:[255,230,150]);sun(fb,sx,hot?10:9,hot?6:4.5,t,hot?[255,170,60]:[255,214,90],k);}
    if(!day&&(c==="pcloudy"||hot||c==="windy")){stars(fb,S,k,Math.floor(W*H/(hot?220:160)));fb.disc(sx,9,4.5,[250,238,190],k);fb.disc(sx+2,7.4,3.8,mix(g[0],g[1],7.4/(H-1)),k);}
    if(c==="pcloudy")puffs(fb,S,k,Math.max(2,Math.round(W/110)),day);if(c==="windy")puffs(fb,S,k,Math.max(2,Math.round(W/140)),day,5);
    const B=BAND[c]&&BAND[c][day?0:1];if(B)cloudBand(fb,S,k,B[2],B[0],B[1],c==="storm"||c==="lightning"?0.18:c==="windyc"?0.4:0.06);
    if(c==="fog")fogBands(fb,S,k,day);if(c==="windy"||c==="windyc"||c==="blizzard")windStreaks(fb,S,k,day);if(c==="exceptional")exceptionalSky(fb,S,k,day);
    if(c==="cold"){if(day)sun(fb,sx,8,3.5,t,[235,240,255],k*0.8);else stars(fb,S,k,Math.floor(W*H/140));frostEdges(fb,S,k);}
    if(c==="smoke"){fb.disc(sx,10,day?5:3.5,day?[210,70,40]:[200,110,50],k*0.85);smokeHaze(fb,S,k,day);}
    if(c==="rainbow"){if(day){sunGlow(fb,S,k,W*0.15,8,4,[255,230,150]);sun(fb,W*0.15,8,3.5,t,[255,214,90],k);}else stars(fb,S,k,Math.floor(W*H/180));puffs(fb,S,k,Math.max(1,Math.round(W/200)),day,0.6);rainbowArc(fb,S,k,day);}
    if(c==="aurora"){stars(fb,S,k,Math.floor(W*H/120));aurora(fb,S,k*(day?0.55:1));aurora(fb,Object.assign({},S,{t:t*1.3+20}),k*(day?0.3:0.6));}
    if(hot&&day)heatHaze(fb,S,k);}
  const p=strip?k*0.5:k;
  if(c==="rain")rainDrops(fb,S,p);else if(c==="storm"){rainDrops(fb,S,strip?k*0.55:k,40,1.35);lightning(fb,S,p);}
  else if(c==="pouring")rainDrops(fb,S,strip?k*0.6:k,24,1.7);else if(c==="lightning"&&!strip)lightning(fb,S,k);else if(c==="hail")hailStones(fb,S,strip?k*0.5:k);
  else if(c==="sleet"){rainDrops(fb,S,p*0.8,90);snowFlakes(fb,S,(strip?k*0.5:k)*0.8,70);}
  else if(c==="freezing"){rainDrops(fb,S,p,60,0.9);if(!strip)iceGlaze(fb,S,k);}else if(c==="drizzle")rainDrops(fb,S,p*0.8,150,0.55);
  else if(c==="blizzard"){snowFlakes(fb,S,strip?k*0.6:k,strip?12:7,1.7);if(!strip)whiteout(fb,S,k,day);}
  else if(c==="snow")snowFlakes(fb,S,strip?k*0.55:k);else if(c==="heavysnow")snowFlakes(fb,S,strip?k*0.6:k,strip?14:9,1);}
/* Effects around a card: the words inside the weather. M marks the words' pixels and Z the columns of the boxes that asked.
   Rain: the near drops come down in front of the words and stop where they hit a letter, with splashes along the tops; the far ones stay behind.
   Snow: it settles on the tops of the letters over half a minute from since, and the near flakes drift in front. Same drops and flakes as the sky behind. */
const RAIN_FX={rain:[55,1],storm:[40,1.35],pouring:[24,1.7],drizzle:[150,0.55],freezing:[60,0.9],sleet:[90,1]};
const SNOW_FX={snow:s=>[40,0],heavysnow:s=>[s?14:9,1],blizzard:s=>[s?12:7,1.7],sleet:s=>[70,0]};
function weatherFront(fb,S,kind,M,Z,strip,since,zr){const c=kBase(kind),{W,H,t}=S,k=strip?0.55:1,top=(x,y)=>M[y*W+x]&&!M[(y-1)*W+x],day=kDay(kind);
  // The sky's own layers over the words, only in the boxes that asked: the sun, see-through clouds, fog, wind and lightning.
  const front=draw=>{for(const r of zr){fb.pushClip(r.x,0,r.w,H);try{draw();}finally{fb.popClip();}}},hot=c==="hot",sx=Math.round(W*(W>=256?0.6:0.5));
  if(day&&(c==="clear"||c==="pcloudy"||hot||c==="windy"))front(()=>sun(fb,sx,hot?10:9,hot?6:4.5,t,hot?[255,170,60]:[255,214,90],k*0.9));
  if(c==="pcloudy")front(()=>puffs(fb,S,k*0.5,Math.max(2,Math.round(W/110)),day));
  if(c==="fog")front(()=>fogBands(fb,S,k*0.45,day));
  if(c==="windy"||c==="windyc"||c==="blizzard")front(()=>windStreaks(fb,S,k*0.6,day));
  if(c==="storm"||c==="lightning")front(()=>lightning(fb,S,k*0.6));
  const rf=RAIN_FX[c],sf=SNOW_FX[c]&&SNOW_FX[c](strip);
  if(rf){const [dens,heavy]=rf,N=Math.floor(W*H/dens),sc=Math.sqrt(H/32),sl=0.22*heavy;
    for(let i=0;i<N;i++){const r1=hash(i*3.1+1),r2=hash(i*7.7+2),r3=hash(i*1.3+3),r4=hash(i*5.9+4);if(r3<=0.6)continue;
      const sp=(34+r2*36)*sc*1.6*heavy,L=(3+r3*5)*sc*heavy,P=(H+L)/sp,Pt=P+0.5,local=(t+r4*Pt*7)%Pt,x=r1*(W+H*0.25);if(local>=P)continue;
      const yh=local*sp;let land=H;for(let yy=0;yy<H;yy++){const xx=Math.round(x-yy*sl);if(xx>=0&&xx<W&&M[yy*W+xx]){land=yy;break;}}
      const hx=Math.round(x-Math.min(yh,H-1)*sl);if(land===H&&!(hx>=0&&hx<W&&Z[hx]))continue;
      if(land<H&&yh>=land){const age=(yh-land)/sp;if(age<0.12){const xx=Math.round(x-land*sl),a=(1-age/0.12)*0.9*k;fb.px(xx,land-1,[205,232,255],a);fb.px(xx-1,land-2,[170,210,255],a*0.6);fb.px(xx+1,land-2,[170,210,255],a*0.6);}continue;}
      for(let j=0;j<L;j++){const yy=yh-j;if(yy<0||yy>=H-2||yy>=land)continue;fb.px(x-yy*sl,yy,mix([175,215,255],[50,100,220],j/L),(1-j/L)*0.95*k);}}
    const rate=0.06*heavy*heavy,f=Math.floor(t*10);for(let y=1;y<H;y++)for(let x=0;x<W;x++)if(top(x,y)&&hash(x*13.7+y*3.1+f*0.917)<rate)fb.px(x,y-1,[210,235,255],0.8*k);}
  if(sf){const [dens,heavy]=sf,lvl=clamp((t-since)/30,0,1)*0.9;
    for(let y=1;y<H;y++)for(let x=0;x<W;x++)if(top(x,y)&&hash(x*7.13+y*1.7)<lvl)fb.px(x,y-1,[236,242,255],0.95*k);
    const N=Math.floor(W*H/dens),drift=1.5+heavy*14;
    for(let i=0;i<N;i++){const r1=hash(i*2.9+1),r2=hash(i*6.3+2),r3=hash(i*4.1+3),big=heavy>0&&r3>1-0.14*heavy,near=big||r3>0.72;if(!near)continue;
      const sp=(4+r2*6)*1.6*(1+heavy*(big?1.2:0.6)),y=((t*sp+r1*97)%(H+4))-2,xx=(((r1*977%1)*W+Math.sin(t*(0.6+r3)+i)*3+t*drift*1.3)%W+W)%W;
      if(!Z[Math.floor(xx)])continue;fb.px(xx,y,[238,244,255],k);if(big){fb.px(xx+1,y,[238,244,255],k*0.9);fb.px(xx,y+1,[238,244,255],k*0.9);fb.px(xx+1,y+1,[238,244,255],k*0.75);}}}}
const AMB={},AMBFULL={};
for(const c of CONDS)for(const kd of [c,c+"-day"]){AMB[kd]=(fb,S,k)=>sky(fb,S,k,kd,true);AMBFULL[kd]=(fb,S,k)=>sky(fb,S,k,kd,false);}

/* ---------- widgets ---------- */
const WX={pc:{T:"12°",hl:"H14 L7",cond:"CLOUDY",icon:iconPC},rain:{T:"11°",hl:"H13 L7",cond:"RAIN",icon:iconRain},storm:{T:"10°",hl:"H13 L7",cond:"STORMS",icon:iconStormRain},
  snow:{T:"-3°",hl:"H-1 L-6",cond:"SNOW",icon:iconSnow},hot:{T:"36°",hl:"H37 L24",cond:"HOT",icon:iconHot},clear:{T:"27°",hl:"H31 L19",cond:"CLEAR",icon:(...a)=>iconMoon(...a)},
  sunny:{T:"22°",hl:"H24 L11",cond:"SUNNY",icon:iconSun},pcn:{T:"11°",hl:"H19 L9",cond:"CLOUDY",icon:iconPCN},overcast:{T:"13°",hl:"H14 L8",cond:"OVERCAST",icon:iconCloud},fog:{T:"8°",hl:"H12 L6",cond:"FOG",icon:iconFog},hail:{T:"14°",hl:"H17 L9",cond:"HAIL",icon:iconHail},
  lightning:{T:"19°",hl:"H24 L15",cond:"LIGHTNING",icon:iconStorm},pouring:{T:"12°",hl:"H14 L9",cond:"POURING",icon:iconPour},sleet:{T:"1°",hl:"H2 L-2",cond:"SLEET",icon:iconSleet},
  windy:{T:"16°",hl:"H18 L9",cond:"WINDY",icon:iconWind},windyc:{T:"13°",hl:"H15 L8",cond:"WINDY",icon:iconWindCloud},exceptional:{T:"31°",hl:"H33 L22",cond:"EXCEPTIONAL",icon:iconExc},
  cold:{T:"-29°",hl:"H-26 L-35",cond:"EXTREME COLD",icon:iconCold},smoke:{T:"27°",hl:"H29 L18",cond:"SMOKE",icon:iconSmoke},freezing:{T:"-1°",hl:"H0 L-4",cond:"FREEZING RAIN",icon:iconFreezing},
  blizzard:{T:"-12°",hl:"H-10 L-17",cond:"BLIZZARD",icon:iconBlizzard},drizzle:{T:"9°",hl:"H11 L6",cond:"DRIZZLE",icon:iconDrizzle},rainbow:{T:"17°",hl:"H19 L10",cond:"RAINBOW",icon:iconRainbow},
  aurora:{T:"4°",hl:"H9 L-2",cond:"AURORA",icon:iconAurora},hotn:{T:"29°",hl:"H37 L24",cond:"HOT",icon:(...a)=>iconMoon(...a)}};
const condOf=k=>{const c=kBase(k),d=kDay(k);return c==="clear"?(d?"sunny":"clear"):c==="pcloudy"?(d?"pc":"pcn"):c==="hot"?(d?"hot":"hotn"):c==="heavysnow"?"snow":c;};
const WIDGETS={
  clock(fb,x,y,w,h,S){const date=dstr(S.now),dw=fb.tw(F3,date),y0=y+Math.floor((h-22)/2);
    bigClock(fb,S,0,y0,(X,Y)=>mix([255,242,216],[255,148,58],(Y-y0)/12),{center:x+w/2});fb.text(F3,date,x+Math.floor((w-dw)/2),y0+17,[150,140,130]);},
  weather(fb,x,y,w,h,S){const d=WX[(S.st&&S.st.cond)||"pc"],v=S.wkind?wxView(S.wkind,S):null,T=v?v.T:d.T,hl=v?v.hl:d.hl,cond=v?wxName(S.wkind):d.cond;d.icon(fb,x+2,y+3,18,S.t);fb.text(F5,T,x+23,y+5,v&&v.temp==null?[150,150,160]:tempCol(parseInt(T,10)));fb.text(F3,hl,x+23,y+14,[150,150,160]);fb.text(F3,cond,x+3,y+24,[120,170,230]);},
  indoor(fb,x,y,w,h,S){const T=w<30?"21°":"21.4°";fb.text(F3,w<44?"IN":"INSIDE",x+3,y+2,[130,135,150]);fb.text(F5,T,x+3,y+9,[110,235,210]);dropIcon(fb,x+3,y+19,[90,160,255]);fb.text(F5,"45%",x+9,y+18,[120,175,255]);if(w>=44)spark(fb,x+3,y+27,w-6,3);},
  fcast(fb,x,y,w,h,S){const T=S.outline?(...q)=>fb.textO(...q):(...q)=>fb.text(...q),F=S.fc||{temps:TEMPS,pops:POPS,icon:iconFor};if(!F.temps.length)return;const n=Math.max(1,Math.min(F.temps.length,Math.floor((w-2)/18))),cw=(w-2)/n;
    for(let i=0;i<n;i++){const mid=x+2+i*cw+cw/2,hr=F.lbls&&F.lbls[i]!=null?F.lbls[i]:hourLbl(F.hrs&&F.hrs[i]!=null?F.hrs[i]:(S.now.getHours()+1+i)%24),ts=F.temps[i]+"°";
      T(F3,hr,Math.round(mid-fb.tw(F3,hr)/2),y+2,[130,135,150]);(F.icons?F.icons[i]:F.icon(F.pops[i]))(fb,Math.round(mid-6),y+8,12,S.t+i*0.3);
      T(F3,ts,Math.round(mid-fb.tw(F3,ts)/2),y+22,tempCol(F.temps[i]));
      const bw=Math.round((cw-4)*F.pops[i]/100);if(bw>0)fb.rect(Math.round(mid-bw/2),y+29,bw,1,[70,140,255]);}},
  lights(fb,x,y,w,h,S){const on=ROOMS.filter(r=>r[2]).length,s=on+" ON";fb.text(F3,"LIGHTS",x+3,y+2,[130,135,150]);fb.text(F3,s,x+w-3-fb.tw(F3,s),y+2,[255,190,110]);
    const rp=Math.floor((h-8)/6),nc=Math.max(1,Math.floor((w-4)/58)),cw=(w-4)/nc;
    for(let i=0;i<Math.min(ROOMS.length,rp*nc);i++){const [nm,c,o]=ROOMS[i],cx=Math.round(x+3+Math.floor(i/rp)*cw),cy=y+9+(i%rp)*6,col=c||hsv(S.t*90+i*40,0.8,1);
      if(o){fb.rect(cx,cy+1,3,3,col);fb.px(cx+1,cy,col,0.35);fb.px(cx+1,cy+4,col,0.35);fb.px(cx-1,cy+2,col,0.35);fb.px(cx+3,cy+2,col,0.35);}
      else fb.frame(cx,cy+1,cx+2,cy+3,[55,58,66]);
      fb.text(F3,nm,cx+6,cy,o?[205,210,220]:[80,84,94]);}},
  np(fb,x,y,w,h,S){const pos=npPos(S),rem=NP.dur-pos;let tx=x+3;if(w>=140){tvIcon(fb,x+12,y+16);tx=x+26;}const tw=x+w-3-tx;
    marquee(fb,F3,NP.title,tx,y+3,tw,[240,236,230],S.t);fb.text(F3,S.npPaused?"S2 E5   PAUSED":"S2 E5",tx,y+10,S.npPaused?[255,200,110]:[150,150,170]);
    progressBar(fb,tx,y+19,tw,2,pos/NP.dur,S.t);fb.text(F3,"-"+mmss(rem),tx,y+24,[140,140,160]);
    if(tw>=70){const e="ENDS "+hm(new Date(S.now.getTime()+rem*1000));fb.text(F3,e,tx+tw-fb.tw(F3,e),y+24,[140,140,160]);}},
  pkg(fb,x,y,w,h,S){isoBox(fb,x+11,y+15,16);fb.text(F5,"PACKAGE",x+22,y+4,[255,200,110]);fb.text(F3,"FRONT PORCH",x+22,y+13,[190,185,175]);fb.text(F3,hm(S.now),x+22,y+20,[150,145,140]);},
  adv(fb,x,y,w,h,S){advCard(fb,x,y,w,h,S,ADVS[V.advKey]);},
  match(fb,x,y,w,h,S){const sc=S.score||[2,1],wide=w>=150,str=sc[0]+"-"+sc[1],sw=flipW(str),mid=wide?x+w/2:x+33+sw/2;drawImg(fb,"espn-361",x+2,y+2);if(wide)drawImg(fb,"espn-388",x+w-30,y+2,0.9);
    /* The score on split-flap tiles, so a goal flips it. */
    flipText(fb,str,Math.round(mid-sw/2),y+3,{key:"match:"+(S.id||"")+":"+x,t:S.t});const l=wide?"67'  LIVE  AT COVENTRY":"67'  LIVE";fb.text(F3,l,Math.round(wide?mid-fb.tw(F3,l)/2:x+33),y+24,[120,230,140]);},
  tomorrow(fb,x,y,w,h,S){fb.text(F3,"TOMORROW",x+3,y+2,[130,135,150]);iconRain(fb,x+3,y+9,18,S.t);fb.text(F5,"9°",x+25,y+10,tempCol(9));fb.text(F3,"L3",x+25,y+19,[150,150,160]);fb.text(F3,"RAIN AM",x+3,y+26,[120,170,230]);},
  wxin(fb,x,y,w,h,S){WIDGETS.weather(fb,x,y,48,h,S);WIDGETS.indoor(fb,x+48,y,w-48,h,S);}
};
function spark(fb,x,y,w,h){for(let i=0;i<w;i++){const u=i/(w-1),T=19.5+2.2*Math.sin(u*Math.PI*1.6-0.6)+0.4*Math.sin(u*17),v=clamp((T-17)/5.5,0,1),yy=y+h-1-Math.round(v*(h-1)),c=tempCol(T);fb.px(x+i,yy,c);for(let Y=yy+1;Y<y+h;Y++)fb.px(x+i,Y,c,0.18);}}
function npPos(S){return S.np!=null?S.np:(1421+S.t)%NP.dur;}
function vsep(fb,x,H){for(let yy=3;yy<H-3;yy+=2)fb.px(x,yy,[36,40,50]);}

const GLANCE={
  "1x2":[["clock",44],["weather",50],["indoor","*"]],
  "1x4":[["clock",44],["weather",56],["indoor",50],["fcast","*"]],
  "1x6":[["clock",44],["weather",56],["indoor",50],["fcast",108],["lights","*"]],
  "1x8":[["clock",44],["weather",56],["indoor",50],["fcast",180],["lights","*"]],
  "1x10":[["clock",44],["weather",56],["indoor",50],["fcast",180],["tomorrow",100],["lights","*"]]
};

/* ---------- gallery scenes ---------- */
function sGlance(fb,S){const items=GLANCE[S.id],fixed=items.reduce((a,[,w])=>a+(w==="*"?0:w),0);let x=0;
  items.forEach(([name,w],i)=>{const ww=w==="*"?S.W-fixed:w;if(i>0)vsep(fb,x,S.H);fb.pushClip(x,0,ww,S.H);WIDGETS[name](fb,x,0,ww,S.H,S);fb.popClip();x+=ww;});}

const spanLbl=m=>m%60===0?"+"+m/60+"H":"+"+Math.round(m)+"M";
/* A chart sensor's series as an area or bars. Rain and snow use a log scale up to 10 and 5 mm/h; anything else runs up to "max" or its own peak. */
function drawSeries(fb,x,y,w,h,S,s){const v=s.values||[],n=v.length;if(n<2||w<8)return;const gh=h-7,base=y+gh,sweep=(S.t*0.25)%1,st=s.style||"area",wet=st==="rain"||st==="snow",bars=st==="bars",c0=s.col||[255,190,110];
  /* line draws a 1-pixel line, area fills under it; smooth (on either) runs a Catmull-Rom curve through the values. Style "smooth" is a smooth line. */
  const line=st==="line"||st==="smooth",sm=st==="smooth"||(!!s.smooth&&(line||st==="area")),ys=[],at=i=>v[Math.max(0,Math.min(n-1,i))];
  const curve=f=>{const k=Math.floor(f),t=f-k,p0=at(k-1),p1=at(k),p2=at(k+1),p3=at(k+2);return Math.max(0,0.5*(2*p1+(p2-p0)*t+(2*p0-5*p1+4*p2-p3)*t*t+(3*p1-p0-3*p2+p3)*t*t*t));};
  const top=wet?Math.log1p(st==="snow"?5:10):(s.max||Math.max(...v)||1),val=q=>wet?clamp(Math.log1p(Math.max(0,q))/top,0,1):clamp(q/top,0,1);
  const col=j=>st==="snow"?mix([90,110,170],[235,242,255],j/gh):st==="rain"?mix([40,90,220],[150,215,255],j/gh):mix(mix(c0,[0,0,0],0.6),c0,j/gh);let peak=0;
  for(let i=0;i<w;i++){const u=i/(w-1);let q;
    if(line){const f=u*(n-1),k=Math.min(n-2,Math.floor(f)),r=f-k;q=val(sm?curve(f):v[k]*(1-r)+v[k+1]*r);peak=Math.max(peak,q);ys[i]=base-1-Math.round(q*(gh-1));continue;}
    if(bars){const k=Math.floor(i*n/w);if(i<w-1&&Math.floor((i+1)*n/w)!==k&&w/n>=3)continue;q=val(v[Math.min(n-1,k)]);}
    else{const f=u*(n-1),k=Math.min(n-2,Math.floor(f)),r=f-k;q=val(sm?curve(f):v[k]*(1-r)+v[k+1]*r);}
    peak=Math.max(peak,q);const bh=Math.ceil(q*gh),sh=0.18*Math.max(0,1-Math.abs(u-sweep)*12);for(let j=0;j<bh;j++)fb.px(x+i,base-1-j,col(j),0.5+sh+(j===bh-1?0.4:0));}
  if(line)for(let i=0;i<ys.length;i++){const y0=ys[i],y1=i?ys[i-1]:y0;for(let yy=Math.min(y0,y1);yy<=Math.max(y0,y1);yy++)fb.px(x+i,yy,c0,yy===y0?1:0.7);}
  fb.rect(x,base,w,1,[60,80,120],0.8);if(wet&&peak<0.02){const m=st==="snow"?"NO SNOW":"NO RAIN";fb.textO(F3,m,x+Math.round((w-fb.tw(F3,m))/2),base-8,[140,160,200]);}
  const span=(n-1)*(s.interval||60),L=s.labels&&s.labels.length?s.labels:["NOW",spanLbl(span/2),spanLbl(span)],lc=[140,160,200],last=L[L.length-1];
  fb.textO(F3,L[0],x,base+2,lc);if(L.length>1)fb.textO(F3,last,x+w-fb.tw(F3,last),base+2,lc);if(L.length>2&&w>80)fb.textO(F3,L[1],x+Math.round(w/2-fb.tw(F3,L[1])/2),base+2,lc);}
/* The rain zone draws the chart sensor it's pointed at (the zone's "chart", "rain" by default). Until one arrives it shows the forecast. The page's demo uses the example sensor. */
function nowcast(fb,x,y,w,h,S,snow,kind,zone){const ck=(zone&&zone.chart)||"rain",cs=SENS[ck];
  if(cs&&cs.type==="chart"&&(live.SN.has(ck)||!S.wxp))drawSeries(fb,x,y,w,h,S,Object.assign({},cs,{style:cs.style==="rain"&&snow?"snow":cs.style}));else if(kind)fcCard(fb,x,y-4,w,32,S,kind);}
/* A weather scene: the sky, a caption, then the rain chart or the forecast and the clock when there's room. */
function sWeather(fb,S,kind){const {W}=S,L=wxView(kind,S).cap,c=capCol(kind);sky(fb,S,1,kind,false);
  fb.textO(F5,L[0],3,3,c[0]);fb.textO(F5,L[1],3,12,c[1]);fb.textO(F3,L[2],3,23,[160,190,225]);
  if(W>=256){const nx=Math.max(60,fb.tw(F5,L[0])+12,fb.tw(F5,L[1])+12,fb.tw(F3,L[2])+10),mw=W-nx-48;if(PRECIP.has(kBase(kind)))nowcast(fb,nx,4,mw,24,S,isSnow(kind),kind);else fcCard(fb,nx,0,mw,32,S,kind);
    bigClock(fb,S,0,4,[255,236,210],{outline:1,right:W-6});fb.textO(F3,dstr(S.now),W-40,22,[150,160,180]);}
  else{const s2=hm(S.now);fb.textO(F5,s2,W-4-fb.tw(F5,s2),3,[255,236,210]);}}

const ALERTS={
  heat:{sev:"adv",title:"HEAT ADVISORY",l1:"FEELS LIKE 38°",l2:"UNTIL THU @20:00",long:"DRINK WATER AND CHECK ON NEIGHBOURS",icon:"heat"},
  advisory:{sev:"adv",title:"WEATHER ADVISORY",l1:"FREEZING DRIZZLE TONIGHT",l2:"UNTIL @09:00",long:"ROADS AND SIDEWALKS MAY BE ICY",icon:"tri"},
  twatch:{sev:"watch",title:"TORNADO WATCH",l1:"CONDITIONS FAVOUR TORNADOES",l2:"UNTIL @21:00",long:"KEEP AN EYE ON THE SKY AND ON ALERTS",icon:"funnel"},
  blizzard:{sev:"warn",title:"BLIZZARD WARNING",l1:"STAY OFF THE ROADS",l2:"UNTIL @09:00",long:"WHITEOUTS AND DRIFTING SNOW, TRAVEL NOT ADVISED",icon:"flake"},
  smoke:{sev:"warn",title:"SMOKE ALARM",l1:"SMOKE DETECTED, BASEMENT",l2:"",long:"SMOKE DETECTED IN THE BASEMENT",icon:"tri"},
  tswarn:{sev:"warn",title:"THUNDERSTORM WARNING",l1:"HAIL AND 90 KM/H GUSTS",l2:"UNTIL @21:30",long:"LARGE HAIL AND DAMAGING WIND, STAY INDOORS",icon:"tri"},
  twarn:{sev:"warn",title:"TORNADO WARNING",l1:"TAKE COVER NOW",l2:"UNTIL @21:15",long:"GO TO A BASEMENT OR AN INNER ROOM AWAY FROM WINDOWS",icon:"funnel"}
};
function sAlert(fb,S,a){const {W,H,t}=S,c=a.col||SEV[a.sev],br=a.sev==="warn"?0.5+0.5*Math.sin(t*Math.PI*2):1;
  for(let x=0;x<W;x++){const k=Math.max(0,1-x/(W*0.7));if(k>0)for(let y=0;y<H;y++)fb.px(x,y,c,0.13*k*(a.sev==="warn"?0.6+0.4*br:1));}
  if(a.icon==="heat")for(let x=0;x<W;x++)for(let k=0;k<4;k++){const yy=(H+4)-((t*6+k*9+Math.sin(x*0.15+t*2+k)*2)%(H+8));fb.px(x,yy,[255,120,40],0.18);}
  if(a.sev==="warn")fb.frame(0,0,W-1,H-1,c,0.3+0.55*br);else if(a.sev==="watch")fb.frame(0,0,W-1,H-1,c,0.45);
  fb.rect(3,3,2,H-6,c);
  const n=a.n||{},Wt=n.big&&W>=128?bigAt(fb,n,W-6,8,mix(c,[255,255,255],0.45),"al:"+a.key,t)-2:W;
  if(a.img&&IMGS[a.img])drawImg(fb,a.img,3,2);else if(a.ico&&ICONS[a.ico])ICONS[a.ico](fb,17,16,t,pc("icon",c));else if(a.icon==="heat")sun(fb,17,16,5.5,t,[255,150,40]);else if(a.icon==="tri")tri(fb,17,16,20,c);else if(a.icon==="flake")flake(fb,17,16,9,[220,235,255]);else funnel(fb,17,17,20,t,c);
  const x0=31,tc=pc("title",mix(c,[255,255,255],0.45)),soft=pc("text",[205,198,190]),dc=pc("detail",[160,155,150]);
  const mt=S.ft!=null?S.ft:t;
  if(a.tf){marquee(fb,a.tf,a.title,x0,2,Wt-x0-4,tc,mt,1,true);if(2+a.tf.h+6<=H)marquee(fb,F3,a.l1,x0,2+a.tf.h+1,Wt-x0-4,soft,mt+0.8);}
  else if(Wt<256||x0+fb.tw(F5,a.title,2)>Wt-(Wt>=384?160:4)){marquee(fb,F5,a.title,x0,3,Wt-x0-4,tc,mt,1,true);marquee(fb,F3,a.l1,x0,13,Wt-x0-4,soft,mt+0.8);fb.text(F3,a.l2,x0,21,dc);}
  else{const tw=fb.tw(F5,a.title,2);fb.textO(F5,a.title,x0,3,tc,2);
    marquee(fb,F5,a.l1,x0,21,(Wt>=384?tw:Wt-x0-60),soft,t);
    if(Wt>=384){const rx=x0+tw+16,rw=Wt-rx-6;marquee(fb,F5,a.long,rx,5,rw,[225,220,210],t);fb.text(F3,a.l2+"   ISSUED @17:42",rx,15,dc);{const s2=hm(S.now);fb.textO(F5,s2,Wt-4-fb.tw(F5,s2),22,[255,236,210]);}}
    else{const r=a.l2;fb.text(F3,r,Wt-4-fb.tw(F3,r),23,dc);}}
  thinBar(fb,x0,H-4,Wt-4-x0,n.prog,c);}

function sNP(fb,S){const {W,t}=S,pos=npPos(S),f=pos/NP.dur,rem=NP.dur-pos,end=hm(new Date(S.now.getTime()+rem*1000)),white=[255,244,232],dim=[150,150,170];
  tvIcon(fb,15,16);
  if(W<256){marquee(fb,F5,NP.title,31,4,W-34,white,t);fb.text(F3,NP.sub,31,13,dim);progressBar(fb,31,21,W-35,2,f,t);fb.text(F3,mmss(pos),31,25,[140,140,160]);const r="-"+mmss(rem);fb.text(F3,r,W-4-fb.tw(F3,r),25,[140,140,160]);return;}
  const tx=34,rc=W-46,big=W>=512;
  if(big)fb.text(F5,NP.title,tx,2,white,2);else marquee(fb,F5,NP.title,tx,3,rc-tx-8,white,t);
  fb.text(F3,NP.sub,tx,big?19:12,dim);progressBar(fb,tx,big?26:20,rc-tx-10,big?2:3,f,t);if(!big)fb.text(F3,mmss(pos),tx,26,[140,140,160]);
  fb.text(F3,"ENDS",rc,4,[140,140,160]);fb.text(F5,end,rc,11,[255,236,210]);fb.text(F3,"-"+mmss(rem),rc,22,[140,140,160]);}

function sDoor(fb,S){const {W,H,t}=S,time=hm(S.now),camR=0;
  fb.pushClip(0,0,W-camR,H);for(let k=0;k<5;k++){const age=((t*0.55)+k/5)%1;fb.ring(15,16,4+age*W*0.55,1.5,mix([255,200,90],[255,60,150],age),(1-age)*0.55);}fb.popClip();
  bell(fb,15,16,1,t);const white=[255,244,232],soft=[200,190,185];
  if(W<256){fb.textO(F5,"FRONT DOOR",31,7,white);fb.textO(F3,"DOORBELL "+time,31,18,soft);}
  else{fb.textO(F5,"FRONT DOOR",32,3,white,2);fb.textO(F5,"DOORBELL  "+time,32,21,soft);if(W>=384)fb.textO(F5,"SOMEONE IS AT THE DOOR",170,21,[170,160,155]);}
  if(camR)cam(fb,W-camR,0,camR,H,"person",S);}
function sPkg(fb,S){const {W,H,t}=S,time=hm(S.now),camR=0;
  fb.pushClip(0,0,W-camR,H);const n=Math.floor(W*H/80);for(let i=0;i<n;i++){const x=Math.floor(hash(i*2.3+5)*W),y=Math.floor(hash(i*6.1+9)*H),tw=0.5+0.5*Math.sin(t*3+i*1.7);
    if(tw>0.65){const a=(tw-0.65)*2.8,c=hsv(30+hash(i)*30,0.5,1);fb.add(x,y,c,a);fb.add(x-1,y,c,a*0.35);fb.add(x+1,y,c,a*0.35);fb.add(x,y-1,c,a*0.35);fb.add(x,y+1,c,a*0.35);}}fb.popClip();
  const b=Math.abs(Math.sin(t*3.2))*Math.max(0,1-((t%3)/1.2))*3,soft=[200,190,180];isoBox(fb,15,17-b,20);
  if(W<256){fb.textO(F5,"PACKAGE",31,6,(X,Y)=>mix([255,236,160],[255,150,50],(Y-6)/6));fb.textO(F3,"FRONT PORCH "+time,31,17,soft);}
  else{fb.textO(F5,"PACKAGE",32,3,(X,Y)=>mix([255,236,160],[255,150,50],(Y-3)/13),2);fb.textO(F3,"DETECTED "+time,120,8,[170,160,150]);fb.textO(F5,"AT THE FRONT PORCH",32,21,soft);}
  if(camR)cam(fb,W-camR,0,camR,H,"package",S);}
function sNight(fb,S){const {W,H}=S;aurora(fb,S,1);
  const cs=clockStr(S),ds=dstr(S.now);bigClock(fb,S,0,5,[255,118,68],{outline:1,center:W/2,a:0.9});fb.textO(F3,ds,Math.round((W-fb.tw(F3,ds))/2),22,[170,110,90]);
  if(W>=384){const m="TOMORROW 9° RAIN AM";fb.textO(F3,m,W-4-fb.tw(F3,m),H-7,[120,130,170]);}}

const SCENES={glance:sGlance,np:sNP,night:sNight,door:sDoor,pkg:sPkg,
  heat:(fb,S)=>sAlert(fb,S,ALERTS.heat),advisory:(fb,S)=>sAlert(fb,S,ALERTS.advisory),twatch:(fb,S)=>sAlert(fb,S,ALERTS.twatch),twarn:(fb,S)=>sAlert(fb,S,ALERTS.twarn)};
for(const c of ["clear","pcloudy","overcast","rain","snow","storm","hot"])SCENES[c]=(fb,S)=>sWeather(fb,S,c+(state.sky==="day"?"-day":""));
const ORDER=["glance","np","clear","pcloudy","overcast","rain","snow","storm","hot","heat","advisory","twatch","twarn","door","pkg","night"];
const SCENE_ST={heat:{cond:"hot"}};

const LOGO_HEX={"WHU": {"28": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000202030e13161c282f263b462f4d5b365d6f3b6b7f3f758c417e9643849e4489a34489a343849e417e963f758c3b6b7f365d6e2f4d5b263b461c282f0f1417020203000000000000000000000000000000343f4429a2d43891be4380a84d72955665855d5a776758726c5269785a6f816175846274714257785468735267694d646757705d5b775665854e72954480a83891bd29a1d3343f440000000000000000000000003a474d53698b7d2c3baf7c85b1818ab4858eceafb5cdadb3cfb2b7b1818aba8f97c099a0823543cfb0b6ccacb2a06570e0ccd0843947d6bcc1ad7a83995a667d2c3b5567873a474d0000000000000000000000003a474d536a8b7d2c3bb07e87d3b8bdebdee0b58890caa9afa56d78e2d0d39d616ca56d78813341ceb0b5ceafb5c5a1a8d5bbc0b1818ad8c0c4cfb3b8b98c957d2c3b5567873a474d0000000000000000000000003a474d536a8b7d2c3b8b4350a46c77a46b768c4452b4858ea66f79bb9098a16671ac7982b98e96ab7780b88c94b5878fa269739a5b67914d59995a65a7707a7d2c3b5567873a474d0000000000000000000000003a474d536a8b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3bb78b93b68b93d6bcc1c9a7adb68890b5878fa06670bb9198b68a92bb92997d2c3b7d2c3b7d2c3b7d2c3b7d2c3b5567873a474d0000000000000000000000003a474d536a8b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b9b5d69904b578c44518e4754893f4d893f4c853a489c5f6a9a5c6794515d7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b5567873a474d0000000000000000000000003a474d536a8b7d2c3b7d2c3b7d2c3b7d2c3b82333bd3a640a86a3d7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3ba4643dd6ab4083353b7d2c3b7d2c3b7d2c3b7d2c3b5567873a474d0000000000000000000000003a474d536a8b7d2c3b7d2c3b7d2c3b83353bd7ad40f5d641ce9f3e7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3bc8963df5d641dbb24085373b7d2c3b7d2c3b7d2c3b5567873a474d0000000000000000000000003a474d536a8b7d2c3b7d2c3b7d2c3bac6f3defcd3feecc40883c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b85383bedca40eecd3fb1773e7d2c3b7d2c3b7d2c3b5567873a474d0000000000000000000000003a474d536a8b7d2c3b7d2c3b7d2c3bd3a640d5a83ec7943dd8ad4083343b7d2c3b7d2c3b7d2c3b7d2c3b81323bd4a83fcc9b3ed1a33ed8ad407d2d3b7d2c3b7d2c3b5567873a474d000000000000000000000000364247526b8d7d2c3b7d2c3b9e5c3db67d3d7e2e3b7f2f3bc9983edab04083363b7d2c3b7d2c3b82333bd6ab3fcfa03e80303b7e2d3bb2763da3633d7d2c3b7d2c3b54698a39464c0000000000000000000000002930334c74987d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7f2f3bcc9b3edcb34085373b83353bd9ae40d2a43e80313b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b4e71942d36390000000000000000000000001112134184ad7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b80303bce9f3edeb640dbb140d4a73e81323b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b4382aa1517180000000000000000000000000000003084ad7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b883c3bf0cf40edcb408c413b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b3286af010101000000000000000000000000000000255873713d517d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b86393bdfb740d9ad3fcf9f3de2bb40883c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b733b4e265b77000000000000000000000000000000000000171d26526b8d7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b873b3be1ba40dbb03f84353b82333bd5a93ee3be408a3e3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b53698a1820290000000000000000000000000000000000000101012f7b9f7a31417d2c3b7d2c3b7d2c3b893d3be2bc40ddb33f85373b7d2c3b7d2c3b83343bd7ac3ee5c0408b413c7d2c3b7d2c3b7d2c3b7a3040307da20101010000000000000000000000000000000000000000001b1e27506e907d2c3b7d2c3b8a3f3be4bf40dfb63f86383b7d2c3b7d2c3b7d2c3b7d2c3b84353bdaaf3fe7c2408d433c7d2c3b7d2c3b526b8d1c212b0000000000000000000000000000000000000000000000000000002b556f694960873a3be6c140e1b93f873a3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b85373bdcb23fe8c441893e3b6a475e2b59740000000000000000000000000000000000000000000000000000000000000503042f7193724454bf8a3e883c3b873d4a7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b7d2c3b863b4986383bbe893e7444533073960603040000000000000000000000000000000000000000000000000000000000000000000905072c769a6949607d2c3bac7882a66f79b1818aa06670ad7b84a46c76c29da4b68a927d2c3b6a475e2c779c090607000000000000000000000000000000000000000000000000000000000000000000000000000000040405245e7a53698a7d3140934f5ca16671a26872b3838c9b5d68914d597f324154688826607d0405060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001829363282a962546f7d2c3b7d2c3b7d2c3b7d2c3b62536d3382aa182b390000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000304051b40533183ac5764845763823284ac1b415504040600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003040432414833424a040405000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"}, "WXM": {"28": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a0a0a0000000000000000000000000000001d1d1d2929290000000000000000000000000000000a0a0a0000000000000000000000000000000000000000000000000000000000000000000000000000003838391517183232330c0c0c0000000303032d2d2e171c1d13181a3535360505050000000707083c3c3d17191a3c3c3d0101010000000000000000000000000000000000000000000000000000000707073d3e3f04151203423103241c070f0f1c1d1f0d0f10031c17034534034735031f190b0f0f1c1d1f080f1003221c02423104181439393b0c0c0c0000000000000000000000000000000000000000000000000d0d0d2a2b2e03332602563f02563f02553e0a554022615002563f7ca69a7c968f02563f346f5f215d4c02553e02563f02563f04372a2324271313130000000000000000000000000000000000000000000000000000001a1a1a16191b03483502563f02563f2d6a59a3a6a53171604e83757c8d88276c59acb2b050786d02563f02563f034b380f15161e1e1e00000000000000000000000000000000000000000000000000000000000000000032333303261e034d3903513c02563f3e7d6c91a39e33756264897f7c958e518a7b02563f03513c034d39042a2137373800000000000000000000000000000000000000000000000000000000000000000000000016181805151399851bab931a657528184d337c846b3257395067468985641b4e335e6f2b9e8a2285731c0519160f0f110000000000000000000000000000000000000000000000000000000000000000000000001a1a1a051312887b1dad941fa591200e4b347f782d7c7c248681258c7d2b1049328b7c238e7b257268200517140808080000000000000000000000000000000000000000000000000000000000000000000000002c2c2c031e1902563f085039b09816757a210e4f385e3b2e623b2e104f38727820b0991808503802563f04231c2f30300000000000000000000000000000000000000000000000000000000000000000000000002d2e2e03312602563f02553e697f26495031ae2728e54a51e75157b426284c4e316c7f2802553e02563f03362939393b0000000000000000000000000000000000000000000000000000000000000000000101011a1d1e034a3702563f15503b89312de02f37efa8abfefdfdfffefef2b0b2e3343c8f302d18503c02563f034e3a15161805050500000000000000000000000000000000000000000000000000000000000025252603151307543e633b32d32229e98185fbf1f2fffffffffffffffffffffffffcf5f5ed898dd7242b693a3208543e031a1630313100000000000000000000000000000000000000000000000000000000000030303139201dbd2327e24a52eca1a4e56166f1ced0dfdcd6cbb651cbb54be2ded0f3d1d3e7676dec9ea1e45158c123274024212b2c2d000000000000000000000000000000000000000000000000000000000000242627b7363cf1b7b9e4777de57379e44047e9b2b4c39b45b89b17b59816be983becb7bae33e45e4767ce17175f2bbbdc33f451b1c1e000000000000000000000000000000000000000000000000000000010101121416eeececfffffff1bfc1e3585de6656ae67176c19d49b29716b99c17b79743e67479e6686de25358eeb8b9fffffffbf9f90e101203030300000000000000000000000000000000000000000000000000000017191be0e0e0fdf0f1e99499e14e54e51922e44b52dba8a7c6b45fc7b45bd9aaa7e55359e51922e0464be8989bfae8e9f0f0f00f12140202020000000000000000000000000000000000000000000000000000002f30329d9e9ff8dee0e2575de88f93e52129e1363deb8b8fffffffffffffee999ce1363de41e27e68c90e2585ef6d5d6aeafaf282a2b000000000000000000000000000000000000000000000000000000000000373636303235fbfbfbe97a7ee1535ae41a23eea6a9e97c81f8e6e7fbededea7e82efabaee41a23e14f57e67175fdfefe3e4143353538000000000000000000000000000000000000000000000000000000000000796f3b383214696a6cfaf4f4f2c3c6e56167f9e2e3fffffffffffffffffffffffffae5e6e86a70edb9bbfbf3f3787a7b2a26107f733800000000000000000000000000000000000000000000000000000000000083752f7f75482e30313c3f41bebfbff0b2b4f3c5c7fffffffffffffffffffffffff5caccefafb1c4c4c446484a26282a6b623e8f7e3000000000000000000000000000000000000000000000000000000000000086762199893b504b326b60261d1d181a1d20545758a3a4a5fbfbfbfdfdfdaaabac595b5d1d2023191a17695d245550378e7f3a98842401010100000000000000000000000000000000000000000000000000000098852f83701cb59b1fb195196a61311415142a2a2a292a2c383a3d4244462627292e2e2e1414146e663eaf9519998421b1971c8f7c260000000000000000000000000000000000000000000000000000000000005f593e8e7b249e8a22a68f218d7e3a0000000000000101013233332c2d2d0202020000000000007b6e318a78219c8829a992246a63400000000000000000000000000000000000000000000000000000000000000000000000000000000c0c0ca18a1b7667256c60237164247769237466217c6c22786a226c6022ab921f0f0f0f0000000000000101010000000000000000000000000000000000000000000000000000000000000000000000000000000f0f0dd2b11178661e76641c937d1d95801f78661da1871c83701ca88f1ed9b7121111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004c4a405d59405d59405d59405d59405d59405d59405d59405d5940515045020202000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"}, "NEW": {"28": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040404373839100e0f03060700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000068757e8a47477c494c8b271e4715112a0e0b2b0f0d0101010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004c67701f23283b343a86261d972a2078221b210b0900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000046391e221b0d634f290908050000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007f745f7e632c564422382c141d170b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000706040b0a0a0000000000000000000000004b41308e6f303c311b2b23150e0b050000000000000000000909090a08060000000000000000000000000000000000000000000000000000000000000000000c0a077d66376b66620d0d0d0000000000000000005352537775757d7c7e11111100000000000000000000000062606087704019140c00000000000000000000000000000000000000000000000000000000000054421f93908aa5a6a86a6a6c0101010000000000004a4949616162767677000000000000000000000000505051a2a3a5a0a1a2634e25000000000000000000000000000000000000000000000000000000000000614c228382815c5b5c5c5a5b100f100000000000004c4b4b65656679787a0101010000000000000202025b5a5b5654568d8d8f6953270100010000000000000000000000000000000000000000000000000000004536177e683d8b898878797a0b0a0a5353541d1c1d53462e75684f70665445361a211d174f4f501919195e5e5f9594946f5e3e5b471e0000000000000000000000000000000000000000000000000000000302020000003c3019675534b6b8ba7373756c593455524e322f2bae8733b08834352e245b595868522769696ababcbd75664a4a3b1e0201010403030000000000000000000000000000000000000000000403026952220000001d181088795bbbbcbe868587a8833699772da781308b6d2f70582bad863298762eb58c3577736db8babc8e8573382e1d0000005e4a1e130f070000000000000000000000000000000000002d230e846729000000524428a2a3a59c9c9e787573bb90352a2421c9c7c5585555302c2de1e0df393430a781337067589e9fa0a2a3a56a5c400101016c54224737160000000000000000000000000000000000002a210fb98f352a21106e624da7a8aa919193565556af9254242020e8e7e75a5757302d2efefefe3834359a7c3e5d5c5d858586a6a7a97b7365282010b78d344c3b1800000000000000000000000000000000000058441cc59939736a5b7f7e7f8f8f916464650707077d6e50231f20e8e7e75a5757302d2efefefe3834356e5f421b1a1a4646478f8f91919293665f54ad8a3f7e62260000000000000000000000000000000000007058250a08062d2821959597868587333233191718514d4b231f20e9e8e85a5757302d2efefefe3834353a35343937381a191a7f7f809393954e4940010101785e28010000000000000000000000000000000000382c130e0c07433f397f7f80141414575657413a30322d2c231f20eaeaea5a5757302d2efefefe3834352a27285147395654560f0e0f69696a5c58530201023b2e160000000000000000000000000000004b3e1e44381a0a08052827284746470b0a0a27242595783c4b3d26231f20eaeaea5a5757302d2efefefe383435262220ad86333734350e0d0d3533344141420403023f32164d3f1d0101010000000000000614185e816a2393ad3c2f13030303555456706f711e1b1b4436189b7931231f20eaeaea5a5757302d2efefefe383435715a2b735922151314615f6161616209090929200e3896a05b8672071b2100000000000006536c13a6cf617e64392e17392c140b0907090908000000010101685120a68132c7beac585556302c2dd9d4cb9d7d3a8768280504030000000504040907062f2511382c1565795a1ca4c6065d7900000000000006597500b6f100b6f11a8ba9706f468b7134817642100d08000000000000251d0eab84307e642e5f4c29b98f343b2e1400000000000005040480743f8a7337766d3f25839800b6f100b6f106648200000000000002040506648202b0e8069ccd04a9df3398a64c7e744b462a312610080705010101030202745a239a772c0b09050100000706042b220f4b42244e7c703c98a007a5d8079ecf01b0e9066c8e02080a000000000000000000000000091b2102ace30e7a9e0a8ab4069ccc03aae0139fc639949d427e7b426c62425d4f486352436b61447f7a3c92981a9ec003a7dc069ccd098db80e7a9f0894c20a242d00000000000000000000000000000000000003080906749804a5da0b86af0b88b10d7da20b86af0990bd0799c90796c4098fbb03a9de0892bf0796c50797c50c80a70c83ab0b85ad0b87b0079ccc06799f030b0e00000000000000000000000000000000000000000000000005161c06546d0587b203aae005a1d5079aca098eb90b89b20a8bb6069bcc0d7fa5069aca04a3d704a5da05a2d50688b205556f05191f00000000000000000000000000000000000000000000000000000000000000000000000000000004070806253006455a065a75056989056e90056d8f056787055b7806465b06293505090b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "18": "0000000000000000000000000000000000000000000404040202020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001e1e1e67545b64313146140f2d0e0b04020200000000000000000000000000000000000000000000000000000000000000000000000014120f242b2b4b31244e1611290c0a0000000000000000000000000000000000000000000000000000000000000000000000000000001413127e673841341a241c0d0000000000000000000000000000000000000000000000000000000000000705033d34210a090a0000001414137c6f544b47400705030000000303033e35270d0b06000000000000000000000000000000000000413419a2a2a35757590000001b1a1a4f4f5046464700000000000049494aa1a2a44e402500000000000000000000000000000000000046371978736a5151521e1e1f201e1b5f584d544e45110e0a2323244443447c78714c3d1e0000000000000000000000000000000a08040a0804564523a5a5a673664d534c3f8b6c2c8e6e2d4e483f796847a5a6a85d4c2b0806030f0c06000000000000000000000000624c1d070604776e5ca2a2a4957b48877043887c67736959947e518f7339a1a2a4867e700605036a5321000000000000000000000000775c235c4d308e8c887b7b7c78694c5854519593937c7a7a6f6d6d7c6b4a6b6b6c949495584b33906f29000000000000000000000000664f21474033909092383738433e395350519593937c7a7a6f6d6d47423e2a292a89898b554f45664f200202010000000000000f0c051d170c3937363131313634355c4d325552529593937c7a7a6f6d6d58492f423e3c1e1d1d47464517120a0d0a05000000000000476b5d4866550e0e0e5150511d1b1b87692b5a56539593937c7a7a716e6e8c6d2d1614134f4e4f161616465e4c4a7264000000030b0e04afe62e808b584f2d413c23110d06130f07876b3187775773664f95793c1d170a0b0804403b235a4d282f798206b0e5041014000000044a600696c412a0c93f8f9133564f292515171209513f1a644e1f1712092a2312335049448f8e1898bc0699c804506900000000000000000004455b0797c60c81a80a8ab4069ed01795b82a8da02a96ab1997b90896c40990bc0c84ab0990bc054b6200000000000000000000000000000003181f04536c067aa00797c60992bf0798c80797c605a0d3069aca07779c04536c031a2100000000000000000000000000000000000000000000000000000001010103090a03121703111603090b010101000000000000000000000000000000000000"}, "COV": {"28": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000303033131314848485f5f5f7777778484848787878383837575755e5e5e4848482626260000000000000000000000000000000000000000000000000000000000000000000000000000002424244848487e7e7ec4c4c4b5b5b5c7c7c7b6b6b6a4a4a4aaaaaa8e8e8eb1b1b1d9d9d9cacacab6b6b6c7c7c7b9b9b96f6f6f545454000000000000000000000000000000000000000000000000000000050505b7b7b7e3e3e39f9f9f9e9e9eb3b3b3c5c5c5adadadb0b0b0bfbfbfa9a9a9b0b0b0c0c0c0b3b3b3b7b7b7b8b8b8c1c1c1f2f2f2d9d9d92b2b2b000000000000000000000000000000000000000000000000555555efefefffffffc0b2aeca8e7ec66b53aa5e499a98949d9789908a7d8f897b948e81a7a39ac6725bc94825d26b4fbc9489fbfbfbe7e7e7969696010101000000000000000000000000000000000000000000a77b6fc75f43cc6c52b57462cd998bdcb9afcca99fa3a098c18a1b8e6614aa7918a57617bea572bba19aded3d0c4a39aa56b5ab64526cf4621b0715f131313000000000000000000000000000000000000000000686565ceb0a8dabdb5e1d0cbb3a29d8f8f8f595959575757a072166e4e0f8a6413835e128d7a53444444515151aaa6a4ebebebdfdededdd5d28a89890000000000000000000000000000000000000000000000008e6b61cf5b3bce5839cc5d3f8a6e67030303000000484848ae7c18725010956a158e64148f7a51000000000000535353ca431edf4921e84c22c7684f151515000000000000000000000000000000000000000000584c48c66f57ce5939ce6144745e570000000909096a655cd8981ead7b18c1881bc38a1bab8e56000000000000333232a76756c06f59a166554d45430000000000000000000000000000000000000000000000000000000606062828281d1d1d0909090606065d5d5d24221f4c370dcaa45acba458b98f3f7d683e2e2e2e0000002626261e1e1e0000002727270b0b0b0000000000000000000000000000000000000000000000000000003c3c3c1616167878777777771b1b1b2d2d2d000000020202c7c0bfd9b4aca8a8a80000004848480606063434348d836c2727277f735882817f000000000000000000000000000000000000000000000000090909a39f9963626198948f6a69664444440c0c0c0000001e1e1edbd9d9c3afab9b9b9b0000001818182f2f2f2b2b2bab832fa09886bb9850a48d5b010101000000000000000000000000000000000000000000333333959089b4afa996908893908d8b8b8b3030303333330000000505054f4f4f0101010000005c5c5c2b2b2b5a5a5ab38219b18c3eae8228a58b520909090000000000000000000000000000000000000000003d3d3da8a198b2a99f9a938aa19b94aeaca96161618c8c8c1515151010107b7b7b03030300000095959588847aac832dc78e1ad2951cb98519a98d510a0a0a0000000000000000000000000000000000000000003f3f3f98928aa29a919f988fa19a907e797283838261616122222209121547a2b81d1d1d00000047474788847aab7d1bd89b1dce941bc08b1aac92580202020000000000000000000000000000000000000000002b2b2ba19b94948d85908981aca59a938d864a4a4968838acecece8d8e8f55a4b7c3c3c3a7a7a75a757b7a6f53997215a47a17da9c1db988197f7254000000000000000000000000000000000000000000000000050505a7a49fb1a99fb5ada2b5ada2a7a0968595970798bcfdfdfdffffffd5d5d5ffffffdce1e215add2ae9967c08c1ac18c1ad0951ca17e23434241000000000000000000000000000000000000000000000000000000404040989591d7cdc0c6bdb2ada59b4692a406a7cfd2d2d289c4d217a4c6a0c5cdbdc6c803afd97e9b8dc7901bc79418987d0b985a2e5757570000000000000000000000000000000000000000000000000000000000007d7c7ab7afa4a49d93b0aca74e8f9ebad9e0ffffff3eb1cd00b5e25cb7ceffffffb2d3db7d9d96d3891dc68819bf900cbd401e4e4b4a000000000000000000000000000000000000000000000000000000333333a7a199b7afa4c1806ac2a198ac786affffffffffff99c2cc39adcaaac6cdfffffff9f9f99b9482c5681db16e11b07311a06e258a8a820000000000000000000000000000000000000000000000002c2c2c878580969087868876925723a551216a602339909b50b5cec0cfd3ffffffabc9d038aecb2386795f902c93760dc8820fdbc301b6aa2a3a39360000000000000000000000000000000000000000001c1c1c7373737272729999996c7d624da3324da3324da332449a3b139ea33cabc6fcfcfc2eadcb1c9b8b4a9f3350872bb3a50bb2a4009d7610ab8475625450090909000000000000000000000000000000000000000000404040bf735ebf5b408b44309f6b51bba492a58a724da3324da33243963953943f4699364da33246912ed18b78da9886ba634aaa4a30db9885bd8d7f292929000000000000000000000000000000000000000000040404adadadffffffbba59edfa393de917cc6836978ae6771aa5f6ea95c70aa5d74ad637cb06c88b37bc69284d2aba0dac6c0cccacafefefe7777770000000000000000000000000000000000000000000000000000004c4c4cecececd7d7d7878787a4a4a4b3b3b3c2c2c2c1c1c1d6d6d6d7d7d7dadadafbfbfbc3c3c3c8c8c89b9b9b7c7c7cb9b9b9d0d0d0323232000000000000000000000000000000000000000000000000000000090909767676b4b4b4ddddddc1c1c1aeaeaec2c2c2a8a8a8a7a7a7989898b0b0b0e0e0e0b8b8b8c2c2c2bcbcbcc8c8c8b8b8b84343430000000000000000000000000000000000000000000000000000000000000000000000002727274949496363637d7d7d8d8d8d9696969999999797978f8f8f8282826e6e6e5454544747472e2e2e040404000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "18": "0000000000000000000000000000000000000000001111112727272c2c2c2121210707070000000000000000000000000000000000000000000000000000001b1b1b4646468b8b8bb1b1b1a6a6a6a8a8a8a1a1a1b5b5b5bebebea0a0a0696969393939000000000000000000000000000000030303bdbdbdd8d8d8ada5a3b2968fb1b1b1b2b2b2abababb3b3b3bf9589b9988fdbdadadcdcdc1515150000000000000000000000003d3735cd7c66c07b68c6806dd19c8e9d8e7099701d936c1db4985ec69c90c28b7cbd7e6dc8745d4b403d000000000000000000000000201f1fc7988bdbab9ea3928e2c2c2c5a4e358a6213815d128c713b1d1d1d7f7774db9886de8f7a4b3c380000000000000000000000001b19199e5440be5d43543b35131313776644b78119b68119aa863f0000002d262496503d844b3c1c19190000000000000000000000000000001a1a1a1d1d1c403f3f303030000000867c6ad7c2a9362e1f2c2c2c3333323e3b355a564d1919190000000000000000000000000000008c88847d7b795f5c5a3c3c3c010101747271a295920d0d0d31313131302eaf8c44b39149413d35000000000000000000000000000000a49f98a09a91a7a39d81807f5252520c0c0c4646460303038787878f743cc48c1bb6841b4a4435000000000000000000000000000000a5a099938c849c958c787673646464282c2d337788434344555555a37d29d1961cb98719433e33000000000000000000000000000000898681a8a096b5ada288898560b4c9ffffffdbddddd8e7eb5c9fa8b78619c58f1aa68534111111000000000000000000000000000000282828aaa49cb7afa47aa1a86abed38ec8d71aaed2cad4d74eb4cdc28b23b28b10a9643e141414000000000000000000000000000000353433ada69cbf8875a67b6ff7f7f7bad8e052b0c7f9f9f9c3cbc6b16820b37c0eac763629292900000000000000000000000036363677757387837e687f2c60822b268e775db8cee3f0f3119eb6409543a19409bfa8029d96590f0f0f000000000000000000000000020202b48b7fa86f5fa46e46b28a664b9f31409a4357a052499f3678873fc57f61ab5c3ed99a895b4e4a000000000000000000000000000000666666e7e7e7b6afaec3b0abafbfaab1c4abbccfb6c3d2beb8bbb4ccccccafafafdadada0c0c0c0000000000000000000000000000001010107b7b7bbebebeb3b3b3bababa9e9e9eaeaeaebbbbbbb8b8b8b6b6b69797973030300000000000000000000000000000000000000000000000000202021919192b2b2b2e2e2e2e2e2e252525101010000000000000000000000000000000000000"}};
const LOGO={};for(const k in LOGO_HEX){LOGO[k]={};for(const n in LOGO_HEX[k]){const h=LOGO_HEX[k][n],a=[];for(let i=0;i<h.length;i+=6)a.push([parseInt(h.substr(i,2),16),parseInt(h.substr(i+2,2),16),parseInt(h.substr(i+4,2),16)]);LOGO[k][n]=a;}}
/* Real ESPN crests from the Team Tracker sensor, area-averaged from 500 px to 28 px the way the Home Assistant integration does it. Black parts vanish: black is an unlit LED. */
function drawLogo(fb,k,n,x,y,a=1){const px=LOGO[k][n];for(let j=0;j<n;j++)for(let i=0;i<n;i++){const c=px[j*n+i];if(c[0]+c[1]+c[2]>9)fb.px(x+i,y+j,c,a);}}
/* Pictures by id, the way the display keeps them in flash. The two crests start here, as if the integration had already sent them. */
const IMGS={"espn-361":{w:28,h:28,px:LOGO.NEW["28"]},"espn-388":{w:28,h:28,px:LOGO.COV["28"]},"espn-371":{w:28,h:28,px:LOGO.WHU["28"]},"espn-352":{w:28,h:28,px:LOGO.WXM["28"]}};
const PICS=[["espn-361","Newcastle"],["espn-388","Coventry"],["espn-371","West Ham"],["espn-352","Wrexham"]];
function drawImg(fb,id,x,y,a=1){const im=IMGS[id];if(!im)return;for(let j=0;j<im.h;j++)for(let i=0;i<im.w;i++){const c=im.px[j*im.w+i];if(c[0]+c[1]+c[2]>9)fb.px(x+i,y+j,c,a);}}
/* RGB565, two bytes per pixel, high byte first, rows top to bottom, then base64. */
function enc565(im){let s="";for(const [r,g,b] of im.px){const v=((r>>3)<<11)|((g>>2)<<5)|(b>>3);s+=String.fromCharCode(v>>8,v&255);}return btoa(s);}
function dec565(o){const w=Math.round(+o.w),h=Math.round(+o.h);if(!(w>0&&h>0&&w<=64&&h<=32))throw new Error(`Picture ${o.id}: "w" and "h" must be up to 64 and 32.`);
  let bin;try{bin=atob(String(o.data));}catch(e){throw new Error(`Picture ${o.id}: "data" isn't valid base64.`);}
  if(bin.length!==w*h*2)throw new Error(`Picture ${o.id}: ${w} × ${h} in RGB565 is ${w*h*2} bytes, but "data" holds ${bin.length}.`);
  const px=[];for(let i=0;i<w*h;i++){const v=(bin.charCodeAt(i*2)<<8)|bin.charCodeAt(i*2+1);px.push([Math.round(((v>>11)&31)*255/31),Math.round(((v>>5)&63)*255/63),Math.round((v&31)*255/31)]);}return {w,h,px};}
const imgPayload=id=>({id,w:IMGS[id].w,h:IMGS[id].h,format:"rgb565",data:enc565(IMGS[id])});
const easeBounce=p=>{const n=7.5625,d=2.75;if(p<1/d)return n*p*p;if(p<2/d)return n*(p-=1.5/d)*p+0.75;if(p<2.5/d)return n*(p-=2.25/d)*p+0.9375;return n*(p-=2.625/d)*p+0.984375;};
const TEAMCOL=[[255,255,255],[241,190,72]];
/* Goal: the crest, "GOAL!" striped in the team colours, confetti, then the score. A payload's colors, message and detail replace the built-in ones. */
function sGoal(fb,S){const {W,H}=S,ft=S.ft!=null?S.ft:(S.t%8),sc=S.score||[1,0],narrow=W<256,scl=narrow?2:3,txt=S.gtitle||"GOAL!",tw=fb.tw(F5,txt,scl),tx=narrow?33:36,ty=narrow?2:5,cx=tx+tw/2,cy=15;
  const tc=S.gcols&&S.gcols.length?[S.gcols[0],S.gcols[1]||S.gcols[0]]:TEAMCOL,msg=S.gmsg!=null?S.gmsg:"NEW "+sc[0]+"-"+sc[1]+" COV",det=S.gdet!=null?S.gdet:"V COVENTRY  23'";
  if(ft<2.2){const k=1-ft/2.2;for(let r=0;r<16;r++){const a=r*Math.PI/8+ft*0.8,L0=6+ft*40,L1=L0+10+ft*30;fb.line(cx+Math.cos(a)*L0,cy+Math.sin(a)*L0*0.6,cx+Math.cos(a)*L1,cy+Math.sin(a)*L1*0.6,tc[r%2],0.8*k,0.1*k);}}
  const n=Math.floor(W*H/40);for(let i=0;i<n;i++){const r1=hash(i*3.7+1),r2=hash(i*5.3+2),r3=hash(i*9.1+3),sp=10+r2*18,y=((ft*sp+r1*40)%(H+10))-5,x=r3*W+Math.sin(ft*3+i)*2,c=i%3===0?tc[1]:i%3===1?tc[0]:mix(tc[0],[255,255,255],0.5);
    fb.px(x,y,c,ft<0.3?ft/0.3:0.9);if(i%4===0)fb.px(x+1,y,c,0.5);}
  drawImg(fb,(S.imgs&&S.imgs[0])||"espn-361",2,2+Math.sin(ft*5)*1.5*Math.max(0,1-ft/3));
  const drop=ft<0.7?easeBounce(ft/0.7):1,y0=ty-(1-drop)*30;
  fb.textO(F5,txt,tx,y0,(X)=>Math.floor((X-tx)/(2*scl)+ft*6)%2===0?tc[0]:tc[1],scl);
  if(ft>1.1){const a=Math.min(1,(ft-1.1)/0.5);
    if(narrow)fb.textO(F3,msg,33,22,[230,230,240],1,a);
    else{const sx=tx+tw+12,room=W-sx-(W>=384?36:4),big=fb.tw(F5,msg,2)<=room?2:1;fb.textO(F5,msg,sx,big===2?3:6,[255,255,255],big,a);if(det)fb.textO(F3,det,sx,21,[200,200,210],1,a);
      if(W>=384)drawImg(fb,(S.imgs&&S.imgs[1])||"espn-388",W-31,2,a*0.9);}}}
function cake(fb,cx,cy,t){fb.rect(cx-9,cy+2,18,6,[235,140,165]);fb.rect(cx-9,cy+2,18,1,[255,240,245]);fb.rect(cx-7,cy-3,14,5,[255,215,228]);
  for(let k=0;k<3;k++){const x=cx-4+k*4;fb.rect(x,cy-7,1,4,[120,200,255]);fb.disc(x+0.5,cy-8.5-Math.sin(t*9+k)*0.4,1.1,[255,200,80]);}}
/* Red alert: bars sweep out from the middle in slow waves around the title. The whole screen breathes at half a hertz; nothing flashes. */
function sRedAlert(fb,S,o){const {W,H}=S,t=S.ft!=null?S.ft:S.t,cx=W/2,br=0.72+0.28*Math.sin(t*Math.PI),title=o.title||"RED ALERT",sc=W>=256?2:1,tw=fb.tw(F5,title,sc),bx=Math.round(cx-tw/2)-7,bw=tw+14;
  const C=o.colors&&o.colors[0]||[255,40,28],dk=mix(C,[0,0,0],0.82);
  fb.vgrad(0,0,W,H,mix(C,[0,0,0],0.87),dk,br);
  for(let x=0;x<W;x++){if(x>=bx&&x<bx+bw)continue;const d=Math.abs(x+.5-cx);if(Math.floor(d)%5>=3)continue;const w=Math.pow(Math.max(0,Math.cos((d/46-t*0.55)*Math.PI*2)),3),k=(0.2+0.8*w)*br;
    for(let y=3;y<H-3;y++)fb.px(x,y,mix(C,[255,255,255],0.28*w),k*(1-Math.abs(y-H/2+0.5)/(H*0.62)));}
  fb.frame(0,0,W-1,H-1,C,0.5*br);
  const ty=sc===2?(o.message?3:9):(o.message?6:12);fb.textO(F5,title,Math.round(cx-tw/2),ty,o.colors&&o.colors[1]||[255,226,214],sc);
  if(o.message){const m=o.message,mw=fb.tw(F3,m);fb.textO(F3,m,Math.round(cx-mw/2),sc===2?21:18,o.colors&&o.colors[2]||mix(C,[255,255,255],0.55));}}
/* Countdown: big numbers down to zero with a bar that shrinks, then a burst and the title. */
function sCountdown(fb,S,o){const {W,H}=S,n=Math.max(1,o.seconds||10),t=S.ft!=null?S.ft:S.t%(n+4),left=n-t,wide=W>=256;
  if(left>0){const v=Math.ceil(left),str=v>=60?Math.floor(v/60)+":"+p2(v%60):String(v),sc=2,nw=fb.tw(BIG,str,sc),nx=wide?W-10-nw:Math.round((W-nw)/2),a=0.55+0.45*(left%1);
    const C=o.colors||[];fb.text(BIG,str,nx,3,mix(C[0]||[255,200,120],[255,255,255],a*(C[0]?0.4:1)),sc,1);
    if(wide){fb.text(F5,o.title||"COUNTDOWN",4,4,[255,236,210]);if(o.message)fb.text(F3,o.message,4,14,[170,165,160]);}
    const bw=Math.round((W-8)*left/n);fb.rect(4,H-3,W-8,1,[60,50,40]);fb.rect(4,H-3,bw,1,C[1]||C[0]||[255,170,70]);}
  else{const b=-left,cols=o.colors&&o.colors.length?o.colors:[[255,124,69],[72,194,138],[90,162,245],[232,181,58],[240,120,200]];
    for(let r=0;r<6;r++){const ox=W*(0.15+0.7*hash(r*3.1)),oy=6+hash(r*7.7)*16,t0=hash(r*1.9)*1.2,age=b-t0;if(age<0||age>1.8)continue;const R=age*22,al=1-age/1.8;
      for(let k=0;k<14;k++){const an=k*Math.PI/7;fb.px(ox+Math.cos(an)*R,oy+Math.sin(an)*R*0.7+age*age*6,cols[(r+k)%cols.length],al);}}
    const ttl=o.title||"NOW",sc=W>=256&&fb.tw(F5,ttl,2)<=W-8?2:1,tw=fb.tw(F5,ttl,sc),y0=sc===2?(o.message?3:9):6;fb.textO(F5,ttl,Math.round((W-tw)/2),y0,[255,236,210],sc);
    if(o.message){const mw=fb.tw(F3,o.message);fb.textO(F3,o.message,Math.round((W-mw)/2),sc===2?21:16,[255,200,120]);}}}
/* Confetti: a burst from the middle, then confetti falling in the payload's colours, with the title dropping in. */
function sConfetti(fb,S,o){const {W,H}=S,t=S.ft!=null?S.ft:S.t%8,cols=o.colors&&o.colors.length?o.colors:[[255,124,69],[72,194,138],[90,162,245],[232,181,58],[187,134,240]],cx=W/2,cy=H/2,n=Math.floor(W*H/30);
  for(let i=0;i<n;i++){const c=cols[i%cols.length],r1=hash(i*3.7+1),r2=hash(i*5.3+2),r3=hash(i*9.1+3);let x,y;
    if(i%2===0){const an=r1*Math.PI*2,sp=20+r2*60;if(t>2.2)continue;x=cx+Math.cos(an)*sp*t;y=cy+Math.sin(an)*sp*t*0.55+14*t*t;}
    else{const sp=8+r2*12,st=0.4+r3*1.2;if(t<st)continue;y=((t-st)*sp)%(H+6)-3;x=r1*W+Math.sin(t*2+i)*3;}
    const flip=Math.floor(t*6+i)%2;fb.px(x,y,c,0.95);fb.px(x+(flip?1:0),y+(flip?0:1),c,0.6);}
  const ttl=o.title||"CONGRATULATIONS",sc=W>=256&&fb.tw(F5,ttl,2)<=W-8?2:1,tw=fb.tw(F5,ttl,sc),drop=t<0.7?easeBounce(t/0.7):1,y0=(sc===2?(o.message?3:9):(o.message?5:12))-(1-drop)*30;
  fb.textO(F5,ttl,Math.round((W-tw)/2),y0,[255,255,255],sc);
  if(o.message&&t>0.9){const mw=fb.tw(F3,o.message);fb.textO(F3,o.message,Math.round((W-mw)/2),sc===2?21:16,[255,220,170],1,Math.min(1,(t-0.9)/0.4));}}
/* Example device details. The ID is the last three bytes of the MAC address, the same one firelabs-core puts in the setup network's name. */
const FW={ver:(()=>{try{return localStorage.getItem("pixelbar.fwver")||"26.9.1";}catch(e){return "26.9.1";}})(),next:"26.10.1",id:"A1B2C3",ip:"10.0.0.57"},UPD_LEN=10.5;
/* Where an update is at t seconds in: the stage and how much is done, 0 to 1. The screen and the progress events both read it. */
const updAt=t=>({pr:t<7?0.8*clamp(t/7+0.04*Math.sin(t*2.3),0,1):t<8.5?0.8+0.15*(t-7)/1.5:Math.min(1,0.95+0.05*(t-8.5)),stage:t<7?"DOWNLOADING":t<8.5?"WRITING":t<9.5?"VERIFYING":"RESTARTING"});
/* The connection steps after the wordmark, in seconds. Joining Wi-Fi takes a few seconds; Ethernet brings the link up, then asks DHCP for an address. */
const NET_STEPS={wifi:[["WI-FI",2.6,1],["WI-FI OK",0.7],["MQTT",1.6,1],["READY",1.1]],eth:[["ETHERNET",1.0,1],["DHCP",1.3,1],["MQTT",1.3,1],["READY",1.1]]};
/* After READY: the ID and name for 3.4 s, then the address for 3.2 s (together on wider strips), then BOOT_X s dissolving into the normal screen. */
const ID_LEN=3.4,IP_LEN=3.2,BOOT_X=0.9,pbLen=net=>3.3+NET_STEPS[net||"wifi"].reduce((a,x)=>a+x[1],0)+ID_LEN+IP_LEN+BOOT_X,bootLen=net=>0.9+FL_LEN+pbLen(net)-0.9;
const ANIM_LEN={canadaflag:10,morningwx:10,golive:10,ytlive:10,sub:8,gifts:10,raid:8,milestone:8,setup:6,boot_eth:25,boot:26,update:UPD_LEN+0.5,goal:8,bday:10,redalert:8,countdown:14,confetti:8,newyear:14,pizza:14,leak:8,chores:8};
function sBirthday(fb,S){const {W,H}=S,ft=S.ft!=null?S.ft:(S.t%10),rk=Math.max(2,Math.floor(W/55));
  for(let r=0;r<rk;r++){const per=2.4+hash(r)*1.2,tt=ft+hash(r*7)*per,cyc=Math.floor(tt/per),ph=tt-cyc*per,x0=10+hash(r*13+cyc*3.1)*(W-20),c=hsv(hash(r*3+cyc*1.7)*360,0.65,1);
    if(ph<0.8){const y=H-ph/0.8*(H*0.7);fb.px(x0,y,[255,230,180]);fb.px(x0,y+1,[255,180,90],0.5);}
    else{const age=(ph-0.8)/(per-0.8),R=age*15,yb=H*0.3;for(let k=0;k<16;k++){const a=k*Math.PI/8;fb.px(x0+Math.cos(a)*R,yb+Math.sin(a)*R*0.8+age*age*7,c,1-age);}}}
  cake(fb,16,19,S.t);const col=(X)=>hsv(X*3-ft*120,0.45,1);
  if(W<256){fb.textO(F5,"HAPPY",34,3,col);fb.textO(F5,"BIRTHDAY",34,12,col);fb.textO(F3,"ADALÉA",34,23,[230,220,240]);}
  else{fb.textO(F5,"HAPPY BIRTHDAY",34,3,col,2);fb.textO(F5,"ADALÉA",34,21,[240,230,250]);}}
/* ---------- holiday themes ----------
   A theme stands in for the weather sky on idle, with the clock and the weather cards still drawn on top. The same scenes double as notification animations. */
const unhex=h=>{const c=[0,2,4].map(i=>parseInt(h.substr(i,2),16));return c[0]+c[1]+c[2]<60?[26,24,30]:c;};
const heroX=S=>S.hx!=null?S.hx:Math.round(S.W*(S.W>=256?0.6:0.5));
const skyAt=(S,c0,c1,y)=>mix(c0,c1,y/(S.H-1));
const twk=(S,i,sp=2)=>{const v=0.5+0.5*Math.sin(S.t*(sp+hash(i*1.7)*2)+i*2.3);return v*v;};
const glyph=(fb,G,x,y,c,a)=>{const w=G[0].length;for(let j=0;j<G.length;j++)for(let i=0;i<w;i++)if(G[j][i]==="#")fb.px(x+i-(w>>1),y+j,c,a);};
const inPoly=(P,X,Y)=>{let ins=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if((yi>Y)!==(yj>Y)&&X<(xj-xi)*(Y-yi)/(yj-yi)+xi)ins=!ins;}return ins;};
function sparkles(fb,S,k,n,cols,seed=0){const {W,H}=S;for(let i=0;i<n;i++)fb.px(hash(i*7.3+seed)*W,hash(i*3.1+seed+9)*H,cols[i%cols.length],k*twk(S,i+seed));}
function fireworks(fb,S,k,cols,n,s=1){const {W,H,t}=S;for(let r=0;r<n;r++){const per=2.6+hash(r*1.3)*1.4,tt=t+hash(r*7)*per,cyc=Math.floor(tt/per),ph=tt-cyc*per,x0=8+hash(r*13+cyc*3.1)*(W-16),yb=H*(0.25+hash(r*5+cyc)*0.2),c=cols[Math.floor(hash(r*3+cyc*1.7)*cols.length)];
  if(ph<0.7){const y=H-ph/0.7*(H-yb);fb.px(x0,y,[255,230,180],k*0.9);fb.px(x0,y+1,[255,170,90],k*0.45);continue;}
  const age=(ph-0.7)/(per-0.7);if(age>0.8)continue;const R=(3+age*14)*s,a=k*(1-age/0.8),dy=age*age*8;
  for(let j=0;j<16;j++){const an=j*Math.PI/8+r;fb.px(x0+Math.cos(an)*R,yb+Math.sin(an)*R*0.75+dy,c,a);fb.px(x0+Math.cos(an)*R*0.6,yb+Math.sin(an)*R*0.45+dy*0.8,mix(c,[255,255,255],0.5),a*0.5);}
  if(age<0.1)fb.disc(x0,yb,2.5*s,[255,250,230],a*(1-age/0.1));}}
/* Things that drift and sway: leaves, poppies and shamrocks fall, hearts rise. */
function floaters(fb,S,k,n,sp,draw,seed=0,up=false){const {W,H,t}=S;for(let i=0;i<n;i++){const r1=hash(i*3.7+seed),v=sp*(0.6+hash(i*5.3+seed+1)*0.8),p=(t*v+r1*(H+12))%(H+12),y=up?H+6-p:p-6,x=((hash(i*9.1+seed+2)*W+t*v*0.4)%(W+8))-4+Math.sin(t*1.3+i)*3;draw(fb,x,y,i,Math.sin(t*1.7+i*2)*0.9,k*(up?Math.min(1,p/(H*0.5)):1));}}
function hills(fb,S,k,c,h=3){const {W,H}=S;for(let x=0;x<W;x++){const hy=Math.round(H-h-1.5*Math.sin(x*0.05)-1.2*Math.sin(x*0.13+1));fb.rect(x,hy,1,H-hy,c,k);}}
/* A theme's parts as its message tunes them ("parts": { "leaves": { "amount": 200 } }): on, amount, speed and size where 100 is as drawn, and its own colours in place of cols. */
const tp=(S,k,cols)=>{const p=(S.parts&&S.parts[k])||{},c=Array.isArray(p.colors)?p.colors.map(rgbOf).filter(Boolean):[],pct=(x,lo,hi)=>clamp(isFinite(+x)&&x!==null?+x:100,lo,hi)/100;
  return {on:p.on!==false,n:pct(p.amount,0,500)*(S.faint?THEME_FAINT_N:1),v:pct(p.speed,0,500),s:pct(p.size,25,300),c:c.length?c:cols};};
/* A part's clock at its own speed, and a count at its amount. */
const tS=(S,p)=>p.v===1?S:Object.assign({},S,{t:S.t*p.v});
const tN=(n,p)=>Math.floor(n*p.n);
/* The sky part: top and bottom colours (one for a flat sky), black when it's off. Gives back the colours, for things cut out of the sky. */
function thSky(fb,S,k,c0,c1){const p=tp(S,"sky",[c0,c1]),a=p.on?p.c[0]:[0,0,0],b=p.on?p.c[1]||p.c[0]:[0,0,0];if(p.on)fb.vgrad(0,0,S.W,S.H,a,b,k);return [a,b];}
function thSpk(fb,S,k,key,n,cols,seed=0){const p=tp(S,key,cols);if(p.on)sparkles(fb,tS(S,p),k,tN(n,p),p.c,seed);}
function thFw(fb,S,k,cols,n){const p=tp(S,"fireworks",cols);if(p.on)fireworks(fb,tS(S,p),k,p.c,tN(n,p),p.s);}
/* A flag that waves: colAt(u,v,i,j) gives the cloth colour, and each column ripples and shades. */
function wavyFlag(fb,x,y,w,h,t,k,colAt,amp=1.2,freq=0.35){for(let i=0;i<w;i++){const ph=t*3-i*freq,off=Math.sin(ph)*amp*Math.min(1,(i+2)/w*1.5),sh=0.8+0.2*Math.cos(ph);for(let j=0;j<h;j++){const c=colAt((i+.5)/w,(j+.5)/h,i,j);if(c)fb.px(x+i,y+j+off,mix([0,0,0],c,sh),k);}}}
/* The leaf from the Canadian flag, traced from its official outline. */
const LEAF=[[-0.045,1],[-0.022,0.572],[-0.077,0.523],[-0.504,0.598],[-0.446,0.439],[-0.456,0.403],[-0.923,0.025],[-0.818,-0.024],[-0.801,-0.064],[-0.893,-0.347],[-0.624,-0.29],[-0.588,-0.309],[-0.536,-0.432],[-0.326,-0.206],[-0.271,-0.235],[-0.372,-0.757],[-0.21,-0.663],[-0.165,-0.676],[0,-1],[0.165,-0.676],[0.21,-0.663],[0.372,-0.757],[0.271,-0.235],[0.326,-0.206],[0.536,-0.432],[0.588,-0.309],[0.624,-0.29],[0.893,-0.347],[0.801,-0.064],[0.818,-0.024],[0.923,0.025],[0.456,0.403],[0.446,0.439],[0.504,0.598],[0.077,0.523],[0.022,0.572],[0.045,1]];
function mapleLeaf(fb,cx,cy,s,c,a=1,rot=0){const co=Math.cos(rot),si=Math.sin(rot);fb.poly(LEAF.map(([x,y])=>[cx+(x*co-y*si)*s,cy+(x*si+y*co)*s]),c,a);}
const CA_RED=[225,30,40],US_RED=[205,35,50],US_BLUE=[40,60,150];
/* How much of an LED the leaf covers, from 16 samples; edge LEDs blend so the points survive at 17 px. */
const leafCov=(X,Y,sc)=>{let n=0;for(let a=0;a<4;a++)for(let b=0;b<4;b++)if(inPoly(LEAF,(X+(a+.5)/4)/sc,(Y+(b+.5)/4)/sc))n++;return Math.pow(n/16,0.6);};
const caFlag=(w,h)=>(u,v,i,j)=>u<0.25||u>=0.75?CA_RED:mix([245,245,245],CA_RED,leafCov(i-w/2,j-h/2,h*0.42));
function leafAA(fb,cx,cy,sc,c,a=1){for(let y=Math.floor(cy-sc)-1;y<=cy+sc;y++)for(let x=Math.floor(cx-sc)-1;x<=cx+sc;x++){const v=leafCov(x-cx,y-cy,sc);if(v>0)fb.px(x,y,c,a*v);}}
const usFlag=(u,v,i,j)=>u<0.42&&v<7/13?(i%2&&j%2?[255,255,255]:US_BLUE):Math.floor(v*13)%2?[240,240,240]:US_RED;
function flagPole(fb,S,x,y,w,h,k,colAt){fb.rect(x-1,y-2,1,S.H-y+2,[150,150,160],k);fb.px(x-1,y-3,[230,200,120],k);wavyFlag(fb,x,y,w,h,S.t,k,colAt);}
const PRIDE={rainbow:["E40303","FF8C00","FFED00","008026","004CFF","732982"],progress:["E40303","FF8C00","FFED00","008026","004CFF","732982"],trans:["5BCEFA","F5A9B8","FFFFFF","F5A9B8","5BCEFA"],
  bi:["D60270","D60270","9B4F96","0038A8","0038A8"],pan:["FF218C","FFD800","21B1FF"],lesbian:["D52D00","EF7627","FF9A56","FFFFFF","D162A4","B55690","A30262"],nonbinary:["FCF434","FFFFFF","9C59D1","2C2C2C"],
  asexual:["000000","A3A3A3","FFFFFF","800080"],aromantic:["3DA542","A7D379","FFFFFF","A9A9A9","000000"],genderfluid:["FF76A4","FFFFFF","C011D7","000000","2F3CBE"],
  agender:["000000","BCC4C7","FFFFFF","B7F684","FFFFFF","BCC4C7","000000"],intersex:["FFD800"]};
const PRIDE_RGB=Object.fromEntries(Object.entries(PRIDE).map(([k,v])=>[k,v.map(unhex)])),PRIDE_V=["FFFFFF","F5A9B8","5BCEFA","613915","000000"].map(unhex);
/* Progress Pride is the intersex-inclusive one: a yellow triangle with a purple ring, then the chevron. Intersex is the ring on yellow. */
const prideCol=(f,w,h)=>{const C=PRIDE_RGB[f];return (u,v,i,j)=>{if(f==="intersex"){const d=Math.hypot(i+.5-w/2,(j+.5-h/2));return Math.abs(d-h*0.28)<h*0.075?[121,2,170]:C[0];}
  if(f==="progress"){const q=u*w/h*0.9+Math.abs(v-0.5)*0.9;if(q<0.36)return Math.abs(Math.hypot(i+.5-h*0.15,j+.5-h/2)-h*0.1)<h*0.02+0.5?[121,2,170]:[255,216,0];const b=Math.floor((q-0.36)/0.1);if(b<5)return PRIDE_V[b];}return C[Math.min(C.length-1,Math.floor(v*C.length))];};};
function thPride(fb,S,k){const {W,H,t}=S,F=tp(S,"flag"),fl=(S.flags&&S.flags.length?S.flags:Object.keys(PRIDE)).filter(f=>PRIDE[f]),n=fl.length||1,per=6,idx=Math.floor(t/per),p=t-idx*per;
  const draw=(f,a)=>wavyFlag(fb,0,-2,W,H+4,t*0.7*F.v,a,prideCol(f,W,H+4),1.4,0.06);
  if(F.on){if(p<0.8&&n>1)draw(fl[(idx-1+n)%n],k*0.62);draw(fl[idx%n],k*0.62*(p<0.8&&n>1?p/0.8:1));}thSpk(fb,S,k*0.7,"sparkles",Math.floor(W*H/260),[[255,255,255]]);}
function thCanada(fb,S,k){const {W,H}=S,sx=heroX(S);thSky(fb,S,k,[6,6,22],[26,8,20]);thSpk(fb,S,k*0.6,"stars",Math.floor(W*H/220),[[220,220,240]]);
  thFw(fb,S,k,[[255,50,50],[255,255,255],[255,120,120]],Math.max(2,Math.round(W/80)));
  const L=tp(S,"leaves",[[255,255,255],CA_RED]);if(L.on)floaters(fb,tS(S,{v:L.v*0.6}),k,tN(Math.max(6,Math.floor(W*H/120)),L),5,(fb,x,y,i,r,a)=>mapleLeaf(fb,x,y,3.4*L.s,L.c[i%L.c.length],a*0.9,r),11);
  const F=tp(S,"flag");if(F.on){const fw=Math.round(40*F.s),fh=Math.min(H-6,Math.round(20*F.s));flagPole(fb,tS(S,F),sx,4,fw,fh,k,caFlag(fw,fh));}}
function thJuly(fb,S,k){const {W,H}=S,sx=heroX(S);thSky(fb,S,k,[4,6,26],[14,10,34]);thSpk(fb,S,k*0.8,"stars",Math.floor(W*H/150),[[255,255,255],[150,180,255]]);
  thFw(fb,S,k,[[255,50,60],[255,255,255],[70,120,255]],Math.max(3,Math.round(W/60)));const F=tp(S,"flag");if(F.on)flagPole(fb,tS(S,F),sx,5,Math.round(26*F.s),Math.min(H-7,Math.round(13*F.s)),k,usFlag);}
/* A full-height flag waving beside the title, on both ends of wide strips. "flag" picks it: canada, usa or any pride flag. */
const WAVE_FLAGS=Object.assign({canada:"Canada",usa:"United States"},Object.fromEntries(Object.keys(PRIDE).map(k=>[k,"Pride: "+k])));
const flagCol=(f,w,h)=>f==="usa"?usFlag:PRIDE[f]?prideCol(f,w,h):caFlag(w,h);
function sFlag(fb,S,o){const {W,H}=S,t=S.ft!=null?S.ft:S.t%10,fw=64,col=flagCol(o.flag,fw,H),two=W>=256,un=ease(clamp(t/0.9,0,1));fb.vgrad(0,0,W,H,[8,8,18],[20,10,20]);
  for(const x of two?[0,W-fw]:[0]){fb.pushClip(x,0,Math.max(1,Math.round(fw*un)),H);wavyFlag(fb,x,0,fw,H,S.t,1,col,1.3,0.16);fb.popClip();}
  const x0=fw+4,x1=two?W-fw-4:W-3,aw=x1-x0,cx=x0+aw/2,ttl=(o.title||"").toUpperCase(),msg=(o.message||"").toUpperCase(),mc=o.flag==="canada"||!o.flag?[255,150,150]:[190,195,220];
  const sc=fb.tw(F5,ttl,2)<=aw?2:1,lines=sc===1&&fb.tw(F5,ttl)>aw&&ttl.includes(" ")?(()=>{const w=ttl.split(" ");let b=1,bd=1e9;for(let i=1;i<w.length;i++){const d=Math.abs(fb.tw(F5,w.slice(0,i).join(" "))-fb.tw(F5,w.slice(i).join(" ")));if(d<bd){bd=d;b=i;}}return [w.slice(0,b).join(" "),w.slice(b).join(" ")];})():[ttl];
  const drop=t<1.2?0:t<1.9?easeBounce((t-1.2)/0.7):1,swap=lines.length>1&&msg&&t>5,fadeA=swap?Math.min(1,(t-5)/0.4):1;
  if(!swap){const lh=sc===2?16:9,top=sc===2?(msg?3:9):lines.length>1?(32-lines.length*lh)/2+1:msg?7:12;lines.forEach((l,i)=>{const w=fb.tw(F5,l,sc);fb.textO(F5,l,Math.round(cx-w/2),Math.round(top+i*lh-(1-drop)*30),[255,250,245],sc);});
    if(msg&&lines.length===1&&t>2.2){const mw=fb.tw(F3,msg);fb.textO(F3,msg,Math.round(cx-mw/2),sc===2?22:18,mc,1,Math.min(1,(t-2.2)/0.4));}}
  else{const f=fb.tw(F5,msg)<=aw?F5:F3,mw=fb.tw(f,msg);fb.textO(f,msg,Math.round(cx-Math.min(mw,aw)/2),f===F5?12:14,mc,1,fadeA);}}
/* A jack-o'-lantern whose candle flickers; face=false for a plain pumpkin. s scales it up for icons. */
function jackO(fb,cx,cy,t,k,s=1,face=true){const o=[225,100,12],d=[150,55,8];fb.disc(cx-2.2*s,cy,3.6*s,d,k);fb.disc(cx+2.2*s,cy,3.6*s,d,k);fb.disc(cx,cy,4.2*s,o,k);fb.rect(cx-0.5*s,cy-5.4*s,Math.max(1,1.6*s),2*s,[90,150,50],k);
  if(!face)return;const f=0.8+0.2*Math.sin(t*11+cx)*Math.sin(t*7.3+cx*0.3),g=[255,240,140],P=(dx,dy)=>fb.rect(cx+dx*s-(s>1?s/2:0),cy+dy*s-(s>1?s/2:0),Math.ceil(s),Math.ceil(s),g,k*f);
  for(const [dx,dy] of [[-2,-1],[-3,0],[-2,0],[2,-1],[2,0],[3,0],[-3,2],[-2,3],[-1,3],[0,2],[1,3],[2,3],[3,2]])P(dx,dy);}
function bat(fb,x,y,t,i,c,k){const up=Math.sin(t*16+i*1.3)>0;for(const [dx,dy] of [[0,0],[0,1],[-1,0],[1,0]])fb.px(x+dx,y+dy,c,k);
  for(const [dx,dy] of up?[[-2,-1],[2,-1],[-3,-2],[3,-2]]:[[-2,1],[2,1],[-3,1],[3,1]])fb.px(x+dx,y+dy,c,k);}
function ghost(fb,cx,cy,t,k,s=1,c=[225,230,255]){fb.disc(cx,cy-2*s,4*s,c,k);fb.rect(cx-4*s,cy-2*s,8*s,6*s,c,k);for(let x=0;x<8*s;x++)if(Math.floor((x+t*6)/(2*s))%2)fb.px(cx-4*s+x,cy+4*s,c,k);
  fb.rect(cx-2*s,cy-3*s,s,1.5*s,[20,20,50],k);fb.rect(cx+s,cy-3*s,s,1.5*s,[20,20,50],k);}
function thHalloween(fb,S,k){const {W,H}=S,sx=heroX(S);thSky(fb,S,k,[14,4,26],[40,12,34]);thSpk(fb,S,k*0.5,"stars",Math.floor(W*H/220),[[200,190,230]]);
  const M=tp(S,"moon",[[255,232,180]]),mc=M.c[0],z=M.s;if(M.on){fb.disc(sx,11,10*z,mix(mc,[255,150,40],0.4),k*0.12);fb.disc(sx,11,6.5*z,mc,k);for(const [dx,dy,r] of [[-2,-1.5,1.4],[2.5,1.5,1.1],[-0.5,3,0.9]])fb.disc(sx+dx*z,11+dy*z,r*z,mix(mc,[150,110,60],0.25),k);}
  const G=tp(S,"ghosts",[[225,230,255]]);if(G.on){const g=tN(W>=256?Math.max(2,Math.round(W/160)):1,G),tg=S.t*G.v;for(let i=0;i<g;i++){const gx=((tg*7+i*W/g)%(W+40))-20;ghost(fb,gx,13+Math.sin(tg*1.5+i)*2,tg,k*0.5,G.s,G.c[i%G.c.length]);}}
  const B=tp(S,"bats",[[120,70,150]]);if(B.on){const nb=tN(Math.max(3,Math.round(W/50)),B),tb=S.t*B.v;for(let i=0;i<nb;i++){const sp=10+hash(i)*10,x=((hash(i*2.3)*W+tb*sp)%(W+20))-10,y=5+hash(i*4.1)*13+Math.sin(tb*2.3+i)*3;bat(fb,x,y,tb,i,B.c[i%B.c.length],k);}}
  const Hl=tp(S,"hills",[[10,4,12]]);if(Hl.on)hills(fb,S,k,Hl.c[0]);
  const Mi=tp(S,"mist",[[120,100,150]]),tm=S.t*Mi.v;if(Mi.on)for(let x=0;x<W;x++)fb.px(x,H-2+(x%3?0:1),Mi.c[0],k*(0.12+0.1*Math.sin(x*0.07+tm*0.6)));
  if(tp(S,"pumpkins").on)for(const f of W>=256?[0.14,0.36,0.86]:[0.16,0.84])jackO(fb,Math.round(W*f),H-6,S.t,k);}
/* A tree in three tiers; lights twinkle when lit. */
function xmasTree(fb,cx,by,t,k,s=1,lit=true){const T=[[22,14,5],[17,8,8],[12,2,11]].map(([a,b,w])=>[by-a*s,by-b*s,w*s]);
  for(const [y0,y1,hw] of T)fb.poly([[cx+.5,y0],[cx+hw+1,y1],[cx-hw,y1]],lit?[30,120,55]:[20,70,40],k);fb.rect(cx-s,by-2*s,Math.max(2,3*s),2*s,[110,70,40],k);if(!lit)return;
  const L=[[255,60,60],[255,200,60],[80,150,255],[255,120,220],[120,230,120]];for(let i=0;i<Math.round(14*s);i++){const yy=by-(4+hash(i*2.1)*15)*s,wAt=(yy-(by-22*s))/(20*s),xx=cx+(hash(i*3.3)-0.5)*2*wAt*9*s;fb.px(xx,yy,L[i%5],k*(0.3+0.7*twk(S0(t),i,3)));}
  const st=0.7+0.3*Math.sin(t*4);fb.px(cx,by-23*s,[255,230,120],k);fb.px(cx-1,by-23*s,[255,210,90],k*st*0.6);fb.px(cx+1,by-23*s,[255,210,90],k*st*0.6);fb.px(cx,by-24*s,[255,210,90],k*st*0.6);fb.disc(cx,by-23*s,3,[255,220,120],k*0.15*st);}
const S0=t=>({t});
/* A snowman standing on the ground at x: three snowballs, coal eyes and buttons, a carrot nose, stick arms, a top hat and a scarf in c. */
function snowman(fb,x,gy,t,k,z,c){const W=[235,240,250],coal=[30,30,40],stick=[120,80,45];
  const r0=5*z,r1=3.8*z,r2=2.9*z,y0=gy-r0,y1=y0-r0-r1+1.5*z,y2=y1-r1-r2+1.2*z,wave=Math.sin(t*2)*1.2*z;
  fb.line(x-r1,y1,x-r1-5*z,y1-2*z-wave,stick,k);fb.line(x+r1,y1,x+r1+5*z,y1-3*z+wave*0.5,stick,k);
  fb.disc(x,y0,r0,W,k);fb.disc(x,y1,r1,W,k);fb.disc(x,y2,r2,W,k);
  fb.rect(Math.round(x-r1+0.5),Math.round(y1-r1+1),Math.round(2*r1),Math.max(1,Math.round(1.2*z)),c,k);fb.rect(Math.round(x+r1-2*z),Math.round(y1-r1+1),Math.max(1,Math.round(1.2*z)),Math.round(3*z),c,k);
  for(const dy of [-1,1.2])fb.px(x,y1+dy*z,coal,k);fb.px(x,y0-1*z,coal,k);
  fb.px(x-z,y2-0.6*z,coal,k);fb.px(x+z,y2-0.6*z,coal,k);fb.rect(Math.round(x+0.5),Math.round(y2+0.4*z),Math.max(2,Math.round(2*z)),1,[255,140,40],k);
  const hat=[70,70,88];fb.rect(Math.round(x-r2-0.5),Math.round(y2-r2),Math.round(2*r2+2),1,hat,k);fb.rect(Math.round(x-r2+1),Math.round(y2-r2-3*z),Math.round(2*r2-1),Math.round(3*z),hat,k);
  fb.rect(Math.round(x-r2+1),Math.round(y2-r2-1),Math.round(2*r2-1),1,c,k);}
function thChristmas(fb,S,k){const {W,H}=S,sx=heroX(S);thSky(fb,S,k,[4,8,30],[16,26,60]);
  if(tp(S,"trees").on)for(const f of [0.12,0.3,0.84])if(W>=256||f!==0.3)xmasTree(fb,Math.round(W*f),H-1,S.t,k*0.8,0.55,false);
  const T=tp(S,"tree");if(T.on){xmasTree(fb,sx,H-1,S.t*T.v,k);fb.rect(sx-10,H-4,4,3,[200,50,60],k);fb.rect(sx-9,H-4,1,3,[255,210,90],k);fb.rect(sx+7,H-5,5,4,[70,120,220],k);fb.rect(sx+9,H-5,1,4,[230,230,240],k);}
  const Sm=tp(S,"snowman",[[220,40,50]]);if(Sm.on)snowman(fb,Math.round(W*(W>=256?0.73:0.3)),H-1,S.t*Sm.v,k,Sm.s,Sm.c[0]);
  const Sn=tp(S,"snow");if(Sn.on&&Sn.n>0)snowFlakes(fb,tS(S,Sn),k*0.9,60/Sn.n,0,Sn.c);
  const Gr=tp(S,"ground",[[200,210,235]]);if(Gr.on)for(let x=0;x<W;x++){const gy=H-1-(Math.sin(x*0.09)>0.6?1:0);fb.rect(x,gy,1,H-gy,Gr.c[0],k);}
  const Li=tp(S,"lights",[[255,60,60],[80,220,100],[255,200,60],[90,150,255]]),tl=S.t*Li.v;if(Li.on)for(let x=0;x<W;x++){const seg=x%24,y=1+2.6*Math.sin(Math.PI*seg/24);fb.px(x,y,[30,80,40],k*0.8);
    if(x%8===4){const i=Math.floor(x/8),on=(Math.floor(tl*2.5)+i)%3===0?1:0.35;fb.rect(x,y+1,1,2,Li.c[i%Li.c.length],k*on);}}}
function thThanks(fb,S,k){const {W,H}=S,sx=heroX(S);thSky(fb,S,k,[30,12,26],[105,48,16]);const Su=tp(S,"sun",[[255,160,70]]);if(Su.on){fb.disc(W*0.8,H-4,11*Su.s,Su.c[0],k*0.15);fb.disc(W*0.8,H-4,6.5*Su.s,Su.c[0],k*0.9);}
  const Hl=tp(S,"hills",[[46,20,10]]);if(Hl.on)hills(fb,S,k,Hl.c[0]);
  if(tp(S,"pumpkins").on){for(const [dx,s] of [[-5,0.9],[4,0.75],[0,1.1]])jackO(fb,sx+dx,H-5,S.t,k,s,false);
    fb.rect(sx+7,H-8,12,6,[200,160,70],k);for(const yy of [H-6,H-4])fb.rect(sx+7,yy,12,1,[160,120,45],k);fb.rect(sx+7,H-8,12,1,[235,200,110],k);jackO(fb,sx+13,H-12,S.t,k,0.7,false);}
  const L=tp(S,"leaves",[[235,95,30],[205,45,30],[245,175,40],[175,95,35]]);if(L.on)floaters(fb,tS(S,L),k,tN(Math.floor(W*H/110),L),5,(fb,x,y,i,r,a)=>{const c=L.c[i%L.c.length];
    if(i%3===0)mapleLeaf(fb,x,y,2.6*L.s,c,a,r);else{fb.px(x,y,c,a);fb.px(x+Math.round(Math.cos(r)*L.s),y+Math.round(Math.sin(r)*L.s),c,a*0.8);}},5);}
const HEART_S=["#.#","###",".#."],HEART_M=[".#.#.","#####","#####",".###.","..#.."];
function thValentine(fb,S,k){const {W,H}=S,sx=heroX(S);thSky(fb,S,k,[34,2,18],[70,8,36]);thSpk(fb,S,k*0.6,"sparkles",Math.floor(W*H/200),[[255,180,210]]);
  const Hs=tp(S,"hearts",[[255,80,120],[255,150,190],[225,40,80]]);if(Hs.on)floaters(fb,tS(S,Hs),k,tN(Math.floor(W*H/140),Hs),4,(fb,x,y,i,r,a)=>glyph(fb,i%3?HEART_S:HEART_M,x,y,Hs.c[i%Hs.c.length],a*0.9),3,true);
  const B=tp(S,"heart",[[255,70,110]]);if(B.on){const c=B.c[0],z=B.s,p=(1+0.1*Math.max(0,Math.sin(S.t*B.v*6)))*z;fb.disc(sx,14,11*z,c,k*0.12);fb.disc(sx-4*p,11,5*p,c,k);fb.disc(sx+4*p,11,5*p,c,k);
    fb.poly([[sx-9*p,12],[sx+9*p,12],[sx,22*p+(1-p)*6]],c,k);fb.px(sx-5*z,9,mix(c,[255,255,255],0.7),k);}}
function shamrock(fb,x,y,s,c,a){for(const [dx,dy] of [[0,-1.1],[-1.1,0.1],[1.1,0.1]])fb.disc(x+dx*s,y+dy*s,0.95*s,c,a);fb.line(x,y+0.4*s,x+0.6*s,y+2*s,mix(c,[0,0,0],0.3),a);}
function thStPat(fb,S,k){const {W,H}=S,sx=heroX(S);thSky(fb,S,k,[2,20,10],[8,44,22]);thSpk(fb,S,k,"sparkles",Math.floor(W*H/160),[[255,210,80],[200,255,200]]);
  const Sh=tp(S,"shamrocks",[[40,160,70],[60,200,90]]);if(Sh.on)floaters(fb,tS(S,Sh),k,tN(Math.floor(W*H/200),Sh),4,(fb,x,y,i,r,a)=>shamrock(fb,x,y,1.4*Sh.s,Sh.c[i%Sh.c.length],a),7);
  const R=tp(S,"rainbow",[[228,3,3],[255,140,0],[255,237,0],[0,160,40],[0,90,255],[140,50,170]]);if(R.on){const cx=sx-12,cy=H-3;for(let a=Math.PI;a<=2*Math.PI;a+=0.02)R.c.forEach((c,i)=>fb.px(cx+Math.cos(a)*(13-i),cy+Math.sin(a)*(13-i)*0.95,c,k*0.85));}
  const Po=tp(S,"pot");if(Po.on){fb.disc(sx,H-5,4.5,[40,40,48],k);fb.rect(sx-5,H-9,11,2,[70,70,80],k);for(let i=0;i<5;i++)fb.disc(sx-3+i*1.5,H-10-(i%2),1.2,[255,200,50],k);fb.px(sx-2+Math.floor(S.t*Po.v*3)%5,H-11,[255,255,220],k);}}
function lantern(fb,cx,cy,t,k,s=1,c=[235,45,35]){fb.disc(cx,cy,7*s,mix(c,[255,170,60],0.5),k*0.12);for(let dy=-3*s;dy<=3*s;dy++){const hw=Math.round(4*s*Math.sqrt(Math.max(0,1-(dy/(3.8*s))**2)));for(let dx=-hw;dx<=hw;dx++)fb.px(cx+dx,cy+dy,dx%2===0?c:mix(c,[0,0,0],0.18),k);}
  fb.rect(cx-2*s,cy-4*s,4*s+1,1*s,[255,200,70],k);fb.rect(cx-2*s,cy+4*s,4*s+1,1*s,[255,200,70],k);fb.rect(cx,cy+5*s,1,3*s,[255,190,60],k);}
function thLunar(fb,S,k){const {W,H}=S;thSky(fb,S,k,[40,2,4],[80,10,8]);thSpk(fb,S,k,"sparkles",Math.floor(W*H/140),[[255,210,80]]);thFw(fb,S,k*0.9,[[255,210,80],[255,80,50]],Math.max(1,Math.round(W/120)));
  const L=tp(S,"lanterns",[[235,45,35]]),n=tN(Math.max(2,Math.round(W/60)),L),t=S.t*L.v;if(L.on)for(let i=0;i<n;i++){const x=Math.round((i+0.5)*W/n),len=6+hash(i*4.4)*8,sw=Math.sin(t*1.4+i*1.7)*0.12,lx=x+Math.sin(sw)*len,ly=Math.cos(sw)*len;
    fb.line(x,0,lx,ly,[200,160,80],k*0.7);lantern(fb,lx,ly+4*L.s,t,k,L.s,L.c[i%L.c.length]);}}
function diya(fb,x,by,t,k,s=1,i=0){const f=0.8+0.2*Math.sin(t*13+i*2.1)*Math.sin(t*5.7+i),sw=Math.sin(t*9+i)*0.5*s,fl=(w,h,c)=>fb.poly([[x+.5+sw,by-2.5*s-h*f],[x+w+.5,by-2.5*s-1.3*s],[x+.5,by-2.3*s],[x-w+.5,by-2.5*s-1.3*s]],c,k);
  fb.disc(x,by-4*s,4.5*s,[255,160,50],k*0.2*f);fb.poly([[x-4*s,by-2.5*s],[x+5.5*s+1,by-3.2*s],[x+4*s+1,by-2.5*s],[x+2.5*s+1,by],[x-2.5*s,by]],[190,90,35],k);fb.rect(x-4*s,by-2.5*s,8*s+1,Math.max(1,s*0.8),[235,140,60],k);
  fl(1.6*s,5.5*s,[255,170,50]);fl(0.8*s,3.5*s,[255,240,170]);}
function thDiwali(fb,S,k){const {W,H}=S;thSky(fb,S,k,[12,4,30],[44,12,40]);thSpk(fb,S,k,"sparkles",Math.floor(W*H/150),[[255,210,90],[255,120,200]]);
  thFw(fb,S,k,[[255,200,60],[255,80,200],[255,130,40],[120,220,255]],Math.max(2,Math.round(W/80)));
  const D=tp(S,"diyas");if(D.on&&D.n>0){const step=Math.max(6,22/D.n),t=S.t*D.v;let i=0;for(let x=11;x<W;x+=step)diya(fb,Math.round(x),H,t,k,1,i++);}}
/* The menorah lights its shamash and, on night n, the n rightmost candles. */
/* A menorah: its own colour, candles in turn from a list (blue and white), flames that flicker as fast and as hard as asked. night lights that many and the shamash. */
function menorah(fb,cx,by,t,k,night=8,s=1,o={}){const g=o.body||[230,190,80],cc=o.candles===false?null:o.candles||[[90,140,255],[230,235,255]],fc=o.flames===false?null:o.flames||[[255,220,110],[255,245,200]],fl=o.flicker==null?1:o.flicker,fv=o.fspeed==null?1:o.fspeed;
  fb.rect(cx-5*s,by-1,10*s+1,1,g,k);fb.rect(cx,by-12*s,1,11*s,g,k);fb.rect(cx-8*s,by-12*s,16*s+1,1,g,k);
  for(let n=-4;n<=4;n++){const x=cx+n*2*s,sh=n===0,top=by-(sh?15:13)*s,lit=sh||(n>0?n+4:n+5)>8-night;if(sh)fb.rect(x,by-15*s,1,3*s,g,k);
    if(!cc)continue;fb.rect(x,top-3*s,1,3*s,cc[(n+4)%cc.length],k);
    if(lit&&fc){const f=clamp(1-0.3*fl*(0.5-0.5*Math.sin(t*12*fv+n*1.9)),0.15,1);fb.px(x,top-3*s-1,fc[0],k*f);fb.px(x,top-3*s-2,fc[1]||fc[0],k*f*0.6);fb.disc(x,top-3*s-1,2.5,fc[0],k*0.12*f);}}}
/* Spooky Christmas: Halloween and Christmas in one night. A spiral hill under a huge pale moon, crooked gravestones and a bent fence,
   bats and snow, jack-o'-lanterns in Santa hats and gifts in black-and-white stripes with lopsided bows, under a teal-to-purple sky. */
function spiralHill(fb,cx,by,k,c,s=1){const top=by-14*s;
  // The hill, a long rise, then its crest rolling up into a curl.
  for(let x=-34*s;x<=8*s;x++){const u=x/(34*s),h=x<=0?(14*s)*(1-u*u):14*s-Math.pow(x/(8*s),2)*6*s;fb.rect(cx+x,by-h,1,h+1,c,k);}
  for(let a=0;a<Math.PI*3.2;a+=0.05){const r=(1+a*1.15)*s,x=cx+8*s-1+Math.cos(a+Math.PI)*r*0.9,y=top-1+Math.sin(a+Math.PI)*r*0.75;fb.rect(x,y,s>1?2:1.4,s>1?2:1.4,c,k);}}
function gravestone(fb,x,by,k,i,c){const h=5+(i%3),w=4+(i%2),lean=i%2?1:-1;for(let j=0;j<h;j++){const sh=Math.round(lean*j/4);fb.rect(x+sh,by-j,w,1,c,k);}fb.px(x+Math.round(lean*h/4)+1,by-h,c,k);fb.px(x+Math.round(lean*(h-2)/4)+1,by-h+3,[20,20,26],k);}
function santaHat(fb,cx,top,k,s=1){fb.poly([[cx-3*s,top+3*s],[cx+3*s,top+3*s],[cx+2*s,top-1*s],[cx+5*s,top+1*s]],[210,40,50],k);fb.rect(cx-3*s,top+3*s,6*s+1,1,[240,240,245],k);fb.disc(cx+5*s,top+1*s,0.9*s,[240,240,245],k);}
function stripedGift(fb,x,by,w,h,k,c,bow){for(let j=0;j<h;j++)for(let i=0;i<w;i++)fb.px(x+i,by-j,c[((i+j)>>1)%c.length],k);fb.rect(x+(w>>1),by-h+1,1,h,bow,k);fb.rect(x,by-(h>>1),w,1,bow,k);
  // A crooked bow on top.
  fb.px(x+(w>>1)-2,by-h-1,bow,k);fb.px(x+(w>>1)-1,by-h,bow,k);fb.px(x+(w>>1)+1,by-h-2,bow,k);fb.px(x+(w>>1)+2,by-h-1,bow,k);}
function thSpookyXmas(fb,S,k){const {W,H}=S,sx=heroX(S);thSky(fb,S,k,[6,26,42],[70,34,92]);thSpk(fb,S,k*0.6,"stars",Math.floor(W*H/200),[[200,230,240]]);
  // The moon sits behind the hill's curl, so the curl shows black against it.
  const M=tp(S,"moon",[[236,236,214]]),mz=M.s,mx=sx+10;if(M.on){fb.disc(mx,12,16*mz,M.c[0],k*0.09);fb.disc(mx,12,12*mz,M.c[0],k*0.95);for(const [dx,dy,r] of [[-5,-3,1.8],[4,4,1.4],[-2,6,1.1]])fb.disc(mx+dx*mz,12+dy*mz,r*mz,mix(M.c[0],[150,150,140],0.3),k);}
  const Hl=tp(S,"hill",[[3,3,6]]);if(Hl.on)spiralHill(fb,sx+4,H-1,k,Hl.c[0],Hl.s>=1.5?1.5:1);
  const B=tp(S,"bats",[[70,40,90]]);if(B.on){const nb=tN(Math.max(3,Math.round(W/60)),B),tb=S.t*B.v;for(let i=0;i<nb;i++){const sp=9+hash(i)*9,x=((hash(i*2.3)*W+tb*sp)%(W+20))-10,y=4+hash(i*4.1)*12+Math.sin(tb*2.1+i)*3;bat(fb,x,y,tb,i,B.c[i%B.c.length],k);}}
  const Gs=tp(S,"graves",[[118,122,138]]);if(Gs.on){const n=tN(W>=256?6:3,Gs);for(let i=0;i<n;i++){const gx=Math.round((i+0.5)*W/n+(hash(i*7.7)-0.5)*14);if(Math.abs(gx-sx)>26)gravestone(fb,gx,H-2,k,i,Gs.c[i%Gs.c.length]);}}
  const Fe=tp(S,"fence",[[22,20,30]]);if(Fe.on){fb.rect(0,H-6,W,1,Fe.c[0],k*0.9);for(let x=1;x<W;x+=4){const lean=Math.round(Math.sin(x*0.7)*1);fb.rect(x+lean,H-9,1,8,Fe.c[0],k*0.9);fb.px(x+lean,H-10,Fe.c[0],k*0.9);}}
  const Pk=tp(S,"pumpkins");if(Pk.on)for(const f of W>=256?[0.16,0.62,0.9]:[0.15,0.85]){const px=Math.round(W*f);if(Math.abs(px-sx)<20)continue;jackO(fb,px,H-6,S.t,k,Pk.s);santaHat(fb,px,H-15-Math.round(3*(Pk.s-1)),k,Pk.s>=1.5?1.5:1);}
  const Gf=tp(S,"gifts",[[235,235,240],[16,16,20]]);if(Gf.on)for(const [f,w,h] of W>=256?[[0.3,7,6],[0.75,6,5]]:[[0.32,6,5]]){const gx=Math.round(W*f);if(Math.abs(gx-sx)>20)stripedGift(fb,gx,H-2,w,h,k,Gf.c,[200,40,60]);}
  const Sn=tp(S,"snow");if(Sn.on&&Sn.n>0)snowFlakes(fb,tS(S,Sn),k*0.85,70/Sn.n,0,Sn.c);}
function thHanukkah(fb,S,k){const {W,H}=S,sx=heroX(S);thSky(fb,S,k,[4,10,40],[12,28,76]);thSpk(fb,S,k,"stars",Math.floor(W*H/120),[[255,255,255],[140,180,255]]);
  const M=tp(S,"menorah",[[230,190,80]]),Cd=tp(S,"candles",[[90,140,255],[230,235,255]]),Fl=tp(S,"flames",[[255,220,110],[255,245,200]]);
  if(M.on)menorah(fb,sx,H-1,S.t,k,S.night!=null?clamp(Math.round(S.night),1,8):8,M.s>=1.5?2:1,{body:M.c[0],candles:Cd.on&&Cd.c,flames:Fl.on&&Fl.c,flicker:Fl.n,fspeed:Fl.v});}
function crescent(fb,cx,cy,r,k,bg,c=[255,220,130]){fb.disc(cx,cy,r,c,k);fb.disc(cx+r*0.45,cy-r*0.25,r*0.88,bg,k);}
function fanous(fb,cx,cy,t,k,i=0,c=[255,190,90]){const f=0.75+0.25*Math.sin(t*6+i*2);fb.disc(cx,cy,6,c,k*0.13*f);fb.poly([[cx-2,cy-3],[cx+3,cy-3],[cx+.5,cy-6]],[210,160,60],k);
  fb.rect(cx-2,cy-3,5,6,c,k*f);fb.frame(cx-2,cy-3,cx+2,cy+2,[200,150,60],k);fb.px(cx,cy-1,[255,245,200],k*f);fb.rect(cx-1,cy+3,3,1,[200,150,60],k);}
function thEid(fb,S,k){const {W,H}=S,sx=heroX(S),[c0,c1]=thSky(fb,S,k,[2,16,28],[6,36,52]);thSpk(fb,S,k,"stars",Math.floor(W*H/120),[[255,240,200],[200,230,255]]);
  const M=tp(S,"moon",[[255,220,130],[255,225,140]]),z=M.s;if(M.on){fb.disc(sx,11,11*z,M.c[0],k*0.08);crescent(fb,sx,11,7*z,k,skyAt(S,c0,c1,9),M.c[0]);
    const P=[];for(let j=0;j<10;j++){const r=(j%2?1.3:3)*z,a=-Math.PI/2+j*Math.PI/5;P.push([sx+8*z+Math.cos(a)*r,8+Math.sin(a)*r]);}fb.poly(P,M.c[1]||M.c[0],k);}
  const L=tp(S,"lanterns",[[255,190,90]]),n=tN(Math.max(2,Math.round(W/70)),L),t=S.t*L.v;if(L.on)for(let i=0;i<n;i++){const x=Math.round((i+0.5)*W/n+W/(n*4)),len=5+hash(i*2.7)*10,sw=Math.sin(t*1.2+i*2)*0.1,lx=x+Math.sin(sw)*len,ly=Math.cos(sw)*len;
    if(Math.abs(lx-sx)<16)continue;fb.line(x,0,lx,ly,[160,130,70],k*0.6);fanous(fb,lx,ly+6,t,k,i,L.c[i%L.c.length]);}}
function poppy(fb,cx,cy,k,s=1){for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]])fb.disc(cx+dx*2*s,cy+dy*2*s,3*s,[205,25,30],k);fb.disc(cx,cy,2.4*s,[225,35,40],k);fb.disc(cx,cy,1.3*s,[18,12,12],k);}
function thPoppy(fb,S,k){const {W,H}=S,sx=heroX(S);thSky(fb,S,k,[6,6,8],[18,14,16]);
  const Pe=tp(S,"petals",[[200,25,30]]);if(Pe.on)floaters(fb,tS(S,Pe),k,tN(Math.floor(W*H/260),Pe),3,(fb,x,y,i,r,a)=>{fb.disc(x,y,1.6*Pe.s,Pe.c[i%Pe.c.length],a*0.9);fb.px(x,y,[20,10,10],a);},13);
  const Po=tp(S,"poppy");if(Po.on)poppy(fb,sx,15,k,1.4*Po.s);}
function thNewYear(fb,S,k){const {W,H}=S;thSky(fb,S,k,[4,4,16],[16,12,34]);
  const C=tp(S,"confetti",[[220,220,235],[255,215,110]]),Sc=tS(S,C);if(C.on)floaters(fb,Sc,k,tN(Math.floor(W*H/120),C),6,(fb,x,y,i,r,a)=>{const c=C.c[i%C.c.length],w=a*twk(Sc,i,4);if(C.s>1.3)fb.disc(x,y,0.6*C.s,c,w);else fb.px(x,y,c,w);},17);
  thFw(fb,S,k,[[255,210,90],[235,235,250],[255,240,190]],Math.max(3,Math.round(W/55)));}
const glyphS=(fb,G,x,y,c,a,s=1)=>{for(let j=0;j<G.length;j++)for(let i=0;i<G[j].length;i++)if(G[j][i]==="#")fb.rect(x+i*s,y+j*s,s,s,c,a);};
const PASTEL=[[255,170,200],[170,220,255],[255,235,140],[180,240,190],[215,185,255]];
/* An egg in pastel bands, the middle one zig-zagged. */
function egg(fb,cx,cy,rx,ry,k,seed=0){for(let y=Math.floor(cy-ry);y<=cy+ry;y++){const v=(y+.5-cy)/ry;if(Math.abs(v)>1)continue;const wd=rx*Math.sqrt(1-v*v)*(v<0?0.8+0.2*(1+v):1);
  for(let x=Math.round(cx-wd);x<=Math.round(cx+wd);x++){const zig=(((x-Math.round(cx))%4+4)%4<2?0.13:-0.13),b=clamp(Math.floor((v+(Math.abs(v)<0.45?zig:0)+1)/2*5),0,4),edge=Math.abs(x+.5-cx)/Math.max(wd,1);
    fb.px(x,y,mix(PASTEL[(b+seed)%5],[90,80,110],clamp((edge-0.7)*1.2,0,0.5)),k);}}}
const BUNNY=["....#.#..","....#.#..","....###..","...#####.","#.######.","########.",".######..",".#...#..."];
function grass(fb,S,k,c0,c1){const {W,H,t}=S;for(let x=0;x<W;x++){const h=2+Math.round(hash(x*1.3)*2.5),sw=Math.sin(t*2+x*0.4)*0.6;fb.rect(x,H-2,1,2,c0,k);fb.line(x,H-2,x+sw,H-2-h,c1,k,k*0.8);}}
function thEaster(fb,S,k){const {W,H}=S,sx=heroX(S);thSky(fb,S,k,[60,110,180],[150,195,235]);
  const Cl=tp(S,"clouds",[[235,242,250],[245,248,255]]),tc=S.t*Cl.v,nc=tN(Math.max(2,Math.round(W/120)),Cl);if(Cl.on)for(let i=0;i<nc;i++){const x=((hash(i*3.1)*W+tc*3)%(W+30))-15,c0=Cl.c[0],c1=Cl.c[1]||c0;
    fb.disc(x,6+hash(i)*5,3,c0,k*0.8);fb.disc(x+4,5+hash(i)*5,4,c1,k*0.8);fb.disc(x+8,6+hash(i)*5,3,c0,k*0.8);}
  const Tu=tp(S,"tulips",[[255,90,120],[255,200,60],[200,120,255]]),nt=tN(Math.max(3,Math.round(W/40)),Tu);if(Tu.on)for(let i=0;i<nt;i++){const x=Math.round(hash(i*5.7)*W),c=Tu.c[i%Tu.c.length];fb.line(x,H-2,x,H-7,[70,160,70],k);fb.rect(x-1,H-10,3,3,c,k);fb.px(x,H-11,c,k);}
  const Gr=tp(S,"grass",[[50,130,50],[90,190,80]]);if(Gr.on)grass(fb,tS(S,Gr),k,Gr.c[0],Gr.c[1]||Gr.c[0]);
  if(tp(S,"eggs").on){for(const [f,i] of (W>=256?[[0.14,1],[0.3,2],[0.84,3]]:[[0.16,1],[0.86,3]]))egg(fb,Math.round(W*f),H-5,3,4,k,i);egg(fb,sx,H-12+Math.sin(S.t*2)*1,7,9,k);}
  const Bu=tp(S,"bunny",[[245,245,250]]);if(Bu.on){const t=S.t*Bu.v,per=W/14+6,bx=((t*14)%(W+per))-10,hop=Math.abs(Math.sin(t*5))*5;glyphS(fb,BUNNY,bx,H-10-hop,Bu.c[0],k);fb.px(bx+6,H-7-hop,[40,30,40],k);}}
function thHoli(fb,S,k){const {W,H}=S,P=tp(S,"powder",[[255,40,140],[255,210,0],[40,210,80],[40,140,255],[255,120,20],[170,60,255]]),C=P.c,n=tN(Math.max(3,Math.round(W/40)),P),t=S.t*P.v,z=P.s;thSky(fb,S,k,[20,8,28],[36,14,30]);
  const G=tp(S,"ground",C);if(G.on)for(let x=0;x<W;x+=3)fb.rect(x,H-2,3,2,G.c[Math.floor(hash(Math.floor(x/9))*G.c.length)],k*0.45);
  if(P.on)for(let r=0;r<n;r++){const per=2.4+hash(r*2.3)*1.6,tt=t+hash(r*5.1)*per,cyc=Math.floor(tt/per),ph=(tt-cyc*per)/per,x0=6+hash(r*7+cyc*1.3)*(W-12),y0=9+hash(r*3+cyc*2.1)*14,c=C[Math.floor(hash(r*11+cyc*0.7)*C.length)],R=(3+ease(Math.min(1,ph*1.6))*11)*z,a=k*(ph<0.12?ph/0.12:1-(ph-0.12)/0.88);
    for(let j=0;j<5;j++)fb.disc(x0+Math.sin(j*2.1+r)*R*0.4,y0+Math.cos(j*1.7+r)*R*0.25-ph*3,R*(0.5+0.12*(j%3)),mix(c,[255,255,255],0.15),a*0.5);
    for(let q=0;q<24;q++){const an=hash(q*3.3+r+cyc)*Math.PI*2,sp=R*(0.7+hash(q*1.9+cyc)*0.9);const px=x0+Math.cos(an)*sp,py=y0+Math.sin(an)*sp*0.7+ph*ph*6;fb.px(px,py,c,a);fb.px(px+1,py,c,a*0.6);}}}
function papelPicado(fb,S,k,C=[[255,60,140],[255,150,30],[80,200,255],[160,90,255],[90,220,120],[255,220,60]]){const {W,t}=S;fb.rect(0,0,W,1,[200,180,160],k*0.5);
  for(let i=0;i*11<W;i++){const x=i*11+1,sw=Math.round(Math.sin(t*1.8+i*0.7)*0.7),c=C[i%C.length];
    for(let y=1;y<7;y++)for(let dx=0;dx<9;dx++){const cut=(y===2&&(dx===2||dx===6))||(y===3&&dx===4)||(y===4&&(dx===1||dx===4||dx===7)),bot=y===6&&dx%2===1;if(!cut&&!bot)fb.px(x+dx+(y>3?sw:0),y,c,k*0.85);}}}
/* A sugar skull: coloured eye rings, a marigold on the forehead, stitched teeth. */
function calavera(fb,cx,cy,t,k,s=1){const w=[240,236,228],d=[24,10,34],P=(dx,dy,c)=>fb.rect(cx+dx*s,cy+dy*s,s,s,c,k);fb.disc(cx+.5,cy-1.5*s,6.2*s,w,k);fb.rect(cx-3*s,cy+2*s,7*s,4*s,w,k);
  fb.disc(cx-2.3*s+.5,cy-1*s,2.3*s,[255,60,140],k);fb.disc(cx+3.3*s-.5,cy-1*s,2.3*s,[80,200,255],k);fb.disc(cx-2.3*s+.5,cy-1*s,1.3*s,d,k);fb.disc(cx+3.3*s-.5,cy-1*s,1.3*s,d,k);
  P(0,2,d);P(1,2,d);for(let i=-2;i<=3;i++){P(i,4,i%2?d:[200,195,190]);}P(-3,3,[255,150,30]);P(4,3,[255,150,30]);
  for(const [dx,dy] of [[-1,-7],[1,-7],[0,-8],[0,-6]])P(dx+.5,dy,[255,150,30]);P(.5,-7,[255,220,60]);}
function thMuertos(fb,S,k){const {W,H}=S,sx=heroX(S);thSky(fb,S,k,[16,4,30],[40,10,40]);thSpk(fb,S,k*0.6,"stars",Math.floor(W*H/240),[[255,220,160]]);
  const Bn=tp(S,"banners",[[255,60,140],[255,150,30],[80,200,255],[160,90,255],[90,220,120],[255,220,60]]);if(Bn.on)papelPicado(fb,tS(S,Bn),k,Bn.c);
  const Pe=tp(S,"petals",[[255,205,40],[255,150,20],[255,150,20]]);if(Pe.on)floaters(fb,tS(S,Pe),k,tN(Math.floor(W*H/150),Pe),4,(fb,x,y,i,r,a)=>{const c=Pe.c[i%Pe.c.length];fb.px(x,y,c,a);if(i%2)fb.px(x+1,y,c,a*0.6);},19);
  const Ca=tp(S,"candles"),tc=S.t*Ca.v;if(Ca.on)for(let x=14,i=0;x<W;x+=30,i++){if(Math.abs(x-sx)<12)continue;const f=0.75+0.25*Math.sin(tc*12+i*2.3);fb.rect(x,H-5,2,4,[240,225,190],k);fb.px(x,H-6,[255,200,80],k*f);fb.px(x+1,H-7,[255,240,170],k*f*0.6);fb.disc(x+1,H-6,3,[255,160,60],k*0.15*f);}
  const Sk=tp(S,"skull"),ts=S.t*Sk.v;if(Sk.on)calavera(fb,sx,16+Math.sin(ts*1.2)*0.6,ts,k,1.4);}
function pancakeStack(fb,cx,by,t,k,n=4,s=1){for(let i=0;i<n;i++){const y=by-2*s-i*2*s,w=Math.round(7*s-(i%2)*0.6);fb.rect(cx-w,y,2*w+1,2*s,[228,168,82],k);fb.rect(cx-w,y+2*s-1,2*w+1,1,[176,112,44],k);}
  const top=by-2*s-(n-1)*2*s;fb.rect(cx-5*s,top,10*s+1,1,[150,70,20],k);for(const dx of [-5,-1,3]){const len=1+(Math.sin(t*1.3+dx)*0.5+0.5)*3*s;fb.rect(cx+dx*s,top+1,1,len,[160,80,25],k);}fb.rect(cx-1.5*s,top-2*s,3*s+1,2*s,[255,236,140],k);}
function lemon(fb,cx,cy,k,s=1){fb.disc(cx,cy,4*s,[250,210,40],k);fb.disc(cx,cy,3.2*s,[255,242,150],k);for(let j=0;j<6;j++){const a=j*Math.PI/3;fb.line(cx,cy,cx+Math.cos(a)*3*s,cy+Math.sin(a)*3*s,[250,215,70],k);}}
function thPancake(fb,S,k){const {W,H}=S,sx=heroX(S),px0=Math.round(W*(W>=256?0.3:0.22)),py=H-7;thSky(fb,S,k,[60,28,12],[110,58,24]);thSpk(fb,S,k*0.7,"sparkles",Math.floor(W*H/200),[[255,255,255],[255,230,190]]);
  fb.rect(0,H-4,W,4,[92,56,30],k);fb.rect(0,H-4,W,1,[130,85,48],k);
  const Pa=tp(S,"pan");if(Pa.on){fb.rect(px0-8,py,17,2,[120,120,132],k);fb.rect(px0-7,py+2,15,1,[80,80,90],k);fb.rect(px0+9,py,9,2,[60,60,66],k);
    const t=S.t*Pa.v,ph=(t%3)/3,air=ph<0.55,q=air?ph/0.55:0,h=air?Math.sin(q*Math.PI)*13:0,ang=q*Math.PI*2,hh=Math.max(0.5,Math.abs(Math.cos(ang))*1.6),c=Math.cos(ang)>0?[232,172,84]:[245,210,140];
    for(let x=-6;x<=6;x++){const e=Math.sqrt(1-(x/7)**2);fb.rect(px0+x,py-1-h-hh*e,1,Math.max(1,2*hh*e),c,k);}}
  if(tp(S,"stack").on){pancakeStack(fb,sx,H-4,S.t,k,5,1.4);lemon(fb,sx+17,H-9,k,1.3);}}
const THEME_ICONS2={easter_egg:(fb,cx,cy)=>egg(fb,cx,cy+1,7,9,1),bunny:(fb,cx,cy)=>{glyphS(fb,BUNNY,cx-9,cy-8,[245,245,250],1,2);fb.rect(cx+3,cy-2,2,2,[40,30,40]);},
  colour_powder:(fb,cx,cy,t)=>{for(const [dx,dy,c] of [[-4,2,[255,40,140]],[4,2,[40,140,255]],[0,-3,[255,210,0]]])fb.disc(cx+dx,cy+dy,5.5,c,0.8);},
  sugar_skull:(fb,cx,cy,t)=>calavera(fb,cx,cy+2,t,1,1.4),marigold:(fb,cx,cy)=>{for(let j=0;j<10;j++){const a=j*Math.PI/5;fb.disc(cx+Math.cos(a)*5,cy+Math.sin(a)*5,3,j%2?[255,160,20]:[255,125,0]);}for(let j=0;j<10;j++){const a=(j+.5)*Math.PI/5;fb.line(cx+Math.cos(a)*3,cy+Math.sin(a)*3,cx+Math.cos(a)*8,cy+Math.sin(a)*8,[110,40,0],0.7);}
    for(let j=0;j<6;j++){const a=j*Math.PI/3+0.3;fb.disc(cx+Math.cos(a)*2.4,cy+Math.sin(a)*2.4,1.8,[255,200,50]);}fb.disc(cx,cy,1.4,[190,85,10]);},
  pancakes:(fb,cx,cy,t)=>pancakeStack(fb,cx,cy+9,t,1,4,1.3)};
const THEMES={new_year:{name:"New Year's",title:"HAPPY NEW YEAR",tc:[255,215,110],bg:thNewYear},valentines:{name:"Valentine's Day",title:"HAPPY VALENTINE'S DAY",tc:[255,140,180],bg:thValentine},
  lunar_new_year:{name:"Lunar New Year",title:"HAPPY LUNAR NEW YEAR",tc:[255,210,80],bg:thLunar},pancake_day:{name:"Pancake Day",title:"PANCAKE DAY",tc:[255,210,120],bg:thPancake},st_patricks:{name:"St Patrick's Day",title:"HAPPY ST PATRICK'S DAY",tc:[90,230,120],bg:thStPat},
  holi:{name:"Holi",title:"HAPPY HOLI",tc:(X,t)=>hsv(X*6+t*120,0.7,1),bg:thHoli},easter:{name:"Easter",title:"HAPPY EASTER",tc:[[255,170,200],[170,220,255],[255,235,140],[180,240,190]],bg:thEaster},eid:{name:"Eid",title:"EID MUBARAK",tc:[255,220,130],bg:thEid},pride:{name:"Pride",title:"HAPPY PRIDE",tc:(X,t)=>hsv(X*4-t*90,0.55,1),bg:thPride},
  canada_day:{name:"Canada Day",title:"HAPPY CANADA DAY",tc:[[255,70,70],[255,255,255]],bg:thCanada},fourth_of_july:{name:"Fourth of July",title:"HAPPY 4TH OF JULY",tc:[[255,80,80],[255,255,255],[110,150,255]],bg:thJuly},
  thanksgiving:{name:"Thanksgiving",title:"HAPPY THANKSGIVING",tc:[255,170,60],bg:thThanks},halloween:{name:"Halloween",title:"HAPPY HALLOWEEN",tc:[255,140,30],bg:thHalloween},
  dia_de_muertos:{name:"Día de los Muertos",title:"DIA DE LOS MUERTOS",tc:[[255,60,140],[255,150,30],[80,200,255],[255,220,60]],bg:thMuertos},diwali:{name:"Diwali",title:"HAPPY DIWALI",tc:[255,200,80],bg:thDiwali},remembrance:{name:"Remembrance Day",title:"LEST WE FORGET",tc:[235,230,230],bg:thPoppy,quiet:1},
  hanukkah:{name:"Hanukkah",title:"HAPPY HANUKKAH",tc:[170,200,255],bg:thHanukkah},christmas:{name:"Christmas",title:"MERRY CHRISTMAS",tc:[[255,70,70],[255,255,255]],bg:thChristmas}};
/* Scenes that moved to the Marketplace as plugins. Not shipped as themes; kept so the SDK port can be compared LED for LED. */
const REF_THEMES={spooky_christmas:{name:"Spooky Christmas",title:"MERRY SPOOKY CHRISTMAS",tc:[[255,140,40],[200,230,240]],bg:thSpookyXmas}};
/* ---------- Marketplace plugins: themes and animations compiled to WebAssembly with the SDK ---------- */
/* What a plugin may import. It draws on st.fb and reads the notification or theme in P ({title, message, detail, colors, parts, faint, night, hx}); st.mem is set once it's instantiated. */
function pluginImports(P,st){const dec=new TextDecoder(),enc=new TextEncoder(),rgb=c=>[(c>>16)&255,(c>>8)&255,c&255],A=a=>clamp(a,0,255)/255,fit=s=>fitText(s,F5,false),hex=h=>{const m=/^#?([0-9a-f]{6})$/i.exec(String(h||""));return m?parseInt(m[1],16):null;};
  const str=(p,n)=>dec.decode(new Uint8Array(st.mem.buffer,p,n)),fb=()=>st.fb,part=k=>(P.parts&&P.parts[k])||{},pct=(v,lo,hi,d)=>{const x=+v;return v!==null&&v!==undefined&&isFinite(x)?clamp(x,lo,hi):d;};
  return {px:(x,y,c,a)=>fb().px(x,y,rgb(c),A(a)),rect:(x,y,w,h,c,a)=>fb().rect(x,y,w,h,rgb(c),A(a)),
    text:(p,n,x,y,c,size,outline)=>{const s=fit(str(p,n)),sc=size>=3?3:size===2?2:1;if(outline)fb().textO(F5,s,x,y,rgb(c),sc);else fb().text(F5,s,x,y,rgb(c),sc);return fb().tw(F5,s,sc);},
    text_width:(p,n,size)=>fb().tw(F5,fit(str(p,n)),size>=3?3:size===2?2:1),
    // Text in a named face: pixel (5 x 7), small (3 x 5 capitals), big, segment (7-segment, its own size), or a title face. Gives back the width.
    text_font:(fp,fn,p,n,x,y,c,size,outline)=>{const f=str(fp,fn),s0=str(p,n),sc=size>=3?3:size===2?2:1,col=rgb(c);
      if(f==="segment"){const s=s0.replace(TRY_KEEP.segment,"");segText(fb(),s,Math.round(x),Math.round(y),{col});return segW(s);}
      const F=f==="small"?F3:f==="big"?BIG:TITLE_FONTS[f]||F5,s=fitText(s0,F,false);if(outline)fb().textO(F,s,x,y,col,sc);else fb().text(F,s,x,y,col,sc);return fb().tw(F,s,sc);},
    text_width_font:(fp,fn,p,n,size)=>{const f=str(fp,fn),s0=str(p,n),sc=size>=3?3:size===2?2:1;if(f==="segment")return segW(s0.replace(TRY_KEEP.segment,""));const F=f==="small"?F3:f==="big"?BIG:TITLE_FONTS[f]||F5;return fb().tw(F,fitText(s0,F,false),sc);},
    /* The card's picture i (its images list), at x, y: its width, or 0 when the card has none there or the display doesn't hold it. */
    image:(i,x,y,a)=>{const id=Array.isArray(P.images)?P.images[i]:null,im=id&&IMGS[id];if(!im)return 0;drawImg(fb(),id,Math.round(x),Math.round(y),A(a)/255);return im.w;},
    image_size:(i,wh)=>{const id=Array.isArray(P.images)?P.images[i]:null,im=id&&IMGS[id];return im?(wh?im.h:im.w):0;},
    param:(kp,kn,bp,cap)=>{const k=str(kp,kn);let v=P[k];if(v===undefined&&P.options&&typeof P.options==="object"&&P.options[k]!==undefined&&P.options[k]!==null)v=String(P.options[k]);if(typeof v!=="string"||cap<1)return -1;const b=enc.encode(v).subarray(0,cap-1),o=new Uint8Array(st.mem.buffer,bp,b.length+1);o.set(b);o[b.length]=0;return b.length;},
    color:i=>{const c=hex((P.colors||[])[i]);return c===null?-1:c;},
    pxf:(x,y,c,a)=>fb().px(x,y,rgb(c),A(a)),add:(x,y,c,a)=>fb().add(x,y,rgb(c),A(a)),rectf:(x,y,w,h,c,a)=>fb().rect(x,y,w,h,rgb(c),A(a)),
    vgrad:(x,y,w,h,c0,c1,a)=>fb().vgrad(x,y,w,h,rgb(c0),rgb(c1),A(a)),frame_rect:(x0,y0,x1,y1,c,a)=>fb().frame(x0,y0,x1,y1,rgb(c),A(a)),
    disc:(cx,cy,r,c,a)=>fb().disc(cx,cy,r,rgb(c),A(a)),ring:(cx,cy,r,w,c,a)=>fb().ring(cx,cy,r,w,rgb(c),A(a)),line:(x0,y0,x1,y1,c,a0,a1)=>fb().line(x0,y0,x1,y1,rgb(c),A(a0),A(a1)),
    poly:(p,n,c,a)=>{const f=new Float64Array(st.mem.buffer,p,n*2),Q=[];for(let i=0;i<n;i++)Q.push([f[i*2],f[i*2+1]]);fb().poly(Q,rgb(c),A(a));},
    clip:(x,y,w,h)=>fb().pushClip(x,y,w,h),unclip:()=>fb().popClip(),icon:(p,n,cx,cy,c)=>{const d=ICONS[str(p,n)];if(d)d(fb(),cx,cy,st.t,rgb(c));},
    part_on:(p,n)=>part(str(p,n)).on===false?0:1,
    part_num:(p,n,kp,kn,d)=>{const k=str(kp,kn),lo=k==="size"?25:0,hi=k==="size"?300:500;let r=pct(part(str(p,n))[k],lo,hi,d);if(k==="amount"&&P.faint)r=Math.round(r*THEME_FAINT_N);return r;},
    part_color:(p,n,i,d)=>{const cs=part(str(p,n)).colors,c=Array.isArray(cs)?hex(cs[i]):null;return c===null?d:c;},
    hero_x:()=>heroX({hx:P.hx,W:fb().W}),night:()=>Math.round(+P.night)||0,hashd:hash,sind:Math.sin,cosd:Math.cos,powd:Math.pow};}
/* Loads a plugin's .wasm: { manifest, frame(fb, t), bg(fb, S, k) }. frame clears fb and draws one frame (an animation); bg draws it as a theme's sky,
   reading parts, faint, night and hx from S like a built-in theme, k bright. A plugin that traps goes dark instead of taking the page down. */
async function loadPlugin(bytes,P={}){const st={fb:null,mem:null,t:0},pb=pluginImports(P,st),{instance}=await WebAssembly.instantiate(bytes,{pb}),X=instance.exports;st.mem=X.memory;
  let manifest=null;if(X.manifest){try{const p=X.manifest(),m=new Uint8Array(X.memory.buffer);let n=0;while(m[p+n]&&n<65536)n++;manifest=JSON.parse(new TextDecoder().decode(m.subarray(p,p+n)));}catch(e){manifest={error:String(e&&e.message||e)};}}
  let inited=false,scratch=null;const run=(fb,t)=>{st.fb=fb;st.t=t;if(!inited){inited=true;if(X.init)X.init(fb.W,32);}try{X.frame(t,fb.W,32);}catch(e){}};
  return {manifest,frame(fb,t){fb.noClip();fb.clear();run(fb,t);},
    bg(fb,S,k){Object.assign(P,{parts:S.parts,faint:S.faint,night:S.night,hx:S.hx});if(k>=1){run(fb,S.t);return;}if(!scratch||scratch.W!==fb.W)scratch=new FB(fb.W,fb.H);scratch.clear();run(scratch,S.t);fb.mixFrom(scratch,k);}};}
/* A plugin theme joins THEMES under key, so theme messages, previews and the catalogue treat it like a built-in one. */
function addPluginTheme(key,plug){const m=plug.manifest||{},tc=(m.colors||[]).map(rgbOf).filter(Boolean);
  THEMES[key]={name:m.title||key,title:fitText(m.banner||m.title||key,F5),tc:tc.length>1?tc:tc[0]||[255,255,255],bg:plug.bg,plugin:plug};return THEMES[key];}
/* The notification version: the scene, a little dimmer, with the title dropping in (remembrance fades in instead). */
/* Marketplace plugins by key (mp:<slug>), fetched from the Marketplace's dist files and registered once: a theme into THEMES,
   an animation into PLUG.anim. The page can point pluginSource at its own copy of the Marketplace. Until the .wasm is in, the key draws nothing. */
const PLUG={anim:{},loading:{}};let PLUGIN_SRC=slug=>fetch("https://cdn.jsdelivr.net/gh/FireBall1725/pixelbar-marketplace@dist/"+slug+".wasm").then(r=>r.ok?r.arrayBuffer():null);
function setPluginSource(fn){PLUGIN_SRC=fn;}
const isPluginKey=k=>typeof k==="string"&&/^mp:[a-z0-9][a-z0-9-]{1,40}$/.test(k);
function ensurePlugin(key,kind){if(PLUG.loading[key])return PLUG.loading[key];PLUG.loading[key]=(async()=>{try{const bytes=await PLUGIN_SRC(key.slice(3));if(!bytes)return;const P={},plug=await loadPlugin(bytes,P);plug.P=P;if(kind==="theme")addPluginTheme(key,plug);else PLUG.anim[key]=plug;}catch(e){/* stays dark */}})();return PLUG.loading[key];}
/* The theme or the animation plugin for a key: null while it loads, and for a key that isn't one. */
function themeOf(k){if(THEMES[k])return THEMES[k];if(isPluginKey(k))ensurePlugin(k,"theme");return null;}
function animPlugin(k){if(PLUG.anim[k])return PLUG.anim[k];if(isPluginKey(k))ensurePlugin(k,"anim");return null;}
function sHoliday(fb,S,o){const th=THEMES[o.theme],t=S.ft!=null?S.ft:S.t%10,{W}=S;th.bg(fb,Object.assign({},S,{t:t+2,flags:o.flags,night:o.night,hx:W>=256?W-(o.theme==="canada_day"?46:o.theme==="fourth_of_july"?38:24):undefined}),0.8);
  const ttl=o.title||th.title,sc=W>=256&&fb.tw(F5,ttl,2)<=W-8?2:1,tw=fb.tw(F5,ttl,sc),tx=Math.round((W-tw)/2),drop=th.quiet||t>=0.7?1:easeBounce(t/0.7),a=th.quiet?Math.min(1,t/1.5):1;
  const y0=(sc===2?(o.message?3:9):(o.message?5:12))-(1-drop)*30,tc=o.colors&&o.colors.length?(o.colors.length>1?o.colors:o.colors[0]):th.tc,col=typeof tc==="function"?X=>tc(X-tx,t):Array.isArray(tc[0])?X=>tc[(Math.floor((X-tx)/(3*sc)+t*2)%tc.length+tc.length)%tc.length]:tc;
  fb.textO(F5,ttl,tx,y0,col,sc,a);
  if(o.message&&t>0.9){const mw=fb.tw(F3,o.message);fb.textO(F3,o.message,Math.round((W-mw)/2),sc===2?21:16,[235,230,240],1,Math.min(1,(t-0.9)/0.4)*a);}}
const THEME_ICONS={maple_leaf:(fb,cx,cy)=>leafAA(fb,cx,cy,9,CA_RED),us_flag:(fb,cx,cy,t)=>{fb.rect(cx-8,cy-8,1,17,[150,150,160]);wavyFlag(fb,cx-7,cy-7,16,10,t,1,usFlag,0.8,0.5);},
  pride_flag:(fb,cx,cy,t)=>{fb.rect(cx-8,cy-8,1,17,[150,150,160]);wavyFlag(fb,cx-7,cy-7,16,11,t,1,prideCol("progress",16,11),0.8,0.5);},pumpkin:(fb,cx,cy,t)=>jackO(fb,cx,cy+2,t,1,1.8),ghost:(fb,cx,cy,t)=>ghost(fb,cx,cy+1,t,1,1.8),
  xmas_tree:(fb,cx,cy,t)=>xmasTree(fb,cx,cy+10,t,1,0.85),shamrock:(fb,cx,cy)=>shamrock(fb,cx,cy-1,4,[60,200,90],1),lantern:(fb,cx,cy,t)=>{fb.line(cx,cy-12,cx,cy-7,[200,160,80]);lantern(fb,cx,cy-1,t,1,1.5);},
  diya:(fb,cx,cy,t)=>diya(fb,cx,cy+6,t,1,2),menorah:(fb,cx,cy,t)=>menorah(fb,cx,cy+10,t,1,8),poppy:(fb,cx,cy)=>poppy(fb,cx,cy,1,1.6),
  crescent:(fb,cx,cy)=>{crescent(fb,cx-1,cy+1,8,1,[0,0,0]);const P=[];for(let j=0;j<10;j++){const r=j%2?1.2:2.8,a=-Math.PI/2+j*Math.PI/5;P.push([cx+7+Math.cos(a)*r,cy-4+Math.sin(a)*r]);}fb.poly(P,[255,225,140]);}};
Object.assign(THEME_ICONS,THEME_ICONS2);
/* ---------- system screens: boot and firmware update ---------- */
/* The FireLabs mark at LED size, redrawn in 1-pixel strokes because the artwork's lines are 2.5 LEDs thick at this scale. Grid is 54 × 29. */
const FL_RED=[255,34,28],FL_OR=[255,160,0],FL_W=54,FL_LEN=5.5;
const FL_TR=[[[20,15],[15,15],[14,14],[11,14]],[[19,18],[8,18],[6,16],[4,16]],[[18,21],[6,21]],[[17,23],[14,23],[13,24],[11,24]],
  [[33,15],[40,15],[41,14],[46,14]],[[34,17],[41,17]],[[35,19],[44,19],[45,20],[49,20]],[[36,23],[40,23],[41,24],[45,24]],[[21,6],[20,6]],[[32,6],[33,6]]];
const FL_PAD=[[9,14],[2,16],[4,21],[9,24],[48,14],[43,17],[51,20],[47,24],[18,6],[35,6]];
const flL=y=>22-(y-13)*6/14,flR=y=>31+(y-13)*6/14;
function flPath(fb,P,frac,c,ox,oy,a){const seg=[];let L=0;for(let i=1;i<P.length;i++){const l=Math.max(Math.abs(P[i][0]-P[i-1][0]),Math.abs(P[i][1]-P[i-1][1]));seg.push(l);L+=l;}
  let left=frac*L,tip=P[0];for(let i=1;i<P.length&&left>0;i++){const [x0,y0]=P[i-1],[x1,y1]=P[i],l=seg[i-1],n=Math.min(l,left);for(let k=0;k<=n;k++){const x=x0+Math.sign(x1-x0)*k,y=y0+Math.sign(y1-y0)*k;fb.px(ox+x,oy+y,c,a);tip=[x,y];}left-=l;}return tip;}
function flPad(fb,cx,cy,c,a){for(const [dx,dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]])fb.px(cx+dx,cy+dy,c,a);}
/* u runs 0 to FL_LEN: the flask draws, the traces power up outward and their pads light, the flask fills and bubbles, then it fades. */
function fireLabs(fb,S,u){const {W,H}=S,gap=W>=256?12:3,ox=Math.max(0,Math.floor((W-FL_W-gap-FL_TW)/2)),oy=2,fade=u>FL_LEN-0.3?Math.max(0,(FL_LEN-u)/0.3):1;
  const oa=Math.min(1,u/0.3)*fade,flash=u<0.45?Math.max(0,1-Math.abs(u-0.3)/0.15):0,oc=mix(FL_RED,[255,230,200],flash*0.7);
  for(let y=6;y<=13;y++){fb.px(ox+22,oy+y,oc,oa);fb.px(ox+31,oy+y,oc,oa);}for(let y=13;y<=27;y++){fb.px(ox+Math.round(flL(y)),oy+y,oc,oa);fb.px(ox+Math.round(flR(y)),oy+y,oc,oa);}fb.rect(ox+17,oy+28,20,1,oc,oa);
  const lv=28-10*ease(clamp((u-0.6)/0.8,0,1));
  for(let y=Math.floor(lv);y<=26;y++)for(let x=Math.round(flL(y))+2;x<=Math.round(flR(y))-2;x++){const s=lv+Math.sin(x*0.55+u*4)*0.8+(x-26)*0.06;if(y>=s)fb.px(ox+x,oy+y,FL_OR,fade);}
  FL_TR.forEach((P,i)=>{const p=clamp((u-0.3-(i%4)*0.06)/0.45,0,1);if(p<=0)return;const tip=flPath(fb,P,p,FL_RED,ox,oy,fade);if(p<1)fb.px(ox+tip[0],oy+tip[1],[255,240,190],fade);
    else{const q=clamp((u-0.3-(i%4)*0.06-0.45)/0.15,0,1);flPad(fb,ox+FL_PAD[i][0],oy+FL_PAD[i][1],mix([255,240,190],FL_RED,q),fade);}});
  if(u>0.9)for(let i=0;i<6;i++){const per=1.6,ph=((u-0.9)/per+i/6)%1,y=lv-1-ph*(lv+1),x=26.5+Math.sin(ph*9+i*2)*(y<13?1.5:2.5);if(y<-1||(u-0.9)<ph*per)continue;const big=i%3===0;fb.rect(ox+Math.round(x),oy+Math.round(y),big?2:1,big?2:1,FL_OR,fade*(y<2?Math.max(0,(y+1)/3):1));}
  let x=ox+FL_W+gap;[..."FireLabs"].forEach((ch,k)=>{const g=flGlyph(ch),a=clamp((u-1-k*0.07)/0.25,0,1)*fade;if(a>0)g.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==="#")fb.px(x+i,oy+8+j,[240,240,245],a);}));x+=g[0].length+2;});}
const BRAND=u=>u<0.5?mix([255,150,60],[255,70,150],u*2):mix([255,70,150],[90,170,255],(u-0.5)*2);
/* The PixelBar wordmark in mixed case, drawn for the LEDs with 2-pixel strokes: 14 rows, x-height from row 4. */
const B4=w=>Array(4).fill(".".repeat(w));
const PBW={P:["#######.","########","##....##","##....##","##....##","########","#######.","##......","##......","##......","##......","##......","##......","##......"],
  i:["##","##","..","..","##","##","##","##","##","##","##","##","##","##"],x:[...B4(8),"##....##","##....##",".##..##.","..####..","...##...","...##...","..####..",".##..##.","##....##","##....##"],
  e:[...B4(8),".######.","########","##....##","##....##","########","########","##......","##......","########",".#######"],l:Array(14).fill("##"),
  B:["#######.","########","##....##","##....##","##...##.","#######.","#######.","##....##","##....##","##....##","##....##","##....##","########","#######."],
  a:[...B4(8),".######.","########","......##","......##",".#######","########","##....##","##....##","########",".#######"],
  r:[...B4(7),"##.####","#######","###....","##.....","##.....","##.....","##.....","##.....","##.....","##....."]};
/* "FireLabs" in the same 2-pixel face as the PixelBar wordmark, which it borrows i, r, e and a from. */
const FLG={F:["#######","#######","##.....","##.....","##.....","######.","######.","##.....","##.....","##.....","##.....","##.....","##.....","##....."],
  L:[...Array(12).fill("##....."),"#######","#######"],b:[...B4(8),"#######.","########","##....##","##....##","##....##","##....##","##....##","##....##","########","#######."].map((r,y)=>y<4?"##......":r),
  s:[...B4(8),".#######","########","##......","##......","#######.",".#######","......##","......##","########","#######."]};
const flGlyph=ch=>FLG[ch]||PBW[ch],FL_TW=[..."FireLabs"].reduce((w,ch)=>w+flGlyph(ch)[0].length+2,0)-2;
/* Logo A at LED size: a bar with rounded ends, pixels of 3, 2 and 1 breaking off it, then the wordmark. One gradient runs across all of it. */
const LKB=(()=>{const P=[],add=(x,y)=>P.push([x,y]);for(let x=0;x<18;x++)for(let y=6;y<10;y++)if(!((x===0||x===17)&&(y===6||y===9)))add(x,y);
  for(let x=20;x<23;x++)for(let y=6;y<9;y++)add(x,y);for(let x=25;x<27;x++)for(let y=7;y<9;y++)add(x,y);add(29,8);
  let cx=36;for(const ch of "PixelBar"){const g=PBW[ch];g.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==="#")add(cx+x,y);}));cx+=g[0].length+2;}return {P,w:cx-2,h:14};})();
const LK={};
function lockup(W){if(LK[W])return LK[W];const sc=W>=384?2:1,lw=LKB.w*sc,lh=LKB.h*sc,sw=sc===2?64:0,x0=Math.round((W-lw-(sw?14+sw:0))/2),y0=sc===2?2:4,P=[];
  for(const [x,y] of LKB.P)for(let a=0;a<sc;a++)for(let b=0;b<sc;b++)P.push({x:x0+x*sc+a,y:y0+y*sc+b,u:(x*sc+a)/lw});
  return LK[W]={sc,x0,y0,lw,lh,P,barTop:y0+6*sc,barBot:y0+10*sc-1,markEnd:x0+18*sc,sx:sc===2?x0+lw+14:null,sy:sc===2?y0+Math.round(lh/2):y0+lh+5};}
function drawLockup(fb,x,y,a=1){for(const [bx,by] of LKB.P)fb.px(x+bx,y+by,BRAND(bx/LKB.w),a);}
const easeOutBack=p=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2);};
/* Boot: a red, green and blue sweep tests every LED, the FireLabs mark powers up, then a spark draws the bar, the bar shatters and the letters grow out of it, then the version, the connection steps, and the ID, name and address to set it up by. */
function sBoot(fb,S,o={}){const {W,H}=S,M=lockup(W);let t=S.ft!=null?S.ft:S.t%bootLen(o.net);const PB=pbLen(o.net);
  if(t>=0.9&&t<0.9+FL_LEN){fireLabs(fb,S,t-0.9);return;}if(t>=0.9+FL_LEN)t-=FL_LEN;
  if(t<0.9){const i=clamp(Math.floor(t/0.3),0,2),x=(t/0.3-i)*(W+28)-14,c=[[255,40,40],[40,255,80],[60,110,255]][i];for(let xx=0;xx<W;xx++){const d=x-xx;if(d<0||d>26)continue;fb.rect(xx,0,1,H,c,0.9*(d<2?1:1-(d-2)/24));}return;}
  const by0=M.barTop,by1=M.barBot,lx1=M.x0+M.lw,rel=x=>1.55+(1-(x-M.x0)/M.lw)*0.55;
  if(t<1.55){const p=ease(clamp((t-0.9)/0.5,0,1)),hx=M.x0+p*M.lw,pulse=t>1.4?Math.sin((t-1.4)/0.15*Math.PI)*0.35:0;
    for(let x=M.x0;x<hx;x++){const u=(x-M.x0)/M.lw;for(let y=by0;y<=by1;y++)fb.px(x,y,mix(mix([255,255,255],BRAND(u),clamp((hx-x)/14,0,1)),[255,255,255],pulse));}
    if(p<1)for(let y=by0-1;y<=by1+1;y++){fb.px(hx,y,[255,255,255]);fb.px(hx+1,y,[255,240,220],0.4);}return;}
  for(let x=M.x0;x<lx1;x++){const r=rel(x),u=(x-M.x0)/M.lw;if(t<r){for(let y=by0;y<=by1;y++)fb.px(x,y,BRAND(u));}
    else if(t<r+0.3&&x>=M.markEnd)for(let y=by0;y<=by1;y++)if(hash(x*7.1+y*3.3)>0.55)fb.px(x,y+(t-r)*10*(hash(x+y)-0.5),mix(BRAND(u),[255,255,255],0.6),0.8*(1-(t-r)/0.3));}
  const sweep=t>2.6&&t<3.6?M.x0-24+(t-2.6)*(M.lw+48):-999;
  for(const q of M.P){const r=rel(q.x);if(t<r)continue;const bar=clamp(q.y,by0,by1),d=Math.abs(q.y-bar),p=clamp((t-r-d*0.025)/0.32,0,1),y=bar+(q.y-bar)*easeOutBack(p);
    const sh=Math.max(0,1-Math.abs(q.x-sweep-(q.y-M.y0)*0.4)/7);fb.px(q.x,Math.round(y),mix(BRAND(q.u),[255,255,255],sh*0.7));}
  if(t>3.3){const ver="V"+(o.ver||FW.ver),dots=".".repeat(1+Math.floor((o.rt!=null?o.rt:t)*3)%3),name=o.name||"LIVING-ROOM",id="ID "+(o.id||FW.id),ip=o.ip||FW.ip,wide=W>=256,amber=[255,200,110],green=[110,230,140],cyan=[120,200,255],y=M.y0+M.h+2;
    const L=[];let at=3.3;for(const [txt,d,wait] of NET_STEPS[o.net||"wifi"]){const off=o.offline&&txt==="READY";L.push([at,ver,off?"NO BROKER":wait?txt+dots:txt,off||wait?amber:green]);at+=d;}
    if(M.sx!=null)L.push([at,id+"  "+name,ip,cyan]);else if(wide)L.push([at,id+"  "+name,ip,cyan]);else L.push([at,id,name,cyan],[at+ID_LEN,"",ip,cyan]);
    let k=0;while(k+1<L.length&&t>=L[k+1][0])k++;const [t0,a1,a2,c]=L[k],a=Math.min(1,(t-t0)/0.3);
    if(M.sx!=null){const rows=a1&&a1.startsWith("ID ")?[[a1.split("  ")[0],cyan],[a1.split("  ")[1]||"",cyan],[a2,[160,165,180]]]:[[a1,[160,165,180]],[a2,c]];
      rows.forEach(([txt,col],i)=>fb.text(F3,txt,M.sx,Math.round(M.sy-rows.length*4+1+i*8),col,1,a));}
    else{const gap=a1&&a2?fb.tw(F3,"  ")+1:0,w=(a1?fb.tw(F3,a1):0)+gap+fb.tw(F3,a2.replace(/\.+$/,"...")),x=Math.round((W-w)/2),y=M.sy;
      const x2=x+(a1?fb.text(F3,a1,x,y,[160,165,180],1,a):0)+gap;fb.text(F3,a2,x2,y,c,1,a);}}
}
function arrowDown(fb,cx,cy,t,c){const b=Math.abs(Math.sin(t*3))*2;fb.rect(cx-1,cy-8+b,3,7,c);fb.poly([[cx-4.5,cy-1+b],[cx+5.5,cy-1+b],[cx+.5,cy+4+b]],c);fb.rect(cx-6,cy+7,13,1,[150,155,170]);fb.rect(cx-6,cy+4,1,3,[150,155,170]);fb.rect(cx+6,cy+4,1,3,[150,155,170]);}
/* Setup mode, from firelabs-core's captive portal: which network to join and where to go. The name ends in the display's ID. */
function sSetup(fb,S,o={}){const {W,H,t}=S,id=o.id||FW.id,wide=W>=256,ssid="PIXELBAR "+id;
  if(wide){ICONS.wifi(fb,16,16,t,[90,170,255]);const x=34;fb.text(F5,"SET ME UP",x,3,[255,236,210]);fb.text(F3,"JOIN WI-FI "+ssid,x,13,[120,200,255]);fb.text(F3,"THEN OPEN 192.168.4.1",x,21,[160,165,180]);
    if(W>=384){drawLockup(fb,W-6-LKB.w,3);fb.text(F3,"V"+FW.ver,W-6-fb.tw(F3,"V"+FW.ver),21,[120,125,140]);}}
  else{fb.text(F5,"JOIN WI-FI",3,2,[255,236,210]);fb.text(F3,ssid,3,12,[120,200,255]);fb.text(F3,"THEN 192.168.4.1",3,20,[160,165,180]);}
  const p=(t%2)/2;fb.rect(0,H-1,W*p,1,[90,170,255],0.6);}
/* Firmware update: the stage, a bar that fills in the brand colours, the percentage and both versions. It ends by restarting into the boot screen. */
function sUpdate(fb,S,o={}){const {W,H}=S,t=S.ft!=null?S.ft:S.t%UPD_LEN,from=o.from||FW.ver,to=o.to||FW.next,wide=W>=256;
  const {pr,stage}=updAt(t),pct=Math.floor(pr*100)+"%";
  const x0=wide?34:3,bx=x0,bw=W-x0-(wide?40:30),byy=wide?21:13,col=stage==="RESTARTING"?[110,230,140]:[255,236,210];
  if(wide)arrowDown(fb,16,15,t,[90,170,255]);fb.text(F5,stage,x0,wide?3:3,col);
  const vs=from+" TO "+to;if(wide)fb.text(F3,vs,x0,12,[150,155,170]);else fb.text(F3,"TO "+to,x0,24,[150,155,170]);
  if(W>=384){const w="KEEP IT PLUGGED IN";fb.text(F3,w,W-4-fb.tw(F3,w),4,[255,190,90]);}
  fb.frame(bx,byy,bx+bw,byy+(wide?6:6),[90,95,110]);const fw=Math.round((bw-2)*pr);for(let x=0;x<fw;x++){const sh=Math.max(0,1-Math.abs(((t*0.8)%1.4-0.2)*bw-x)/10);fb.rect(bx+1+x,byy+1,1,wide?5:5,mix(BRAND(x/Math.max(1,bw)),[255,255,255],sh*0.5));}
  fb.text(F5,pct,W-3-fb.tw(F5,pct),wide?20:12,[255,255,255]);
  if(t>9.5)fb.scaleRect(0,0,W,H,Math.max(0,1-(t-9.5)));}
/* ---------- shared compositor: strip, full screen, tray ---------- */
const DT=0.05,ROLL=0.5,STAG=0.25,FULLR=0.6,AMBF=2,MODEF=1.2;
const TL_LAYOUT={"1x2":{fixed:[["clock",44]],flex:["*"]},"1x4":{fixed:[["clock",44],["wx",56]],flex:["*"]},
  "1x6":{fixed:[["clock",44],["wx",56]],flex:[140,"*"]},"1x8":{fixed:[["clock",44],["wx",56],["indoor",50]],flex:[180,"*"]},"1x10":{fixed:[["clock",44],["wx",56],["indoor",50]],flex:[180,150,"*"]}};
const BASE_CARDS={"1x2":[["wxin",30],["fcast",20]],"1x4":[["fcast",20],["indoor",12],["lights",10]],"1x6":[["fcast",20],["indoor",12],["lights",10]],"1x8":[["fcast",20],["lights",10]],"1x10":[["fcast",20],["tomorrow",15],["lights",10]]};
function pick(c,n,tt){c.sort((a,b)=>b.p-a.p);if(c.length<=n)return c.map(x=>x.k);const head=c.slice(0,n-1).map(x=>x.k),top=c[n-1];
  return top.p>=70?[...head,top.k]:[...head,[c[n-1].k,c[n].k][Math.floor(tt/10)%2]];}
function stable(prev,D){const n=prev.length,next=new Array(n).fill(null),used=new Set();prev.forEach((k,s)=>{if(k&&D.includes(k)&&!used.has(k)){next[s]=k;used.add(k);}});
  const rest=D.filter(k=>!used.has(k));for(let s=0;s<n;s++)if(!next[s])next[s]=rest.shift()||null;return next;}
const ADVS={
  tswatch:{sev:"watch",t:"THUNDERSTORM WATCH",l1:"SEVERE STORMS",l2:"UNTIL @21:00"},squall:{sev:"watch",t:"SNOW SQUALL WATCH",l1:"SNOW SQUALLS",l2:"UNTIL @06:00"},
  health:{sev:"adv",t:"STREAM HEALTH",l1:"DROPPED FRAMES 4%",l2:"BITRATE 3800 KBPS"},
  heat:{sev:"adv",t:"HEAT ADVISORY",l1:"FEELS LIKE 38°",l2:"UNTIL THU @20:00"},wxadv:{sev:"adv",t:"WEATHER ADVISORY",l1:"FREEZING DRIZZLE TONIGHT",l2:"UNTIL @09:00"},
  twatch:{sev:"watch",t:"TORNADO WATCH",l1:"CONDITIONS FAVOUR TORNADOES",l2:"UNTIL @21:00"},
  twarn:{sev:"warn",t:"TORNADO WARNING",l1:"TAKE COVER NOW",l2:"UNTIL @21:15"},blizzard:{sev:"warn",t:"BLIZZARD WARNING",l1:"STAY OFF THE ROADS",l2:"UNTIL @09:00"},
  smoke:{sev:"warn",t:"SMOKE ALARM",l1:"SMOKE DETECTED",l2:"BASEMENT"},tswarn:{sev:"warn",t:"THUNDERSTORM WARNING",l1:"HAIL AND 90 KM/H GUSTS",l2:"UNTIL @21:30"},heatnight:{sev:"adv",t:"HEAT ADVISORY",l1:"STILL 27° AT @21:00",l2:"UNTIL THU @20:00"}};
function advCard(fb,x,y,w,h,S,a){const c=a.col||SEV[a.sev],n=a.n||{},pic=a.img&&IMGS[a.img],tx=pic?x+33:x+19;fb.rect(x+2,y+3,2,h-6,c);
  if(pic)drawImg(fb,a.img,x+5,y+2);else if(a.ico&&ICONS[a.ico])miniIcon(fb,a.ico,x+11,y+11,S.t,pc("icon",c));else tri(fb,x+11,y+11,11,pc("icon",c));
  const R=n.big&&w>=120?bigAt(fb,n,x+w-5,y+3,mix(c,[255,255,255],0.45),"ad:"+a.key+":"+x,S.t)-5:x+w-3,aw=Math.max(8,R-tx);
  if(a.tf){const ty=y+2;marquee(fb,a.tf,a.t,tx,ty,aw,pc("title",mix(c,[255,255,255],0.45)),S.t);if(ty+a.tf.h+6<=y+h)marquee(fb,F3,a.l1,tx,ty+a.tf.h+1,aw,pc("text",[205,200,192]),S.t+0.8);}
  else{marquee(fb,F5,a.t,tx,y+4,aw,pc("title",mix(c,[255,255,255],0.45)),S.t);marquee(fb,F3,a.l1,tx,y+13,aw,pc("text",[205,200,192]),S.t+0.8);marquee(fb,F3,a.l2,tx,y+20,aw,pc("detail",[150,145,140]),S.t+1.6);}
  thinBar(fb,tx,y+h-4,R-tx,n.prog,c);}
/* A card's own outline wins over its screen's while it draws: notifications by key, box cards from their JSON. */
const CARD_OUTLINE={},CARD_FX={};
/* Whether a box's card wants the weather around it: its own effects, a notification's, or its screen's. */
const fxOf=(k,def)=>{if(k==null)return false;const c=String(k).startsWith("bx:")?boxCard(k):null,v=c&&c.effects!==undefined?c.effects:CARD_FX[k]!==undefined?CARD_FX[k]:def.effects;return v==="around";};
/* A card's own outline, scrolling speed and palette while it draws, put back after. */
const withHalo=(fb,ol,draw,speed,pal)=>{const h0=fb.halo,m0=MQ_SPEED,p0=PALETTE;if(ol!==undefined)fb.halo=ol;if(speed!=null&&isFinite(+speed))MQ_SPEED=Math.max(0,+speed);if(pal&&typeof pal==="object")PALETTE=pal;
  try{return draw();}finally{fb.halo=h0;MQ_SPEED=m0;PALETTE=p0;}};
const CARD_SPEED={},CARD_PALETTE={};
function drawCard(fb,k,x,y,w,h,S){const n=k&&k.startsWith("adv:")?k.slice(4):k;return withHalo(fb,CARD_OUTLINE[n],()=>CARD_OUTLINE[n]?haloed(fb,f=>drawCard0(f,k,x,y,w,h,S),x,y,w,h):drawCard0(fb,k,x,y,w,h,S),CARD_SPEED[n],CARD_PALETTE[n]);}
function drawCard0(fb,k,x,y,w,h,S){if(!k||w<=0)return;fb.pushClip(x,y,w,h);
  if(k.startsWith("wx:"))WIDGETS.weather(fb,x,y,w,h,Object.assign({},S,{st:{cond:k.slice(3)}}));
  else if(k.startsWith("adv:"))advCard(fb,x,y,w,h,S,ADVS[k.slice(4)]);
  else if(k.startsWith("sn:"))sensorCard(fb,x,y,w,h,S,k.slice(3));
  else if(k.startsWith("c2:"))drawCard2(fb,CARD2[k.slice(3)],x,y,w,h,S);
  else if(CARDS[k])noticeCard(fb,x,y,w,h,S,CARDS[k](S));else WIDGETS[k](fb,x,y,w,h,S);
  fb.popClip();}
/* Example captions for the demo, one per sky. The display itself only draws the caption a weather message sends. */
function capLines(kind,S){const t=S.now.getTime(),day=kDay(kind);return {rain:["RAIN","2.4 MM/H","DRY BY "+hm(new Date(t+85*60000))],storm:["THUNDERSTORM","LIGHTNING 6 KM","PASSING BY "+hm(new Date(t+50*60000))],
  snow:["SNOW","2 CM/H","12 CM BY @08:00"],heavysnow:["HEAVY SNOW","4 CM/H","25 CM BY @08:00"],
  clear:day?["SUNNY","UV 6 HIGH","SUNSET @19:02"]:["CLEAR","WARM NIGHT","LOW 19° AT @05:00"],
  pcloudy:day?["PARTLY CLOUDY","WIND 12 KM/H","CLEARING BY @16:00"]:["PARTLY CLOUDY","MILD NIGHT","LOW 9° AT @06:00"],
  overcast:day?["OVERCAST","NO RAIN TODAY","HIGH 14° AT @15:00"]:["OVERCAST","DRY NIGHT","LOW 8° AT @06:00"],
  hot:day?["EXTREME HEAT","HUMIDEX 42","PEAK AT @16:00"]:["HOT NIGHT","STILL 29°","LOW 24° AT @05:00"],
  fog:day?["FOG","VIS 300 M","LIFTS BY @10:00"]:["FOG","VIS 200 M","LIFTS BY @09:00"],hail:["HAIL","PEA-SIZED","ENDS BY "+hm(new Date(t+20*60000))],
  lightning:["LIGHTNING","DRY STORM","12 KM AWAY"],pouring:["POURING","12 MM/H","EASING BY "+hm(new Date(t+60*60000))],sleet:["SLEET","RAIN AND SNOW","ICY ROADS LATER"],
  windy:["WINDY","GUSTS 70 KM/H","CALMER BY @18:00"],windyc:["WINDY","GUSTS 60 KM/H","CLOUD AND WIND"],exceptional:["EXCEPTIONAL","WEATHER","CHECK THE ALERTS"],
  cold:["EXTREME COLD","FEELS -41°","FROSTBITE IN 10 MIN"],smoke:["SMOKE","AQHI 9 HIGH","KEEP WINDOWS SHUT"],freezing:["FREEZING RAIN","ICE 5 MM","ROADS ARE ICY"],
  blizzard:["BLIZZARD","GUSTS 80 KM/H","VISIBILITY NEAR ZERO"],drizzle:["DRIZZLE","0.3 MM/H","ENDS BY "+hm(new Date(t+40*60000))],
  rainbow:day?["RAINBOW","RAIN MOVING OFF","SUNNY BY @16:00"]:["MOONBOW","RAIN MOVING OFF","CLEARING BY @23:00"],aurora:["AURORA","KP 6","LOOK NORTH AFTER @23:00"]}[kBase(kind)];}
const CAPCOL={rain:[[210,230,255],[120,190,255]],storm:[[225,215,255],[255,220,110]],snow:[[235,242,255],[190,210,245]],heavysnow:[[235,242,255],[190,210,245]],clear:[[255,236,200],[255,190,120]],
  pcloudy:[[235,240,255],[170,205,255]],overcast:[[225,228,236],[170,178,194]],hot:[[255,236,190],[255,150,60]],fog:[[240,242,246],[190,196,206]],hail:[[235,242,255],[180,205,255]],
  lightning:[[225,215,255],[255,220,110]],pouring:[[210,230,255],[100,170,255]],sleet:[[225,235,250],[160,200,240]],windy:[[235,245,255],[170,215,255]],windyc:[[235,245,255],[170,215,255]],exceptional:[[255,220,180],[255,150,90]],cold:[[235,245,255],[150,205,255]],smoke:[[255,215,170],[255,140,80]],freezing:[[225,240,255],[160,210,255]],
  blizzard:[[240,245,255],[190,210,245]],drizzle:[[215,230,255],[140,190,255]],rainbow:[[255,245,210],[140,220,150]],aurora:[[200,255,220],[120,240,170]]};
const capCol=k=>kDay(k)&&kBase(k)==="clear"?[[255,242,190],[255,205,90]]:CAPCOL[kBase(k)];
const WXNAME={clear:["SUNNY","CLEAR"],pcloudy:"PARTLY CLOUDY",overcast:"CLOUDY",fog:"FOG",windy:"WINDY",windyc:"WINDY",rain:"RAIN",pouring:"POURING",lightning:"LIGHTNING",storm:"THUNDERSTORM",hail:"HAIL",snow:"SNOW",sleet:"SLEET",
  exceptional:"EXCEPTIONAL",heavysnow:"HEAVY SNOW",hot:["EXTREME HEAT","HOT NIGHT"],cold:"EXTREME COLD",smoke:"SMOKE",freezing:"FREEZING RAIN",blizzard:"BLIZZARD",drizzle:"DRIZZLE",rainbow:["RAINBOW","MOONBOW"],aurora:"AURORA"};
const wxName=k=>{const n=WXNAME[kBase(k)];return Array.isArray(n)?n[kDay(k)?0:1]:n||"";};
/* The example weather message for a sky, as Home Assistant would send it. */
function demoWx(kind,now){const tk=TEMPK[kind]||TEMPK[kBase(kind)],n=v=>{const m=/-?\d+/.exec(v);return m?+m[0]:undefined;},hl=/H(-?\d+) L(-?\d+)/.exec(tk[2]);
  return {temperature:n(tk[0]),apparent_temperature:/^(FEELS|HUMIDEX)/.test(tk[1])?n(tk[1]):undefined,high:hl?+hl[1]:undefined,low:hl?+hl[2]:undefined,caption:capLines(kind,{now})};}
/* What the weather cards draw: the message's caption where it sends one, otherwise the condition's name. Temperatures are sensors now, so a real message only brings words. */
function wxView(kind,S){const p=S.wxp?{caption:S.wxp.caption}:demoWx(kind,S.now),c=p.caption||[],deg=v=>Math.round(v)+"°",unit=String(p.wind_speed_unit||"km/h").toUpperCase();
  const feels=p.apparent_temperature!=null?"FEELS "+deg(p.apparent_temperature):p.humidity!=null?"HUMIDITY "+Math.round(p.humidity)+"%":"",hl=p.high!=null&&p.low!=null?"H"+Math.round(p.high)+" L"+Math.round(p.low):"",wind=p.wind_speed!=null?"WIND "+Math.round(p.wind_speed)+" "+unit:"";
  return {T:p.temperature!=null?deg(p.temperature):"--",temp:p.temperature,feels,hl,cap:[c[0]!=null?c[0]:wxName(kind),c[1]!=null?c[1]:feels||wind,c[2]!=null?c[2]:hl]};}
function captionCard(fb,x,y,w,h,S,kind){const L=wxView(kind,S).cap,c=capCol(kind);fb.textO(F5,L[0],x+3,y+3,c[0]);fb.textO(F5,L[1],x+3,y+12,c[1]);fb.textO(F3,L[2],x+3,y+23,[160,190,225]);}
const nightIcon=p=>p>=50?iconRain:p>=20?iconCloud:iconMoon;
const FCK={
  rain:{temps:[11,11,10,10,9,9,8,8,8,7,7,7],pops:[80,70,60,40,30,20,10,0,0,0,0,0],icon:nightIcon},
  storm:{temps:[10,10,9,9,8,8,8,7,7,7,6,6],pops:[90,90,70,50,30,20,10,10,0,0,0,0],icon:p=>p>=70?iconStormRain:nightIcon(p)},
  fog:{temps:[8,8,9,10,11,12,12,12,11,10,9,9],pops:[10,10,10,0,0,0,0,0,0,0,0,0],icon:()=>iconFog},
  hail:{temps:[14,13,13,14,15,15,14,13,12,11,10,10],pops:[70,60,40,20,10,0,0,0,0,0,0,0],icon:p=>p>=50?iconHail:p>=20?iconCloud:iconPCN},
  lightning:{temps:[19,19,18,18,17,17,16,16,15,15,15,15],pops:[20,20,20,10,10,0,0,0,0,0,0,0],icon:p=>p>=10?iconStorm:iconPCN},
  pouring:{temps:[12,12,11,11,11,10,10,10,9,9,9,9],pops:[100,100,90,80,70,50,30,20,10,0,0,0],icon:p=>p>=80?iconPour:p>=50?iconRain:p>=20?iconCloud:iconPCN},
  sleet:{temps:[1,1,0,0,0,-1,-1,-1,-2,-2,-2,-2],pops:[80,80,70,60,40,30,20,10,0,0,0,0],icon:p=>p>=50?iconSleet:p>=20?iconCloud:iconPCN},
  windy:{temps:[16,16,15,15,14,13,12,11,10,10,9,9],pops:[0,0,0,0,0,0,0,0,0,0,0,0],icon:()=>iconWind},
  windyc:{temps:[13,13,12,12,11,11,10,10,9,9,8,8],pops:[10,10,10,10,0,0,0,0,0,0,0,0],icon:()=>iconWindCloud},
  exceptional:{temps:[31,32,33,33,32,30,28,26,25,24,23,22],pops:[0,0,0,0,0,0,0,0,0,0,0,0],icon:()=>iconExc},
  cold:{temps:[-29,-30,-31,-32,-33,-33,-34,-34,-35,-35,-34,-33],pops:[0,0,0,0,0,0,0,0,0,0,0,0],icon:()=>iconCold},
  smoke:{temps:[27,27,26,25,24,23,22,21,20,20,19,19],pops:[0,0,0,0,0,0,0,0,0,0,0,0],icon:()=>iconSmoke},
  freezing:{temps:[-1,-1,-1,-2,-2,-2,-3,-3,-3,-3,-4,-4],pops:[90,90,80,70,60,40,30,20,10,0,0,0],icon:p=>p>=50?iconFreezing:p>=20?iconCloud:iconPCN},
  blizzard:{temps:[-12,-12,-13,-13,-14,-14,-15,-15,-16,-16,-16,-17],pops:[100,100,95,90,90,80,70,50,40,20,10,0],icon:p=>p>=50?iconBlizzard:p>=20?iconCloud:iconPCN},
  drizzle:{temps:[9,9,9,9,8,8,8,8,7,7,7,7],pops:[60,60,50,40,30,20,10,0,0,0,0,0],icon:p=>p>=30?iconDrizzle:p>=10?iconCloud:iconPCN},
  rainbow:{temps:[17,17,16,16,15,14,13,12,11,11,10,10],pops:[20,10,0,0,0,0,0,0,0,0,0,0],icon:p=>p>=10?iconCloud:iconPCN},
  aurora:{temps:[4,3,2,2,1,1,0,0,-1,-1,-1,-2],pops:[0,0,0,0,0,0,0,0,0,0,0,0],icon:()=>iconAurora},
  snow:{temps:[-3,-3,-4,-4,-5,-5,-6,-6,-6,-7,-7,-7],pops:[80,80,70,60,40,30,20,10,0,0,0,0],icon:p=>p>=50?iconSnow:p>=20?iconCloud:iconMoon},
  heavysnow:{temps:[-4,-4,-5,-5,-6,-6,-7,-7,-8,-8,-8,-9],pops:[95,95,90,80,70,50,40,20,10,0,0,0],icon:p=>p>=50?iconSnow:p>=20?iconCloud:iconMoon},
  clear:{temps:[27,26,25,24,23,22,21,21,20,20,19,19],pops:[0,0,0,0,0,0,0,0,0,0,0,0],icon:()=>iconMoon},
  pcloudy:{temps:[18,18,19,19,18,17,16,15,14,13,12,12],pops:[10,10,0,0,0,0,0,0,0,0,0,0],icon:p=>p>=20?iconCloud:iconPCN},
  overcast:{temps:[13,13,14,14,13,13,12,12,11,11,10,10],pops:[10,10,20,20,10,10,0,0,0,0,0,0],icon:()=>iconCloud},
  hot:{temps:[35,36,36,35,34,33,31,29,28,27,26,25],pops:[0,0,0,0,0,0,0,0,0,0,0,0],icon:()=>iconMoon}};
/* Daytime forecasts swap the moon for the sun: a plain sun on clear and hot days, sun behind cloud otherwise. */
const FC_ICON={sunny:()=>iconSun,"clear-night":()=>iconMoon,partlycloudy:d=>d?iconPC:iconPCN,cloudy:()=>iconCloud,fog:()=>iconFog,windy:()=>iconWind,"windy-variant":()=>iconWindCloud,rainy:()=>iconRain,pouring:()=>iconPour,
  lightning:()=>iconStorm,"lightning-rainy":()=>iconStormRain,hail:()=>iconHail,snowy:()=>iconSnow,"snowy-rainy":()=>iconSleet,exceptional:()=>iconExc};
/* Hours from weather.get_forecasts: each hour's condition picks its icon. */
/* Days from weather.get_forecasts with type daily: the weekday, the condition's icon, the high and the chance of rain. */
function dailyFrom(fc){const D=fc.slice(0,7);return {temps:D.map(h=>Math.round(+h.temperature||0)),pops:D.map(h=>clamp(Math.round(+h.precipitation_probability||0),0,100)),icons:D.map(h=>(FC_ICON[h.condition]||FC_ICON.cloudy)(true)),lbls:D.map(h=>{const d=new Date(h.datetime);return isNaN(d)?"":DAYS[d.getDay()];})};}
/* The demo's example days, starting with the sky on screen. */
function demoDaily(kind,now){const hi=(TEMPK[kind]||TEMPK[kBase(kind)])[2],h=+((/H(-?\d+)/.exec(hi)||[0,12])[1]),c=kBase(kind),first=c==="clear"?iconSun:FCK[c]?FCK[c].icon(70):iconCloud;
  return {temps:[h,h+2,h-1,h+3,h+1],pops:[FCK[c]?FCK[c].pops[0]:20,20,60,10,30],icons:[first,iconPC,iconRain,iconSun,iconCloud],lbls:[1,2,3,4,5].map(i=>DAYS[(now.getDay()+i)%7])};}
function fcFrom(fc,day){const H=fc.slice(0,12);return {temps:H.map(h=>Math.round(+h.temperature||0)),pops:H.map(h=>clamp(Math.round(+h.precipitation_probability||0),0,100)),
  icons:H.map(h=>(FC_ICON[h.condition]||FC_ICON.cloudy)(h.is_daytime!=null?!!h.is_daytime:day)),hrs:H.map(h=>{const d=new Date(h.datetime);return isNaN(d)?null:d.getHours();})};}
function fcFor(kind){const b=FCK[kBase(kind)],c=kBase(kind);if(!kDay(kind))return b;const sunny=c==="clear"?iconSun:c==="hot"?iconHot:iconPC;
  return {...b,icon:p=>{const f=b.icon(p);return f===iconMoon||f===iconPCN?sunny:f;}};}
const TEMPK={rain:["11°","FEELS 8°","H13 L7"],storm:["10°","FEELS 7°","H13 L7"],snow:["-3°","FEELS -9°","H-1 L-6"],heavysnow:["-4°","FEELS -11°","H-2 L-8"],clear:["27°","FEELS 30°","H31 L19"],
  "clear-day":["22°","FEELS 23°","H24 L11"],fog:["8°","FEELS 6°","H12 L6"],hail:["14°","FEELS 12°","H17 L9"],lightning:["19°","FEELS 19°","H24 L15"],pouring:["12°","FEELS 9°","H14 L9"],
  sleet:["1°","FEELS -4°","H2 L-2"],cold:["-29°","FEELS -41°","H-26 L-35"],smoke:["27°","AQHI 9","H29 L18"],freezing:["-1°","FEELS -7°","H0 L-4"],blizzard:["-12°","FEELS -27°","H-10 L-17"],
  drizzle:["9°","FEELS 7°","H11 L6"],rainbow:["17°","FEELS 17°","H19 L10"],aurora:["4°","FEELS 1°","H9 L-2"],windy:["16°","FEELS 11°","H18 L9"],windyc:["13°","FEELS 8°","H15 L8"],exceptional:["31°","FEELS 38°","H33 L22"],pcloudy:["11°","FEELS 9°","H19 L9"],"pcloudy-day":["18°","FEELS 17°","H19 L9"],overcast:["13°","FEELS 11°","H14 L8"],hot:["29°","FEELS 33°","H37 L24"],"hot-day":["36°","HUMIDEX 42","H37 L24"]};
function tempCard(fb,x,y,w,h,S,kind){const v=wxView(kind,S),T=v.T,f=v.feels,hl=v.hl;fb.textO(F5,T,x+3,y+2,v.temp!=null?tempCol(v.temp):[150,150,160],2);fb.textO(F3,f,x+3,y+19,[195,195,210]);fb.textO(F3,hl,x+3,y+25,[150,160,180]);}
function fcCard(fb,x,y,w,h,S,kind){WIDGETS.fcast(fb,x,y,w,h,Object.assign({},S,{fc:fcFor(kind,S),outline:true}));}
function pageKey(id,kind,t){const P=id==="1x2"?["cap","temp","next"]:id==="1x4"?["cap","temp"]:["cap"];return P[Math.floor((t+4)/8)%P.length]+":"+kind;}
function midKey(id,kind,t){if(id==="1x2"||id==="1x8"||id==="1x10")return null;return PRECIP.has(kBase(kind))&&Math.floor(t/12)%2===0?"now:"+kind:"fc:"+kind;}
function midCard(fb,k,x,y,w,h,S){if(!k)return;const [t,kind]=k.split(":");fb.pushClip(x,y,w,h);
  if(t==="now")nowcast(fb,x,y+4,w,24,S,isSnow(kind),kind);else fcCard(fb,x,y,w,h,S,kind);fb.popClip();}
/* Draws a card over the idle sky with no box behind it: it goes to a scratch layer first, then every lit LED is copied over and the unlit ones
   next to it are darkened, a one-pixel outline like the captions have. The weather keeps moving everywhere else. */
const SCRATCH={};
function overSky(dst,x0,x1,draw){const W=dst.W,H=dst.H,tmp=SCRATCH[W]||(SCRATCH[W]=new FB(W,H));tmp.noClip();tmp.clear();draw(tmp);
  const s=tmp.d,d=dst.d,a=Math.max(0,Math.floor(x0)-1),b=Math.min(W,Math.ceil(x1)+1),lit=i=>s[i]+s[i+1]+s[i+2]>24;
  for(let y=0;y<H;y++)for(let x=a;x<b;x++){const i=(y*W+x)*3;if(lit(i))continue;
    let near=false;for(let dy=-1;dy<=1&&!near;dy++){const Y=y+dy;if(Y<0||Y>=H)continue;for(let dx=-1;dx<=1;dx++){const X=x+dx;if(X>=0&&X<W&&lit((Y*W+X)*3)){near=true;break;}}}
    if(near){d[i]*=0.15;d[i+1]*=0.15;d[i+2]*=0.15;}}
  for(let y=0;y<H;y++)for(let x=a;x<b;x++){const i=(y*W+x)*3;if(lit(i)){d[i]=s[i];d[i+1]=s[i+1];d[i+2]=s[i+2];}}}
function ambSlot(fb,k,x,y,w,h,S){if(!k)return;const [t,kind]=k.split(":");if(!/^(cap|temp|next)$/.test(t)){overSky(fb,x,x+w,f=>drawCard(f,k,x,y,w,h,S));return;}fb.pushClip(x,y,w,h);
  if(t==="cap")captionCard(fb,x,y,w,h,S,kind);else if(t==="temp")tempCard(fb,x,y,w,h,S,kind);else if(t==="next")fcCard(fb,x,y,w,h,S,kind);
  fb.popClip();}
const GARAGE=[255,170,70];
const TRAYI={
  door:(fb,cx,cy)=>{fb.disc(cx,cy-0.5,2.6,[255,200,80]);fb.rect(cx-3.5,cy+1.5,7,1,[255,200,80]);fb.px(cx,cy+3,[255,220,130]);},
  pkg:(fb,cx,cy)=>isoBox(fb,cx,cy,8),
  garage:(fb,cx,cy)=>{fb.poly([[cx-4,cy],[cx,cy-4],[cx+4,cy]],GARAGE);fb.rect(cx-3,cy,7,4,GARAGE);fb.rect(cx-2,cy+2,5,2,[50,28,10]);},
  door2:(fb,cx,cy)=>{fb.rect(cx-2,cy-3,5,7,GARAGE);fb.px(cx+1,cy,[40,20,10]);},
  lock:(fb,cx,cy)=>{fb.pushClip(cx-4,cy-4,9,4);fb.ring(cx+1.5,cy,2.2,1,[205,210,220]);fb.popClip();fb.rect(cx-3,cy,6,4,[255,120,90]);},
  plant:(fb,cx,cy)=>{fb.disc(cx-1,cy-2,2,[100,200,110]);fb.disc(cx+1.5,cy-1.5,1.6,[130,180,90]);fb.rect(cx-2,cy+1,5,3,[200,110,70]);},
  flake:(fb,cx,cy)=>flake(fb,cx,cy,3.5,[140,215,255]),
  snake:(fb,cx,cy)=>{for(let i=0;i<7;i++)fb.px(cx-3+i,cy+Math.round(Math.sin(i*1.1)*1.5),[120,220,100]);},
  server:(fb,cx,cy,t)=>{fb.frame(cx-2,cy-3,cx+2,cy+3,[150,140,190]);fb.px(cx,cy-1,(t%1)<0.5?[255,60,60]:[90,20,20]);},
  thermo:(fb,cx,cy)=>{fb.rect(cx,cy-3,1,5,[225,228,238]);fb.disc(cx+0.5,cy+2,1.6,[255,110,70]);},
  bolt:(fb,cx,cy)=>fb.poly([[cx+1,cy-4],[cx-2,cy+0.5],[cx,cy+0.5],[cx-1,cy+4],[cx+2,cy-1],[cx,cy-1],[cx+2,cy-4]],[255,225,90]),
  shield:(fb,cx,cy)=>fb.poly([[cx-3,cy-3],[cx+3,cy-3],[cx+3,cy],[cx,cy+3.5],[cx-3,cy]],[70,150,230]),
  car:(fb,cx,cy)=>{fb.rect(cx-3,cy-1,7,2,[110,180,240]);fb.rect(cx-1,cy-2,3,1,[110,180,240]);fb.px(cx-2,cy+1,[70,70,80]);fb.px(cx+2,cy+1,[70,70,80]);},
  key:(fb,cx,cy)=>{fb.ring(cx-2,cy,1.6,1,[255,210,90]);fb.rect(cx,cy,4,1,[255,210,90]);},
  baby:(fb,cx,cy)=>fb.disc(cx,cy,2.4,[255,150,180]),
  dot:(fb,cx,cy)=>fb.disc(cx,cy,2.2,[200,200,210])
};
function trayIcon(fb,k,cx,cy,t){if(k.startsWith("adv:")){tri(fb,cx,cy,8,SEV[k.slice(4)]);return;}if(k.startsWith("mini:")){const [,n,h]=k.split(":");miniIcon(fb,n,cx,cy,t,h?rgbOf(h):undefined);return;}(TRAYI[k]||TRAYI.dot)(fb,cx,cy,t);}
const mkProg=(t,smooth)=>(a,dur,delay=0)=>(!smooth||a.prev===undefined)?1:clamp((t-a.t0-delay)/dur,0,1);
function trayAnim(A,prog){const a=A.tray,pt=ease(prog(a,ROLL)),wOf=v=>v?11:0,w0=wOf(a.prev===undefined?a.cur:a.prev);return {a,pt,w:Math.round(w0+(wOf(a.cur)-w0)*pt)};}
function drawTray(fb,W,H,ta,backing,t){if(ta.w<=0)return;const tx=W-ta.w;if(backing)fb.rect(tx,0,ta.w,H,[0,0,0],0.6);vsep(fb,tx,H);
  let cur=(ta.a.cur||"").split(",").filter(Boolean);const prev=(ta.a.prev||"").split(",").filter(Boolean),extra=cur.length>4?cur.length-3:0;if(extra)cur=cur.slice(-3);
  const n=cur.length+(extra?1:0),pitch=n>3?8:9,y0=Math.floor((H-n*pitch)/2);
  cur.forEach((k,j)=>{const top=y0+j*pitch,off=prev.includes(k)?0:(1-ta.pt)*pitch;fb.pushClip(tx+1,top,ta.w-1,pitch);trayIcon(fb,k,tx+6,top+pitch/2+off,t);fb.popClip();});
  if(extra){const s="+"+extra;fb.text(F3,s,tx+1+Math.round((ta.w-1-fb.tw(F3,s))/2),y0+cur.length*pitch+1,[190,190,200]);}}
function drawAdvLine(fb,S,A,prog,w){const a=A.adv,pv=prog(a,1),ak=a.cur?pv:(a.prev?1-pv:0);if(ak<=0)return;const sev=a.cur||a.prev,c=SEV[sev],per=Math.max(48,w*0.45);
  for(let xx=0;xx<w;xx++){const g=0.5+0.5*Math.sin(xx/per*Math.PI*2-S.t*0.7),v=ak*(0.28+0.6*g);fb.px(xx,S.H-1,c,v);if(sev==="warn")fb.px(xx,S.H-2,c,v*0.45);}}
/* A holiday theme replaces the sky, faint on a faint one (like its weather); the active screen's weather strip stays. */
/* Faint, like the faint weather: dimmer, and half as many of everything that falls, floats or bursts. */
const THEME_FAINT=0.5,THEME_FAINT_N=0.5;
function bgFade(A,prog,dst,S,table){const thm=S.theme&&themeOf(S.theme);if(thm){const f=table===AMB;thm.bg(dst,f?Object.assign({},S,{faint:true}):S,f?THEME_FAINT:1);return A.kind;}return kindFade(A,prog,dst,S,table);}
function kindFade(A,prog,dst,S,table){const a=A.kind,pa=prog(a,AMBF);if(a.prev&&pa<1&&table[a.prev])table[a.prev](dst,S,1-pa);if(table[a.cur])table[a.cur](dst,S,a.prev?pa:1);return a;}
/* 1x2 only: notices, alerts, status cards and lights take the whole strip up to the tray, and the clock steps aside. */
const narrowBase=k=>!k||k==="wxin"||k==="fcast"||k.startsWith("sn:");
function renderStrip1x2(d,S,A,prog,dst){const {W,H}=S,{base}=d.L;dst.noClip();dst.clear();kindFade(A,prog,dst,S,AMB);base.noClip();base.clear();
  const ta=trayAnim(A,prog),right=W-ta.w,ch=A.slots[A.slots.length-1],p=ease(prog(ch,ROLL));
  const lay=(k,y)=>{if(narrowBase(k)){drawCard(base,"clock",0,y,44,H,S);for(let yy=3;yy<H-3;yy+=2)base.px(44,yy+y,[36,40,50]);drawCard(base,k,44,y,right-44,H,S);}else drawCard(base,k,0,y,right,H,S);};
  base.pushClip(0,0,right,H);
  if(p>=1)lay(ch.cur,0);
  else if(narrowBase(ch.prev)&&narrowBase(ch.cur)){drawCard(base,"clock",0,0,44,H,S);vsep(base,44,H);base.pushClip(44,0,right-44,H);drawCard(base,ch.prev,44,-p*H,right-44,H,S);drawCard(base,ch.cur,44,(1-p)*H,right-44,H,S);base.popClip();}
  else{lay(ch.prev,-p*H);lay(ch.cur,(1-p)*H);}
  base.popClip();drawTray(base,W,H,ta,false,S.t);drawAdvLine(base,S,A,prog,right);dst.maxFrom(base);}
function renderStrip(d,S,A,prog,dst){if(S.id==="1x2")return renderStrip1x2(d,S,A,prog,dst);const {W,H}=S,{base,tmp}=d.L;dst.noClip();dst.clear();kindFade(A,prog,dst,S,AMB);
  base.noClip();base.clear();const ta=trayAnim(A,prog),L=TL_LAYOUT[S.id],widths=[...L.fixed.map(([,w])=>w),...L.flex];
  const fixedSum=widths.reduce((a,w)=>a+(w==="*"?0:w),0);let x=0;
  widths.forEach((sw,n)=>{const w=sw==="*"?W-ta.w-fixedSum:sw,ch=A.slots[n],rank=A.slots.slice(0,n).filter(c=>c.prev!==undefined&&c.t0===ch.t0).length,p=ease(prog(ch,ROLL,rank*STAG));
    if(n>0)vsep(base,x,H);
    if(p>=1)drawCard(base,ch.cur,x,0,w,H,S);
    else{tmp.noClip();tmp.clear();drawCard(tmp,ch.prev,x,0,w,H,S);base.blit(tmp,x,0,w,H,-p*H);tmp.clear();drawCard(tmp,ch.cur,x,0,w,H,S);base.blit(tmp,x,0,w,H,(1-p)*H);}
    x+=w;});
  drawTray(base,W,H,ta,false,S.t);drawAdvLine(base,S,A,prog,W-ta.w);dst.maxFrom(base);}
function renderAmbient(d,S,A,prog,dst){const {W,H,id}=S;dst.noClip();dst.clear();const am=bgFade(A,prog,dst,S,AMBFULL),kind=am.cur,ta=trayAnim(A,prog),capW=W<256?84:92,right=W-ta.w,wide=W>=256;
  /* While a card holds the caption, the sky dims a little, to 65%, so the card reads without a box. */
  {const c=A.cap,pg=k=>!k||/^(cap|temp|next):/.test(k),pc=ease(prog(c,ROLL)),on=!pg(c.cur),was=c.prev!==undefined&&!pg(c.prev),f=on&&was?1:on?pc:was?1-pc:0;if(f>0)dst.scaleRect(0,0,W,H,1-0.35*f);}
  if(id==="1x2"){const ch=A.cap,p=ease(prog(ch,ROLL)),isPage=k=>!k||/^(cap|temp|next|sn):/.test(k);
    const clock=y=>{const s2=hm(S.now);dst.textO(F5,s2,right-4-dst.tw(F5,s2),3+y,[255,236,210]);};
    const lay=(k,y)=>{if(isPage(k)){ambSlot(dst,k,0,y,capW,H,S);clock(y);}else ambSlot(dst,k,0,y,right,H,S);};
    dst.pushClip(0,0,right,H);
    if(p>=1)lay(ch.cur,0);
    else if(isPage(ch.prev)&&isPage(ch.cur)){clock(0);dst.pushClip(0,0,capW,H);ambSlot(dst,ch.prev,0,-p*H,capW,H,S);ambSlot(dst,ch.cur,0,(1-p)*H,capW,H,S);dst.popClip();}
    else{lay(ch.prev,-p*H);lay(ch.cur,(1-p)*H);}
    dst.popClip();drawTray(dst,W,H,ta,true,S.t);drawAdvLine(dst,S,A,prog,right);return;}
  if(wide){bigClock(dst,S,0,4,[255,236,210],{outline:1,right:right-6});dst.textO(F3,dstr(S.now),right-40,22,[150,160,180]);}else{const s2=hm(S.now);dst.textO(F5,s2,right-4-dst.tw(F5,s2),3,[255,236,210]);}
  /* A notice covers the caption, temperature and forecast (never the clock), drawn at up to 240 px like its preview. */
  const mEnd=right-46,isPage=k=>!k||/^(cap|temp|next):/.test(k);
  const extras=(y,roll)=>{let mx=capW+6;if(W>=384){tempCard(dst,capW+2,y,56,H,S,kind);mx=capW+62;}if(mEnd-mx<=40)return;
    if(W>=512){const half=Math.floor((mEnd-mx)/2);if(PRECIP.has(kBase(kind))){midCard(dst,"now:"+kind,mx,y,half-4,H,S);midCard(dst,"fc:"+kind,mx+half+4,y,mEnd-mx-half-4,H,S);}else midCard(dst,"fc:"+kind,mx,y,mEnd-mx,H,S);}
    else if(A.mid){const mc=A.mid,mp=roll?ease(prog(mc,ROLL)):1;dst.pushClip(mx,y,mEnd-mx,H);
      if(mp>=1)midCard(dst,mc.cur,mx,y,mEnd-mx,H,S);else{midCard(dst,mc.prev,mx,y-mp*H,mEnd-mx,H,S);midCard(dst,mc.cur,mx,y+(1-mp)*H,mEnd-mx,H,S);}dst.popClip();}};
  const lay=(k,y)=>{if(isPage(k)){extras(y,y===0);ambSlot(dst,k,0,y,capW,H,S);}else ambSlot(dst,k,0,y,Math.min(mEnd,240),H,S);};
  const ch=A.cap,p=ease(prog(ch,ROLL));
  dst.pushClip(0,0,mEnd,H);
  if(p>=1)lay(ch.cur,0);
  else if(isPage(ch.prev)&&isPage(ch.cur)){extras(0,true);dst.pushClip(0,0,capW,H);ambSlot(dst,ch.prev,0,-p*H,capW,H,S);ambSlot(dst,ch.cur,0,(1-p)*H,capW,H,S);dst.popClip();}
  else{lay(ch.prev,-p*H);lay(ch.cur,(1-p)*H);}
  dst.popClip();
  drawTray(dst,W,H,ta,true,S.t);drawAdvLine(dst,S,A,prog,right);}
function renderSleep(d,S,A,prog,dst){const {W,H}=S;dst.noClip();dst.clear();const ta=trayAnim(A,prog),right=W-ta.w;
  bigClock(dst,S,0,Math.round((H-13)/2),[110,34,16],{steady:1,center:right/2});
  if(ta.w>0){drawTray(dst,W,H,ta,false,S.t);dst.scaleRect(right,0,ta.w,H,0.3);}}
function sTake(fb,S,o){const {W,t}=S;for(let k=0;k<5;k++){const age=((t*0.55)+k/5)%1;fb.ring(15,16,4+age*W*0.55,1.5,mix(o.c0,o.c1,age),(1-age)*0.5);}
  o.icon(fb,15,16,t);const white=pc("title",[255,244,232]),soft=pc("text",[200,190,185]);
  /* The second line is the message, then the detail when there is one, else the time it came: a takeover is the only place an alert's detail shows. */
  const det=o.det||hm(S.now),dc=pc("detail",soft),R=o.big&&W>=128?bigAt(fb,o,W-6,8,o.c1,"tk:"+o.key,t)-6:W-4;
  const two=(f,y,gap,d)=>{const mw=fb.tw(f,o.msg),dw=d?fb.tw(f,d):0,aw=R-x0;if(mw+(d?gap+dw:0)<=aw){fb.textO(f,o.msg,x0,y,soft);if(d)fb.textO(f,d,x0+mw+(o.msg?gap:0),y,dc);}else marquee(fb,f,o.msg+(d?"  "+d:""),x0,y,aw,soft,t,1,true);},x0=W<256?31:32;
  // A title face (Space) in place of the 5 × 7: the title at the top, the message in small print under it.
  if(o.tf){marquee(fb,o.tf,o.title,x0,2,R-x0,white,t,1,true);if(2+o.tf.h+6<=S.H)two(F3,2+o.tf.h+1,4,W<256?o.det:det);}
  else if(W<256){marquee(fb,F5,o.title,31,7,R-31,white,t,1,true);two(F3,18,4,o.det);}else{if(fb.tw(F5,o.title,2)<=R-32)fb.textO(F5,o.title,32,3,white,2);else marquee(fb,F5,o.title,32,6,R-32,white,t,1,true);two(F5,21,8,det);}
  thinBar(fb,x0,S.H-2,R-x0,o.prog,o.c1);}
const FULL={newyear:(fb,S)=>sCountdown(fb,S,{title:"HAPPY NEW YEAR",message:"2027",seconds:10}),pizza:(fb,S)=>sCountdown(fb,S,{title:"PIZZA IS READY",message:"OVEN IS OFF",seconds:10}),
  leak:(fb,S)=>sRedAlert(fb,S,{title:"WATER LEAK",message:"UNDER THE LAUNDRY SINK"}),chores:(fb,S)=>sConfetti(fb,S,{title:"CHORES DONE",message:"NICE WORK, ADALÉA"}),redalert:(fb,S)=>sRedAlert(fb,S,{message:"TORNADO WARNING"}),countdown:(fb,S)=>sCountdown(fb,S,{title:"HAPPY NEW YEAR",message:"2027",seconds:10}),confetti:(fb,S)=>sConfetti(fb,S,{title:"YOU DID IT",message:"OFFER ACCEPTED"}),door:sDoor,twarn:(fb,S)=>sAlert(fb,S,ALERTS.twarn),blizzard:(fb,S)=>sAlert(fb,S,ALERTS.blizzard),tswarn:(fb,S)=>sAlert(fb,S,ALERTS.tswarn),smoke:(fb,S)=>sAlert(fb,S,ALERTS.smoke),
  cry:(fb,S)=>sTake(fb,S,{icon:waveIcon,title:"NURSERY",msg:"CRYING DETECTED",c0:[255,160,200],c1:[170,90,255]}),goal:sGoal,bday:sBirthday,morningwx:(fb,S)=>sWeatherNote(fb,S,{title:"GOOD MORNING",sensors:["today","forecast"]}),golive:(fb,S)=>sLive(fb,S,{title:"FIREBALL1725 IS LIVE",message:"BUILDING AN LED DISPLAY, COME HANG OUT",colors:[TW]}),ytlive:(fb,S)=>sLive(fb,S,{title:"SAM IS LIVE ON YOUTUBE",message:"SOLDERING THE CONTROLLER BOARD",colors:[YT]}),
  sub:(fb,S)=>sConfetti(fb,S,{title:"NEW SUB",message:"PIXELPAL_42, TIER 1, 6 MONTHS",colors:[TW,[191,148,255],[255,255,255]]}),gifts:(fb,S)=>sFireworks(fb,S,{title:"5 GIFT SUBS",message:"FROM PIXELPAL_42",colors:[TW,[191,148,255],[255,214,90]]}),
  raid:(fb,S)=>sRaid(fb,S,{title:"FROM FIREBALL1725",message:"42 VIEWERS",colors:[[255,80,70]]}),milestone:(fb,S)=>sConfetti(fb,S,{title:"1,000 FOLLOWERS",message:"ON TWITCH",colors:[TW,[191,148,255],[255,214,90],[255,255,255]]}),boot:(fb,S)=>sBoot(fb,S),boot_eth:(fb,S)=>sBoot(fb,S,{net:"eth"}),update:(fb,S)=>sUpdate(fb,S),setup:(fb,S)=>sSetup(fb,Object.assign({},S,{t:S.ft})),canadaflag:(fb,S)=>sFlag(fb,S,{flag:"canada",title:"HAPPY CANADA DAY",message:"1 JULY"})};
/* ---------- display layouts ----------
   A display's screens are a list, in the order they're tried: it shows the first whose rules hold, or the last one. Every screen at
   every size is a row of zones. A zone has a width (pixels, or "*" to share what's left),
   the modules it shows in turn, and the kinds of event it takes (notices, alerts, status, sensors). A zone with nothing to show folds away. */
const SCREENS=["demo"],ALLT=["notices","alerts","status","sensors"];
const TAKES=[["notices","Notifications"],["alerts","Alerts"],["status","Status"],["sensors","Sensors"]];
const MODS={active:[["clock","Clock"],["weather","Weather now"],["lights","Lights"]],idle:[["clock","Clock"],["caption","Weather in words"],["rain","Rain chart, when it's wet"]],sleep:[["clock","Clock"]]};
/* Before the forecast and temperature became sensors, layouts named them as modules. Those layouts still load. */
const OLDMOD={forecast:"sn:forecast",temp:"sn:today",tomorrow:"sn:daily"};
const Zn=(w,show,take=[],o={})=>({w,show:[...show],take:[...take],every:o.every||10,wide:!!o.wide,chart:o.chart});
const TIER_CAT={notice:"notices",advisory:"alerts",warning:"alerts",status:"status"},ACCEPT_ALL=["notice","advisory","warning","status"];
const Zb=(box,w="*",accepts=[],o={})=>({w,box,show:[],accepts:[...accepts],take:[...new Set(accepts.map(a=>TIER_CAT[a]).filter(Boolean))],every:10,wide:o.spill==="whole"});
/* The layouts a display starts with, as boxes. The boxes start empty; the page fills them the way Home Assistant would. */
function defaultZones(scr,id){const A=ACCEPT_ALL;
  if(scr==="demo")scr="active";else if(!["active","idle","sleep"].includes(scr))return [];
  if(scr==="active")return ({"1x2":()=>[Zb("time",44),Zb("main","*",A,{spill:"whole"})],
    "1x4":()=>[Zb("time",44),Zb("now",56),Zb("more","*",A)],
    "1x6":()=>[Zb("time",44),Zb("now",56),Zb("forecast",140,A),Zb("lights","*",A)],
    "1x8":()=>[Zb("time",44),Zb("now",56),Zb("inside",50),Zb("forecast",180,A),Zb("lights","*",A)],
    "1x10":()=>[Zb("time",44),Zb("now",56),Zb("inside",50),Zb("forecast",180,A),Zb("tomorrow",150,A),Zb("lights","*",A)]})[id]();
  if(scr==="idle"){if(id==="1x2")return [Zb("glance",84,A,{spill:"whole"}),Zb("time")];if(id==="1x4")return [Zb("glance",92,A),Zb("outlook"),Zb("time",46)];
    if(id==="1x6")return [Zb("words",92,A),Zb("today",56),Zb("outlook"),Zb("time",46)];
    return [Zb("words",92,A),Zb("today",56),Zb("rain"),Zb("forecast"),Zb("time",46)];}
  return [Zb("time"),Zb("alerts",id==="1x2"?64:110,["notice","advisory","warning"])];}
const SIZE_IDS=["1x2","1x4","1x6","1x8","1x10"],LAYOUT={};
/* Protocol v2's stores: data by key and boxes by name, each kept apart for messages to all and to this display. */
const POOL=new Map(),BOXES=new Map(),layerGet=(M,k)=>{const e=M.get(k);return e?(e.own||e.all):null;};
const layerSet=(M,k,target,v)=>{const e=M.get(k)||{all:null,own:null};e[target==="all"?"all":"own"]=v;if(e.all||e.own)M.set(k,e);else M.delete(k);};
let poolRev=0;
const poolGet=k=>layerGet(POOL,k),boxGet=n=>layerGet(BOXES,n);
/* What a screen is besides its boxes: when it shows, what's behind the boxes, how they sit on it, and what it overrides.
   The three a display starts with are just these settings: sleep is black, red and quiet; active a calm sky with cards side by side; idle the full sky. */
const SDEF_DEFAULT={sleep:{style:"plain",background:"black",filter:"night",quiet:true},active:{style:"panel",background:{type:"sky",calm:true},when:["media","presence"]},idle:{style:"overlay",background:"sky"}};
/* Until a display gets its first layout it shows demo: the active boxes over a calm sky, filled with example data, so it's never blank. */
const DEMO_DEF={demo:{style:"panel",background:{type:"sky",calm:true}}};
let SDEF=JSON.parse(JSON.stringify(DEMO_DEF)),DEMO=true;
const sdef=s=>SDEF[s]||{},styleOf=s=>sdef(s).style||"overlay",isQuiet=s=>!!sdef(s).quiet;
/* Cards draw the way they did on the screen whose style they share. */
const LOOK={panel:"active",overlay:"idle",plain:"sleep"};
const bgOf=s=>{const b=sdef(s).background;if(b==null)return sdef(s).filter==="night"?{type:"none"}:{type:"sky"};return b==="sky"?{type:"sky"}:b==="black"?{type:"none"}:b;};
const zonesOf=(scr,id)=>{const L=LAYOUT[scr]||(LAYOUT[scr]={});return L[id]||(L[id]=defaultZones(scr,id));};
const LAYOUT_HAS=name=>SCREENS.some(s=>zonesOf(s,simSize).some(z=>z.box===name));
const resetLayout=(scr,id)=>{zonesOf(scr,id);LAYOUT[scr][id]=defaultZones(scr,id);};
/* Back to the demo screen, or to the three starter screens. */
function resetScreens(id,starters){const L=starters?["sleep","active","idle"]:["demo"];SCREENS.splice(0,SCREENS.length,...L);DEMO=!starters;
  SDEF=JSON.parse(JSON.stringify(starters?SDEF_DEFAULT:DEMO_DEF));for(const scr of SCREENS)resetLayout(scr,id);}
for(const scr of ["demo","sleep","active","idle"]){LAYOUT[scr]={};for(const id of SIZE_IDS)resetLayout(scr,id);}
const modOk=(m,lv)=>{if(String(m).startsWith("bx:"))return true;if(OLDMOD[m])m=OLDMOD[m];return m==="rain"?PRECIP.has(lv.cond):m.startsWith("sn:")?!!SENS[m.slice(3)]:true;};
/* One module or event in a zone. */
function drawZ(fb,k,x,y,w,h,S,scr,kind,zone){if(k==null||w<=0)return;if(OLDMOD[k])k=OLDMOD[k];fb.pushClip(x,y,w,h);const look=LOOK[styleOf(scr)];
  if(k==="clock"){if(look==="active")WIDGETS.clock(fb,x,y,w,h,S);else if(look==="sleep")bigClock(fb,S,0,y+Math.round((h-13)/2),[255,236,210],{steady:1,center:x+w/2});
    else if(w>=46){bigClock(fb,S,0,y+4,[255,236,210],{outline:1,center:x+w/2});const ds=dstr(S.now);fb.textO(F3,ds,Math.round(x+(w-fb.tw(F3,ds))/2),y+22,[150,160,180]);}
    else{const s2=hm(S.now);fb.textO(F5,s2,x+w-4-fb.tw(F5,s2),y+3,[255,236,210]);}}
  /* Weather now: the sky's icon, its name and the caption's second line. The numbers are sensors. */
  else if(k==="weather"){const wi=WX[condOf(kind)]||WX.pc,L=wxView(kind,S).cap;wi.icon(fb,x+2,y+3,18,S.t);marquee(fb,F3,wxName(kind),x+23,y+6,w-25,[230,230,240],S.t);if(L[1])marquee(fb,F3,L[1],x+23,y+14,w-25,[150,160,180],S.t);}
  else if(k==="caption")captionCard(fb,x,y,w,h,S,kind);else if(k==="temp")tempCard(fb,x,y,w,h,S,kind);
  else if(k==="rain")nowcast(fb,x,y+4,w,24,S,isSnow(kind),kind,zone);
  else if(String(k).startsWith("bx:"))drawCard2(fb,boxCard(k),x,y,w,h,Object.assign({},S,{wkind:kind,scr:look}));
  else drawCard(fb,k,x,y,w,h,String(k).startsWith("sn:")?Object.assign({},S,{wkind:kind,scr:look}):S);
  fb.popClip();}
/* What's behind a screen's boxes: the sky (calm or full; a holiday theme replaces either, faint on the calm one), a colour, a gradient, or a moving one. */
const gradAt=(cs,u)=>{const n=cs.length-1,f=clamp(u,0,1)*n,i=Math.min(n-1,Math.floor(f));return mix(cs[i],cs[i+1],f-i);};
const gradLoop=(cs,u)=>{const n=cs.length,f=((u%1)+1)%1*n,i=Math.floor(f);return mix(cs[i],cs[(i+1)%n],f-i);};
function drawBg(dst,S,A,prog,scr){const b=bgOf(scr),{W,H}=S;
  if(b.type==="sky"){bgFade(A,prog,dst,S,b.calm?AMB:AMBFULL);return;}
  if(b.type==="solid"){dst.rect(0,0,W,H,rgbOf(b.color)||[0,0,0]);return;}
  const cs=(b.colors||[]).map(rgbOf).filter(Boolean);if(cs.length<2)return;
  if(b.type==="gradient"){if(b.direction==="down")for(let y=0;y<H;y++)dst.rect(0,y,W,1,gradAt(cs,y/(H-1)));else for(let x=0;x<W;x++)dst.rect(x,0,1,H,gradAt(cs,x/(W-1)));return;}
  if(b.type==="animated"){const T=S.t/clamp(+b.seconds||30,2,600);if(b.motion==="cycle")dst.rect(0,0,W,H,gradLoop(cs,T));else for(let x=0;x<W;x++)dst.rect(x,0,1,H,gradLoop(cs,x/W-T));}}
/* A screen with no boxes yet says so, over its background. */
function setMeUp(dst,S,scr,right){const n=String(scr).toUpperCase(),m="ADD BOXES TO IT IN YOUR PIXELBAR SETTINGS";
  dst.textO(F5,n,Math.max(3,Math.round((right-dst.tw(F5,n))/2)),5,[255,236,210]);
  const mw=dst.tw(F3,m);if(mw<=right-6)dst.textO(F3,m,Math.round((right-mw)/2),19,[150,160,180]);else marquee(dst,F3,m,3,19,right-6,[150,160,180],S.t);}
/* A screen's outline: a #RRGGBB colour all round everything in its boxes, { color, at } on one side (a shadow below, a glow above), "none" for none,
   or the style's own when it's not set. */
const outlineOf=o=>{if(o==="none")return false;const c=rgbOf(o&&typeof o==="object"?o.color:o);return c?{c,at:(o&&o.at)||"around"}:undefined;};
function renderZ(d,S,A,prog,dst,scr){const {W,H,id}=S,Zs=zonesOf(scr,id),zs=A.Z[scr]||[],{base}=d.L,kind=A.kind.cur,def=sdef(scr),style=styleOf(scr),cs0=CLOCK_STYLE;
  if(def.clock_style&&FONTS.includes(def.clock_style))CLOCK_STYLE=def.clock_style;
  dst.noClip();dst.clear();const ta=trayAnim(A,prog),right=W-ta.w;drawBg(dst,S,A,prog,scr);
  if(def.tint){const c=rgbOf(def.tint.color),a=clamp(+def.tint.opacity||0,0,1);if(c&&a>0)dst.rect(0,0,W,H,c,a);}
  // Every buffer the boxes draw into: the strip, and the layers panel and rolling cards use.
  const hal=outlineOf(def.outline),haloBufs=[dst,base,d.L.tmp,d.L.la,d.L.lb];for(const b of haloBufs){b.halo=hal;b.haloTo=style==="panel"&&b!==dst?dst:undefined;}
  if(!Zs.length)setMeUp(dst,S,scr,right);
  const has=a=>a&&(a.cur!=null||(a.prev!=null&&prog(a,ROLL)<1));let fixed=0,stars=0;
  Zs.forEach((z,i)=>{if(!has(zs[i]))return;if(z.w==="*")stars++;else fixed+=z.w;});
  const each=stars?Math.max(0,Math.floor((right-fixed)/stars)):0,R=[];let x=0;
  Zs.forEach((z,i)=>{const w=has(zs[i])?(z.w==="*"?each:Math.min(z.w,Math.max(0,right-x))):0;R.push({x,w});x+=w;});
  const taken=(i,k)=>k!=null&&!String(k).startsWith("bx:")&&!Zs[i].show.includes(k),bc=k=>String(k).startsWith("bx:")?boxCard(k):null;
  let clockX=right;Zs.forEach((z,i)=>{if(R[i].w&&(z.show.includes("clock")||(bc(zs[i]&&zs[i].cur)||{}).card==="clock")&&R[i].x>0)clockX=Math.min(clockX,R[i].x);});
  /* An event can spill over its neighbours: across the whole width when the zone allows it, or on idle up to 240 px, stopping at the clock or at the next box that's showing an event of its own. */
  /* a.prev sticks after the roll ends, so a gone event only counts while it's still rolling out. */
  const rect=i=>{const a=zs[i];if(!a||!R[i].w||!(taken(i,a.cur)||(a.prev!==undefined&&prog(a,ROLL)<1&&taken(i,a.prev))))return R[i];if(Zs[i].wide)return {x:0,w:right,spill:1};
    if(style==="overlay"){let stop=clockX;for(let j=i+1;j<Zs.length;j++){const b=zs[j];if(R[j].w&&b&&(taken(j,b.cur)||(b.prev!==undefined&&prog(b,ROLL)<1&&taken(j,b.prev)))){stop=Math.min(stop,R[j].x);break;}}
      return {x:R[i].x,w:Math.max(R[i].w,Math.min(240,stop-R[i].x)),spill:1};}return R[i];};
  const rs=Zs.map((_,i)=>rect(i)),hidden=i=>rs.some((r,j)=>j!==i&&r.spill&&R[i].w&&R[i].x<r.x+r.w&&R[i].x+R[i].w>r.x);
  // While an event holds a box, the sky dims to 65% under that box (as wide as the event spills), so the card reads without a frame and the rest of the strip stays as it was.
  if(style==="overlay")zs.forEach((a,i)=>{if(!a||!R[i].w)return;const pc=ease(prog(a,ROLL)),on=taken(i,a.cur),was=a.prev!==undefined&&taken(i,a.prev),f=on&&was?1:on?pc:was?1-pc:0;if(f>0){const r=rs[i],dim=(def&&def.dim!=null?clamp(+def.dim,0,100):35)/100;if(dim>0)dst.scaleRect(r.x,0,r.w,H,1-dim*f);}});
  // Effects around a card: the boxes are compared with the sky under them afterwards, so the weather can come in front of the words.
  const fxI=bgOf(scr).type==="sky"?Zs.map((_,i)=>i).filter(i=>zs[i]&&rs[i].w>0&&fxOf(zs[i].cur,def)):[],fxBg=fxI.length?(d.L.fxbg=d.L.fxbg||new FB(W,H)):null;
  if(fxBg)fxBg.d.set(dst.d);
  const tgt=style==="panel"?base:dst;if(style==="panel"){base.noClip();base.clear();}
  const order=Zs.map((_,i)=>i).sort((a,b)=>(rs[a].spill?1:0)-(rs[b].spill?1:0));
  for(const i of order){const a=zs[i],r=rs[i];if(!a||r.w<=0||(!r.spill&&hidden(i)))continue;
    if(style==="panel"&&!r.spill&&r.x>0)vsep(tgt,r.x,H);
    const rank=zs.slice(0,i).filter(c=>c&&c.prev!==undefined&&c.t0===a.t0).length,p=ease(prog(a,ROLL,rank*STAG));
    /* On idle, only a card (an event, or a sensor) gets the outlined over-the-sky treatment, and each item is judged on its own:
       a zone that once showed a sensor must not keep outlining the rain chart after the sensor has rolled away. */
    const flat=c=>!c||["clock","caption","weather","date"].includes(c.card)||(c.card==="chart"&&(c.style==="rain"||c.style==="snow")),card=k=>k!=null&&(taken(i,k)||String(k).startsWith("sn:")||(String(k).startsWith("bx:")&&!flat(bc(k)))),one=(k,yo)=>{const f=fb=>drawZ(fb,k,r.x,yo,r.w,H,S,scr,kind,Zs[i]);if(style==="overlay"&&card(k))overSky(tgt,r.x,r.x+r.w,f);else f(tgt);};
    if(p>=1)one(a.cur,0);else{one(a.prev,-p*H);one(a.cur,(1-p)*H);}}
  if(style==="panel")dst.overFrom(base);
  if(fxBg){const M=new Uint8Array(W*H),Z=new Uint8Array(W),q=dst.d,p=fxBg.d;let since=Infinity;
    for(const i of fxI){const r=rs[i],x0=Math.max(0,r.x),x1=Math.min(W,r.x+r.w);since=Math.min(since,zs[i].t0||0);for(let x=x0;x<x1;x++)Z[x]=1;
      // row by row, plain compares: this runs every frame
      for(let y=0;y<H;y++){let j=(y*W+x0)*3,m=y*W+x0;for(let x=x0;x<x1;x++,j+=3,m++){const a=q[j]-p[j],b=q[j+1]-p[j+1],c=q[j+2]-p[j+2];if(a>60||a<-60||b>60||b<-60||c>60||c<-60)M[m]=1;}}}
    weatherFront(dst,S,kind,M,Z,!!bgOf(scr).calm,since,fxI.map(i=>rs[i]));}
  CLOCK_STYLE=cs0;
  for(const b of haloBufs){b.halo=undefined;b.haloTo=undefined;}
  const night=def.filter==="night";
  if(night){const q=dst.d;for(let yy=0;yy<H;yy++)for(let xx=0;xx<right;xx++){const j=(yy*W+xx)*3,l=Math.max(q[j],q[j+1],q[j+2]);q[j]=l*0.43;q[j+1]=l*0.13;q[j+2]=l*0.063;}}
  else if(def.filter==="dim")dst.scaleRect(0,0,right,H,0.5);
  drawTray(dst,W,H,ta,style==="overlay",S.t);if(night&&ta.w>0)dst.scaleRect(right,0,ta.w,H,0.3);
  if(!night)drawAdvLine(dst,S,A,prog,right);}
/* While the display boots or updates, that screen replaces everything else. */
function composeLive(d,S,A,prog){if(!live.sys)return compose(d,S,A,prog);if(!d.sysFB||d.sysFB.W!==d.W)d.sysFB=new FB(d.W,d.H);const fb=d.sysFB,e=Math.max(0,simT-live.sys.t0);fb.noClip();fb.clear();
  const cur=typeof DS!=="undefined"&&DS.list.find(x=>x.id===DS.cur),sy=live.sys,k=sy.k,real=sy.mqtt&&BROKER;
  const o={name:(SET2.name&&real?SET2.name:real?BROKER.name:cur?cur.name:"").toUpperCase()||undefined,net:sy.net,rt:simT,offline:sy.offline,from:sy.from,to:sy.to,ip:real?BROKER.host:undefined};
  if(k==="update")sUpdate(fb,Object.assign({},S,{ft:e}),o);else if(k==="setup"&&e>=3.3+FL_LEN)sSetup(fb,Object.assign({},S,{t:e}),o);else sBoot(fb,Object.assign({},S,{ft:k==="setup"?Math.min(e,3.2+FL_LEN):e}),o);
  /* The end of a boot dissolves into the live screen, left to right with some grain, a bright edge sparkling where they meet. */
  const p=k==="boot"?(e-(bootLen(live.sys.net)-BOOT_X))/BOOT_X:0;if(p>0){const n=compose(d,S,A,prog),W=d.W,H=d.H;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const th=0.7*(x/W)+0.3*hash(x*7.3+y*13.1),i=(y*W+x)*3;if(p*1.08>th){fb.d[i]=n.d[i];fb.d[i+1]=n.d[i+1];fb.d[i+2]=n.d[i+2];}
      else if(p*1.08>th-0.05){const g=1-(th-p*1.08)/0.05;fb.d[i]=Math.max(fb.d[i],255*g);fb.d[i+1]=Math.max(fb.d[i+1],240*g);fb.d[i+2]=Math.max(fb.d[i+2],220*g);}}}
  return fb;}
function compose(d,S,A,prog){const W=d.W,H=d.H;
  if(!d.L)d.L={la:new FB(W,H),lb:new FB(W,H),base:new FB(W,H),tmp:new FB(W,H),alert:new FB(W,H),out:new FB(W,H)};
  const {la,lb,alert,out}=d.L,R=(m,dst)=>A.Z?renderZ(d,S,A,prog,dst,m):(m==="strip"?renderStrip:m==="sleep"?renderSleep:renderAmbient)(d,S,A,prog,dst);
  const m=A.mode,pm=ease(prog(m,MODEF));let main=la;R(m.cur,la);
  if(m.prev!==undefined&&pm<1){R(m.prev,lb);lb.mixFrom(la,pm);main=lb;}
  const f=A.full,pf=ease(prog(f,FULLR));
  if(!f.cur&&!(f.prev&&pf<1))return main;
  alert.noClip();alert.clear();FULL[f.cur||f.prev](alert,Object.assign({},S,{ft:S.traw!=null?S.traw-f.t0:null}));
  if(f.cur&&pf>=1)return alert;
  out.noClip();out.clear();
  if(f.cur){out.blit(main,0,0,W,H,-pf*H);out.blit(alert,0,0,W,H,(1-pf)*H);}
  else{out.blit(alert,0,0,W,H,pf*H);out.blit(main,0,0,W,H,-(1-pf)*H);}
  return out;}

/* ---------- the scripted evening (demo) ---------- */
const TL_LEN=96;
const VARIANTS={
  rain:{kind:["rain","storm"],cond:["rain","storm"],advKey:"tswatch",advEv:"Storms build, severe thunderstorm watch",crit:"twarn",warnTier:false,critEv:"Tornado warning takes the strip",endEv:"Tornado warning ends",wxEv:"Raining, nothing playing: full-screen weather"},
  snow:{kind:["snow","heavysnow"],cond:["snow","snow"],advKey:"squall",advEv:"Snow gets heavier, snow squall watch",crit:"blizzard",warnTier:true,critEv:"Blizzard warning pops up",endEv:"Popup ends, the red line and rotation stay",wxEv:"Snowing, nothing playing: full-screen weather"},
  clear:{kind:["clear","clear"],cond:["clear","clear"],advKey:"heatnight",advEv:"Heat advisory issued",crit:"twarn",warnTier:false,critEv:"Tornado warning takes the strip",endEv:"Tornado warning ends",wxEv:"Clear warm night, nothing playing: night sky"}
};
let V=VARIANTS.rain;
const NOTICE_SCHED=[];
{let end=0;for(const [t,k] of [[32,"pkg"],[34,"garage5"],[64,"garage10"]]){const s=Math.max(t,end);NOTICE_SCHED.push([s,s+8,k]);end=s+8;}}
function tlEvents(){return [[0,V.wxEv,"home","Idle"],[4,"Garage door opens, timer starts, nothing shown","home","Timer"],[10,"The media device starts playing, fade to the strip","status","Status"],
  [18,"Someone rings the doorbell","alert","Alert"],[27,"Front door opens, the bell leaves the tray","home","Resolved"],[32,"Package left at the porch","notice","Notice"],
  [34,"Garage open 5 minutes, waits for the package notice","notice","Notice"],[50,V.advEv,ADVS[V.advKey].sev==="adv"?"adv":"watch","Advisory"],
  [64,"Garage still open, 10 minute reminder","notice","Notice"],[70,V.critEv,"warn",V.warnTier?"Warning":"Critical"],[80,V.endEv,V.warnTier?"warn":"home",V.warnTier?"Warning":"Resolved"],
  [82,"Garage door closes","home","Resolved"],[84,"Package brought inside","home","Resolved"],[88,"The media device stops, fade back to full screen","home","Idle"]];}
function tlWorld(tt){const esc=tt>=50?1:0,tray=[];
  if(tt>=18&&tt<27)tray.push("door");if(tt>=32&&tt<84)tray.push("pkg");if(tt>=34&&tt<82)tray.push("garage");const advKey=tt>=50?(V.warnTier&&tt>=70?V.crit:V.advKey):null,advSev=advKey?ADVS[advKey].sev:null;if(advKey)tray.push("adv:"+advSev);
  let notice=null;for(const [s,e,k] of NOTICE_SCHED)if(tt>=s&&tt<e)notice=k;
  const tv=tt>=10&&tt<88;
  return {mode:tv?"strip":"amb",playing:tv,kind:V.kind[esc],cond:V.cond[esc],full:(tt>=18&&tt<25)?"door":(tt>=70&&tt<80)?V.crit:null,notice,adv:advSev,advKey,tray:tray.join(",")};}
function computeTrack(id){const L=TL_LAYOUT[id],n=L.flex.length,N=Math.round(TL_LEN/DT),out=[];let prev=new Array(n).fill(null),prevCap=[null];
  for(let i=0;i<N;i++){const tt=i*DT,w=tlWorld(tt),dyn=[];
    if(w.advKey)dyn.push({k:"adv:"+w.advKey,p:60});if(w.notice)dyn.push({k:w.notice,p:80});
    const c=BASE_CARDS[id].map(([k,p])=>({k,p})).concat(dyn);if(w.playing)c.push({k:"np",p:40});
    const flex=stable(prev,pick(c,n,tt)),cap=stable(prevCap,pick([{k:pageKey(id,w.kind,tt),p:30},...dyn],1,tt));
    out.push({mode:w.mode,flex,cap:cap[0],mid:midKey(id,w.kind,tt),fixed:L.fixed.map(([k])=>k==="wx"?"wx:"+w.cond:k),full:w.full,tray:w.tray,kind:w.kind,adv:w.adv,cond:w.cond});prev=flex;prevCap=cap;}
  return out;}
const TRACKS={};const buildTracks=()=>{for(const id of Object.keys(TL_LAYOUT))TRACKS[id]=computeTrack(id);};buildTracks();
function lastChange(tr,i,get){const cur=get(tr[i]);let j=i;while(j>0&&get(tr[j-1])===cur)j--;return {cur,prev:j>0?get(tr[j-1]):undefined,j};}
function tlNow(tt){const b=new Date();b.setHours(20,14,0,0);return new Date(b.getTime()+tt*10000);}
function tlCompose(d,tt,smooth){const id=d.size.id,tr=TRACKS[id],i=clamp(Math.floor(tt/DT),0,tr.length-1),s=tr[i],L=TL_LAYOUT[id];
  const g=get=>{const c=lastChange(tr,i,get);return {cur:c.cur,prev:c.prev,t0:c.j*DT};};
  const A={slots:[...L.fixed.map((_,n)=>g(x=>x.fixed[n])),...L.flex.map((_,n)=>g(x=>x.flex[n]))],cap:g(x=>x.cap),mid:g(x=>x.mid),tray:g(x=>x.tray),adv:g(x=>x.adv),kind:g(x=>x.kind),mode:g(x=>x.mode),full:g(x=>x.full)};
  const S={W:d.W,H:d.H,id,t:tt+3.3,traw:tt,now:tlNow(tt),np:1421+Math.max(0,tt-10)*10,st:{cond:s.cond},opened:tlNow(4),pkgAt:tlNow(32)};
  return compose(d,S,A,mkProg(tt,smooth));}

/* ---------- the live simulator (Try it) ---------- */
const DEF={
  doorbell:{tier:"alert",full:"door",card:"doorbell",tray:"door",icon:"bell",ctl:["send"],sound:"chime"},
  garage:{tier:"notice",keep:1,timer:1,card:"garage5",remind:"garage10",tray:"garage",icon:"garage",ctl:["set","remind","clear"],key:"garage_door"},
  backdoor:{tier:"notice",keep:1,timer:1,card:"backdoor",remind:"backdoor10",tray:"door2",icon:"door",ctl:["set","remind","clear"],key:"back_door"},
  unlocked:{tier:"notice",keep:1,card:"unlocked",tray:"lock",icon:"lock",ctl:["set","clear"],key:"front_door_lock"},
  alarm:{tier:"notice",card:"alarm",tray:"shield",icon:"alarm",ctl:["send"],key:"alarm_armed"},
  frontopen:{tier:"notice",card:"frontopen",icon:"door",ctl:["send"],key:"front_door_opened",notray:1,slot:5,sound:"beepboop"},
  frontclosed:{tier:"notice",card:"frontclosed",icon:"door_closed",ctl:["send"],key:"front_door_closed",notray:1,slot:5},
  pkg:{tier:"notice",keep:1,card:"pkg",tray:"pkg",icon:"package",ctl:["set","clear"],key:"package"},
  car:{tier:"notice",card:"car",tray:"car",icon:"car",ctl:["send"],key:"car_arrived"},
  lightning:{tier:"notice",card:"lightning",tray:"bolt",icon:"bolt",ctl:["send"]},
  heat:{tier:"advisory",adv:"heat",icon:"warning",ctl:["set","clear"],key:"wx_heat_advisory"},
  wxadv:{tier:"advisory",adv:"wxadv",icon:"warning",ctl:["set","clear"],key:"wx_advisory"},
  tswatch:{tier:"advisory",adv:"tswatch",icon:"warning",ctl:["set","clear"],key:"wx_tstorm_watch"},
  twatch:{tier:"advisory",adv:"twatch",icon:"tornado",ctl:["set","clear"],key:"wx_tornado_watch"},
  twarn:{tier:"critical",adv:"twarn",full:"twarn",icon:"tornado",ctl:["set","clear"],key:"wx_tornado_warning",sound:"alarm"},
  blizzard:{tier:"warning",adv:"blizzard",full:"blizzard",icon:"snowflake",ctl:["set","clear"],key:"wx_blizzard_warning",sound:"alert"},
  tswarn:{tier:"warning",adv:"tswarn",full:"tswarn",icon:"warning",ctl:["set","clear"],key:"wx_tstorm_warning",sound:"alert"},
  smoke:{tier:"critical",adv:"smoke",full:"smoke",icon:"warning",ctl:["set","clear"],key:"smoke_alarm",sound:"alarm"},
  plant:{tier:"nudge",card:"plant",tray:"plant",icon:"plant",ctl:["set","clear"],key:"plant_ginger"},
  freezer:{tier:"notice",keep:1,card:"freezer",tray:"flake",icon:"thermometer",ctl:["set","clear"],key:"freezer_garage"},
  sally:{tier:"notice",keep:1,card:"sally",tray:"snake",icon:"snake",ctl:["set","clear"],key:"enclosure_sally"},
  match:{tier:"status",card:"match",icon:"football",ctl:["set","clear"],key:"match_newcastle",
    pay:S=>({title:"NEW v COV",message:"67' live",detail:"At Coventry",big:{value:(S.score||[1,0]).join("-")},font:"flip",images:[imgPayload("espn-361"),imgPayload("espn-388")]})},
  goal:{tier:"alert",full:"goal",dur:8,notray:1,preview:"full:goal",icon:"football",ctl:["send"],key:"goal_newcastle",sound:"chime",
    pay:S=>({animation:"goal",title:"Goal!",message:"NEW "+(S.score||[1,0]).join("-")+" COV",detail:"23'",colors:["#FFFFFF","#F1BE48"],images:[imgPayload("espn-361"),imgPayload("espn-388")]})},
  bday:{tier:"alert",full:"bday",dur:10,notray:1,preview:"full:bday",icon:"cake",ctl:["send"],key:"birthday_sam",sound:"chime",
    pay:S=>({animation:"fireworks",title:"Happy birthday",message:"Adaléa"})},
  recycling:{tier:"notice",keep:1,repeat:1,card:"recycling",tray:"mini:recycling",icon:"recycling",ctl:["set","clear"],key:"recycling_night",sound:"double"},
  garbage:{tier:"notice",keep:1,repeat:1,card:"garbage",tray:"mini:bins",icon:"bins",ctl:["set","clear"],key:"garbage_night",sound:"double"},
  newyear:{tier:"alert",full:"newyear",dur:14,notray:1,preview:"full:newyear",icon:"star",ctl:["send"],key:"new_year",sound:"done",
    pay:()=>({animation:"countdown",title:"Happy new year",message:"2027",seconds:10})},
  pizza:{tier:"alert",full:"pizza",dur:14,notray:1,preview:"full:pizza",icon:"pizza",ctl:["send"],key:"oven_timer",sound:"triple",
    pay:()=>({animation:"countdown",title:"Pizza is ready",message:"Oven is off",seconds:10})},
  leak:{tier:"critical",full:"leak",preview:"full:leak",icon:"leak",ctl:["set","clear"],key:"water_leak",sound:"siren",
    pay:()=>({animation:"red_alert",title:"Water leak",message:"Under the laundry sink"})},
  chores:{tier:"alert",full:"chores",dur:8,notray:1,preview:"full:chores",icon:"star",ctl:["send"],key:"chores_done",sound:"done",
    pay:()=>({animation:"confetti",title:"Chores done",message:"Nice work, Adaléa",colors:["#FF7C45","#48C28A","#5AA2F5","#E8B53A"]})},
  morningwx:{tier:"alert",full:"morningwx",dur:12,notray:1,preview:"full:morningwx",icon:"sun",ctl:["send"],key:"morning_weather",sound:"chime",
    pay:()=>({animation:"weather",title:"Good morning",sensors:["today","forecast"],seconds:300})},
  golive:{tier:"alert",full:"golive",dur:10,notray:1,preview:"full:golive",icon:"twitch",ctl:["send"],key:"twitch_live",sound:"rising",
    pay:()=>({animation:"live",title:"FireBall1725 is live",message:"Building an LED display, come hang out",colors:["#9146FF"]})},
  ytlive:{tier:"alert",full:"ytlive",dur:10,notray:1,preview:"full:ytlive",icon:"youtube",ctl:["send"],key:"youtube_live",sound:"rising",
    pay:()=>({animation:"live",title:"FireBall1725 is live on YouTube",message:"Soldering the controller board",colors:["#FF1E28"]})},
  onair:{tier:"status",card:"onair",icon:"live",ctl:["set","clear"],key:"on_air"},
  follower:{tier:"notice",card:"follower",icon:"twitch",ctl:["send"],key:"twitch_follow",sound:"beep"},
  sub:{tier:"alert",full:"sub",dur:8,notray:1,preview:"full:sub",icon:"twitch",ctl:["send"],key:"twitch_sub",sound:"done",
    pay:()=>({animation:"confetti",title:"New sub",message:"PixelPal_42, tier 1, 6 months",colors:["#9146FF","#BF94FF","#FFFFFF"]})},
  gifts:{tier:"alert",full:"gifts",dur:10,notray:1,preview:"full:gifts",icon:"gift",ctl:["send"],key:"twitch_gift_subs",sound:"done",
    pay:()=>({animation:"fireworks",title:"5 gift subs",message:"From PixelPal_42",colors:["#9146FF","#BF94FF","#FFD65A"]})},
  bits:{tier:"notice",card:"bits",icon:"gem",ctl:["send"],key:"twitch_bits",sound:"rising"},
  tip:{tier:"notice",card:"tip",icon:"kofi",ctl:["send"],key:"kofi_tip",sound:"rising"},
  raid:{tier:"alert",full:"raid",dur:8,notray:1,preview:"full:raid",icon:"raid",ctl:["send"],key:"twitch_raid",sound:"alert",
    pay:()=>({animation:"raid",title:"From FireBall1725",message:"42 viewers",colors:["#FF5046"]})},
  superchat:{tier:"notice",card:"superchat",icon:"youtube",ctl:["send"],key:"youtube_superchat",sound:"rising"},
  ytmember:{tier:"notice",card:"ytmember",icon:"youtube",ctl:["send"],key:"youtube_member",sound:"beep"},
  upload:{tier:"notice",card:"upload",icon:"youtube",ctl:["send"],key:"youtube_upload",sound:"chime"},
  milestone:{tier:"alert",full:"milestone",dur:8,notray:1,preview:"full:milestone",icon:"star",ctl:["send"],key:"twitch_milestone",sound:"done",
    pay:()=>({animation:"confetti",title:"1,000 followers",message:"On Twitch",colors:["#9146FF","#BF94FF","#FFD65A","#FFFFFF"]})},
  health:{tier:"advisory",adv:"health",icon:"warning",ctl:["set","clear"],key:"obs_health",sound:"double"},
  hype:{tier:"notice",card:"hype",icon:"twitch",ctl:["set","clear"],key:"twitch_hype_train"},
  homelab:{tier:"notice",keep:1,card:"homelab",tray:"server",icon:"server",ctl:["set","clear"],key:"homelab_node"},
  nap:{tier:"status",card:"nap",icon:"moon",ctl:["set","clear"]},
  cry:{tier:"alert",full:"cry",card:"cry",tray:"baby",icon:"baby",ctl:["send"],key:"nursery_crying",sound:"chime"},
  nursery:{tier:"notice",keep:1,card:"nursery",tray:"thermo",icon:"thermometer",ctl:["set","clear"],key:"nursery_temp"},
  tvtime:{tier:"status",card:"tvtime",icon:"tv",ctl:["set","clear"],key:"tv_time"},
  bedtime:{tier:"status",card:"bedtime",icon:"moon",ctl:["set","clear"]},
  kidhome:{tier:"notice",card:"kidhome",tray:"key",icon:"key",ctl:["send"],key:"home_from_school"},
  gate:{tier:"notice",keep:1,card:"gate",remind:"gate10",tray:"door2",icon:"gate",ctl:["set","remind","clear"],key:"back_gate"}
};
/* Every catalogue item as data, for other pages to list (Home Assistant's Examples tab): its words, and a function that builds its messages. */
const CAT_OUT={};const catOut=(sec,o)=>(CAT_OUT[sec]=CAT_OUT[sec]||[]).push(o);
const CATALOG=[
  ["doorbell","Doorbell","Front Door Doorbell","The whole strip for 7 s, then the tray until the door opens.","doors"],
  ["garage","Garage door open","Garage door sensor","Shows at 5 minutes open, reminds every 5 after.","doors"],
  ["backdoor","Back door open","Back Door contact sensor","Same rule as the garage, with its own threshold.","doors"],
  ["unlocked","Front door unlocked","Front Door Lock and Alarmo","Only while the alarm is armed or the house is asleep.","doors"],
  ["alarm","Alarm armed","Alarmo","A short confirmation after arming.","doors"],
  ["frontopen","Front door opened","Front door contact sensor, while the alarm is armed","A one-shot: 5 s in a slot with the beep boop, then gone.","doors"],
  ["frontclosed","Front door closed","Front door contact sensor","The same one-shot, silent.","doors"],
  ["pkg","Package waiting","Front Door Package Camera","Stays in the tray until the front door opens.","doors"],
  ["car","Car arrived","Garage Vehicle detection","A short heads-up when a car pulls in.","doors"],
  ["morningwx","Morning weather","A time trigger, or your phone's alarm going off","The sky full screen with today's temperature and the forecast, for 5 minutes.","weather"],
  ["heat","Heat advisory","Environment Canada alerts","Rotates with a yellow line until it ends.","weather"],
  ["wxadv","Weather advisory","Environment Canada alerts","Same as the heat advisory.","weather"],
  ["tswatch","Severe thunderstorm watch","Environment Canada alerts","A watch is orange: joins the rotation with an orange line.","weather"],
  ["twatch","Tornado watch","Environment Canada alerts","Orange, like any watch. Only a warning takes over.","weather"],
  ["twarn","Tornado warning","Environment Canada alerts","Takes the whole strip until cancelled.","weather"],
  ["tswarn","Severe thunderstorm warning","Environment Canada alerts","Pops up, then a red bar and a card.","weather"],
  ["blizzard","Blizzard warning","Environment Canada alerts","Same as the thunderstorm warning.","weather"],
  ["lightning","Lightning nearby","Tempest lightning strike","Within 10 km. Leaves 30 seconds after the last strike.","weather"],
  ["leak","Water leak","A leak sensor under the laundry sink","A red alert: the whole strip until it's cleared, and it wakes the house.","house"],
  ["recycling","Recycling night","A waste collection calendar, like the Waste Collection Schedule integration","The evening before pickup. Comes back to a box every 15 minutes (30 seconds on this page) until it's cleared.","house"],
  ["garbage","Garbage and green bin night","The same calendar, on the other week","The same repeating reminder for the garbage and the green bin.","house"],
  ["pizza","Oven timer","A timer helper started with the oven","The last 10 seconds, then pizza is ready.","house"],
  ["smoke","Smoke or CO alarm","Smoke and CO detectors, if the house has them in Home Assistant","Takes the whole strip and wakes the house.","house"],
  ["plant","Plant needs water","Ginger Moisture and its floor helper","Tray only. Never takes a slot and hides while the house is asleep.","house"],
  ["freezer","Freezer warm","Garage Freezer Temperature","Above −15 °C for 10 minutes. The kitchen fridge and freezer work the same way.","house"],
  ["sally","Sally's enclosure","Sally Humidifier and Sally sensors","Humidity or temperature out of range for 15 minutes.","house"],
  ["match","Newcastle match","Newcastle United sensor (Team Tracker)","Rotates while a match is live.","fun"],
  ["goal","Newcastle goal","Newcastle United sensor, when team_score goes up","A goal animation in the team colours. Each Send adds a goal.","fun"],
  ["newyear","New Year countdown","A calendar or time trigger for midnight","The last 10 seconds, then fireworks.","fun"],
  ["bday","Birthday","A birthdays calendar or helper","Fireworks and a cake in the morning.","fun"],
  ["golive","Going live on Twitch","The Twitch integration, when the stream sensor turns to streaming","The whole strip, in Twitch purple, with the stream title scrolling.","stream"],
  ["ytlive","Going live on YouTube","The YouTube Data API through a REST sensor","The same animation in YouTube red.","stream"],
  ["onair","On air","The same stream sensor, for as long as it's streaming","Stays up on every display, so the house knows you're live.","stream"],
  ["follower","New follower","Streamer.bot, Streamlabs or StreamElements, through a webhook","A short card with the name. Group a burst in the automation: 12 new followers.","stream"],
  ["sub","New sub or resub","The same event tools","Confetti in the channel's colours.","stream"],
  ["gifts","Gift subs","The same event tools","Fireworks, with who they came from.","stream"],
  ["bits","Bits","The same event tools","The amount and the cheer message.","stream"],
  ["tip","Tip","Ko-fi or Streamlabs donation webhooks","The amount, who it's from, and their message.","stream"],
  ["raid","Raid","The same event tools","Its own animation, with the raider and how many came.","stream"],
  ["superchat","Super Chat","YouTube events through Streamer.bot or StreamElements","The amount and the message.","stream"],
  ["ytmember","New YouTube member","The same YouTube events","A welcome card.","stream"],
  ["upload","New video is up","The YouTube integration's latest upload","When a video goes public.","stream"],
  ["milestone","Follower milestone","The follower count crossing a number you pick, in an automation","Confetti.","stream"],
  ["health","Stream health","OBS, through obs-websocket, while you're live","A yellow alert for dropped frames or a low bitrate, so you see it without opening OBS.","stream"],
  ["hype","Hype train","Twitch events through Streamer.bot","The level and the time left, until it ends.","stream"],
  ["homelab","Homelab node down","Talos node sensors","Only after 5 minutes down, so a normal reboot never shows.","house"],
  ["nap","Nap in progress","A sleep toggle or the nursery camera","Shows while the kid is down, with a timer.","kids"],
  ["cry","Crying in the nursery","Camera or baby monitor sound detection","Takes the strip, like the doorbell.","kids"],
  ["nursery","Nursery too warm or cold","Nursery temperature sensor","Out of the range you set for 10 minutes.","kids"],
  ["tvtime","TV time left","A timer helper started with the TV","Counts down under the TV, where the kid can see it too.","kids"],
  ["bedtime","Bedtime countdown","A schedule or calendar helper","Starts 15 minutes before bedtime.","kids"],
  ["chores","Chores done","A to-do list, when the last chore is ticked off","Confetti in the colours you pick.","kids"],
  ["kidhome","Home from school","Lock keypad user code or a phone tracker","Shows who unlocked the door.","kids"],
  ["gate","Back gate open","Gate contact sensor","A short threshold. Make it critical if there's a pool.","kids"]
];
const LIFE=d=>d.repeat&&d.tier==="notice"?"Slot every 15 min until cleared (30 s here)":d.notray&&d.tier==="notice"?`Slot for ${d.slot||8} s, then gone`:d.tier==="critical"?"Full strip until cleared":d.tier==="warning"?"Pops up, then a red bar until cleared":d.tier==="alert"?`Full strip for ${d.dur||7} s`:d.tier==="advisory"?"Rotates until cleared":d.tier==="status"?"Rotates while on":d.tier==="nudge"?"Tray only":d.keep?"Slot, then tray until cleared":"Slot, then tray for 30 s";
let buzzer=true,AC=null;
/* Buzzer patterns as [frequency Hz, seconds] steps, 0 Hz being a rest. The buzzer is passive, so the controller can play any of these, or a tune sent as RTTTL. */
const SOUNDS={none:["None",[],""],beep:["Beep",[[1000,.12]],"a quiet heads-up"],double:["Double beep",[[1000,.1],[0,.08],[1000,.1]],"a door left open"],
  triple:["Triple beep",[[1000,.08],[0,.06],[1000,.08],[0,.06],[1000,.08]],"reminders"],chime:["Chime",[[880,.16],[0,.04],[660,.26]],"the default for alerts"],
  westminster:["Westminster",[[659,.3],[523,.3],[587,.3],[392,.55]],"a doorbell"],rising:["Rising",[[523,.1],[659,.1],[784,.18]],"someone's home"],
  falling:["Falling",[[784,.1],[659,.1],[523,.18]],"a timer ran out"],done:["All done",[[523,.1],[659,.1],[784,.1],[1046,.28]],"laundry or the dishwasher"],
  alert:["Alert",[[988,.14],[0,.06],[988,.14],[0,.06],[784,.3]],"the default for warnings"],
  alarm:["Alarm",[[1046,.12],[0,.08],[1046,.12],[0,.08],[1046,.12],[0,.35],[1046,.12],[0,.08],[1046,.12],[0,.08],[1046,.12]],"the default for critical"],
  siren:["Siren",Array.from({length:8},(_,i)=>[i%2?740:1040,.18]),"smoke or CO"],
  beepboop:["Beep boop",[[3968,.15],[0,.3],[2381,.15]],"a door opens, the old Abode chime"],garage:["Garage",[[1480,.15],[0,.15],[1480,.15]],"the garage opens"]};
/* "freq:ms" steps, the chime board's own format: "3968:150,0:300,2381:150". */
const steps=str=>String(str).split(",").map(p=>p.trim().split(":").map(Number)).filter(([f,ms])=>f>=0&&ms>0).slice(0,128).map(([f,ms])=>[f,ms/1000]);
/* An RTTTL tune's head: its name, d= the default length, o= the octave and b= beats a minute (4, 6 and 63 when left out). */
function rtttlHead(str){const [name="",defs=""]=String(str).split(":");let d=4,o=6,b=63;for(const q of defs.split(",")){const [k,v]=q.trim().toLowerCase().split("=");if(k==="d")d=+v||d;if(k==="o")o=+v||o;if(k==="b")b=+v||b;}return {name:name.trim(),d,o,b};}
const NOTE_N={c:0,"c#":1,d:2,"d#":3,e:4,f:5,"f#":6,g:7,"g#":8,a:9,"a#":10,b:11},NOTE_NAMES=Object.keys(NOTE_N);
/* An RTTTL tune's notes as written: each with its pitch in Hz (0 for a rest p), its length in seconds, and how long it sounds (nine tenths of it). */
function rtttlNotes(str){try{const {d,o,b}=rtttlHead(str),notes=String(str).split(":")[2]||"",whole=240/b,out=[];
  for(const raw of notes.split(",")){const t=raw.trim().toLowerCase(),m=t.match(/^(\d+)?([a-gp]#?)(\.?)(\d)?(\.?)$/);if(!m)continue;let dur=whole/(m[1]?+m[1]:d);if(m[3]||m[5])dur*=1.5;
    if(m[2]==="p")out.push({name:t,f:0,d:dur,on:0});else{const oc=m[4]?+m[4]:o;out.push({name:t,note:m[2],oct:oc,f:440*Math.pow(2,(NOTE_N[m[2]]+(oc-4)*12-9)/12),d:dur,on:dur*0.9});}}
  return out;}catch(e){return [];}}
function rtttl(str){const out=[];for(const n of rtttlNotes(str)){if(n.f)out.push([n.f,n.on],[0,n.d-n.on]);else out.push([0,n.d]);}return out.slice(0,128);}
/* A sound's notes on the strip, for the sound editor's preview: the title above, every note in one long line of big letters under it, the one
   sounding (o.at) lit and slid into view, the ones played dimmer. o keeps its own scroll between frames. */
function notesStrip(fb,S,o){const x0=26,w=S.W-x0-3,gap=7,names=(o.notes||[]).map(n=>n==="p"||n==="rest"?"-":String(n).toUpperCase());
  ICONS.music(fb,12,16,S.t,[255,140,190]);marquee(fb,F5,o.title||"",x0,3,w,[130,210,255],S.t);
  const xs=[];let x=0;for(const n of names){xs.push(x);x+=fb.tw(BIG,n)+gap;}const total=Math.max(0,x-gap),at=o.at!=null?o.at:-1;
  const target=at<0||total<=w?0:clamp(xs[at]+fb.tw(BIG,names[at])/2-w/2,0,total-w),dt=o.lt==null?1:clamp(S.t-o.lt,0,0.1);o.lt=S.t;
  o.off=o.off==null?target:o.off+(target-o.off)*Math.min(1,dt*14);
  fb.pushClip(x0,12,w,18);
  names.forEach((n,i)=>{const nx=Math.round(x0+xs[i]-o.off),nw=fb.tw(BIG,n);if(nx>x0+w||nx+nw<x0)return;
    if(i===at){fb.rect(nx-2,13,nw+4,15,[255,190,80],0.22);fb.text(BIG,n,nx,14,[255,205,110]);}else fb.text(BIG,n,nx,14,at>=0&&i<at?[120,125,140]:[215,215,225]);});
  fb.popClip();}
/* Any sound as notes to show and play: an RTTTL tune's as written, anything else its tones, each named for the nearest note. */
const toneName=f=>{if(!f)return {name:"rest"};const m=Math.round(69+12*Math.log2(f/440));return {name:NOTE_NAMES[((m%12)+12)%12]+(Math.floor(m/12)-1),note:NOTE_NAMES[((m%12)+12)%12],oct:Math.floor(m/12)-1};};
function soundNotes(x){if(typeof x==="string"&&SND2[x])x=SND2[x];
  if(x&&typeof x==="object"&&x.rtttl){const one=rtttlNotes(x.rtttl),n=clamp(Math.round(+x.repeat||1),1,10);let out=[];for(let i=0;i<n;i++)out=out.concat(one,i<n-1?[{name:"rest",f:0,d:0.25,on:0}]:[]);return out;}
  const out=[];for(const [f,d] of soundSeq(x)){const last=out[out.length-1];if(!f&&last&&last.f&&last.on===last.d){last.d+=d;continue;}out.push({...toneName(f),f,d,on:f?d:0});}return out;}
const SOUND_OF={};
const soundOf=k=>SOUND_OF[k]||(DEF[k]&&DEF[k].sound)||"none";
/* A sound is a pattern name, "custom" (the form's tune), or a payload object: { "rtttl": "..." }, { "steps": "3968:150,0:300,2381:150" } or { "pattern": "alarm", "repeat": 3 }. */
const SND2={};
const soundSeq=x=>{if(typeof x==="string"&&SND2[x])x=SND2[x];if(x&&typeof x==="object"){const one=x.rtttl?rtttl(x.rtttl):x.steps?steps(x.steps):(SOUNDS[x.pattern]||SOUNDS.none)[1],n=clamp(Math.round(+x.repeat||1),1,10);let out=[];for(let i=0;i<n;i++)out=out.concat(one,i<n-1?[[0,0.25]]:[]);return out;}
  return x==="custom"?rtttl(CUST.rtttl):(SOUNDS[x]||SOUNDS.none)[1];};
function playSeq(seq){if(!seq.length)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();
  let at=AC.currentTime+0.02;for(const [f,d] of seq){if(f){const o=AC.createOscillator(),g=AC.createGain();o.type="square";o.frequency.value=f;g.gain.setValueAtTime(0.0001,at);g.gain.exponentialRampToValueAtTime(0.06,at+0.01);g.gain.exponentialRampToValueAtTime(0.0001,at+d);o.connect(g).connect(AC.destination);o.start(at);o.stop(at+d+0.02);}at+=d;}}catch(e){}}
function beep(name){if(buzzer)playSeq(soundSeq(name));}
/* Which screens a notification ("n") or sensor ("s") may appear on. Critical always shows everywhere. */
const SCR={n:new Map(),s:new Map()};
const INF=1e30;
/* The spec's tier defaults. */
const TIER_D={critical:{takeover:INF,slot:0,tray:INF,repeat:0,rotate:false},warning:{takeover:10,slot:0,tray:INF,repeat:900,rotate:true},alert:{takeover:7,slot:0,tray:30,repeat:0,rotate:false},
  notice:{takeover:0,slot:8,tray:30,repeat:0,rotate:false},advisory:{takeover:0,slot:0,tray:INF,repeat:0,rotate:true},status:{takeover:0,slot:0,tray:0,repeat:0,rotate:true},nudge:{takeover:0,slot:0,tray:INF,repeat:0,rotate:false}};
const secsOr=(v,dflt)=>typeof v==="number"?v:v==="none"?0:v==="until_cleared"?INF:dflt;
function deliveryOf(b){const D=TIER_D[b.tier];return {takeover:secsOr(b.takeover,D.takeover),slot:secsOr(b.slot,D.slot),tray:secsOr(b.tray,D.tray),repeat:secsOr(b.repeat,D.repeat),rotate:b.rotate!==undefined?!!b.rotate:D.rotate,rank:b.rank||0,edge:b.edge};}
/* The catalog's built-in demos, as deliveries. Their repeats are 30 and 45 s here so you can watch them come back. */
function delivery(def){if(def.dl)return def.dl;const D=TIER_D[def.tier],o={...D};
  if(def.tier==="notice"){o.slot=def.slot||8;o.tray=def.keep?INF:def.notray?0:30;o.repeat=def.repeat?NOTICE_REPEAT:0;}
  else if(def.tier==="alert"){o.takeover=def.dur||7;o.tray=def.notray?0:30;}else if(def.tier==="warning")o.repeat=WARN_REPEAT;return o;}
const isCrit=k=>DEF[k]&&DEF[k].tier==="critical";
function scrSet(t,k){if(!SCR[t].has(k))SCR[t].set(k,new Set(t==="n"&&isCrit(k)?SCREENS:SCREENS.filter(s=>!isQuiet(s))));return SCR[t].get(k);}
const allowedOn=(k,scr)=>isCrit(k)||scrSet("n",k).has(scr);
const WARN_REPEAT=45,NOTICE_REPEAT=30;
class Live{
  constructor(){this.score=[0,0];this.lightsUntil=-1;this.wasQuiet=false;this.tv=false;this.playing=true;this.pos=1421;this.cond="rain";this.theme=null;this.themeO={};this.wx=null;this.sys=null;this.net="wifi";this.day=isDaytime(new Date());this.kind=this.cond+(this.day?"-day":"");
    this.mode="demo";this.SN=new Map();this.sOn=null;this.sLast={};this.zPrev={};this.an={};this.seq=0;this.clearAll();}
  syncKind(){this.kind=this.cond+(this.day?"-day":"");}
  addSensor(k){if(!this.SN.has(k)){this.SN.set(k,true);this.sLast[k]=-1e9;}}
  removeSensor(k){this.SN.delete(k);if(this.sOn&&this.sOn.key===k)this.sOn=null;}
  sVis(k){return scrSet("s",k).has(this.screen());}
  /* One rotating sensor on screen at a time; the one waiting longest past its interval goes next. */
  sensorsUpdate(t){if(this.sOn&&(t>=this.sOn.until||!this.SN.has(this.sOn.key)||!this.sVis(this.sOn.key))){this.sLast[this.sOn.key]=t;this.sOn=null;}
    if(this.sOn)return;let best=null;
    for(const k of this.SN.keys()){const c=SCFG[k];if(!this.sVis(k)||t-this.sLast[k]<c.every)continue;if(best===null||this.sLast[k]<this.sLast[best])best=k;}
    if(best!==null)this.sOn={key:best,until:t+SCFG[best].dwell};}
  sState(k,t){const c=SCFG[k];if(this.sOn&&this.sOn.key===k)return `on screen, ${Math.max(0,Math.ceil(this.sOn.until-t))} s`;
    if(!this.sVis(k))return "not shown on "+this.screen();const w=Math.ceil(c.every-(t-this.sLast[k]));return w>0?`next in ${w} s`:"next up";}
  /* The page picks the screen directly. On the display it follows the screens' rules, a notification's screen, or the state topic. */
  screen(){return this.mode;}
  get quiet(){return isQuiet(this.mode);}
  stripOn(){return styleOf(this.mode)==="panel";}
  clearAll(){this.E=new Map();this.queue=[];this.takeQ=[];this.borrow=null;this.take=null;}
  anim(name,v,t){const a=this.an[name];if(!a)return this.an[name]={cur:v,prev:undefined,t0:t};if(a.cur!==v){a.prev=a.cur;a.cur=v;a.t0=t;}return a;}
  /* The notification rules: the same algorithm as the firmware's pb_core.c, so test/parity_test there can compare the two.
     Each entry carries its delivery (e.d): what the message sent, or the tier's defaults. */
  toTray(e,t){if(!(e.d.tray>0)){this.clear(e.k);return;}e.tray=true;e.trayUntil=e.d.tray>=INF?null:t+e.d.tray;}
  set(k,t){{const d0=DEF[k];if(d0&&d0.box&&!d0.fallback&&!LAYOUT_HAS(d0.box))return;}const def=DEF[k];if(k==="goal"){this.score[0]++;if(!this.E.has("match"))this.set("match",t);}if(def.ctl.includes("send"))this.clear(k);else if(this.E.has(k))return;
    const now=Date.now(),e={k,def,d:delivery(def),expires:def.expiresAt||0,card:def.card,added:t,seq:this.seq++,tray:false,trayUntil:null,setMs:now,sinceMs:def.timer?now-300000:now};this.E.set(k,e);this.arrive(e,t);}
  arrive(e,t){const d=e.d,hush=this.quiet&&!allowedOn(e.k,this.mode);
    if(d.rotate||(!(d.takeover>0)&&!(d.slot>0))){if(d.tray>0){e.tray=true;e.trayUntil=d.tray>=INF?null:t+d.tray;}}
    if(d.takeover>0){if(hush)this.toTray(e,t);else if(!this.takeQ.includes(e.k))this.takeQ.push(e.k);}
    else if(d.slot>0){if(hush)this.toTray(e,t);else if(!this.queue.includes(e.k))this.queue.push(e.k);}
    if(!this.E.has(e.k))return;if(d.repeat>0)e.nextRepeat=t+d.repeat;
    {const sn=soundOf(e.k);if(sn!=="none"&&!hush)beep(sn);}}
  remind(k){const e=this.E.get(k);if(!e||!e.def.remind)return;e.card=e.def.remind;if(!this.quiet&&(!this.borrow||this.borrow.key!==k)&&!this.queue.includes(k))this.queue.push(k);}
  clear(k){this.E.delete(k);this.queue=this.queue.filter(x=>x!==k);this.takeQ=this.takeQ.filter(x=>x!==k);if(this.borrow&&this.borrow.key===k)this.borrow=null;if(this.take&&this.take.key===k)this.take=null;}
  update(t){const q=this.quiet;if(Math.floor(t)!==this.tick){this.tick=Math.floor(t);autoScreen();}
    if(this.wasQuiet&&!q)for(const e of this.E.values()){if(e.tray&&e.trayUntil!=null)e.trayUntil=Math.max(e.trayUntil,t+30);
      if(e.d.takeover>0&&e.d.repeat>0&&!this.takeQ.includes(e.k)&&!(this.take&&this.take.key===e.k)){this.takeQ.push(e.k);e.nextRepeat=t+e.d.repeat;}}
    this.wasQuiet=q;
    for(const [k,e] of [...this.E]){if(e.expires&&Date.now()>=e.expires)this.clear(k);else if(!q&&e.tray&&e.trayUntil!=null&&t>=e.trayUntil)this.clear(k);}
    if(q){const ok=k=>allowedOn(k,this.mode),mv=k=>{const e=this.E.get(k);if(e)this.toTray(e,t);};
      this.queue=this.queue.filter(k=>ok(k)||(mv(k),false));this.takeQ=this.takeQ.filter(k=>ok(k)||(mv(k),false));
      if(this.borrow&&!ok(this.borrow.key)){const k=this.borrow.key;this.borrow=null;mv(k);}
      if(this.take&&this.take.tier!=="critical"&&!ok(this.take.key)){const e=this.E.get(this.take.key);this.take=null;if(e&&!e.tray)this.toTray(e,t);}}
    if(this.borrow&&t>=this.borrow.until){const e=this.E.get(this.borrow.key);this.borrow=null;if(e)this.toTray(e,t);}
    for(const e of [...this.E.values()]){if(!(e.d.repeat>0)||t<e.nextRepeat)continue;e.nextRepeat=t+e.d.repeat;
      if((q&&!allowedOn(e.k,this.mode))||(this.borrow&&this.borrow.key===e.k)||(this.take&&this.take.key===e.k))continue;
      if(e.d.takeover>0){if(!this.takeQ.includes(e.k))this.takeQ.push(e.k);}else if(e.d.slot>0&&!this.queue.includes(e.k))this.queue.push(e.k);}
    while(!this.borrow&&this.queue.length){const k=this.queue.shift(),e=this.E.get(k);if(e)this.borrow={key:k,until:t+e.d.slot};}
    const crit=[...this.E.values()].filter(e=>e.def.tier==="critical").sort((a,b)=>b.seq-a.seq)[0];
    if(this.take&&this.take.tier!=="critical"&&(crit||t>=this.take.until)){const e=this.E.get(this.take.key);this.take=null;if(e&&!e.tray)this.toTray(e,t);}
    if(this.take&&this.take.tier==="critical"&&(!crit||crit.k!==this.take.key))this.take=null;
    if(!this.take){if(crit)this.take={key:crit.k,tier:"critical",until:INF};else while(this.takeQ.length){const k=this.takeQ.shift(),e=this.E.get(k);if(e){this.take={key:k,tier:e.def.tier,until:e.d.takeover>=INF?INF:t+e.d.takeover};break;}}}}
  state(k,t){const e=this.E.get(k);if(!e)return null;if(this.take&&this.take.key===k)return "full strip";if(this.borrow&&this.borrow.key===k)return "in a slot";if(this.queue.includes(k)||this.takeQ.includes(k))return "queued";
    const tier=e.def.tier;if(tier==="warning")return this.quiet?"tray, pops up when the house wakes":"rotation, red bar, tray";if(tier==="status")return this.quiet?"hidden, house asleep":"in the rotation";if(tier==="advisory")return this.quiet?"tray":"rotation and tray";if(tier==="critical")return "full strip";
    if(e.tray&&e.d.repeat>0&&e.nextRepeat)return `tray, back in ${Math.max(0,Math.ceil(e.nextRepeat-t))} s`;
    if(e.tray)return e.trayUntil!=null?`tray, ${Math.max(0,Math.ceil(e.trayUntil-t))} s`:"tray until cleared";return "waiting";}
  /* What wants a zone on a given screen, each with the kind of zone it needs and a rank. */
  events(scr){const out=[],ok=k=>allowedOn(k,scr);
    for(const e of this.E.values()){const tr=e.def.tier;if(!ok(e.k))continue;if(!e.d.rotate||tr==="critical")continue;const bx={box:e.def.box,fb:e.def.fallback},r=(e.d.rank||0)/1000;
      if(tr==="advisory"||tr==="warning")out.push({k:"adv:"+e.def.adv,cat:"alerts",p:(tr==="warning"?65:60)+r,...bx});else out.push({k:e.card,cat:tr==="status"?"status":tr==="notice"?"notices":"alerts",p:(tr==="status"?38:40)+r,...bx});}
    if(this.borrow){const e=this.E.get(this.borrow.key);if(e&&ok(e.k))out.push({k:e.card,cat:"notices",p:80,box:e.def.box,fb:e.def.fallback});}
    return out;}
  /* Each zone keeps what it had if it still can; new events go to the rightmost free zone that takes their kind, and every other zone shows its own modules in turn. */
  frame(id,t){this.t=t;const P=id+":",cur=this.screen(),Z={};
    for(const scr of SCREENS){const Zs=zonesOf(scr,id),prev=this.zPrev[P+scr]||[],out=new Array(Zs.length).fill(null);
      for(const e of this.events(scr).sort((a,b)=>b.p-a.p)){const named=e.box&&Zs.some(zn=>zn.box===e.box),fits=i=>Zs[i]&&(named?Zs[i].box===e.box:Zs[i].take.includes(e.cat));if(e.box&&!named&&!e.fb)continue;
        let z=prev.indexOf(e.k);if(z<0||out[z]||!fits(z)){z=-1;for(let i=Zs.length-1;i>=0;i--)if(!out[i]&&fits(i)){z=i;break;}}if(z>=0)out[z]=e.k;}
      Zs.forEach((zn,i)=>{if(out[i])return;if(zn.box){out[i]=boxPick(zn.box,t,i);return;}const av=zn.show.filter(m=>modOk(m,this));out[i]=av.length?av[Math.floor(t/zn.every+i*0.5)%av.length]:null;});
      this.zPrev[P+scr]=out;Z[scr]=out.map((k,i)=>this.anim(P+scr+i,k,t));}
    const vals=[...this.E.values()];
    const tray=vals.filter(e=>e.tray&&!(this.quiet&&e.def.tier==="nudge")).sort((a,b)=>a.added-b.added).map(e=>e.def.tier==="advisory"||e.def.tier==="warning"?"adv:"+ADVS[e.def.adv].sev:(e.def.tray||"dot")).join(",");
    const sevs=vals.filter(e=>(e.def.tier==="advisory"||e.def.tier==="warning")&&e.d.rotate&&e.d.edge!==false).map(e=>ADVS[e.def.adv].sev),advSev=sevs.includes("warn")?"warn":sevs.includes("watch")?"watch":sevs.includes("adv")?"adv":null;
    const full=this.take&&this.E.get(this.take.key)&&allowedOn(this.take.key,cur)?this.E.get(this.take.key).def.full:null;
    return {Z,tray:this.anim(P+"tray",tray,t),adv:this.anim(P+"adv",advSev,t),kind:this.anim(P+"kind",this.kind,t),mode:this.anim(P+"mode",cur,t),full:this.anim(P+"full",full,t)};}
  opened(){const e=this.E.get("garage");return new Date(e?e.sinceMs:Date.now()-300000);}
  pkgAt(){const e=this.E.get("pkg");return new Date(e?e.setMs:Date.now());}
}
/* Sentence case for payloads, keeping acronyms and anything that mixes letters and digits (CO2, TSX, UV) in capitals. */
const KEEPUP=/^[(]?((?=[A-Z]*\d)(?=\d*[A-Z])[A-Z0-9.]+|TV|UV|TSX|EV|AC|HVAC|CO|PM|RH|ETA|HA)[),.:;!?]*$/;
/* Title case for place names: a capital after a space, hyphen, slash or bracket ("Times Sq-42 St", "Dublin/Pleasanton"). */
const capT=s=>s&&fmtT(s).split(" ").map(t=>KEEPUP.test(t)?t:t.toLowerCase().replace(/(^|[-/(])([a-z])/g,(m,a,b)=>a+b.toUpperCase())).join(" ");
const cap1=s=>{if(!s)return s;s=fmtT(s);const w=s.split(" ").map(t=>KEEPUP.test(t)?t:t.toLowerCase()).join(" ");return w.charAt(0).toUpperCase()+w.slice(1);};
function isoT(d){const o=-d.getTimezoneOffset(),sg=o>=0?"+":"-";return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate())+"T"+p2(d.getHours())+":"+p2(d.getMinutes())+":00"+sg+p2(Math.floor(Math.abs(o)/60))+":"+p2(Math.abs(o)%60);}
/* The catalog's payloads are written flat; v2 keeps delivery on the message and puts everything drawn in the card. */
const DELIVERY=["tier","box","fallback","rank","takeover","slot","rotate","tray","edge","repeat","renotify","screens","sound","since","until","expires"];
const SENSOR_CARD={today:{card:"temperature",data:"outside_temperature"},forecast:{card:"forecast",data:"forecast_hourly"},daily:{card:"forecast",data:"forecast_daily",period:"daily"},inside:{card:"climate",data:"inside",label:"Inside"}};
function v2Notify(b){const o={v:2},c={};for(const [k,v] of Object.entries(b)){if(k==="v"||k==="key"||v===undefined)continue;if(DELIVERY.includes(k))o[k]=v;else c[k]=v;}
  if(c.animation){const a={card:"animation",name:c.animation};delete c.animation;if(c.sensors){a.cards=c.sensors.map(k=>SENSOR_CARD[k]||{card:"value",data:k});delete c.sensors;}
    if(o.until&&a.name==="countdown"){a.until=o.until;delete o.until;}o.card=Object.assign(a,c);}
  else{if(c.font){if(c.big)c.big=Object.assign({},c.big,{font:c.font});delete c.font;}o.card=Object.assign({card:"text"},c);}return o;}
function payloadFor(k,act){const def=DEF[k],key=def.key||k,topic="pixelbar/all/notify/"+key,ongoing=def.ctl.includes("clear");
  if(act==="clear")return {topic,note:"Empty payload, retained. Clears it on every display and deletes it from the broker.",body:""};
  const now=new Date(),S={now,t:0,opened:new Date(now.getTime()-300000),pkgAt:now},b={v:1,key,tier:def.tier,icon:def.icon},tc=s=>def.raw?s:cap1(s);
  if(def.pay)Object.assign(b,def.pay({score:live.score[0]?live.score:[1,0]}));
  else if(def.adv){const a=ADVS[def.adv];Object.assign(b,{title:cap1(a.t),message:cap1(a.l1),detail:cap1(a.l2)});}
  else{const o=CARDS[act==="remind"?def.remind:def.card](S);Object.assign(b,{title:tc(o.title),message:tc(o.l2),detail:tc(o.l3)});if(o.big)b.big={value:o.big,unit:(o.unit||"").toLowerCase()};}
  if(def.timer){b.message=act==="remind"?"Still open":"Open {elapsed_min} min";b.detail="Since {since_time}";b.big={value:"{elapsed_min}",unit:"min"};b.since=isoT(new Date(now.getTime()-300000));}
  if(def.keep&&def.tier==="notice")b.tray="until_cleared";if(def.notray&&def.tier==="notice")b.tray="none";if(def.repeat&&def.tier==="notice")b.repeat=900;if(def.slot)b.slot=def.slot;if(act==="remind")b.renotify=true;if(def.tier==="warning")b.repeat=900;
  {const sn=soundOf(k);if(sn==="custom")b.sound={rtttl:CUST.rtttl};else if(sn!=="none")b.sound=sn;}
  b.screens=isCrit(k)?[...SCREENS]:SCREENS.filter(x=>scrSet("n",k).has(x));
  if(ongoing)b.expires=isoT(new Date(now.getTime()+12*3600000));
  /* A clock time baked into the words is stale the moment it's copied: say it with {since_time}, and give since the moment it stands for. */
  for(const f of ["message","detail"])if(typeof b[f]==="string"&&!b.since){const m=/\b(at|since) (\d{1,2}):(\d{2})\b/i.exec(b[f]);
    if(m){const d=new Date(now);d.setHours(+m[2],+m[3],0,0);if(d>now)d.setDate(d.getDate()-1);b.since=isoT(d);b[f]=b[f].replace(m[0],m[1]+" {since_time}");}}
  return {topic,note:ongoing?"Retained, so a display that reboots gets it back.":"Not retained, so a reboot never replays it.",body:JSON.stringify(v2Notify(b),null,2)};}

/* ---------- cards built from Home Assistant entities ---------- */
/* How far along a card's progress is, 0 to 1, moving on its own while it's playing; null without one. */
function progFrac(p){if(!p||!(+p.max>0))return null;const run=p.playing&&p.updated?Math.max(0,(Date.now()-Date.parse(p.updated))/1000):0;return clamp(((+p.value||0)+(isFinite(run)?run:0))/+p.max,0,1);}
function thinBar(fb,x,y,w,f,c){if(f==null||w<4)return;fb.rect(x,y,w,2,[40,44,58]);fb.rect(x,y,Math.round(w*f),2,pc("bar",c));}
/* A big number with its unit under it, right-aligned at xr; gives back its left edge. */
/* How wide bigNum draws a value in a font, without drawing it. */
function bigW(fb,font,str){if(font==="flip")return flipW(str);if(font==="nixie")return nixieW(str);if(font==="segment")return segW(str);
  const F=TITLE_FONTS[font];if(F)return fb.tw(F,fitText(str,F,false),font==="retro64"||font==="comicoro"?2:1);return fb.tw(BIG,str);}
function bigAt(fb,o,xr,y,col,key,t){const bw=bigNum(fb,o.font||"pixel",o.big,xr,y,pc("value",col),key,t),bx=xr-bw;if(o.unit)fb.text(F3,o.unit,bx+Math.round((bw-fb.tw(F3,o.unit))/2),y+17,pc("unit",[150,145,140]));return bx;}
/* A big value on a line of its own, its top at y, scrolling when it's wider than w. */
function bigLine(fb,bf,str,x,y,w,col,key,t){const bw=bigW(fb,bf,str),off={retro64:2,comicoro:2,space:1,alagard:1,celtic:1,flip:1,nixie:1,segment:1}[bf]||0;
  if(bw<=w){bigNum(fb,bf,str,x+bw,y+off,col,key,t);return;}
  const gap=24,o=(t*16)%(bw+gap);fb.pushClip(x,y-1,w,40);for(const lx of [x-o,x-o+bw+gap])if(lx<x+w)bigNum(fb,bf,str,lx+bw,y+off,col,key,t);fb.popClip();}
/* How tall a big value draws in a font. */
const bigH=f=>{const F=TITLE_FONTS[f];return F?F.h*(f==="retro64"||f==="comicoro"?2:1):f==="flip"||f==="nixie"?16:13;};
function noticeCard(fb,x,y,w,h,S,o){const pic=o.img&&IMGS[o.img],tx=pic?x+33:x+24;if(pic)drawImg(fb,o.img,x+2,y+2);else iconHalo(fb,f=>o.icon(f,x+12,y+16,S.t),x+1,y+5,23,23);
  let right=x+w-3;
  // big at top: the value across the card, then the title and the small print under it, as far as they fit.
  if(o.big&&o.btop){const bf=o.font||o.tfont||"pixel",aw=x+w-3-tx,TF=titleFont(o.tfont)||F5,bh=bigH(bf);
    // As many lines as fit, centred: the big value, then the title, then the small print.
    let tot=bh;if(o.title&&tot+1+TF.h<=h)tot+=1+TF.h;if(o.title&&o.l2&&tot+1+5<=h)tot+=6;let ty=y+Math.max(0,Math.floor((h-tot)/2));
    bigLine(fb,bf,o.big,tx,ty,aw,pc("value",mix(o.col,[255,255,255],0.25)),o.fkey||"c:"+o.title+":"+x,S.t);ty+=bh+1;
    if(o.title&&ty+TF.h<=y+h){marquee(fb,TF,o.title,tx,ty,aw,pc("title",o.col),S.t);ty+=TF.h+1;}
    if(o.l2&&ty+5<=y+h){marquee(fb,F3,o.l2,tx,ty,aw,pc("text",[205,200,192]),S.t+0.6);ty+=6;}
    if(o.l3&&ty+5<=y+h)marquee(fb,F3,o.l3,tx,ty,aw,pc("detail",[150,145,140]),S.t+1.2);return;}
  // A big value too wide for the card takes all of it and scrolls.
  const bf=o.font||o.tfont||"pixel",room=x+w-5-tx,bw=o.big&&w>=120?bigW(fb,bf,o.big):0;
  if(bw>room){const gap=24,off=(S.t*16)%(bw+gap),bc=mix(o.col,[255,255,255],0.25);fb.pushClip(tx,y,room,h);
    for(const lx of [tx-off,tx-off+bw+gap])if(lx<tx+room)bigNum(fb,bf,o.big,lx+bw,y+3,pc("value",bc),o.fkey||"c:"+o.title+":"+x,S.t);fb.popClip();right=tx;}
  else if(o.big&&w>=120)right=bigAt(fb,{...o,font:bf},x+w-5,y+3,mix(o.col,[255,255,255],0.25),o.fkey||"c:"+o.title+":"+x,S.t)-5;
  else if(o.img2&&IMGS[o.img2]&&w>=150){drawImg(fb,o.img2,x+w-30,y+2,0.9);right=x+w-33;}
  const aw=Math.max(8,right-tx),TF=titleFont(o.tfont);
  // A tall title face (Space) takes the card, with the message in small print under it when there's room.
  if(TF){const ty=y+(TF.h>13?2:4);marquee(fb,TF,o.title,tx,ty,aw,pc("title",o.col),S.t);if(o.l2&&ty+TF.h+6<=y+h)marquee(fb,F3,o.l2,tx,ty+TF.h+1,aw,pc("text",[205,200,192]),S.t+0.6);
    if(o.l3&&ty+TF.h+13<=y+h)marquee(fb,F3,o.l3,tx,ty+TF.h+8,aw,pc("detail",[150,145,140]),S.t+1.2);}
  else{marquee(fb,F5,o.title,tx,y+4,aw,pc("title",o.col),S.t);
  if(o.l2)marquee(fb,F3,o.l2,tx,y+13,aw,pc("text",[205,200,192]),S.t+0.6);if(o.l3)marquee(fb,F3,o.l3,tx,y+20,aw,pc("detail",[150,145,140]),S.t+1.2);}
  thinBar(fb,tx,y+h-4,x+w-3-tx,o.prog,o.col);}
const elapsedMin=(S,min)=>String(Math.max(min,Math.floor((S.now.getTime()-S.opened.getTime())/60000)));
const CARDS={
  doorbell:S=>({icon:(fb,cx,cy,t)=>bell(fb,cx,cy+2,0.8,t),col:[255,210,120],title:"FRONT DOOR",l2:"DOORBELL",l3:"AT "+hm(S.now)}),
  garage5:S=>({icon:garageIcon,col:GARAGE,title:"GARAGE",l2:"OPEN "+elapsedMin(S,5)+" MIN",l3:"SINCE "+hm(S.opened),big:elapsedMin(S,5),unit:"MIN"}),
  garage10:S=>({icon:garageIcon,col:GARAGE,title:"GARAGE",l2:"STILL OPEN",l3:"SINCE "+hm(S.opened),big:elapsedMin(S,10),unit:"MIN"}),
  pkg:S=>({icon:(fb,cx,cy)=>isoBox(fb,cx,cy,16),col:[255,200,110],title:"PACKAGE",l2:"FRONT PORCH",l3:"LEFT AT "+hm(S.pkgAt||S.now)}),
  backdoor:S=>({icon:doorIcon,col:GARAGE,title:"BACK DOOR",l2:"OPEN 5 MIN",l3:"SINCE "+hm(new Date(S.now.getTime()-300000)),big:"5",unit:"MIN"}),
  backdoor10:S=>({icon:doorIcon,col:GARAGE,title:"BACK DOOR",l2:"STILL OPEN",l3:"SINCE "+hm(new Date(S.now.getTime()-600000)),big:"10",unit:"MIN"}),
  unlocked:S=>({icon:(fb,cx,cy)=>lockIcon(fb,cx,cy,[255,120,90],true),col:[255,130,100],title:"FRONT DOOR",l2:"UNLOCKED",l3:"ALARM IS ARMED"}),
  freezer:S=>({icon:freezerIcon,col:[120,210,255],title:"FREEZER",l2:"GARAGE AT -9°",l3:"NORMALLY -19°"}),
  sally:S=>({icon:snakeIcon,col:[140,230,120],title:"SALLY",l2:"HUMIDITY 38%",l3:"CHECK THE HUMIDIFIER"}),
  plant:S=>({icon:plantIcon,col:[120,220,140],title:"GINGER",l2:"NEEDS WATER",l3:"MOISTURE 18%"}),
  lightning:S=>({icon:boltIcon,col:[255,220,90],title:"LIGHTNING",l2:"6 KM AWAY",l3:"3 STRIKES, TEMPEST",big:"6",unit:"KM"}),
  alarm:S=>({icon:shieldIcon,col:[110,200,255],title:"ALARM",l2:"ARMED AWAY",l3:"AT "+hm(S.now)}),
  onair:S=>({icon:liveIcon,col:[255,70,80],title:"ON AIR",l2:"LIVE ON TWITCH",l3:"SINCE @19:02"}),
  follower:S=>({icon:twitchIcon,col:TW,title:"NEW FOLLOWER",l2:"PIXELPAL_42",l3:"12 TODAY"}),
  bits:S=>({icon:gemIcon,col:[180,110,255],title:"CHEER",l2:"PIXELPAL_42",l3:"LETS GOOO",big:"500",unit:"BITS"}),
  tip:S=>({icon:kofiIcon,col:[41,171,224],title:"KO-FI TIP",l2:"FROM ADALÉA",l3:"FOR THE SUSHI FUND",big:"5",unit:"CAD"}),
  superchat:S=>({icon:youtubeIcon,col:[255,200,60],title:"SUPER CHAT",l2:"ADALÉA: LOVE THE NEW BOARD",l3:"PINNED FOR 2 MIN",big:"10",unit:"CAD"}),
  ytmember:S=>({icon:youtubeIcon,col:[60,200,120],title:"NEW MEMBER",l2:"PIXELPAL_42",l3:"WELCOME TO THE CREW"}),
  upload:S=>({icon:youtubeIcon,col:YT,title:"NEW VIDEO IS UP",l2:"I BUILT AN LED STATUS BAR",l3:"PUBLIC AT @18:00"}),
  hype:S=>({icon:twitchIcon,col:TW,title:"HYPE TRAIN",l2:"LEVEL 3, 64% TO 4",l3:"ENDS IN 3:12",big:"3",unit:"LVL"}),
  recycling:S=>({icon:recyclingIcon,col:[110,175,250],title:"RECYCLING",l2:"BLUE BOX OUT TONIGHT",l3:"PICKUP TOMORROW @07:00"}),
  garbage:S=>({icon:binsIcon,col:[130,210,140],title:"GARBAGE",l2:"AND GREEN BIN TONIGHT",l3:"PICKUP TOMORROW @07:00"}),
  frontopen:S=>({icon:doorIcon,col:[255,190,110],title:"FRONT DOOR",l2:"OPENED",l3:"AT "+hm(S.now)}),
  frontclosed:S=>({icon:doorClosedIcon,col:[140,215,160],title:"FRONT DOOR",l2:"CLOSED",l3:"AT "+hm(S.now)}),
  car:S=>({icon:carIcon,col:[130,210,255],title:"CAR ARRIVED",l2:"IN THE GARAGE",l3:"AT "+hm(S.now)}),
  homelab:S=>({icon:rackIcon,col:[190,165,255],title:"HOMELAB",l2:"TALOS-WK-02 DOWN",l3:"SINCE "+hm(new Date(S.now.getTime()-6*60000))}),
  nap:S=>({icon:napIcon,col:[180,160,255],title:"NAP TIME",l2:"ASLEEP 42 MIN",l3:"DOORBELL IS MUTED"}),
  nursery:S=>({icon:thermoIcon,col:[255,150,90],title:"NURSERY",l2:"TOO WARM, 25°",l3:"SINCE "+hm(new Date(S.now.getTime()-12*60000))}),
  cry:S=>({icon:waveIcon,col:[255,140,170],title:"NURSERY",l2:"CRYING DETECTED",l3:"AT "+hm(S.now)}),
  tvtime:S=>({icon:tvIcon,col:[120,200,255],title:"TV TIME",l2:"12 MIN LEFT",l3:"THEN BATH TIME",big:"12",unit:"MIN"}),
  bedtime:S=>({icon:napIcon,col:[180,160,255],title:"BEDTIME",l2:"IN 15 MINUTES",l3:"PYJAMAS AND TEETH",big:"15",unit:"MIN"}),
  kidhome:S=>({icon:keyIcon,col:[130,230,160],title:"ADALÉA IS HOME",l2:"USED THE DOOR CODE",l3:"AT "+hm(S.now)}),
  gate:S=>({icon:gateIcon,col:GARAGE,title:"BACK GATE",l2:"OPEN 2 MIN",l3:"YARD SIDE",big:"2",unit:"MIN"}),
  gate10:S=>({icon:gateIcon,col:GARAGE,title:"BACK GATE",l2:"STILL OPEN",l3:"YARD SIDE",big:"4",unit:"MIN"})
};

function garageIcon(fb,cx,cy){fb.poly([[cx-9,cy-2],[cx,cy-9],[cx+9,cy-2]],GARAGE);fb.rect(cx-7,cy-2,14,10,[46,28,14]);fb.frame(cx-7,cy-2,cx+6,cy+7,GARAGE);fb.rect(cx-5,cy,11,1,GARAGE);fb.rect(cx-5,cy+2,11,1,GARAGE,0.8);}
function doorIcon(fb,cx,cy){fb.frame(cx-6,cy-8,cx+5,cy+8,[150,110,70]);fb.poly([[cx-6,cy-8],[cx+1,cy-6],[cx+1,cy+10],[cx-6,cy+8]],[210,125,55]);fb.px(cx-1,cy+1,[255,220,150]);}
function lockIcon(fb,cx,cy,c,open){fb.pushClip(cx-11,cy-10,22,9);fb.ring(cx+(open?5:0),cy-2,4.2,1.8,[205,210,220]);fb.popClip();fb.rect(cx-6,cy-1,12,9,c);fb.px(cx,cy+2,[0,0,0]);fb.px(cx,cy+3,[0,0,0]);}
function flake(fb,cx,cy,r,c){for(let k=0;k<3;k++){const a=k*Math.PI/3,dx=Math.cos(a)*r,dy=Math.sin(a)*r;fb.line(cx-dx,cy-dy,cx+dx,cy+dy,c);
  for(const sgn of [1,-1]){const bx=cx+sgn*dx*0.6,by=cy+sgn*dy*0.6;fb.line(bx,by,bx+Math.cos(a+sgn*0+0.8)*r*0.35*sgn,by+Math.sin(a+0.8)*r*0.35*sgn,c,0.8);fb.line(bx,by,bx+Math.cos(a-0.8)*r*0.35*sgn,by+Math.sin(a-0.8)*r*0.35*sgn,c,0.8);}}}
function freezerIcon(fb,cx,cy,t){flake(fb,cx-2,cy,7,[140,215,255]);const a=0.6+0.4*Math.sin(t*3);fb.poly([[cx+7,cy-8],[cx+10,cy-4],[cx+4,cy-4]],[255,90,70],a);fb.rect(cx+6,cy-4,2,6,[255,90,70],a);}
function snakeIcon(fb,cx,cy,t){let yy=cy;for(let i=0;i<18;i++){yy=cy+2+Math.sin(i*0.6-t*2)*3;fb.disc(cx-9+i,yy,1.3,mix([80,190,90],[190,240,120],i/17));}
  fb.disc(cx+9,yy,2.2,[190,240,120]);if((t%1.2)<0.35){fb.px(cx+11,yy,[255,80,80]);fb.px(cx+12,yy-1,[255,80,80]);}}
function napIcon(fb,cx,cy,t){fb.disc(cx-2,cy+1,5.5,[222,212,255]);fb.disc(cx+0.8,cy-1.6,4.8,[0,0,0]);fb.text(F3,"Z",cx+4,cy-9,[190,170,255],1,0.45+0.45*Math.sin(t*2));}
function thermoIcon(fb,cx,cy){fb.rect(cx-1,cy-8,3,11,[225,228,238]);fb.disc(cx+0.5,cy+5,3.2,[255,110,70]);fb.rect(cx,cy-4,1,9,[255,110,70]);}
function waveIcon(fb,cx,cy,t){fb.disc(cx-4,cy,4,[255,210,180]);fb.px(cx-5,cy-1,[60,40,40]);fb.px(cx-3,cy-1,[60,40,40]);fb.pushClip(cx+1,cy-10,12,20);
  for(let k=0;k<3;k++){const r=3+k*3+((t*6)%3);fb.ring(cx-2,cy,r,1,[255,140,170],clamp(1-r/12,0,1));}fb.popClip();}
function tvIcon(fb,cx,cy){fb.rect(cx-7,cy-5,15,10,[36,54,92]);fb.frame(cx-8,cy-6,cx+8,cy+5,[160,170,190]);fb.rect(cx-6,cy+2,5,1,[120,200,255]);fb.rect(cx-1,cy+2,8,1,[70,80,100]);fb.rect(cx-3,cy+7,7,1,[160,170,190]);}
function keyIcon(fb,cx,cy){fb.ring(cx-4,cy,3.2,1.6,[255,210,90]);fb.rect(cx-1,cy-1,9,2,[255,210,90]);fb.rect(cx+5,cy+1,1,3,[255,210,90]);fb.rect(cx+7,cy+1,1,2,[255,210,90]);}
function gateIcon(fb,cx,cy){fb.rect(cx-9,cy-7,2,15,GARAGE);fb.rect(cx+7,cy-7,2,15,GARAGE);fb.rect(cx-7,cy-3,8,1,GARAGE);fb.rect(cx-7,cy+4,8,1,GARAGE);for(let k=0;k<3;k++)fb.rect(cx-6+k*3,cy-5,1,11,GARAGE,0.85);}
function plantIcon(fb,cx,cy,t){fb.poly([[cx-5,cy+1],[cx+5,cy+1],[cx+4,cy+8],[cx-4,cy+8]],[200,110,70]);fb.rect(cx-6,cy,12,2,[225,135,88]);fb.line(cx,cy,cx,cy-5,[110,190,100]);
  fb.disc(cx-3.5,cy-5,3,[100,200,110]);fb.disc(cx+3.5,cy-3,2.8,[130,180,90]);const ph=(t*0.8)%1;fb.px(cx+8,cy-8+ph*12,[110,170,255],1-ph);}
function boltIcon(fb,cx,cy,t){const a=(t%2)<0.12?1:0.75;fb.poly([[cx+2,cy-9],[cx-5,cy+1],[cx-1,cy+1],[cx-3,cy+9],[cx+5,cy-2],[cx+1,cy-2],[cx+4,cy-9]],[255,225,90],a);}
function stripesIcon(fb,cx,cy){for(let x=-7;x<7;x++){const c=((x+7)>>1)%2?[18,18,18]:[240,240,240];for(let y=-7;y<7;y++)fb.px(cx+x,cy+y,c);}fb.frame(cx-8,cy-8,cx+7,cy+7,[120,120,130]);}
function shieldIcon(fb,cx,cy){fb.poly([[cx-7,cy-8],[cx+7,cy-8],[cx+7,cy],[cx,cy+8],[cx-7,cy]],[70,150,230]);fb.line(cx-4,cy-1,cx-1,cy+2,[255,255,255]);fb.line(cx-1,cy+2,cx+4,cy-4,[255,255,255]);}
function carIcon(fb,cx,cy){fb.poly([[cx-10,cy+3],[cx-10,cy-1],[cx-5,cy-2],[cx-2,cy-6],[cx+4,cy-6],[cx+7,cy-2],[cx+10,cy-1],[cx+10,cy+3]],[110,180,240]);
  fb.rect(cx-1,cy-5,4,3,[30,50,80]);fb.rect(cx+4,cy-4,2,2,[30,50,80]);for(const wx of [-5,5]){fb.disc(cx+wx,cy+4,2.4,[36,36,44]);fb.px(cx+wx,cy+4,[160,160,170]);}}
function rackIcon(fb,cx,cy,t){fb.frame(cx-6,cy-8,cx+6,cy+8,[150,140,190]);for(let k=0;k<4;k++){fb.rect(cx-4,cy-6+k*4,6,2,[70,60,100]);fb.px(cx+4,cy-6+k*4,k===1?((t%1)<0.5?[255,60,60]:[80,20,20]):[80,230,120]);}}
function iconMoon(fb,x,y,s,t){fb.disc(x+s*0.45,y+s*0.48,s*0.3,[250,238,190]);fb.disc(x+s*0.58,y+s*0.38,s*0.26,[0,0,0]);fb.px(x+s*0.85,y+s*0.2,[255,255,255],0.5+0.5*Math.sin(t*2));fb.px(x+s*0.2,y+s*0.85,[255,255,255],0.5+0.5*Math.sin(t*2+2));}

/* ---------- sensors: readings Home Assistant keeps current, shown in turn with the built-in cards ---------- */
function washerIcon(fb,cx,cy,t){fb.frame(cx-7,cy-8,cx+7,cy+8,[190,200,215]);fb.rect(cx-6,cy-7,13,2,[90,100,120]);fb.ring(cx,cy+2,4.2,1.4,[190,200,215]);const a=t*6;
  for(const o of [0,Math.PI])fb.px(cx+Math.cos(a+o)*2.2,cy+2+Math.sin(a+o)*2.2,[110,190,255]);}
function co2Icon(fb,cx,cy,t){for(let k=0;k<3;k++){const ph=(t*0.5+k/3)%1;fb.ring(cx-4+k*4,cy+4-ph*12,1.6+ph*1.4,1,[160,200,230],1-ph);}}
function homeIcon(fb,cx,cy){fb.poly([[cx-8,cy-1],[cx,cy-8],[cx+8,cy-1]],[255,190,110]);fb.rect(cx-6,cy-1,12,9,[255,190,110]);fb.rect(cx-1,cy+3,3,5,[60,40,20]);}
function sunIcon(fb,cx,cy,t){sun(fb,cx,cy,3.6,t);}
/* ---------- streaming and socials: platform and event icons, the going-live and raid animations ---------- */
const TW=[145,70,255],YT=[255,30,40];
function twitchIcon(fb,cx,cy){fb.poly([[cx-7,cy-8],[cx+8,cy-8],[cx+8,cy+3],[cx+3,cy+8],[cx-1,cy+8],[cx-4,cy+11],[cx-4,cy+8],[cx-7,cy+8]],TW);fb.rect(cx-5,cy-6,11,10,[255,255,255]);fb.rect(cx-1,cy-4,2,5,TW);fb.rect(cx+3,cy-4,2,5,TW);fb.poly([[cx+6,cy+3],[cx+6,cy+4],[cx+2,cy+8],[cx+2,cy+4]],TW);}
function youtubeIcon(fb,cx,cy){fb.rect(cx-9,cy-5,19,12,YT);fb.rect(cx-8,cy-6,17,14,YT);fb.poly([[cx-2,cy-3],[cx-2,cy+5],[cx+4.5,cy+1]],[255,255,255]);}
function instaIcon(fb,cx,cy){const g=(X,Y)=>mix(mix([255,190,60],[240,40,120],clamp((X-cx+8)/16,0,1)),[140,60,220],clamp((cy+8-Y)/-16+0.3,0,1)*0.6);
  fb.rect(cx-6,cy-8,13,2,g);fb.rect(cx-6,cy+7,13,2,g);fb.rect(cx-8,cy-6,2,13,g);fb.rect(cx+7,cy-6,2,13,g);for(const [dx,dy] of [[-7,-7],[7,-7],[-7,7],[7,7]])fb.px(cx+dx,cy+dy,g);fb.ring(cx+.5,cy+.5,3.6,1.6,g);fb.disc(cx+4.6,cy-4.2,1.1,g);}
function tiktokIcon(fb,cx,cy){const d=(ox,oy,c)=>{fb.rect(cx+ox,cy-8+oy,2,13,c);fb.disc(cx-2.5+ox,cy+4.5+oy,3.2,c);fb.poly([[cx+2+ox,cy-8+oy],[cx+7+ox,cy-4+oy],[cx+7+ox,cy-1.5+oy],[cx+2+ox,cy-4.5+oy]],c);};d(-1,-1,[40,240,240]);d(1,1,[255,40,90]);d(0,0,[250,250,250]);}
function blueskyIcon(fb,cx,cy){const c=[32,139,254];fb.poly([[cx+.5,cy+1],[cx-2.5,cy-5],[cx-8,cy-8],[cx-9,cy-3],[cx-6.5,cy+1.5]],c);fb.poly([[cx+.5,cy+1],[cx+3.5,cy-5],[cx+9,cy-8],[cx+10,cy-3],[cx+7.5,cy+1.5]],c);fb.disc(cx-3.5,cy+4.5,3,c);fb.disc(cx+4.5,cy+4.5,3,c);}
function mastodonIcon(fb,cx,cy){const c=(X,Y)=>mix([110,110,255],[86,58,204],clamp((Y-cy+8)/16,0,1)),w=[255,255,255];fb.rect(cx-6,cy-8,13,15,c);fb.rect(cx-8,cy-6,17,11,c);for(const [dx,dy] of [[-6,-6],[6,-6],[-6,4],[6,4]])fb.disc(cx+dx+.5,cy+dy+.5,2.3,c);fb.rect(cx-3,cy+6,6,2,c);
  fb.rect(cx-5,cy-2,2,6,w);fb.rect(cx-1,cy-1,2,4,w);fb.rect(cx+3,cy-2,2,6,w);fb.rect(cx-4,cy-3,3,1,w);fb.rect(cx,cy-3,3,1,w);}
function discordIcon(fb,cx,cy){const c=[88,101,242];fb.poly([[cx-7,cy-6],[cx-3,cy-7],[cx-2,cy-5],[cx+3,cy-5],[cx+4,cy-7],[cx+8,cy-6],[cx+10,cy+4],[cx+6,cy+7],[cx+4,cy+5],[cx-3,cy+5],[cx-5,cy+7],[cx-9,cy+4]],c);fb.disc(cx-2.5,cy+.5,1.9,[20,20,30]);fb.disc(cx+3.5,cy+.5,1.9,[20,20,30]);}
function patreonIcon(fb,cx,cy){fb.disc(cx+2,cy-1,6.5,[255,66,77]);fb.rect(cx-8,cy-8,3,16,[255,66,77]);}
function kofiIcon(fb,cx,cy){const w=[245,245,250];fb.rect(cx-8,cy-4,13,10,w);fb.rect(cx-7,cy+6,11,1,w);fb.ring(cx+6,cy+.5,2.6,1.6,w);fb.disc(cx-3.5,cy,1.7,[255,90,95]);fb.disc(cx-.5,cy,1.7,[255,90,95]);fb.poly([[cx-5.2,cy+.6],[cx+1.2,cy+.6],[cx-2,cy+3.6]],[255,90,95]);
  for(let k=0;k<2;k++)fb.px(cx-4+k*4,cy-6-(k%2),[200,205,215],0.7);}
function birdIcon(fb,cx,cy){const c=[29,155,240];fb.disc(cx-1,cy+1,5.5,c);fb.disc(cx+4,cy-3,3.2,c);fb.poly([[cx+6.5,cy-4],[cx+10,cy-4.5],[cx+7,cy-1.5]],c);fb.poly([[cx-6,cy+1],[cx-10,cy-4],[cx-3,cy-1]],c);fb.poly([[cx-5,cy+4],[cx-9,cy+7],[cx-2,cy+6]],c);fb.px(cx+4,cy-4,[10,20,30]);}
function liveIcon(fb,cx,cy,t){const p=0.75+0.25*Math.sin((t||0)*5);fb.rect(cx-9,cy-5,19,11,[230,30,40],p);fb.rect(cx-8,cy-6,17,13,[230,30,40],p);fb.text(F3,"LIVE",cx-7,cy-2,[255,255,255]);}
function eyeIcon(fb,cx,cy){fb.poly([[cx-9,cy],[cx-4,cy-5],[cx+4,cy-5],[cx+9,cy],[cx+4,cy+5],[cx-4,cy+5]],[235,235,245]);fb.disc(cx,cy,3.6,[70,150,255]);fb.disc(cx,cy,1.6,[10,10,20]);fb.px(cx+1,cy-2,[255,255,255]);}
function gemIcon(fb,cx,cy){fb.poly([[cx-7,cy-3],[cx-3,cy-7],[cx+4,cy-7],[cx+8,cy-3],[cx+.5,cy+8]],[160,80,255]);fb.poly([[cx-3,cy-7],[cx+4,cy-7],[cx+2,cy-3],[cx-1,cy-3]],[215,175,255]);fb.line(cx-7,cy-3,cx+8,cy-3,[200,150,255]);fb.line(cx+.5,cy-3,cx+.5,cy+7,[120,50,220]);}
function raidIcon(fb,cx,cy,t){for(let k=0;k<3;k++){const x=cx-9+k*6+((t||0)*8)%6;fb.poly([[x,cy-6],[x+3,cy-6],[x+7,cy],[x+3,cy+6],[x,cy+6],[x+4,cy]],[255,90,80],0.45+0.25*k);}}
function micIcon(fb,cx,cy){const c=[220,224,235];fb.disc(cx+.5,cy-6,3.5,c);fb.rect(cx-3,cy-6,7,8,c);fb.disc(cx+.5,cy+2,3.5,c);for(let y=-6;y<=2;y+=2)fb.rect(cx-2,cy+y,5,1,[120,125,140]);fb.rect(cx,cy+6,1,3,c);fb.rect(cx-4,cy+9,9,1,c);}
const STREAM_ICONS={twitch:twitchIcon,youtube:youtubeIcon,instagram:instaIcon,tiktok:tiktokIcon,bluesky:blueskyIcon,mastodon:mastodonIcon,discord:discordIcon,patreon:patreonIcon,kofi:kofiIcon,twitter:birdIcon,live:liveIcon,eye:eyeIcon,gem:gemIcon,raid:raidIcon,mic:micIcon};
/* Going live: a red LIVE pill pops in with its dot pulsing rings, the title slides in, and the stream title scrolls under it. The background takes the platform colour from "colors". */
function sLive(fb,S,o){const {W,H}=S,t=S.ft!=null?S.ft:S.t%10,pc=o.colors&&o.colors[0]||TW,wide=W>=256;fb.vgrad(0,0,W,H,mix(pc,[0,0,0],0.86),mix(pc,[0,0,0],0.7));
  for(let k=0;k<4;k++){const x=((t*70+k*W/4)%(W+40))-20;fb.line(x,0,x-14,H,mix(pc,[255,255,255],0.2),0.22);}
  const pw=fb.tw(F5,"LIVE")+19,ph=wide?17:15,px=4,cy=16,pop=t<0.35?easeOutBack(t/0.35):1,hw=pw/2*pop,hh=ph/2*pop;
  fb.rect(px+pw/2-hw,cy-hh,hw*2,hh*2,[230,30,40]);if(pop>=1){const dx=px+8;for(let i=0;i<2;i++){const r=((t*1.1+i/2)%1);fb.ring(dx,cy,2+r*12,1,[255,90,100],(1-r)*0.6);}
    fb.disc(dx,cy,2.6+0.5*Math.sin(t*6),[255,255,255]);fb.text(F5,"LIVE",px+14,cy-3,[255,255,255],1);}
  const tx=px+pw+8,a=clamp((t-0.35)/0.4,0,1),off=(1-ease(a))*24,ttl=o.title||"LIVE NOW",room=W-tx-4,sc=wide&&fb.tw(F5,ttl,2)<=room?2:1;
  if(sc===2){fb.textO(F5,ttl,tx+off,3,[255,255,255],2,a);if(o.message&&t>0.8)marquee(fb,F3,o.message,tx,22,room,mix(pc,[255,255,255],0.6),t-0.8,1,true);}
  else{const ty=wide?8:6;if(fb.tw(F5,ttl)>room&&t>0.75)marquee(fb,F5,ttl,tx,ty,room,[255,255,255],t-0.75,1,true);else{fb.pushClip(tx,0,room,H);fb.textO(F5,ttl,tx+off,ty,[255,255,255],1,a);fb.popClip();}if(o.message&&t>0.8)marquee(fb,F3,o.message,tx,wide?19:17,room,mix(pc,[255,255,255],0.6),t-0.8,1,true);}}
/* Raid: chevrons race across, RAID! drops in and shakes, then who it's from and how many came. */
function sRaid(fb,S,o){const {W,H}=S,t=S.ft!=null?S.ft:S.t%8,c=o.colors&&o.colors[0]||[255,80,70];fb.vgrad(0,0,W,H,[22,6,12],[44,10,18]);
  for(let r=0;r<Math.max(4,Math.round(W/36));r++){const y=4+hash(r*3.3)*24,x=((t*W*(0.6+hash(r)*0.6)+hash(r*7)*W)%(W+30))-15;for(let k=0;k<3;k++){const xx=x-k*6;fb.poly([[xx,y-3],[xx+2,y-3],[xx+5,y],[xx+2,y+3],[xx,y+3],[xx+3,y]],mix(c,[255,255,255],0.2*k),0.8-k*0.22);}}
  const ttl="RAID!",sc=W>=256?3:2,tw=fb.tw(F5,ttl,sc),drop=t<0.6?easeBounce(t/0.6):1,sh=t>0.6&&t<0.95?Math.sin(t*90)*1.5:0,tx=W>=256?Math.round(W*0.1):Math.round((W-tw)/2),y0=(sc===3?5:1)-(1-drop)*30;
  fb.textO(F5,ttl,tx+sh,y0,X=>mix([255,255,255],c,clamp((X-tx)/tw,0,1)),sc);
  if(t>0.9){const a=Math.min(1,(t-0.9)/0.4);if(W>=256){const mx=tx+tw+14;fb.textO(F5,o.title||"",mx,7,[255,255,255],1,a);if(o.message)fb.textO(F3,o.message,mx,18,mix(c,[255,255,255],0.5),1,a);}
    else{const l1=o.title||"",l2=o.message||"";fb.textO(F3,l1,Math.round((W-fb.tw(F3,l1))/2),18,[255,255,255],1,a);if(l2)fb.textO(F3,l2,Math.round((W-fb.tw(F3,l2))/2),25,mix(c,[255,255,255],0.5),1,a);}}}
/* A weather notification: the sky full screen, the title over the caption, then the sensors it names across the rest (or the ones this screen's zones show), and the clock. */
function sWeatherNote(fb,S,o){const {W,H}=S,kind=live.kind,capW=W<256?84:92,clockW=W>=256?48:0;sky(fb,S,1,kind,false);fb.scaleRect(0,0,W,H,0.62);
  const L=wxView(kind,S).cap,cc=capCol(kind);if(o.title){fb.textO(F5,o.title,3,3,cc[0]);fb.textO(F3,L[0],3,14,cc[1]);if(L[1])fb.textO(F3,L[1],3,22,[160,190,225]);}else captionCard(fb,0,0,capW,H,S,kind);
  if(o.cards){const room=W-capW-clockW,n=Math.min(o.cards.length,Math.max(1,Math.floor(room/56))),per=n?room/n:0;
    o.cards.slice(0,n).forEach((c,i)=>{const x=capW+Math.round(i*per),w=Math.round(per);drawCard2(fb,c,x,0,w,H,Object.assign({},S,{wkind:kind,scr:"idle"}));});
    if(clockW){bigClock(fb,S,0,4,[255,236,210],{outline:1,right:W-4});fb.textO(F3,dstr(S.now),W-40,22,[150,160,180]);}return;}
  let ks=(o.sensors||[]).filter(k=>SENS[k]);if(!ks.length){const scr=isQuiet(live.mode)?SCREENS.find(x=>!isQuiet(x))||live.mode:live.mode,Zs=zonesOf(scr,S.id);ks=[...new Set(Zs.flatMap(z=>z.show).map(m=>OLDMOD[m]||m).filter(m=>m.startsWith("sn:")).map(m=>m.slice(3)))].filter(k=>SENS[k]);}
  const room=W-capW-clockW,n=Math.min(ks.length,Math.max(1,Math.floor(room/56))),per=n?room/n:0;
  ks.slice(0,n).forEach((k,i)=>{const x=capW+Math.round(i*per),w=Math.round(per);fb.pushClip(x,0,w,H);drawCard(fb,"sn:"+k,x,0,w,H,Object.assign({},S,{wkind:kind,scr:"idle"}));fb.popClip();});
  if(clockW){bigClock(fb,S,0,4,[255,236,210],{outline:1,right:W-4});fb.textO(F3,dstr(S.now),W-40,22,[150,160,180]);}}
/* Fireworks for any notification: bursts in "colors", the title dropping in, the message under it, and a cake when the icon is cake. */
function sFireworks(fb,S,o){const {W,H}=S,t=S.ft!=null?S.ft:S.t%10,cols=o.colors&&o.colors.length?o.colors:[[255,124,69],[72,194,138],[90,162,245],[232,181,58],[240,120,200]];
  fireworks(fb,Object.assign({},S,{t:t+1}),1,cols,Math.max(3,Math.round(W/45)));const cake0=o.cake?34:0;if(o.cake)cake(fb,16,19,S.t);
  const ttl=o.title||"",sc=W>=256&&fb.tw(F5,ttl,2)<=W-8-cake0?2:1,tw=fb.tw(F5,ttl,sc),tx=Math.round(cake0+(W-cake0-tw)/2),drop=t<0.7?easeBounce(t/0.7):1,y0=(sc===2?(o.message?3:9):(o.message?5:12))-(1-drop)*30;
  fb.textO(F5,ttl,tx,y0,X=>hsv((X-tx)*3-t*120,0.45,1),sc);if(o.message&&t>0.9){const mw=fb.tw(F3,o.message);fb.textO(F3,o.message,Math.round(cake0+(W-cake0-mw)/2),sc===2?21:16,[240,230,250],1,Math.min(1,(t-0.9)/0.4));}}
/* ---------- icon library: one list for notifications, sensors and JSON payloads. Every icon is drawn about 16 px across, centred on cx, cy. ---------- */
const dropG=(cy)=>(X,Y)=>mix([150,210,255],[40,120,235],(Y-(cy-9))/14);
function leakIcon(fb,cx,cy,t){const g=dropG(cy);fb.poly([[cx,cy-9],[cx+4.6,cy-2],[cx-4.6,cy-2]],g);fb.disc(cx,cy,4.8,g);fb.px(cx-2,cy-1,[230,245,255]);
  for(let k=0;k<2;k++){const ph=(t*0.9+k*0.5)%1,w=3+ph*6;fb.rect(cx-w,cy+7,w*2+1,1,[90,170,255],(1-ph)*0.9);}}
function waterIcon(fb,cx,cy){const g=dropG(cy+1);fb.poly([[cx,cy-8],[cx+5,cy+1],[cx-5,cy+1]],g);fb.disc(cx,cy+2,5.2,g);fb.px(cx-2,cy+1,[230,245,255]);}
function flameIcon(fb,cx,cy,t){const f=Math.sin(t*9)*0.8,g=(X,Y)=>mix([255,240,140],[255,80,30],clamp((Y-(cy-9))/16+Math.abs(X-cx)/8,0,1));
  fb.poly([[cx+f,cy-9],[cx+5,cy-1],[cx+5,cy+3],[cx+2,cy+7],[cx-2,cy+7],[cx-5,cy+3],[cx-5,cy-2],[cx-2,cy-5]],g);fb.poly([[cx-f*0.5,cy-2],[cx+2.5,cy+3],[cx,cy+7],[cx-2.5,cy+3]],[255,245,190]);}
function smokeIcon(fb,cx,cy,t){for(let k=0;k<4;k++){const ph=(t*0.35+k/4)%1;fb.disc(cx-2+Math.sin(ph*6+k)*2.5,cy+7-ph*15,2+ph*2.5,[180,180,190],(1-ph)*0.85);}}
function batteryIcon(fb,cx,cy,t,c){fb.frame(cx-8,cy-4,cx+6,cy+4,[200,205,215]);fb.rect(cx+7,cy-2,2,5,[200,205,215]);fb.rect(cx-6,cy-2,4,5,c||[255,90,70]);}
function plugIcon(fb,cx,cy,t){const m=[200,205,215];fb.rect(cx-5,cy-3,11,7,m);fb.rect(cx-3,cy-7,2,4,m);fb.rect(cx+2,cy-7,2,4,m);fb.rect(cx,cy+4,1,5,m);
  fb.poly([[cx+1,cy-2],[cx-2,cy+1],[cx,cy+1],[cx-1,cy+3],[cx+2,cy],[cx,cy]],[60,200,100],0.6+0.4*Math.sin(t*4));}
function wifiIcon(fb,cx,cy,t){fb.pushClip(cx-10,cy-10,21,13);for(let k=0;k<3;k++)fb.ring(cx,cy+3,3+k*3.2,1.4,[110,200,255],((t*1.5)%3)>=k?1:0.25);fb.popClip();fb.disc(cx,cy+3,1.5,[110,200,255]);}
function bulbIcon(fb,cx,cy,t,c){fb.disc(cx,cy-2,5.5,c||[255,214,110]);fb.rect(cx-2,cy+3,5,2,[200,205,215]);fb.rect(cx-2,cy+6,5,1,[150,155,165]);fb.px(cx-2,cy-4,[255,255,230]);}
function fanIcon(fb,cx,cy,t){for(let k=0;k<3;k++){const a=t*6+k*2.094;fb.poly([[cx,cy],[cx+Math.cos(a)*8,cy+Math.sin(a)*8],[cx+Math.cos(a+0.6)*6,cy+Math.sin(a+0.6)*6]],[150,210,240]);}fb.disc(cx,cy,1.6,[235,240,250]);}
function windowIcon(fb,cx,cy){const w=[210,215,225];fb.rect(cx-7,cy-8,15,16,[40,70,110]);fb.frame(cx-7,cy-8,cx+7,cy+7,w);fb.rect(cx,cy-8,1,16,w);fb.rect(cx-7,cy-1,15,1,w);fb.line(cx-5,cy-6,cx-3,cy-4,[170,210,255],0.8);}
function binIcon(fb,cx,cy){fb.rect(cx-7,cy-7,15,2,[120,200,120]);fb.rect(cx-2,cy-9,5,2,[120,200,120]);fb.poly([[cx-6,cy-4],[cx+7,cy-4],[cx+6,cy+8],[cx-5,cy+8]],[70,150,80]);for(const X of [-3,0,3])fb.rect(cx+X+0.5,cy-2,1,8,[40,90,50]);}
function mailIcon(fb,cx,cy){fb.rect(cx-8,cy-5,17,11,[235,235,240]);fb.line(cx-8,cy-5,cx,cy+1,[120,125,140]);fb.line(cx+8,cy-5,cx,cy+1,[120,125,140]);fb.frame(cx-8,cy-5,cx+8,cy+5,[170,175,190]);}
function pawIcon(fb,cx,cy,t,c){const k=c||[230,170,110];fb.disc(cx,cy+3,4.2,k);for(const [dx,dy] of [[-5,-2],[-2,-6],[2,-6],[5,-2]])fb.disc(cx+dx,cy+dy,1.9,k);}
function calendarIcon(fb,cx,cy){const d=String(new Date().getDate());fb.rect(cx-7,cy-6,15,14,[240,240,245]);fb.rect(cx-7,cy-6,15,4,[235,70,60]);
  for(const X of [-4,4]){fb.rect(cx+X,cy-8,1,3,[200,205,215]);}fb.text(F5,d,Math.round(cx-fb.tw(F5,d)/2),cy-1,[40,42,52]);}
function timerIcon(fb,cx,cy,t){const ph=(t*0.25)%1,m=[200,205,215];fb.rect(cx-6,cy-9,13,1,m);fb.rect(cx-6,cy+8,13,1,m);fb.poly([[cx-5,cy-8],[cx+5,cy-8],[cx,cy]],[255,210,120],1-ph*0.8);fb.poly([[cx,cy],[cx+5,cy+8],[cx-5,cy+8]],[255,210,120],0.2+ph*0.8);}
function musicIcon(fb,cx,cy,t){const b=Math.sin(t*4)>0?0:-1,c=[255,140,190];fb.disc(cx-4,cy+5+b,2.6,c);fb.disc(cx+4,cy+3+b,2.6,c);fb.rect(cx-2,cy-6+b,1,11,c);fb.rect(cx+6,cy-8+b,1,11,c);fb.line(cx-2,cy-6+b,cx+6,cy-8+b,c);fb.line(cx-2,cy-5+b,cx+6,cy-7+b,c);}
function cameraIcon(fb,cx,cy){fb.rect(cx-8,cy-4,17,11,[200,205,215]);fb.rect(cx-3,cy-6,6,2,[200,205,215]);fb.disc(cx,cy+1,4,[40,50,70]);fb.ring(cx,cy+1,3.4,1,[120,180,255]);fb.px(cx+6,cy-2,[255,80,80]);}
function personIcon(fb,cx,cy,t,c){const k=c||[230,200,170];fb.disc(cx,cy-5,3.3,k);fb.disc(cx,cy+2,5,k);fb.rect(cx-5,cy+2,11,6,k);}
function motionIcon(fb,cx,cy,t){fb.disc(cx-5,cy,2,[255,200,110]);fb.pushClip(cx-5,cy-10,16,21);for(let k=0;k<3;k++){const ph=(t*0.8+k/3)%1;fb.ring(cx-5,cy,3+ph*11,1.2,[255,200,110],1-ph);}fb.popClip();}
function pillIcon(fb,cx,cy){fb.disc(cx-4,cy,4,[255,90,90]);fb.rect(cx-4,cy-4,4,8,[255,90,90]);fb.rect(cx,cy-4,4,8,[240,240,245]);fb.disc(cx+4,cy,4,[240,240,245]);}
function sprinklerIcon(fb,cx,cy,t){fb.rect(cx-1,cy+2,3,7,[150,155,165]);fb.rect(cx-4,cy+8,9,1,[110,190,90]);for(let k=0;k<5;k++){const a=-Math.PI*(0.15+k*0.175),ph=(t*1.2+k*0.2)%1,r=3+ph*8;fb.px(cx+Math.cos(a)*r,cy+1+Math.sin(a)*r,[110,180,255],1-ph);}}
function solarIcon(fb,cx,cy,t){sun(fb,cx+5,cy-6,2.2,t);fb.poly([[cx-8,cy+7],[cx+4,cy+7],[cx+7,cy-1],[cx-5,cy-1]],[40,80,160]);for(let q=1;q<4;q++)fb.line(cx-8+q*3,cy+7,cx-5+q*3,cy-1,[110,150,220],0.8);fb.line(cx-6.5,cy+3,cx+5.5,cy+3,[110,150,220],0.8);}
function checkIcon(fb,cx,cy){fb.disc(cx,cy,8,[60,190,110]);for(const o of [0,1]){fb.line(cx-4,cy+o,cx-1,cy+3+o,[255,255,255]);fb.line(cx-1,cy+3+o,cx+4,cy-3+o,[255,255,255]);}}
function infoIcon(fb,cx,cy){fb.disc(cx,cy,8,[70,140,230]);fb.rect(cx-1,cy-5,2,2,[255,255,255]);fb.rect(cx-1,cy-2,2,7,[255,255,255]);}
function heartIcon(fb,cx,cy,t){const k=1+0.08*Math.max(0,Math.sin(t*6)),c=[255,80,110];fb.disc(cx-3*k,cy-2,3.6*k,c);fb.disc(cx+3*k,cy-2,3.6*k,c);fb.poly([[cx-6.8*k,cy-1],[cx+6.8*k,cy-1],[cx,cy+7*k]],c);}
function starIcon(fb,cx,cy){const P=[];for(let k=0;k<10;k++){const r=k%2?3.4:8,a=-Math.PI/2+k*Math.PI/5;P.push([cx+Math.cos(a)*r,cy+1+Math.sin(a)*r]);}fb.poly(P,[255,210,80]);}
function moneyIcon(fb,cx,cy){fb.rect(cx-8,cy-5,17,11,[70,150,90]);fb.frame(cx-8,cy-5,cx+8,cy+5,[140,220,150]);fb.disc(cx+.5,cy+.5,3,[150,225,160]);fb.rect(cx,cy-2,1,6,[50,110,65]);fb.px(cx-6,cy-3,[140,220,150]);fb.px(cx+6,cy+3,[140,220,150]);}
function giftIcon(fb,cx,cy){fb.rect(cx-7,cy-2,15,10,[230,80,90]);fb.rect(cx-8,cy-5,17,4,[255,110,120]);fb.rect(cx-1,cy-5,3,13,[255,220,110]);fb.disc(cx-3,cy-7,2,[255,220,110]);fb.disc(cx+4,cy-7,2,[255,220,110]);}
function phoneIcon(fb,cx,cy,t){fb.rect(cx-5,cy-9,11,18,[60,65,80]);fb.frame(cx-5,cy-9,cx+5,cy+8,[190,195,210]);fb.rect(cx-3,cy-6,7,11,(t%1)<0.5?[110,190,255]:[70,130,200]);fb.px(cx,cy+7,[190,195,210]);}
/* A football seen with one patch facing you: a pentagon in the middle, five more cut off at the rim, seams between them, shaded so it reads round.
   The patches are dark grey, not black, because black is an unlit LED and the ball would lose its outline. It turns slowly. */
function ballIcon(fb,cx,cy,t){const R=7.6,rot=t*0.4,pent=(ox,oy,r,a0)=>Array.from({length:5},(_,k)=>[ox+Math.cos(a0+k*1.2566)*r,oy+Math.sin(a0+k*1.2566)*r]);
  const inside=(P,X,Y)=>{let v=false;for(let i=0,j=4;i<5;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if((yi>Y)!==(yj>Y)&&X<(xj-xi)*(Y-yi)/(yj-yi)+xi)v=!v;}return v;};
  const A=k=>rot-Math.PI/2+k*1.2566,C=pent(cx,cy,2.9,A(0)),O=[0,1,2,3,4].map(k=>pent(cx+Math.cos(A(k))*7.9,cy+Math.sin(A(k))*7.9,2.5,A(k)+Math.PI));
  for(let y=Math.floor(cy-R-1);y<=Math.ceil(cy+R+1);y++)for(let x=Math.floor(cx-R-1);x<=Math.ceil(cx+R+1);x++){const X=x+.5,Y=y+.5,d=Math.hypot(X-cx,Y-cy),cov=clamp(R-d+.5,0,1);if(cov<=0)continue;
    const dark=inside(C,X,Y)||O.some(P=>inside(P,X,Y)),sh=1-0.4*clamp(((X-cx)+(Y-cy))/(2*R)+0.25+0.35*(d/R)**2,0,1);
    fb.px(x,y,dark?[46*sh+12,48*sh+12,60*sh+12]:[248*sh,248*sh,252*sh],cov);}
  fb.ring(cx,cy,R-0.6,1,[190,190,200],0.55);
  for(let k=0;k<5;k++){const a=A(k);fb.line(cx+Math.cos(a)*2.9,cy+Math.sin(a)*2.9,cx+Math.cos(a)*4.7,cy+Math.sin(a)*4.7,[110,110,122]);
    const m=a+0.6283;fb.line(cx+Math.cos(m)*4.4,cy+Math.sin(m)*4.4,cx+Math.cos(m)*7.4,cy+Math.sin(m)*7.4,[150,150,160],0.8);}}
function doorClosedIcon(fb,cx,cy){fb.rect(cx-6,cy-8,12,17,[150,110,70]);fb.rect(cx-5,cy-7,10,15,[210,125,55]);fb.frame(cx-4,cy-6,cx+3,cy-1,[170,95,40]);fb.frame(cx-4,cy+1,cx+3,cy+6,[170,95,40]);fb.px(cx+3,cy+1,[255,220,150]);}
function vacuumIcon(fb,cx,cy,t){fb.disc(cx,cy+1,7,[70,75,90]);fb.ring(cx,cy+1,7,1,[160,165,180]);fb.disc(cx,cy-2,2,[120,200,255],0.6+0.4*Math.sin(t*3));fb.rect(cx-5,cy+4,11,1,[160,165,180]);}
function dishIcon(fb,cx,cy,t){fb.frame(cx-7,cy-8,cx+7,cy+8,[190,200,215]);fb.rect(cx-6,cy-7,13,3,[90,100,120]);fb.px(cx+4,cy-6,[90,220,130]);for(let k=0;k<3;k++){const ph=(t*0.6+k/3)%1;fb.disc(cx-3+k*3,cy+5-ph*8,1.2,[140,200,255],1-ph);}}
function coffeeIcon(fb,cx,cy,t){fb.rect(cx-6,cy-2,10,9,[235,235,240]);fb.ring(cx+5,cy+2,2.4,1.2,[235,235,240]);fb.rect(cx-5,cy-1,8,2,[150,95,55]);for(let k=0;k<2;k++){const ph=(t*0.5+k*0.5)%1;fb.px(cx-3+k*4+Math.sin(ph*6)*1,cy-4-ph*5,[200,200,210],1-ph);}}
function ovenIcon(fb,cx,cy,t){fb.rect(cx-7,cy-8,15,17,[70,75,90]);fb.frame(cx-7,cy-8,cx+7,cy+8,[190,195,210]);fb.rect(cx-5,cy-2,11,8,[30,30,36]);fb.rect(cx-4,cy-1,9,6,[255,140,50],0.35+0.25*Math.sin(t*2));for(const X of [-4,0,4])fb.disc(cx+X,cy-5,1,[220,220,230]);}
function bedIcon(fb,cx,cy){fb.rect(cx-8,cy-4,2,11,[190,160,120]);fb.rect(cx-6,cy+1,15,4,[110,150,230]);fb.rect(cx-6,cy-2,5,3,[240,240,245]);fb.rect(cx-6,cy+5,15,1,[190,160,120]);fb.rect(cx+7,cy+1,2,6,[190,160,120]);}
function showerIcon(fb,cx,cy,t){fb.rect(cx-6,cy-8,2,4,[190,195,210]);fb.rect(cx-6,cy-8,8,2,[190,195,210]);fb.poly([[cx-1,cy-6],[cx+5,cy-6],[cx+3,cy-3],[cx+1,cy-3]],[190,195,210]);for(let k=0;k<6;k++){const ph=(t*1.5+k*0.17)%1;fb.px(cx+k%3-0.5+Math.floor(k/3)*1.5,cy-1+ph*9,[110,180,255],1-ph);}}
function bikeIcon(fb,cx,cy){fb.ring(cx-5,cy+3,3.6,1.2,[190,195,210]);fb.ring(cx+5,cy+3,3.6,1.2,[190,195,210]);fb.line(cx-5,cy+3,cx-1,cy-3,[255,120,90]);fb.line(cx-1,cy-3,cx+4,cy-3,[255,120,90]);fb.line(cx+4,cy-3,cx+5,cy+3,[255,120,90]);fb.line(cx-1,cy-3,cx,cy+3,[255,120,90]);fb.rect(cx-3,cy-5,3,1,[230,230,240]);}
function busIcon(fb,cx,cy){fb.rect(cx-7,cy-7,15,13,[255,200,70]);fb.rect(cx-6,cy-5,13,5,[60,90,140]);fb.rect(cx-7,cy-8,15,1,[255,220,120]);fb.disc(cx-4,cy+6,1.6,[40,40,50]);fb.disc(cx+4,cy+6,1.6,[40,40,50]);fb.px(cx-5,cy+2,[255,255,220]);fb.px(cx+5,cy+2,[255,255,220]);}
function umbrellaIcon(fb,cx,cy){fb.pushClip(cx-9,cy-8,19,8);fb.disc(cx,cy,8,[110,150,255]);fb.popClip();fb.rect(cx,cy,1,8,[200,205,215]);fb.rect(cx-2,cy+7,3,1,[200,205,215]);}
function cartIcon(fb,cx,cy){fb.line(cx-8,cy-6,cx-5,cy-6,[200,205,215]);fb.poly([[cx-5,cy-5],[cx+7,cy-5],[cx+5,cy+2],[cx-3,cy+2]],[120,200,140]);fb.rect(cx-3,cy+3,9,1,[200,205,215]);fb.disc(cx-2,cy+6,1.5,[200,205,215]);fb.disc(cx+4,cy+6,1.5,[200,205,215]);}
function gameIcon(fb,cx,cy,t){fb.disc(cx-5,cy+1,4.5,[90,95,120]);fb.disc(cx+5,cy+1,4.5,[90,95,120]);fb.rect(cx-5,cy-3,11,8,[90,95,120]);fb.rect(cx-7,cy,5,1,[230,230,240]);fb.rect(cx-5,cy-2,1,5,[230,230,240]);fb.px(cx+5,cy-1,[255,90,90]);fb.px(cx+7,cy+1,[90,200,255]);fb.px(cx+3,cy+1,[255,210,80],0.6+0.4*Math.sin(t*4));}
/* A font: a capital A and a small a beside it. */
function fontIcon(fb,cx,cy){const c=[235,235,240],c2=[130,200,255];fb.poly([[cx-10,cy+8],[cx-7.5,cy+8],[cx-2.5,cy-8],[cx-4.5,cy-8]],c);fb.poly([[cx-4.5,cy-8],[cx-2.5,cy-8],[cx+2.5,cy+8],[cx,cy+8]],c);
  fb.rect(cx-7,cy+2,7,2,c);fb.ring(cx+6,cy+5,2.4,1.6,c2);fb.rect(cx+8,cy,2,9,c2);fb.rect(cx+4,cy-1,5,2,c2);}
function bookIcon(fb,cx,cy){fb.poly([[cx,cy-5],[cx-8,cy-7],[cx-8,cy+6],[cx,cy+8]],[235,235,240]);fb.poly([[cx+1,cy-5],[cx+9,cy-7],[cx+9,cy+6],[cx+1,cy+8]],[215,215,225]);for(let k=0;k<3;k++){fb.line(cx-6,cy-3+k*3,cx-2,cy-2+k*3,[150,155,170],0.8);fb.line(cx+3,cy-2+k*3,cx+7,cy-3+k*3,[150,155,170],0.8);}}
function treeIcon(fb,cx,cy){fb.poly([[cx,cy-9],[cx+7,cy+3],[cx-7,cy+3]],[70,170,90]);fb.poly([[cx,cy-5],[cx+5,cy+1],[cx-5,cy+1]],[100,200,110]);fb.rect(cx-1,cy+3,3,5,[150,100,60]);}
function pizzaIcon(fb,cx,cy){fb.poly([[cx-8,cy-6],[cx+8,cy-6],[cx,cy+8]],[250,200,90]);fb.rect(cx-8,cy-7,17,2,[210,140,60]);for(const [dx,dy] of [[-3,-3],[2,-2],[0,2]])fb.disc(cx+dx,cy+dy,1.4,[220,60,50]);}
function dryerIcon(fb,cx,cy,t){washerIcon(fb,cx,cy,t);for(let k=0;k<3;k++){const ph=(t*0.7+k/3)%1;fb.px(cx-3+k*3,cy-9-ph*3,[255,150,80],1-ph);}}
function metroIcon(fb,cx,cy){const b=[190,195,210];fb.rect(cx-6,cy-8,13,14,b);fb.rect(cx-5,cy-9,11,1,b);fb.rect(cx-5,cy-6,11,5,[40,70,120]);fb.rect(cx,cy-6,1,5,b);
  fb.disc(cx+0.5,cy-7.5,1,[60,200,110]);fb.px(cx-4,cy+2,[255,240,180]);fb.px(cx+4,cy+2,[255,240,180]);fb.rect(cx-2,cy+2,5,1,[120,125,140]);
  fb.line(cx-4,cy+6,cx-7,cy+9,[150,155,165]);fb.line(cx+4,cy+6,cx+7,cy+9,[150,155,165]);fb.rect(cx-5,cy+8,11,1,[110,115,125]);}
function trainIcon(fb,cx,cy){fb.rect(cx-9,cy-5,17,9,[210,90,70]);fb.poly([[cx+8,cy-5],[cx+10,cy-2],[cx+10,cy+4],[cx+8,cy+4]],[210,90,70]);for(const X of [-7,-3,1])fb.rect(cx+X,cy-3,3,3,[230,235,245]);fb.rect(cx+6,cy-3,3,3,[40,60,90]);
  fb.rect(cx-9,cy+1,19,1,[255,210,120]);for(const X of [-6,-2,4])fb.disc(cx+X,cy+5,1.6,[60,60,70]);fb.rect(cx-10,cy+7,21,1,[150,155,165]);}
function tramIcon(fb,cx,cy){fb.line(cx-4,cy-9,cx,cy-6,[180,185,195]);fb.line(cx+4,cy-9,cx,cy-6,[180,185,195]);fb.rect(cx-6,cy-6,13,12,[80,170,120]);fb.rect(cx-5,cy-4,11,4,[40,70,110]);
  fb.px(cx-4,cy+3,[255,240,180]);fb.px(cx+4,cy+3,[255,240,180]);fb.rect(cx-7,cy+7,15,1,[150,155,165]);fb.disc(cx-3,cy+6,1.2,[60,60,70]);fb.disc(cx+3,cy+6,1.2,[60,60,70]);}
/* Sports. An oval filled pixel by pixel, rotated by ang, with colour c (a colour or a function of the local u, v in -1..1). */
function oval(fb,cx,cy,a,b,ang,c){const ca=Math.cos(ang),sa=Math.sin(ang),R=Math.max(a,b)+1;for(let y=Math.floor(cy-R);y<=cy+R;y++)for(let x=Math.floor(cx-R);x<=cx+R;x++){const dx=x+.5-cx,dy=y+.5-cy,u=(dx*ca+dy*sa)/a,v=(-dx*sa+dy*ca)/b,d=u*u+v*v;
  if(d<=1)fb.px(x,y,typeof c==="function"?c(u,v):c,clamp((1-d)*a,0,1));}}
function hockeyIcon(fb,cx,cy){const st=[215,175,115];fb.line(cx+6,cy-9,cx-1,cy+4,st);fb.line(cx+7,cy-9,cx,cy+4,st);fb.rect(cx-7,cy+4,8,2,st);fb.rect(cx-7,cy+4,2,2,[245,245,250]);
  oval(fb,cx+5,cy+6,3.4,1.6,0,[80,82,96]);fb.line(cx+2,cy+5,cx+8,cy+5,[150,152,165],0.8);}
function gridironIcon(fb,cx,cy){oval(fb,cx,cy,8.4,4.8,-0.5,(u,v)=>mix([175,95,45],[120,60,28],(v+1)/2));const ca=Math.cos(-0.5),sa=Math.sin(-0.5),P=(u,v)=>[cx+u*ca-v*sa,cy+u*sa+v*ca];
  const [x0,y0]=P(-3,-1.2),[x1,y1]=P(3,-1.2);fb.line(x0,y0,x1,y1,[245,245,245]);for(let k=-2;k<=2;k+=1){const [a,b]=P(k*1.3,-2.3),[c,d]=P(k*1.3,-0.1);fb.line(a,b,c,d,[245,245,245],0.9);}
  for(const e of [-6.2,6.2]){const [a,b]=P(e,-3),[c,d]=P(e,3);fb.line(a,b,c,d,[245,245,245],0.7);}}
function rugbyIcon(fb,cx,cy){oval(fb,cx,cy,8,5.4,-0.45,(u,v)=>Math.abs(u)>0.55&&Math.abs(u)<0.75?[220,50,60]:mix([248,248,252],[200,200,210],(v+1)/2));const ca=Math.cos(-0.45),sa=Math.sin(-0.45);
  for(let k=-4;k<=4;k++){const x=cx+k*ca-(-4.6)*sa*0,y=cy+k*sa;fb.px(x,y-0.5,[140,140,150],0.8);}}
function baseballIcon(fb,cx,cy){fb.disc(cx,cy,7.4,(X,Y)=>mix([252,252,252],[205,205,212],clamp((X-cx+Y-cy)/15+0.5,0,1)));
  for(const sg of [-1,1])for(let a=-1.1;a<=1.1;a+=0.18){const x=cx+sg*(7.4-3.2*Math.cos(a))*0.9,y=cy+Math.sin(a)*6.2;fb.px(x,y,[225,40,40]);fb.px(x-sg*1,y-0.6,[225,40,40],0.6);}}
function basketballIcon(fb,cx,cy){fb.disc(cx,cy,7.4,(X,Y)=>mix([255,150,50],[215,95,25],clamp((X-cx+Y-cy)/15+0.5,0,1)));const L=[40,24,14];
  fb.line(cx,cy-7,cx,cy+7,L);fb.line(cx-7,cy,cx+7,cy,L);for(const sg of [-1,1])for(let a=-1.2;a<=1.2;a+=0.12)fb.px(cx+sg*(7.2-4.2*Math.cos(a)),cy+Math.sin(a)*6.6,L);}
function lacrosseIcon(fb,cx,cy,t){const st=[210,210,220];fb.line(cx-7,cy+8,cx+2,cy-2,st);fb.line(cx-6,cy+8,cx+3,cy-2,st);oval(fb,cx+4,cy-5,4,3,-0.8,[70,75,90]);
  for(let k=-2;k<=2;k++)fb.line(cx+2+k,cy-7,cx+5+k,cy-3,[190,195,205],0.5);fb.ring(cx+4,cy-5,3.6,1,[230,230,240],0.9);const b=Math.abs(Math.sin(t*3))*3;fb.disc(cx+6,cy+4-b,1.7,[255,210,60]);}
function tennisIcon(fb,cx,cy){fb.disc(cx,cy,7,(X,Y)=>mix([220,245,90],[170,205,40],clamp((X-cx+Y-cy)/14+0.5,0,1)));for(const sg of [-1,1])for(let a=-1.3;a<=1.3;a+=0.08){const x=cx+sg*(7.2-3.8*Math.cos(a)),y=cy+Math.sin(a)*5.6;if(Math.hypot(x-cx,y-cy)<6.6)fb.px(x,y,[250,250,245]);}}
function golfIcon(fb,cx,cy,t){oval(fb,cx,cy+6,8,2.4,0,[70,170,80]);fb.rect(cx-1,cy-8,1,14,[230,230,235]);const w=Math.sin(t*3)*0.8;fb.poly([[cx,cy-8],[cx+7,cy-6+w],[cx,cy-4]],[235,60,60]);fb.disc(cx+4,cy+6,1.1,[20,20,24]);fb.disc(cx-5,cy+5,1.3,[250,250,250]);}
function volleyballIcon(fb,cx,cy){fb.disc(cx,cy,7.4,(X,Y)=>{const a=Math.atan2(Y-cy,X-cx),band=Math.floor(((a+Math.PI)/(Math.PI*2/3))+0.2)%3;return [[250,250,250],[70,120,230],[250,210,60]][band];});
  for(let k=0;k<3;k++){const a=k*2.094-0.5;for(let r=0;r<7.2;r+=0.5)fb.px(cx+Math.cos(a+r*0.12)*r,cy+Math.sin(a+r*0.12)*r,[40,40,50],0.8);}}
/* Bins in Ontario colours: a blue box for recycling, a grey garbage bin, a green bin for compost. */
function wheelieBin(fb,cx,cy,w,c){const h=w*1.1;fb.poly([[cx-w/2,cy-h/2+2],[cx+w/2,cy-h/2+2],[cx+w/2-1,cy+h/2],[cx-w/2+1,cy+h/2]],(X,Y)=>mix(c,mix(c,[0,0,0],0.35),(X-(cx-w/2))/w));
  fb.rect(cx-w/2-1,cy-h/2,w+2,2,mix(c,[255,255,255],0.2));fb.disc(cx-w/2+1.5,cy+h/2+1,1.2,[60,62,70]);fb.disc(cx+w/2-1.5,cy+h/2+1,1.2,[60,62,70]);}
function garbageIcon(fb,cx,cy){wheelieBin(fb,cx,cy-1,12,[128,134,146]);}
function compostIcon(fb,cx,cy){wheelieBin(fb,cx,cy-1,12,[60,160,80]);fb.poly([[cx,cy-3],[cx+3,cy],[cx,cy+3],[cx-3,cy]],[200,245,160]);fb.line(cx-2,cy+2,cx+2,cy-2,[60,160,80]);}
function recyclingIcon(fb,cx,cy,t){fb.poly([[cx-8,cy-3],[cx+8,cy-3],[cx+6,cy+7],[cx-6,cy+7]],(X,Y)=>mix([60,140,235],[30,80,170],(Y-(cy-3))/10));fb.rect(cx-8,cy-4,17,1,[120,180,250]);
  const r=3.2,a0=t*0.8;for(let k=0;k<3;k++){const a=a0+k*2.094,b=a+1.6;fb.line(cx+Math.cos(a)*r,cy+2+Math.sin(a)*r,cx+Math.cos(b)*r,cy+2+Math.sin(b)*r,[255,255,255]);fb.px(cx+Math.cos(b)*r,cy+2+Math.sin(b)*r+1,[255,255,255],0.8);}
  fb.rect(cx-6,cy-7,5,3,[235,235,240]);fb.rect(cx+1,cy-6,4,2,[200,200,210]);}
function binsIcon(fb,cx,cy){wheelieBin(fb,cx-4,cy-1,7,[128,134,146]);wheelieBin(fb,cx+4,cy-1,7,[60,160,80]);}
const ICONS={bell:(fb,cx,cy,t)=>bell(fb,cx,cy+2,0.8,t),garage:garageIcon,door:doorIcon,door_closed:doorClosedIcon,lock:(fb,cx,cy)=>lockIcon(fb,cx,cy,[255,120,90],true),locked:(fb,cx,cy)=>lockIcon(fb,cx,cy,[90,200,130],false),
  package:(fb,cx,cy)=>isoBox(fb,cx,cy,16),alarm:shieldIcon,car:carIcon,key:keyIcon,gate:gateIcon,window:windowIcon,camera:cameraIcon,motion:motionIcon,person:personIcon,
  leak:leakIcon,water:waterIcon,flame:flameIcon,smoke:smokeIcon,warning:(fb,cx,cy,t,c)=>tri(fb,cx,cy,16,c||[255,190,60]),tornado:(fb,cx,cy,t,c)=>funnel(fb,cx,cy+1,18,t,c||[255,140,40]),snowflake:(fb,cx,cy)=>flake(fb,cx,cy,7,[140,215,255]),
  thermometer:thermoIcon,freezer:freezerIcon,fan:fanIcon,co2:co2Icon,sun:sunIcon,moon:napIcon,bolt:boltIcon,battery:batteryIcon,charger:plugIcon,solar:solarIcon,bulb:bulbIcon,wifi:wifiIcon,server:rackIcon,
  tv:tvIcon,music:musicIcon,phone:phoneIcon,game:gameIcon,book:bookIcon,washer:washerIcon,dryer:dryerIcon,dishwasher:dishIcon,vacuum:vacuumIcon,oven:ovenIcon,coffee:coffeeIcon,pizza:pizzaIcon,bed:bedIcon,shower:showerIcon,bin:binIcon,garbage:garbageIcon,compost:compostIcon,recycling:recyclingIcon,bins:binsIcon,cart:cartIcon,bike:bikeIcon,bus:busIcon,metro:metroIcon,train:trainIcon,tram:tramIcon,umbrella:umbrellaIcon,tree:treeIcon,mail:mailIcon,plant:plantIcon,sprinkler:sprinklerIcon,home:homeIcon,calendar:calendarIcon,timer:timerIcon,pill:pillIcon,
  baby:waveIcon,pet:pawIcon,snake:snakeIcon,football:ballIcon,soccer:ballIcon,american_football:gridironIcon,rugby:rugbyIcon,hockey:hockeyIcon,baseball:baseballIcon,basketball:basketballIcon,lacrosse:lacrosseIcon,tennis:tennisIcon,golf:golfIcon,volleyball:volleyballIcon,cake,gift:giftIcon,heart:heartIcon,star:starIcon,check:checkIcon,info:infoIcon};
Object.assign(ICONS,THEME_ICONS,STREAM_ICONS);ICONS.money=moneyIcon;ICONS.font=fontIcon;
const SICON=ICONS;
/* The small (tray) size of any icon: the 18 px icon area-averaged down to 9 px, the same way the display shrinks images. */
const MINI=new FB(32,32);
function miniIcon(fb,name,cx,cy,t,c){MINI.noClip();MINI.clear();(ICONS[name]||ICONS.bell)(MINI,16,16,t,c);const d=MINI.d,ox=Math.round(cx-4.5),oy=Math.round(cy-4.5),lit=[];
  for(let j=0;j<9;j++)for(let i=0;i<9;i++){let r=0,g=0,b=0;for(let q=0;q<2;q++)for(let p=0;p<2;p++){const k=((7+j*2+q)*32+(7+i*2+p))*3;r+=d[k];g+=d[k+1];b+=d[k+2];}
    const v=[r/4,g/4,b/4];if(v[0]+v[1]+v[2]>12)lit.push([ox+i,oy+j,v]);}
  const tint=iconTint();haloUnder(fb,lit);for(const [X,Y,v] of lit)fb.px(X,Y,tint?tinted(tint,v):v);}
/* The outline under an icon's lit pixels, in its shape whatever its colours, before the icon goes on top: the same halo as the words beside it. */
function haloUnder(fb,lit){const h=fb.halo;if(!h||fb._h)return;const hb=fb.haloTo||fb;for(const [X,Y] of lit)for(const [dx,dy] of HALO_AT[h.at]||HALO_AT.around)hb.px(X+dx,Y+dy,h.c,0.85);}
/* A big icon drawn straight onto the strip, with the same outline: drawn once on a spare layer to find its pixels, then for real. */
const ICON_SCRATCH={};
/* Everything a card draws with its outline round the lot (words, icons, bars, lines, dots): drawn once on a spare layer to find its lit pixels,
   the outline under those, then drawn for real. Without an outline it's just drawn. */
const HALO_SCRATCH={};
function haloed(fb,draw,x0,y0,w,h){if(!fb.halo||fb._h)return draw(fb);const sc=HALO_SCRATCH[fb.W+"x"+fb.H]||(HALO_SCRATCH[fb.W+"x"+fb.H]=new FB(fb.W,fb.H));sc.noClip();
  const xa=Math.max(0,Math.floor(x0)),xb=Math.min(fb.W,Math.ceil(x0+w)),ya=Math.max(0,Math.floor(y0)),yb=Math.min(fb.H,Math.ceil(y0+h)),d=sc.d;
  for(let y=ya;y<yb;y++)d.fill(0,(y*fb.W+xa)*3,(y*fb.W+xb)*3);sc.pushClip(xa,ya,xb-xa,yb-ya);draw(sc);sc.popClip();const lit=[];
  for(let y=ya;y<yb;y++)for(let x=xa;x<xb;x++){const k=(y*fb.W+x)*3;if(d[k]+d[k+1]+d[k+2]>24)lit.push([x,y]);}
  haloUnder(fb,lit);return draw(fb);}
/* An icon tinted by its card's palette: your colour, as bright as the icon's own pixels. */
const iconTint=()=>PALETTE&&PALETTE.icon?rgbOf(PALETTE.icon):null,tinted=(t,v)=>{const l=Math.max(v[0],v[1],v[2])/255;return [t[0]*l,t[1]*l,t[2]*l];};
function iconHalo(fb,draw,x0,y0,w,h){const tint=iconTint();if((!fb.halo||fb._h)&&!tint)return draw(fb);const sc=ICON_SCRATCH[fb.W+"x"+fb.H]||(ICON_SCRATCH[fb.W+"x"+fb.H]=new FB(fb.W,fb.H));sc.noClip();
  const xa=Math.max(0,Math.floor(x0)),xb=Math.min(fb.W,Math.ceil(x0+w)),ya=Math.max(0,Math.floor(y0)),yb=Math.min(fb.H,Math.ceil(y0+h)),d=sc.d;
  for(let y=ya;y<yb;y++)d.fill(0,(y*fb.W+xa)*3,(y*fb.W+xb)*3);draw(sc);const lit=[];
  for(let y=ya;y<yb;y++)for(let x=xa;x<xb;x++){const k=(y*fb.W+x)*3;if(d[k]+d[k+1]+d[k+2]>12)lit.push([x,y,[d[k],d[k+1],d[k+2]]]);}
  if(fb.halo&&!fb._h)haloUnder(fb,lit);if(!tint){draw(fb);return;}for(const [X,Y,v] of lit)fb.px(X,Y,tinted(tint,v));}
const staleX=(fb,x,y)=>{for(let i=0;i<5;i++){fb.px(x+i,y+i,[255,70,60]);fb.px(x+4-i,y+i,[255,70,60]);}};
/* The palette of the card being drawn: its own colour for each part (label, title, text, name, value, unit, detail, icon, up, down, bar, humidity).
   pc(role, usual) is that colour, or the usual one when the card doesn't set it. */
let PALETTE=null;
const pc=(role,d)=>{const v=PALETTE&&PALETTE[role];return (v&&rgbOf(v))||d;};
const sLabel=(fb,s,x,y)=>fb.text(F3,s,x,y,pc("label",[130,135,150]));
/* The climate card's line: the history Home Assistant sent, or nothing. */
function climLine(fb,x,y,w,h,s,T){if(s.hist){const v=s.hist;if(v.length<2)return;const lo=Math.min(...v),hi=Math.max(...v),rg=Math.max(0.5,hi-lo);
    for(let i=0;i<w;i++){const u=i/Math.max(1,w-1)*(v.length-1),a=Math.floor(u),b=Math.min(v.length-1,a+1),val=v[a]+(v[b]-v[a])*(u-a),yy=y+h-1-Math.round((val-lo)/rg*(h-1)),c=tempCol(val);fb.px(x+i,yy,c);for(let Y=yy+1;Y<y+h;Y++)fb.px(x+i,Y,c,0.18);}return;}
  if(s.amp)sparkline(fb,x,y,w,h,s.seed||0,T,s.amp);}
function sparkline(fb,x,y,w,h,seed,T0,amp){for(let i=0;i<w;i++){const u=i/Math.max(1,w-1),T=T0+amp*Math.sin(u*Math.PI*1.6-0.6+seed)+amp*0.2*Math.sin(u*17+seed),v=clamp((T-(T0-amp*1.3))/(amp*2.6),0,1),yy=y+h-1-Math.round(v*(h-1)),c=tempCol(T);
  fb.px(x+i,yy,c);for(let Y=yy+1;Y<y+h;Y++)fb.px(x+i,Y,c,0.18);}}
const SRENDER={
  /* The temperature card. Its icon is the weather on screen; the numbers are the sensor's. */
  temperature(fb,x,y,w,h,S,s){const kind=S.wkind||live.kind,d=s.demo?demoWx(kind,S.now):s,deg=v=>v==null?"--":Math.round(v)+"°",T=deg(d.temperature),col=pc("value",d.temperature!=null?tempCol(d.temperature):[150,150,160]);
    const hl=d.high!=null&&d.low!=null?"H"+Math.round(d.high)+" L"+Math.round(d.low):"",feels=d.apparent_temperature!=null?"FEELS "+deg(d.apparent_temperature):"",wi=WX[condOf(kind)]||WX.pc;
    if(S.scr==="active"){wi.icon(fb,x+2,y+3,18,S.t);if(s.font)fontNum(fb,s.font,T,x+23,y+4,col,1,"tp:"+x,S.t);else{fb.text(F5,T,x+23,y+5,col);fb.text(F3,hl,x+23,y+14,pc("detail",[150,150,160]));}
      if(s.label)sLabel(fb,s.label,x+3,y+24);else fb.text(F3,wi.cond,x+3,y+24,pc("text",[120,170,230]));return;}
    if(w>=110){wi.icon(fb,x+3,y+7,18,S.t);sLabel(fb,s.label||"",x+26,y+2);const tw=fontNum(fb,s.font,T,x+26,y+10,col,2,"tp:"+x,S.t);fb.text(F3,feels,x+30+tw,y+12,pc("text",[195,195,210]));fb.text(F3,hl,x+30+tw,y+19,pc("detail",[150,160,180]));return;}
    fontNum(fb,s.font,T,x+3,y+2,col,2,"tp:"+x,S.t);fb.text(F3,feels,x+3,y+19,pc("text",[195,195,210]));fb.text(F3,hl,x+3,y+25,pc("detail",[150,160,180]));},
  /* A forecast row: hours, or days with "period": "daily". */
  forecast(fb,x,y,w,h,S,s){const kind=S.wkind||live.kind,F=s.demo?(s.period==="daily"?demoDaily(kind,S.now):fcFor(kind)):(s.period==="daily"?dailyFrom(s.items||[]):fcFrom(s.items||[],kDay(kind)));
    WIDGETS.fcast(fb,x,y,w,h,Object.assign({},S,{fc:F,outline:S.scr==="idle"}));},
  chart(fb,x,y,w,h,S,s){const mi=s.icon&&ICONS[s.icon];if(mi)miniIcon(fb,s.icon,x+7,y+4.5,S.t,pc("icon",[190,200,215]));sLabel(fb,s.label,mi?x+13:x+3,y+2);if(s.unit)fb.text(F3,s.unit,x+w-3-fb.tw(F3,s.unit),y+2,pc("unit",[150,150,160]));drawSeries(fb,x+3,y+9,w-6,h-9,S,s);},
  value(fb,x,y,w,h,S,s){const deg=s.unit==="°",col=pc("value",s.col||(deg?tempCol(parseFloat(s.value)):[240,236,230])),icol=pc("icon",col);
    /* Narrow boxes have no room for the big icon, so a small one goes before the label. */
    if(w<80){const mi=s.icon&&ICONS[s.icon];if(mi)miniIcon(fb,s.icon,x+7,y+5,S.t,icol);sLabel(fb,s.label,mi?x+13:x+3,y+2);
      fb.text(F5,s.value+(deg?"°":""),x+3,y+10,col);if(!deg&&s.unit)fb.text(F3,s.unit,x+3,y+19,pc("unit",[150,150,160]));return;}
    const ic=w>=110&&SICON[s.icon],tx=ic?x+26:x+3,mi=!ic&&s.icon&&ICONS[s.icon];if(ic)iconHalo(fb,f=>ic(f,x+12,y+16,S.t),x+1,y+5,23,23);else if(mi)miniIcon(fb,s.icon,x+7,y+4.5,S.t,icol);
    sLabel(fb,s.label,mi?tx+10:tx,y+2);const vw=s.font==="flip"?flipText(fb,s.value,tx,y+8,{key:"sv:"+s.label+":"+x,t:S.t,col:mix(col,[240,234,214],0.5)})+(deg?fb.text(F5,"°",tx+flipW(s.value)+1,y+9,col):0):s.font==="nixie"?nixieText(fb,s.value,tx,y+8,{t:S.t})+(deg?fb.text(F5,"°",tx+nixieW(s.value)+1,y+9,col):0):s.font==="segment"?segText(fb,s.value+(deg?"°":""),tx,y+8,{col}):s.font==="space"||s.font==="alagard"?fb.text(TITLE_FONTS[s.font],fitText(s.value+(deg?"°":""),TITLE_FONTS[s.font],false),tx,y+7,col):(s.font==="retro64"||s.font==="comicoro")?fb.text(TITLE_FONTS[s.font],fitText(s.value+(deg?"°":""),TITLE_FONTS[s.font],false),tx,y+8,col,2):fb.text(F5,s.value+(deg?"°":""),tx,y+9,col,2);let ax=tx+vw+3;
    if(!deg&&s.unit){fb.text(F3,s.unit,ax,y+17,pc("unit",[150,150,160]));ax+=fb.tw(F3,s.unit)+3;}
    if(s.trend&&ax+5<x+w){const up=s.trend==="up",c=up?pc("up",[255,150,90]):pc("down",[110,180,255]);fb.poly(up?[[ax,y+14],[ax+5,y+14],[ax+2.5,y+10]]:[[ax,y+10],[ax+5,y+10],[ax+2.5,y+14]],c);}
    if(s.detail)fb.text(F3,s.detail,tx,y+26,pc("detail",[150,145,140]));},
  climate(fb,x,y,w,h,S,s){const T=parseFloat(s.value);
    if(w<80){sLabel(fb,w<44?s.label.slice(0,3):s.label,x+3,y+2);fb.text(F5,(w<30?String(Math.round(T)):s.value)+"°",x+3,y+9,pc("value",tempCol(T)));dropIcon(fb,x+3,y+19,pc("humidity",[90,160,255]));fb.text(F5,s.hum+"%",x+9,y+18,pc("humidity",[120,175,255]));
      if(w>=44)climLine(fb,x+3,y+27,w-6,3,s,T);return;}
    const ic=w>=150,tx=ic?x+26:x+3,si=s.icon&&SICON[s.icon];if(ic){if(si)iconHalo(fb,f=>si(f,x+12,y+16,S.t),x+1,y+5,23,23);else if(s.icon&&ICONS[s.icon])ICONS[s.icon](fb,x+12,y+16,S.t,pc("icon",[190,200,215]));else thermoIcon(fb,x+12,y+16);}
    sLabel(fb,s.label,tx,y+2);const vw=fontNum(fb,s.font,s.value+"°",tx,y+9,pc("value",tempCol(T)),2,"cl:"+x,S.t),hx=tx+vw+6;
    if(x+w-hx>=26){dropIcon(fb,hx,y+11,pc("humidity",[90,160,255]));fb.text(F5,s.hum+"%",hx+5,y+10,pc("humidity",[120,175,255]));climLine(fb,tx,y+26,x+w-4-tx,5,s,T);}
    else fb.text(F3,s.hum+"% HUMIDITY",tx,y+26,pc("humidity",[120,175,255]));},
  sun(fb,x,y,w,h,S,s){const now=S.now,r=atHM(now,s.rise||SUNT.rise),st=atHM(now,s.set||SUNT.set),day=now>=r&&now<st,next=day?st:(now<r?r:new Date(r.getTime()+864e5)),left=next-now,hh=Math.floor(left/36e5),mm=Math.floor(left%36e5/6e4);
    if(w<80){sLabel(fb,day?"SUNSET":"SUNRISE",x+3,y+2);fb.text(F5,hm(next),x+3,y+10,pc("value",day?[255,176,90]:[255,214,130]));fb.text(F3,"IN "+(hh?hh+"H":mm+"M"),x+3,y+20,pc("detail",[150,145,140]));return;}
    let tx=x+3;if(w>=120){const R=17,cx=x+21,cy=y+26;for(let i=0;i<=48;i++){const a=Math.PI*i/48;fb.px(cx-Math.cos(a)*R,cy-Math.sin(a)*R*1.1,[80,90,120],0.9);}fb.rect(x+2,cy+1,38,1,[90,100,130]);
      if(day){const a=Math.PI*(now-r)/(st-r);sun(fb,cx-Math.cos(a)*R,cy-Math.sin(a)*R*1.1,2.4,S.t,[255,200,60]);}else{fb.disc(cx,cy-9,3.2,[250,238,190]);fb.disc(cx+1.6,cy-10.2,2.6,[0,0,0]);}tx=x+46;}
    sLabel(fb,day?"SUNSET":"SUNRISE",tx,y+2);fontNum(fb,s.font,hm(next),tx,y+9,pc("value",day?[255,176,90]:[255,214,130]),2,"su:"+x,S.t);fb.text(F3,"IN "+(hh?hh+"H ":"")+mm+"M",tx,y+26,pc("detail",[150,145,140]));
    if(w>=190){const o=day?"ROSE "+hm(r):"SET "+hm(st);fb.text(F3,o,x+w-4-fb.tw(F3,o),y+2,[110,110,125]);}},
  rooms(fb,x,y,w,h,S,s){const mi=s.icon&&ICONS[s.icon];if(mi)miniIcon(fb,s.icon,x+7,y+4.5,S.t,pc("icon",[190,200,215]));sLabel(fb,s.label,mi?x+13:x+3,y+2);const rp=4,cw=58,nc=Math.max(1,Math.floor((w-4)/cw)),per=rp*nc,pages=Math.ceil(s.items.length/per),pg=pages>1?Math.floor(S.t/4)%pages:0;
    if(pages>1){const pc=(pg+1)+"/"+pages;fb.text(F3,pc,x+w-4-fb.tw(F3,pc),y+2,[90,95,110]);}
    s.items.slice(pg*per,pg*per+per).forEach(([nm,v,u="°",c],i)=>{const cx=x+3+Math.floor(i/rp)*cw,cy=y+9+(i%rp)*6,vs=v+u;fb.text(F3,nm,cx,cy,pc("name",[205,210,220]));fb.text(F3,vs,cx+cw-6-fb.tw(F3,vs),cy,pc("value",c||(u==="°"?tempCol(parseFloat(v)):[230,230,236])));});},
  gauge(fb,x,y,w,h,S,s){const v=parseFloat(s.value),b=s.bands.find(q=>v<=q[0])||s.bands[s.bands.length-1],c=pc("bar",b[1]),ic=w>=150&&SICON[s.icon],tx=ic?x+26:x+3,bw=x+w-4-tx,mi=!ic&&s.icon&&ICONS[s.icon];if(ic)iconHalo(fb,f=>ic(f,x+12,y+16,S.t),x+1,y+5,23,23);else if(mi)miniIcon(fb,s.icon,x+7,y+4.5,S.t,pc("icon",c));
    sLabel(fb,s.label,mi?tx+10:tx,y+2);const vw=fb.text(F5,s.value,tx,y+9,pc("value",c));fb.text(F3,s.unit||"",tx+vw+3,y+11,pc("unit",[150,150,160]));if(b[2]&&bw>=90)fb.text(F3,b[2],x+w-4-fb.tw(F3,b[2]),y+11,c);
    let lo=s.min;for(const [to,bc] of s.bands){const x0=tx+Math.round((lo-s.min)/(s.max-s.min)*bw),x1=tx+Math.round((Math.min(to,s.max)-s.min)/(s.max-s.min)*bw);fb.rect(x0,y+19,Math.max(1,x1-x0),3,bc,0.28);lo=to;}
    const fx=Math.round(clamp((v-s.min)/(s.max-s.min),0,1)*bw);fb.rect(tx,y+19,fx,3,c);fb.rect(tx+fx-1,y+17,2,7,[255,255,255],0.9);
    fb.text(F3,String(s.min),tx,y+26,pc("detail",[100,100,115]));const mx=String(s.max);fb.text(F3,mx,tx+bw-fb.tw(F3,mx),y+26,pc("detail",[100,100,115]));
    if(b[2]&&bw<90)fb.text(F3,b[2],tx+Math.round((bw-fb.tw(F3,b[2]))/2),y+26,c);},
  /* Departures: up to three rows of route, destination and minutes. "bullets" draws coloured route circles like NYC's countdown clocks;
     "board" is a one-colour platform board like the Underground's or BART's, with an optional line-colour bar. Long destinations scroll. */
  departures(fb,x,y,w,h,S,s){const board=s.style==="board",txt=pc("name",s.col||(board?[255,176,40]:[232,232,238]));
    // Three rows at a time; more than that turn the page (every 6 seconds unless the card says), with a dot a page in the corner.
    const pages=Math.max(1,Math.ceil(s.items.length/3)),pg=pages>1?Math.floor(S.t/Math.max(2,+s.every||6))%pages:0,rows=s.items.slice(pg*3,pg*3+3),n=rows.length,dy=n<3?Math.round((32-n*10)/2):2;
    if(pages>1)for(let i=0;i<pages;i++)fb.px(x+w-2-(pages-1-i)*2,y+h-1,i===pg?txt:mix(txt,[0,0,0],0.7));
    rows.forEach((it,i)=>{const [route,col,dest,mins,det]=it,ry=y+dy+i*10;let tx=x+3;
      if(!board){const c=col||[200,200,210],lw=fb.tw(F3,route),dark=c[0]*0.3+c[1]*0.59+c[2]*0.11>150;fb.disc(tx+4,ry+3.5,4.3,c);fb.text(F3,route,Math.round(tx+4.5-lw/2),ry+1,dark?[0,0,0]:[255,255,255]);tx+=12;}
      else{if(col){fb.rect(tx,ry,2,7,col);tx+=4;}if(route){tx+=fb.text(F5,route,tx,ry,txt)+5;}}
      const due=+mins<=0,m=due?"DUE":board?mins+" MIN":String(mins),unit=!board&&!due?"MIN":"",mw=fb.tw(F5,m),uw=unit?fb.tw(F3,unit)+2:0,mx=x+w-3-mw-uw,dw=det?fb.tw(F3,det)+5:0,showDet=det&&mx-dw-tx>40;
      fb.text(F5,m,mx,ry,pc("value",board?txt:due?[120,230,140]:[255,210,120]));if(unit)fb.text(F3,unit,mx+mw+2,ry+2,pc("unit",[140,140,150]));
      if(showDet)fb.text(F3,det,mx-dw,ry+2,pc("detail",board?mix(txt,[0,0,0],0.35):[150,150,160]));
      marquee(fb,F5,dest,tx,ry,Math.max(8,mx-(showDet?dw:0)-4-tx),txt,S.t+i*1.7);});},
  /* A scrolling ticker: symbol, value and change, green for up and red for down. It scrolls on any width, so it fits a narrow zone too. */
  ticker(fb,x,y,w,h,S,s){const mi=s.icon&&ICONS[s.icon];if(mi)miniIcon(fb,s.icon,x+7,y+4.5,S.t,pc("icon",[190,200,215]));sLabel(fb,s.label,mi?x+13:x+3,y+2);const pct=s.cu==null?"%":s.cu,it=s.items.map(([sym,v,ch,ic])=>{const c=String(ch),dn=c.startsWith("-"),cs=c.replace(/^[-+]/,"")+pct,ico=ic&&ICONS[ic]?ic:null,sw=ico?11:fb.tw(F5,sym)+4;
      return {sym,v,cs,dn,ico,w:sw+fb.tw(F5,v)+4+6+fb.tw(F3,cs)+14};}),L=it.reduce((a,q)=>a+q.w,0);if(!L)return;
    const speed=s.speed!=null&&isFinite(+s.speed)?Math.max(0,+s.speed):18;let cx=x+3-(speed?((S.t*speed)%L):0);/* speed: LEDs a second; 0 holds it still */while(cx<x+w){for(const q of it){if(cx+q.w>x&&cx<x+w){let px=cx;if(q.ico){miniIcon(fb,q.ico,px+4.5,y+14,S.t,pc("icon",[240,236,230]));px+=11;}else px+=fb.text(F5,q.sym,px,y+11,pc("name",[240,236,230]))+4;px+=fb.text(F5,q.v,px,y+11,pc("value",[190,195,210]))+4;
      const c=q.dn?pc("down",[255,100,90]):pc("up",[90,220,130]),ax=Math.round(px),P=q.dn?[[ax,y+13],[ax+5,y+13],[ax+2.5,y+17]]:[[ax,y+17],[ax+5,y+17],[ax+2.5,y+13]];/* on whole LEDs like the words, so it doesn't shimmer as it scrolls */
        fb.haloShape((f,dx,dy,hc,a)=>f.poly(P.map(([X,Y])=>[X+dx,Y+dy]),hc||c,a));fb.text(F3,q.cs,px+7,y+13,c);}cx+=q.w;}}
    if(s.detail)fb.text(F3,s.detail,x+3,y+25,pc("detail",[150,145,140]));},
  /* Lights in their own colours: name, on or off, and colour, from a list Home Assistant sends. */
  lights(fb,x,y,w,h,S,s){const L=s.items||[],on=L.filter(r=>r[2]).length,n=on+" ON",mi=s.icon&&ICONS[s.icon];if(mi)miniIcon(fb,s.icon,x+7,y+4.5,S.t,pc("icon",[190,200,215]));fb.text(F3,s.label||"LIGHTS",mi?x+13:x+3,y+2,pc("label",[130,135,150]));fb.text(F3,n,x+w-3-fb.tw(F3,n),y+2,pc("value",[255,190,110]));
    const rp=Math.floor((h-8)/6),nc=Math.max(1,Math.floor((w-4)/58)),cw=(w-4)/nc;
    for(let i=0;i<Math.min(L.length,rp*nc);i++){const [nm,c,o,b]=L[i],cx=Math.round(x+3+Math.floor(i/rp)*cw),cy=y+9+(i%rp)*6,col=mix([0,0,0],c||[255,214,150],b==null?1:0.35+0.65*b/255);
      if(o){fb.rect(cx,cy+1,3,3,col);fb.px(cx+1,cy,col,0.35);fb.px(cx+1,cy+4,col,0.35);fb.px(cx-1,cy+2,col,0.35);fb.px(cx+3,cy+2,col,0.35);}
      else fb.frame(cx,cy+1,cx+2,cy+3,[55,58,66]);fb.text(F3,nm,cx+6,cy,o?pc("name",[205,210,220]):[80,84,94]);}},
  /* A media player: title, artist and progress. While it's playing the bar moves on its own from media_position_updated_at. */
  media(fb,x,y,w,h,S,s){const pos=clamp(s.playing?s.pos+(Date.now()-s.at)/1000:s.pos,0,s.dur||0),rem=Math.max(0,(s.dur||0)-pos);let tx=x+3;if(w>=140){const si=s.icon&&SICON[s.icon];if(si)iconHalo(fb,f=>si(f,x+12,y+16,S.t),x+1,y+5,23,23);else if(s.icon&&ICONS[s.icon])ICONS[s.icon](fb,x+12,y+16,S.t,pc("icon",[190,200,215]));else tvIcon(fb,x+12,y+16);tx=x+26;}const tw=x+w-3-tx;
    marquee(fb,F3,s.title||"NOTHING PLAYING",tx,y+3,tw,pc("title",[240,236,230]),S.t);fb.text(F3,s.playing?s.sub:(s.sub?s.sub+"   ":"")+"PAUSED",tx,y+10,pc("text",s.playing?[150,150,170]:[255,200,110]));
    if(s.dur){progressBar(fb,tx,y+19,tw,2,pos/s.dur,S.t);fb.text(F3,"-"+mmss(rem),tx,y+24,pc("detail",[140,140,160]));if(tw>=70){const e="ENDS "+hm(new Date(S.now.getTime()+rem*1000));fb.text(F3,e,tx+tw-fb.tw(F3,e),y+24,pc("detail",[140,140,160]));}}},
  text(fb,x,y,w,h,S,s){noticeCard(fb,x,y,w,h,S,{img:s.img,img2:s.img2,icon:SICON[s.icon]||((f,cx,cy)=>f.disc(cx,cy,3,s.col||[130,210,255])),col:s.col||[130,210,255],title:s.label,l2:s.state,l3:s.detail,big:s.big,unit:s.bunit,btop:s.btop,font:s.font,tfont:s.tfont,fkey:"sn:"+s.label+":"+x,prog:progFrac(s.progress)});}
};
const SENS={
  outside:{type:"climate",label:"OUTSIDE",value:"12.4",hum:"71",seed:1.3,amp:3.5},
  inside:{type:"climate",label:"INSIDE",value:"21.4",hum:"45",seed:0,amp:1.2},
  office:{type:"value",label:"OFFICE",icon:"thermometer",value:"23.1",unit:"°",trend:"up",detail:"UP 0.8° IN AN HOUR"},
  sun:{type:"sun",label:"SUN"},
  rooms:{type:"rooms",label:"ROOMS",items:[["LIVING","21.4"],["BEDROOM","19.8"],["OFFICE","23.1"],["NURSERY","21.0"],["KITCHEN","22.2"],["BASEMENT","18.2"],["BATH","22.8"],["GARAGE","9.4"]]},
  co2:{type:"gauge",label:"CO2, OFFICE",icon:"co2",value:"820",unit:"PPM",min:400,max:2000,bands:[[800,[72,194,138],"GOOD"],[1200,[240,190,60],"OPEN A WINDOW"],[2000,[255,90,70],"STUFFY"]]},
  car:{type:"gauge",label:"CAR BATTERY",icon:"car",value:"64",unit:"%",min:0,max:100,bands:[[20,[255,90,70],"CHARGE SOON"],[100,[80,200,255],"312 KM RANGE"]]},
  power:{type:"value",label:"POWER NOW",icon:"bolt",value:"1.8",unit:"KW",col:[255,214,90],trend:"down",detail:"TODAY 14.2 KWH"},
  stocks:{type:"ticker",label:"MARKETS",items:[["SHOP","112.40","+1.8"],["RY","171.20","+0.6"],["TD","84.10","-0.4"],["ENB","58.70","-0.2"],["XIU","38.95","+0.3"]],detail:"TSX UP 0.4% TODAY"},
  fx:{type:"ticker",label:"CAD EXCHANGE",items:[["USD","1.3712","+0.2"],["EUR","1.5034","-0.1"],["GBP","1.8210","+0.1"],["JPY","0.0092","-0.3"],["MXN","0.0701","+0.4"]],detail:"ONE UNIT IN CANADIAN DOLLARS"},
  trip:{type:"value",label:"CAD TO EUR",icon:"money",value:"0.665",unit:"EUR",trend:"up",detail:"UP 0.3% THIS WEEK",col:[120,220,160]},
  nyc:{type:"departures",label:"TIMES SQ-42 ST",style:"bullets",items:[["1",[238,53,46],"VAN CORTLANDT PARK 242 ST","3"],["7",[185,51,173],"FLUSHING MAIN ST","5"],["N",[252,204,10],"ASTORIA DITMARS BLVD","8"]]},
  london:{type:"departures",label:"OXFORD CIRCUS",style:"board",items:[["1",null,"WALTHAMSTOW CENTRAL","2"],["2",null,"SEVEN SISTERS","4"],["3",null,"WALTHAMSTOW CENTRAL","7"]]},
  bart:{type:"departures",label:"EMBARCADERO",style:"board",col:[255,90,60],items:[["",[255,228,0],"ANTIOCH","3","10 CAR"],["",[0,165,229],"DUBLIN/PLEASANTON","7","9 CAR"],["",[76,184,72],"BERRYESSA","12","8 CAR"]]},
  ttc:{type:"departures",label:"ST GEORGE",style:"bullets",items:[["1",[255,196,37],"VAUGHAN","2"],["2",[0,146,63],"KENNEDY","4"],["2",[0,146,63],"KIPLING","6"]]},
  bus:{type:"departures",label:"YOUR STOP",style:"bullets",items:[["12",[0,120,200],"DOWNTOWN","0"],["34",[230,120,20],"UNIVERSITY","6"],["88",[120,80,180],"AIRPORT","14"]]},
  today:{type:"temperature",label:"TODAY",demo:true},
  forecast:{type:"forecast",label:"NEXT HOURS",demo:true},
  daily:{type:"forecast",label:"NEXT DAYS",period:"daily",demo:true},
  rain:{type:"chart",label:"RAIN, NEXT 2 HOURS",unit:"MM/H",style:"rain",interval:15,values:[5,3.5,2.5,3.3,1.7,0.7,0.3,0.1,0]},
  power_day:{type:"chart",label:"POWER TODAY",unit:"KW",style:"bars",interval:60,col:[255,214,90],values:[0.4,0.3,0.3,0.3,0.3,0.4,0.9,1.6,1.2,0.8,0.7,0.9,1.1,0.8,0.7,0.8,1.3,2.4,3.1,1.8],labels:["00:00","NOW"]},
  viewers:{type:"value",label:"LIVE VIEWERS",icon:"eye",font:"nixie",value:"214",trend:"up",detail:"TWITCH 180, YOUTUBE 34",col:[255,110,110]},
  socials:{type:"ticker",label:"FOLLOWERS",cu:"",items:[["TWITCH","12.4K","+32","twitch"],["YOUTUBE","8.1K","+12","youtube"],["BLUESKY","2.3K","+5","bluesky"],["INSTAGRAM","4.8K","+9","instagram"],["TIKTOK","9.9K","+40","tiktok"],["MASTODON","640","+1","mastodon"]],detail:"TODAY'S CHANGE"},
  uptime:{type:"text",label:"STREAM",icon:"live",font:"flip",state:"LIVE",detail:"JUST CHATTING",big:"2:14",bunit:"UP",col:[255,110,110]},
  chat:{type:"chart",label:"CHAT, MESSAGES A MINUTE",unit:"MSG",style:"area",col:[160,100,255],interval:5,values:[4,6,5,9,14,11,8,12,22,31,18,15,19],labels:["-1H","NOW"]},
  subgoal:{type:"gauge",label:"SUB GOAL",icon:"star",value:"412",unit:"SUBS",min:0,max:500,bands:[[500,[145,70,255],"88 TO GO"]]},
  video:{type:"value",label:"LATEST VIDEO",icon:"youtube",value:"3.2K",unit:"VIEWS",trend:"up",detail:"340 LIKES, 2 DAYS AGO"},
  discord:{type:"value",label:"DISCORD ONLINE",icon:"discord",value:"86",detail:"1,240 MEMBERS",col:[140,150,255]},
  washer:{type:"text",label:"WASHER",icon:"washer",state:"RUNNING",detail:"RINSE CYCLE",big:"23",bunit:"MIN",col:[130,200,255]}
};
const SCAT=[
  ["outside","Outside","A weather station, or the weather entity's temperature and humidity","Temperature, humidity and a 24-hour line."],
  ["inside","Inside","The thermostat","The same card, indoors."],
  ["office","Room temperature","Any temperature sensor","One big reading with a trend arrow."],
  ["sun","Sunrise and sunset","sun.sun, next_rising and next_setting","The next sunset or sunrise, with a countdown."],
  ["rooms","Every room","A list of temperature sensors","Many rooms on one card."],
  ["co2","Air quality","A CO2 sensor","A bar with coloured bands you set."],
  ["car","Car battery","The car's integration","A gauge with a range readout."],
  ["power","Power use","An energy monitor","Right now, and today's total."],
  ["stocks","Stocks","Stock price sensors, one per symbol","A scrolling ticker, green for up and red for down."],
  ["fx","Exchange rates","The Open Exchange Rates integration, one sensor per currency","The same ticker, for your dollar against the others."],
  ["trip","Travel money","One exchange rate sensor","A single rate with the week's trend, for a trip coming up."],
  ["nyc","NYC subway","A GTFS-realtime feed through a transit integration","Countdown-clock style: coloured route bullets and minutes."],
  ["london","London Underground","TfL arrivals through a transit integration","A one-colour platform board, the Victoria line at Oxford Circus."],
  ["bart","BART","BART's real-time departures","A platform board with a line colour and the car count."],
  ["ttc","Toronto subway","TTC arrivals through a transit integration","Round line bullets like the TTC's: Line 1 in yellow, Line 2 in green."],
  ["bus","Bus stop","Your transit agency's real-time feed","The next three buses, due or in minutes."],
  ["today","Today's temperature","The weather entity's temperature, feels-like, high and low, in a template sensor","The temperature card. Its icon follows the weather on screen."],
  ["forecast","Hourly forecast","weather.get_forecasts with type hourly, in an automation","The next hours with icons, temperatures and the chance of rain."],
  ["daily","Daily forecast","weather.get_forecasts with type daily, in an automation","The next days with icons and highs."],
  ["rain","Rain, next 2 hours","Minutely precipitation from Pirate Weather or Open-Meteo, through a template sensor","A chart. The rain box shows it while it's wet."],
  ["power_day","Power today","An energy monitor's hourly use, from the recorder","A bar for each hour so far."],
  ["viewers","Live viewers","The Twitch integration, plus the YouTube Data API for YouTube","Everyone watching right now, across platforms."],
  ["socials","Followers","Twitch and YouTube integrations, Bluesky's public API, the Mastodon integration. Instagram needs a business or creator account; TikTok needs a source of your own.","Every platform in one ticker, with today's change."],
  ["uptime","Stream uptime","The Twitch integration's stream start time","How long you've been live, and what you're playing."],
  ["chat","Chat rate","Streamer.bot counting messages, through a webhook","Messages a minute over the last hour."],
  ["subgoal","Sub goal","Your goal from the event tool, or a number helper","Progress toward it."],
  ["video","Latest video","The YouTube integration","Views and likes since it went up."],
  ["discord","Discord online","Your server's widget, through a REST sensor","Members online right now."],
  ["washer","Washer","The washer's integration, or a smart plug's power draw","A state in words, with a countdown."]
];
const STYPE={climate:"climate",value:"value",sun:"sun",rooms:"rooms",gauge:"gauge",text:"text"};
const EVERY=[[20,"Every 20 s"],[60,"Every minute"],[300,"Every 5 min"]],DWELL=[[5,"For 5 s"],[8,"For 8 s"],[10,"For 10 s"],[15,"For 15 s"]];
/* Sensors and notifications that arrived as JSON rather than from the examples. */
const JSENS=new Set(),JNOTE={};
const SCFG={};for(const [k] of SCAT)SCFG[k]={every:60,dwell:8};SCFG.sun.every=300;SCFG.stocks.dwell=15;SCFG.fx.dwell=15;SCFG.socials.dwell=15;for(const k of ["nyc","london","bart","ttc","bus"])SCFG[k].dwell=12;SCFG.rooms.dwell=10;
const sLife=c=>{const e=EVERY.find(x=>x[0]===c.every);return `${e?e[1]:"Every "+c.every+" s"}, ${c.dwell} s each`;};
function sensorCard(fb,x,y,w,h,S,k){const s=SENS[k];if(!s)return;SRENDER[s.type](fb,x,y,w,h,S,s);if(s.stale){fb.scaleRect(Math.max(0,x),Math.max(0,y),w,h,0.45);staleX(fb,x+w-8,y+2);}}

/* ---------- output: gamma + PWM depth ---------- */
const state={scene:"glance",cycle:false,bits:12,dim:1,fps:120,size:"1x4",tv:65,mon:"27",place:"tv",sky:isDaytime(new Date())?"day":"night",paused:false,trans:1};
try{state.paused=matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){}
const LUT=new Uint8ClampedArray(256);
function buildLUT(){const L=(1<<state.bits)-1,dm=state.dim;for(let v=0;v<256;v++){const q=Math.round(Math.pow(v/255,2.2)*dm*L)/L;LUT[v]=Math.round(Math.pow(Math.min(1,q/dm),1/2.2)*255);}}
buildLUT();

const panelColor=()=>getComputedStyle(document.documentElement).getPropertyValue("--panel").trim()||"#050608";
class Disp{
  constructor(canvas,size){this.canvas=canvas;this.ctx=canvas.getContext("2d");this.visible=true;this.setSize(size);}
  setSize(size){this.size=size;this.W=size.W||size.cols*64;this.H=32;this.fb=new FB(this.W,this.H);this.L=null;this.off=document.createElement("canvas");this.off.width=this.W;this.off.height=this.H;this.octx=this.off.getContext("2d");this.img=this.octx.createImageData(this.W,this.H);this.cssW=0;}
  /* Between 2 and 3 screen pixels per LED there's no room for round dots, so snap to exactly 2 and draw a 1-pixel grid instead.
     The TV sizer opts out because it has to stay to scale; fill draws whole-pixel dots and lets the browser scale them to the width. */
  resize(cssW){cssW=Math.max(40,Math.floor(cssW));if(cssW===this.cssW)return;this.cssW=cssW;const dpr=window.devicePixelRatio||1,nat=cssW*dpr/this.W;
    /* fill is never scaled by the browser (even 2% turns the dots into a grid). From 4 device pixels per LED, round dots at exactly
       cssW; at 2 and 3 a whole number per LED, square LEDs with a 1-pixel gap, a little narrower than cssW; plain only under 2. */
    this.plain=!!this.fill&&nat<2;
    if(this.fill){const k=nat>=4||this.plain?nat:Math.floor(nat),cw=Math.round(this.W*k);this.canvas.width=cw;this.canvas.height=Math.round(cw*this.H/this.W);this.canvas.style.width=(cw/dpr)+"px";}
    else if(!this.noSnap&&nat<3){this.canvas.width=this.W*2;this.canvas.height=this.H*2;this.canvas.style.width=(this.W*2/dpr)+"px";}
    else{const cw=Math.round(cssW*Math.min(2,dpr));this.canvas.width=cw;this.canvas.height=Math.round(cw*this.H/this.W);this.canvas.style.width=cssW+"px";}
    this.buildMask();}
  buildMask(){const cw=this.canvas.width,ch=this.canvas.height,p=cw/this.W,q=ch/this.H,m=document.createElement("canvas");m.width=cw;m.height=ch;const c=m.getContext("2d");
    const g=Math.round(p);this.dots=p>=(this.fill?4:3)&&!this.plain;this.fine=false;this.crisp=Math.abs(p-1)<0.01;
    if(!this.dots&&!this.plain&&Math.abs(p-g)<0.01&&(g===2||g===3)){c.fillStyle=panelColor();c.fillRect(0,0,cw,ch);c.globalCompositeOperation="destination-out";
      for(let y=0;y<this.H;y++)for(let x=0;x<this.W;x++)c.fillRect(x*g,y*g,g-1,g-1);c.globalCompositeOperation="source-over";this.dots=true;this.fine=true;}
    else if(this.dots){c.fillStyle=panelColor();c.fillRect(0,0,cw,ch);c.globalCompositeOperation="destination-out";c.beginPath();const r=Math.min(p,q)*0.4;
      for(let y=0;y<this.H;y++)for(let x=0;x<this.W;x++){const X=(x+.5)*p,Y=(y+.5)*q;c.moveTo(X+r,Y);c.arc(X,Y,r,0,Math.PI*2);}c.fill();c.globalCompositeOperation="source-over";}
    this.mask=m;}
  resizePitch(k){const dpr=window.devicePixelRatio||1;this.canvas.width=this.W*k;this.canvas.height=this.H*k;this.cssW=this.W*k/dpr;this.canvas.style.width=this.cssW+"px";this.buildMask();}
  render(scene,S){const fb=this.fb;fb.noClip();fb.clear();scene(fb,S);this.present(fb);}
  present(fb){const d=fb.d,o=this.img.data;for(let i=0,j=0;i<d.length;i+=3,j+=4){o[j]=LUT[d[i]|0];o[j+1]=LUT[d[i+1]|0];o[j+2]=LUT[d[i+2]|0];o[j+3]=255;}
    this.octx.putImageData(this.img,0,0);
    const c=this.ctx,cw=this.canvas.width,ch=this.canvas.height;
    c.globalCompositeOperation="source-over";c.globalAlpha=1;c.imageSmoothingEnabled=false;c.drawImage(this.off,0,0,cw,ch);c.drawImage(this.mask,0,0);
    c.globalCompositeOperation="lighter";c.globalAlpha=this.crisp?0:this.fine?0.55:this.dots?0.28:0.12;c.imageSmoothingEnabled=true;c.drawImage(this.off,0,0,cw,ch);
    c.globalCompositeOperation="source-over";c.globalAlpha=1;}
}

/* ---------- page wiring ---------- */
const SIZES=[2,4,6,8,10].map(cols=>({id:"1x"+cols,rows:1,cols}));
const SIZE_NAME={2:["S","Small"],4:["M","Medium"],6:["L","Large"],8:["XL","Extra large"],10:["XXL","Extra extra large"]};
const byId=id=>SIZES.find(s=>s.id===id);
const $=id=>document.getElementById(id);
const stage=$("stage"),propsEl=$("props"),stageCanvas=$("stageCanvas"),dimline=$("dimline");
const stageDisp=new Disp(stageCanvas,byId(state.size));stageDisp.noSnap=true;
function makeRack(rackId,label){return SIZES.map(s=>{const fig=document.createElement("figure"),cv=document.createElement("canvas");
  cv.setAttribute("role","img");cv.setAttribute("aria-label",`${label}, 1 by ${s.cols} panels`);
  const cap=document.createElement("figcaption");cap.innerHTML=`<b>${SIZE_NAME[s.cols][0]} · 1×${s.cols}</b><span>${s.cols*64} × 32 px</span><span>${s.cols*160} × 80 mm</span><span>${s.cols} panels</span><span>up to ${s.cols*12} W</span>`;
  fig.append(cv,cap);$(rackId).append(fig);return new Disp(cv,s);});}
const lineup=makeRack("rack","The display"),tlDisps=makeRack("tlRack","Scripted evening");
const live=new Live();let simSize="1x4",simT=0,prevDisp=null,ED=null,PREV_ERR=null;
const simDisp=new Disp($("simCanvas"),byId(simSize));
/* Card previews follow the chosen bar: S previews at S width, and M or bigger at M. */
const catW=()=>simSize==="1x2"?128:256;
const TIER_COL={critical:"--sev-warn",warning:"--sev-warn",alert:"--sev-warn",notice:"--sev-notice",advisory:"--sev-watch",status:"--sev-status",nudge:"--sev-adv"};
const ACT_LABEL={set:"Set",send:"Send",remind:"Remind",clear:"Clear"};
const catDisps=[];
const scrChips=(t,k)=>`<span class="scr" role="group" aria-label="Screens it shows on">${SCREENS.map(sc=>`<button type="button" data-scr-t="${t}" data-scr-k="${k}" data-scr="${sc}" aria-pressed="${t==="n"&&isCrit(k)||scrSet(t,k).has(sc)}"${t==="n"&&isCrit(k)?" disabled":""}>${sc[0].toUpperCase()+sc.slice(1)}</button>`).join("")}</span>`;
const soundOpts=(v,own)=>Object.entries(SOUNDS).map(([k,[l]])=>`<option value="${k}"${k===v?" selected":""}>${k==="none"?"No sound":"Sound: "+l}</option>`).join("")+(own?`<option value="custom"${v==="custom"?" selected":""}>Sound: your own tune</option>`:"");
for(const [k,title,src,rule,grp] of CATALOG){const def=DEF[k],fig=document.createElement("figure"),cv=document.createElement("canvas");
  catOut(grp,{id:k,title,chip:def.tier,src,desc:rule,look:{card:def.preview||(def.adv?"adv:"+def.adv:def.card)},msgs:()=>[payloadFor(k,def.ctl.includes("set")?"set":"send")],show:"notify"});
  cv.setAttribute("role","img");cv.setAttribute("aria-label",title+" card");
  const meta=document.createElement("figcaption");
  meta.innerHTML=`<div class="cat-head"><b>${title}</b><span class="chip" style="color:var(${TIER_COL[def.tier]})">${def.tier}</span><span class="life">${LIFE(def)}</span></div><p class="src">${src}</p><p>${rule}</p>`+
    `<div class="acts">${def.ctl.map(a=>`<button type="button" data-k="${k}" data-act="${a}"${a==="set"||a==="send"?' class="primary"':""}>${ACT_LABEL[a]}</button>`).join("")}<select data-snd="${k}" aria-label="Buzzer sound for ${title}">${soundOpts(soundOf(k))}</select>${scrChips("n",k)}<button type="button" data-code="n" data-k="${k}" aria-expanded="false">Edit JSON</button></div>`;
  fig.append(cv,meta);$("cat-"+grp).append(fig);const d=new Disp(cv,{id:"cat",cols:0,W:catW()});d.card=def.preview||(def.adv?"adv:"+def.adv:def.card);catDisps.push(d);}
/* West Ham's goal, with I'm Forever Blowing Bubbles on the buzzer: the tune is saved once by name, then every goal names it.
   The melody is John Kellette's from 1918, in the public domain; notes only. */
const BUBBLES="bubbles:d=4,o=5,b=120:4d.,8d#,8d,8c#,2d,4d#,4d,1d,4p,4g.,8g,8g,8f#,2f,4d#,1d.,4d,4g,4d#,2d.,8d#,8f,4g,4d#,2d.,4a#4,4e,4d#,2e,4e,2d#,4d#,2c.";
FULL.whgoal=(fb,S)=>sGoal(fb,Object.assign({},S,{imgs:["espn-371"],gcols:[[122,38,58],[27,177,231]],gmsg:"WHU 1-0 TOT",gdet:"67'"}));
catOut("fun",{id:"westham",title:"West Ham goal",chip:"alert",src:"West Ham United sensor (Team Tracker), when team_score goes up",
  desc:"The goal animation in claret and blue with the crest, and Bubbles on the buzzer. The tune is saved once, so every goal just names it, and takeover holds the strip for as long as it plays.",
  look:{card:"full:whgoal"},sound:{rtttl:BUBBLES},show:"notify",
  msgs:()=>[{topic:"pixelbar/all/asset/sound/bubbles",note:"Retained, so a display that reboots still has the tune.",body:JSON.stringify({v:2,rtttl:BUBBLES},null,2)},
    {topic:"pixelbar/all/notify/goal_westham",note:"Not retained, so a reboot never replays it.",body:JSON.stringify({v:2,tier:"alert",takeover:Math.ceil(soundSeq({rtttl:BUBBLES}).reduce((a,[,d])=>a+d,0)),sound:"bubbles",
      card:{card:"animation",name:"goal",icon:"football",title:"Goal",message:"WHU 1-0 TOT",detail:"67'",colors:["#7A263A","#1BB1E7"],images:[imgPayload("espn-371")]}},null,2)}]});
let dirty=true;
/* Make your own: one editable notification that goes through the same rules as the catalogue. */
const CUST_ICONS={bell:[(fb,cx,cy,t)=>bell(fb,cx,cy+2,0.8,t),"door"],garage:[garageIcon,"garage"],door:[doorIcon,"door2"],lock:[(fb,cx,cy)=>lockIcon(fb,cx,cy,[255,120,90],true),"lock"],
  package:[(fb,cx,cy)=>isoBox(fb,cx,cy,16),"pkg"],alarm:[shieldIcon,"shield"],car:[carIcon,"car"],key:[keyIcon,"key"],plant:[plantIcon,"plant"],thermometer:[thermoIcon,"thermo"],
  bolt:[boltIcon,"bolt"],tv:[tvIcon,"custom"],moon:[napIcon,"custom"],server:[rackIcon,"server"],warning:[(fb,cx,cy,t,c)=>tri(fb,cx,cy,16,c),"custom"]};
for(const [n,f] of Object.entries(ICONS))if(!CUST_ICONS[n])CUST_ICONS[n]=[f,"custom"];
const CUST_COLS={amber:[255,170,70],red:[255,84,70],green:[120,220,140],blue:[110,190,255],purple:[180,160,255],pink:[255,140,190],white:[236,236,242]};
const CUST={tier:"notice",icon:"bell",col:"blue",title:"LAUNDRY",message:"WASHER IS DONE",detail:"MOVE IT TO THE DRYER",big:"",unit:"",keep:false,sound:"done",rtttl:"laundry:d=8,o=6,b=160:c,e,g,c7,p,g,4c7"};
const custClean=(s,font)=>fitText(s,font);
const custSev=()=>CUST.tier==="advisory"?"adv":"warn";
const hex=c=>"#"+c.map(v=>v.toString(16).padStart(2,"0")).join("").toUpperCase();
CARDS.custom=()=>{const c=CUST_COLS[CUST.col]||CUST_COLS.blue,ic=(CUST_ICONS[CUST.icon]||CUST_ICONS.bell)[0];
  return {icon:(fb,cx,cy,t)=>ic(fb,cx,cy,t,c),col:c,title:CUST.title||"YOUR TITLE",l2:CUST.message,l3:CUST.detail,big:CUST.big||undefined,unit:CUST.unit||undefined};};
Object.defineProperty(ADVS,"custom",{get:()=>({sev:custSev(),t:CUST.title||"YOUR TITLE",l1:CUST.message,l2:CUST.detail})});
Object.defineProperty(ALERTS,"custom",{get:()=>({sev:"warn",title:CUST.title||"YOUR TITLE",l1:CUST.message,l2:CUST.detail,long:[CUST.message,CUST.detail].filter(Boolean).join(", "),icon:"tri"})});
FULL.custom=(fb,S)=>{if(CUST.tier==="critical"||CUST.tier==="warning")return sAlert(fb,S,ALERTS.custom);
  const c=CUST_COLS[CUST.col]||CUST_COLS.blue,ic=(CUST_ICONS[CUST.icon]||CUST_ICONS.bell)[0];
  sTake(fb,S,{icon:(fb2,cx,cy,t)=>ic(fb2,cx,cy,t,c),title:CUST.title||"YOUR TITLE",msg:CUST.message,c0:c,c1:mix(c,[255,255,255],0.45)});};
TRAYI.custom=(fb,cx,cy)=>fb.disc(cx,cy,2.4,CUST_COLS[CUST.col]||CUST_COLS.blue);
function custDef(){const t=CUST.tier,ongoing=t!=="alert"&&!(t==="notice"&&!CUST.keep),
    d={tier:t,icon:CUST.icon,ctl:ongoing?["send","clear"]:["send"],key:"my_notification",raw:1,card:"custom",tray:(CUST_ICONS[CUST.icon]||CUST_ICONS.bell)[1]};
  if(t==="critical"||t==="warning"){d.adv="custom";d.full="custom";}else if(t==="advisory")d.adv="custom";else if(t==="alert")d.full="custom";
  d.sound=CUST.sound;
  if(t==="notice"&&CUST.keep)d.keep=1;
  {const tr=(CUST_ICONS[CUST.icon]||CUST_ICONS.bell)[1];if(tr==="custom")d.tray="mini:"+CUST.icon+":"+hex(CUST_COLS[CUST.col]||CUST_COLS.blue);}
  d.pay=()=>{const o={title:cap1(CUST.title||"YOUR TITLE")};if(CUST.message)o.message=cap1(CUST.message);if(CUST.detail)o.detail=cap1(CUST.detail);
    if(CUST.big&&t!=="advisory"&&t!=="warning"&&t!=="critical")o.big={value:CUST.big,unit:CUST.unit.toLowerCase()};if(t!=="advisory"&&t!=="warning"&&t!=="critical")o.color=hex(CUST_COLS[CUST.col]);return o;};
  return d;}
DEF.custom=custDef();
const custDisp=new Disp($("custCanvas"),{id:"cat",cols:0,W:catW()});
function custPreview(){const t=CUST.tier;$("custScr").innerHTML=scrChips("n","custom");custDisp.card=t==="critical"||t==="warning"||t==="alert"?"full:custom":t==="advisory"?"adv:custom":"custom";
  $("custLife").textContent=LIFE(DEF.custom)+(t==="advisory"||t==="warning"||t==="critical"?". Weather-style alerts use the severity colours, not yours.":"");
  $("custKeep").disabled=t!=="notice";dirty=true;}
catDisps.push(custDisp);
{const f=$("custForm");
  f.tier.innerHTML=["critical","warning","alert","notice","advisory","status","nudge"].map(x=>`<option value="${x}"${x===CUST.tier?" selected":""}>${x[0].toUpperCase()+x.slice(1)}</option>`).join("");
  f.icon.innerHTML=Object.keys(CUST_ICONS).map(x=>`<option value="${x}"${x===CUST.icon?" selected":""}>${x}</option>`).join("");
  $("custCols").innerHTML=Object.entries(CUST_COLS).map(([k,c])=>`<label class="sw-pick"><input type="radio" name="col" value="${k}"${k===CUST.col?" checked":""}><span style="background:${hex(c)}"></span><em>${k}</em></label>`).join("");
  for(const k of ["title","message","detail","big","unit","rtttl"])f[k].value=CUST[k];
  f.sound.innerHTML=soundOpts(CUST.sound,true);
  $("custPlay").addEventListener("click",()=>playSeq(soundSeq(CUST.sound)));
  const read=()=>{CUST.tier=f.tier.value;CUST.icon=f.icon.value;CUST.sound=f.sound.value;CUST.rtttl=f.rtttl.value;$("rtttlWrap").hidden=CUST.sound!=="custom";CUST.col=(f.querySelector('input[name="col"]:checked')||{}).value||"blue";CUST.keep=f.keep.checked;
    const fonts={title:F5,message:F3,detail:F3,unit:F3,big:BIG};
    for(const k in fonts){const el=f[k],v=custClean(el.value,fonts[k]).slice(0,+el.maxLength||40);if(el.value!==v){const p=el.selectionStart;el.value=v;try{el.setSelectionRange(p,p);}catch(e){}}CUST[k]=v.trim();}
    DEF.custom=custDef();custPreview();};
  f.addEventListener("input",read);f.addEventListener("change",read);f.addEventListener("submit",e=>e.preventDefault());read();}
/* Sensors on Try it: a card per example, sorted into groups like the notifications. */
const SGRP={today:"climate",forecast:"climate",daily:"climate",outside:"climate",inside:"climate",office:"climate",rooms:"climate",co2:"climate",sun:"climate",rain:"climate",power:"energy",power_day:"energy",car:"energy",washer:"energy",
  stocks:"money",fx:"money",trip:"money",nyc:"transit",london:"transit",bart:"transit",ttc:"transit",bus:"transit",viewers:"stream",socials:"stream",uptime:"stream",chat:"stream",subgoal:"stream",video:"stream",discord:"stream"};
const sSel=(k,name,opts,v,label)=>`<select data-sk="${k}" data-sset="${name}" aria-label="${label}">${opts.map(([o,l])=>`<option value="${o}"${String(o)===String(v)?" selected":""}>${l}</option>`).join("")}</select>`;
for(const [k,title,src,rule] of SCAT){const fig=document.createElement("figure"),cv=document.createElement("canvas"),meta=document.createElement("figcaption"),c=SCFG[k];
  catOut("s-"+(SGRP[k]||"energy"),{id:k,title,get chip(){return "data: "+sensKey(k);},src,desc:rule,look:{card:"sn:"+k},show:"card",msgs:()=>[sensorPayload(k,"show"),
    {topic:"pixelbar/all/box/main",note:"Retained. Shows it in every display's box called main; use your own box's name.",body:JSON.stringify({v:2,cards:[sensCard(k)]},null,2)}]});
  cv.setAttribute("role","img");cv.setAttribute("aria-label",title+" sensor card");
  meta.innerHTML=`<div class="cat-head"><b>${title}</b><span class="chip" style="color:var(--bus)">${SENS[k].type}</span></div><p class="src">${src}</p><p>${rule}</p>`+
    `<div class="acts"><button type="button" class="primary" data-sk="${k}" data-sact="add">Add</button><button type="button" data-sk="${k}" data-sact="remove">Remove</button><button type="button" data-code="s" data-k="${k}" aria-expanded="false">Edit JSON</button></div>`;
  fig.append(cv,meta);$("cat-s-"+(SGRP[k]||"energy")).append(fig);const d=new Disp(cv,{id:"cat",cols:0,W:catW()});d.card="sn:"+k;catDisps.push(d);}
const SCUST={type:"value",icon:"thermometer",label:"GARAGE",value:"9.4",unit:"°",second:"DOOR IS SHUT",every:60,dwell:8,stale:false,col:"auto",gmin:"400",gmax:"2000",
  bands:[["800","green","GOOD"],["1200","amber","OPEN A WINDOW"],["2000","red","STUFFY"]]};
const SECLBL={value:"Second line",climate:"Humidity, %",gauge:"Maximum",text:"Second line"};
function sensBuild(){const c=SCUST,t=c.type;let o;
  if(t==="climate")o={type:t,label:c.label,value:c.value,hum:c.second||"50",seed:2.1,amp:2};
  else if(t==="gauge"){const mn=parseFloat(c.gmin)||0,mx=parseFloat(c.gmax)||100,bands=c.bands.filter(r=>r[0]!==""&&!isNaN(parseFloat(r[0]))).map(([to,cl,l])=>[parseFloat(to),CUST_COLS[cl]||CUST_COLS.blue,l]).sort((p,q)=>p[0]-q[0]);
    o={type:t,label:c.label,icon:c.icon,value:c.value,unit:c.unit,min:mn,max:mx>mn?mx:mn+1,bands:bands.length?bands:[[mx,CUST_COLS.blue,""]]};}
  else if(t==="text")o={type:t,label:c.label,icon:c.icon,state:c.value,detail:c.second,col:CUST_COLS[c.col]||[130,210,255]};
  else o={type:"value",label:c.label,icon:c.icon,value:c.value,unit:c.unit,detail:c.second,col:CUST_COLS[c.col]};
  o.stale=c.stale;SENS.custom=o;SCFG.custom={every:c.every,dwell:c.dwell};}
const sensDisp=new Disp($("sensCanvas"),{id:"cat",cols:0,W:catW()});sensDisp.card="sn:custom";catDisps.push(sensDisp);
prevDisp=new Disp($("jsonPrev"),{id:"cat",cols:0,W:catW()});prevDisp.fill=true;
{const f=$("sensForm");
  f.type.innerHTML=["value","climate","gauge","text"].map(x=>`<option value="${x}"${x===SCUST.type?" selected":""}>${x}</option>`).join("");
  f.icon.innerHTML=Object.keys(SICON).map(x=>`<option value="${x}"${x===SCUST.icon?" selected":""}>${x}</option>`).join("");
  f.every.innerHTML=EVERY.map(([o,l])=>`<option value="${o}"${o===SCUST.every?" selected":""}>${l}</option>`).join("");
  f.dwell.innerHTML=DWELL.map(([o,l])=>`<option value="${o}"${o===SCUST.dwell?" selected":""}>${l}</option>`).join("");
  $("sensScr").innerHTML=scrChips("s","custom");
  for(const k of ["label","value","unit","second","gmin","gmax"])f[k].value=SCUST[k];
  const colOpts=(v,auto)=>(auto?`<option value="auto"${v==="auto"?" selected":""}>automatic</option>`:"")+Object.keys(CUST_COLS).map(k=>`<option value="${k}"${k===v?" selected":""}>${k}</option>`).join("");
  f.col.innerHTML=colOpts(SCUST.col,true);SCUST.bands.forEach(([to,cl,l],i)=>{f["b"+(i+1)+"to"].value=to;f["b"+(i+1)+"col"].innerHTML=colOpts(cl);f["b"+(i+1)+"lbl"].value=l;});
  const read=()=>{Object.assign(SCUST,{type:f.type.value,icon:f.icon.value,every:+f.every.value,dwell:+f.dwell.value,stale:f.stale.checked,col:f.col.value,gmin:f.gmin.value.trim(),gmax:f.gmax.value.trim(),
      bands:[1,2,3].map(i=>[f["b"+i+"to"].value.trim(),f["b"+i+"col"].value,custClean(f["b"+i+"lbl"].value,F3).trim()])});
    {const g=SCUST.type==="gauge";$("gaugeEd").hidden=!g;$("sensSecWrap").hidden=g;$("sensColWrap").hidden=g||SCUST.type==="climate";}
    const fonts={label:F3,value:F5,unit:F3,second:F3};
    for(const k in fonts){const el=f[k],v=custClean(el.value,fonts[k]).slice(0,+el.maxLength||24);if(el.value!==v){const p=el.selectionStart;el.value=v;try{el.setSelectionRange(p,p);}catch(e){}}SCUST[k]=v.trim();}
    $("sensValLbl").textContent=SCUST.type==="text"?"State":"Value";$("sensSecLbl").textContent=SECLBL[SCUST.type];f.unit.disabled=SCUST.type==="climate"||SCUST.type==="text";f.icon.disabled=SCUST.type==="climate";
    sensBuild();$("sensLife").textContent=sLife(SCFG.custom)+(SCUST.stale?". Stale: drawn dim with a red cross until the next update.":"");
    if(live.SN.has("custom"))showMsg(sensorPayload("custom","add"));dirty=true;};
  f.addEventListener("input",read);f.addEventListener("change",read);f.addEventListener("submit",e=>e.preventDefault());read();}
const SUNITS={"°":"°C",KW:"kW",PPM:"ppm","%":"%"};
/* A catalog sensor as v2: the data Home Assistant publishes, and the card that draws it. */
/* The weather sensors are the same data the default boxes read, so sending one changes the display. */
const DEMO_KEY={today:"outside_temperature",forecast:"forecast_hourly",daily:"forecast_daily"};
const sensKey=k=>k==="custom"?"my_sensor":DEMO_KEY[k]||k;
function sensData(k){demoHA();if(DEMO_KEY[k]){const p=poolGet(DEMO_KEY[k]);if(p){const b={v:2,value:p.value};if(p.unit)b.unit=p.unit;if(p.attributes&&Object.keys(p.attributes).length)b.attributes=p.attributes;b.stale_after=1800;return b;}}
  const s=SENS[k],num=v=>{const n=Number(v);return v!==""&&v!=null&&!isNaN(n)?n:v;},u=x=>SUNITS[x]||String(x||"").toLowerCase(),b={v:2};
  if(s.type==="climate")Object.assign(b,{value:num(s.value),unit:"°C",attributes:{humidity:num(s.hum)}});
  else if(s.type==="value"||s.type==="gauge")Object.assign(b,{value:num(s.value),unit:u(s.unit)});
  else if(s.type==="sun"){const n=new Date(),r=atHM(n,s.rise||SUNT.rise),st=atHM(n,s.set||SUNT.set),day=n>=r&&n<st;b.value=day?"above_horizon":"below_horizon";b.attributes={next_rising:isoT(n<r?r:new Date(r.getTime()+864e5)),next_setting:isoT(n<st?st:new Date(st.getTime()+864e5))};}
  else if(s.type==="rooms")b.value=s.items.map(([l,v])=>({label:cap1(l),value:num(v),unit:"°C"}));
  else if(s.type==="departures")b.value=s.items.map(([r,c,d,m,det])=>{const o={route:r||"",destination:capT(d),minutes:+m};if(c)o.color=hex(c);if(det)o.detail=cap1(det);return o;});
  else if(s.type==="ticker")b.value=s.items.map(([l,v,c,ic])=>Object.assign({label:ic?cap1(l):l,value:Number(v)||v,change:Number(c)},ic?{icon:ic}:{}));
  else if(s.type==="temperature"){const d=s.demo?demoWx(live.kind,new Date()):s;b.value=d.temperature;b.unit="°C";b.attributes=JSON.parse(JSON.stringify({apparent_temperature:d.apparent_temperature,high:d.high,low:d.low}));}
  else if(s.type==="forecast"){const p=poolGet(s.period==="daily"?"forecast_daily":"forecast_hourly");b.value=s.demo&&p?p.value:s.items||[];b.unit="°C";}
  else if(s.type==="chart")Object.assign(b,{value:s.values,unit:u(s.unit)});
  else if(s.type==="text")b.value=cap1(s.state);
  b.stale_after=1800;return b;}
function sensCard(k){const s=SENS[k],c={card:s.type==="rooms"?"list":s.type,data:sensKey(k)};if(s.label&&!["text","forecast","sun","departures"].includes(s.type))c.label=s.type==="departures"?capT(s.label):cap1(s.label);
  if(s.icon&&["value","gauge","text","chart"].includes(s.type))c.icon=s.icon;
  if(s.type==="value"){if(s.detail)c.detail=cap1(s.detail);if(s.trend)c.trend=s.trend;}
  else if(s.type==="gauge")Object.assign(c,{min:s.min,max:s.max,bands:s.bands.map(([to,col,l])=>l?{to,color:hex(col),label:cap1(l)}:{to,color:hex(col)})});
  else if(s.type==="departures"&&s.style)c.style=s.style;else if(s.type==="ticker"&&s.cu!=null)c.change_unit=s.cu.toLowerCase();
  else if(s.type==="forecast"&&s.period==="daily")c.period="daily";
  else if(s.type==="chart"){Object.assign(c,{style:s.style,interval:s.interval});if(s.labels)c.labels=s.labels.map(cap1);if(s.max!=null)c.max=s.max;}
  else if(s.type==="text"){c.title=cap1(s.label);if(s.detail)c.detail=cap1(s.detail);if(s.big)c.big={value:s.big,unit:(SUNITS[s.bunit]||String(s.bunit||"").toLowerCase())};}
  if(s.col&&s.type!=="gauge")c.color=hex(s.col);
  if(s.font){if(s.type==="text"){if(c.big)c.big.font=s.font;}else if(["value","temperature","climate","sun"].includes(s.type))c.font=s.font;}return c;}
/* Where Add puts a card: the widest box on this display's active screen that makes room for notices, which is the one that takes turns. */
function addBox(){const Zs=LAYOUT.active[simSize]||[];const z=[...Zs].reverse().find(z=>z.box&&z.w==="*")||[...Zs].reverse().find(z=>z.box);return z?z.box:"more";}
function sensorPayload(k,act){const key=sensKey(k);
  if(act==="add"||act==="remove"){const bx=addBox(),cur=boxGet(bx),cards=(cur?cur.cards:[]).filter(c=>c.data!==key);if(act==="add"){applyData("all",key,sensData(k));cards.push(sensCard(k));}
    const body={v:2,cards};applyBox("all",bx,body);return {topic:"pixelbar/all/box/"+bx,note:(act==="add"?`Adds the card to the ${bx} box, after publishing its data. `:`Takes the card out of the ${bx} box. `)+"Retained.",body:JSON.stringify(body,null,2)};}
  return {topic:"pixelbar/all/data/"+key,note:"Retained. Home Assistant republishes it whenever the reading changes, and a display that reboots gets it straight back.",body:JSON.stringify(sensData(k),null,2)};}
/* Display settings: a mockup of the display's own settings page. It edits LAYOUT for the simulator's size, and the simulator follows. */
let layScr="demo",laySel=0;
const WOPTS=[44,46,50,56,64,84,92,100,110,128,140,150,180,200,240,256,"*"];
const dispName=()=>DS.cur&&DS.list.find(d=>d.id===DS.cur)?slug(DS.list.find(d=>d.id===DS.cur).name):"living-room";
function layoutPayload(){const scr=sc=>{const o={name:sc},d=sdef(sc);for(const k of SCR_KEYS)if(d[k]!==undefined)o[k]=d[k];
    o.boxes=zonesOf(sc,simSize).map(z=>{const b={box:z.box};if(z.w!=="*")b.width=z.w;if(z.accepts&&z.accepts.length)b.accepts=z.accepts;if(z.wide)b.spill="whole";return b;});return o;};
  return {topic:"pixelbar/"+dispName()+"/layout",note:DEMO?"The demo isn't a layout: it's what a display shows before it gets one. Start your own below, or send this with the screen renamed.":"Retained. The display keeps its layout in flash too, so it starts the same way without Home Assistant. It shows the first screen whose rules (when) hold, or the last.",
    body:JSON.stringify({v:2,screens:SCREENS.map(scr)},null,2)};}
/* The screen buttons, in the editor and the simulator's bar. */
const scrLabel=x=>x[0].toUpperCase()+x.slice(1).replace(/[_-]/g," ");
function renderScreens(){const ls=$("layScr");
  if(ls)ls.innerHTML=SCREENS.map(x=>`<button type="button" data-v="${x}" aria-pressed="${x===layScr}">${scrLabel(x)}</button>`).join("")+(DEMO?"":`<button type="button" data-v="__add" aria-pressed="false">+ Add a screen</button>`);
  document.querySelectorAll('.seg[data-key="mode"]').forEach(g=>{g.innerHTML=SCREENS.map(x=>`<button type="button" data-v="${x}" aria-pressed="${x===live.mode}">${scrLabel(x)}</button>`).join("");});}
/* One screen's settings: name, style, background, tint, filter, quiet and brightness. Its rules are in the JSON (when). */
const BG_KINDS=[["sky","The weather sky, full"],["calm","The weather sky, faint"],["solid","A colour"],["gradient","A gradient"],["animated","A moving gradient"],["none","Black"]];
const bgKind=b=>b.type==="sky"?(b.calm?"calm":"sky"):b.type;
function renderScrEd(){const el=$("layScrEd");if(!el)return;
  if(DEMO){el.innerHTML=`<p class="lay-note wide">The demo: what a display shows until it gets its layout, with example data so it's never blank. To build your own, start from the three starter screens (sleep, active and idle) or from one empty screen.</p>
    <div class="acts wide"><button type="button" data-lsact="starters">Start with the starter screens</button><button type="button" data-lsact="blank">Start with an empty screen</button></div>`;return;}
  const d=sdef(layScr),b=bgOf(layScr),k=bgKind(b),cs=b.colors||[b.color||"#0B1A3A","#1D3B6E"],i=SCREENS.indexOf(layScr),last=i===SCREENS.length-1,col=(n,v)=>`<input type="color" data-ls="${n}" value="${v}">`;
  el.innerHTML=`<label class="f"><span class="lbl">Screen name</span><input data-ls="name" value="${layScr}" spellcheck="false" autocomplete="off"></label>
    <label class="f"><span class="lbl">The boxes sit</span><select data-ls="style">${[["panel","Side by side, lines between"],["overlay","Over the background, outlined"],["plain","Plain, with a big clock"]].map(([v,l])=>`<option value="${v}"${styleOf(layScr)===v?" selected":""}>${l}</option>`).join("")}</select></label>
    <label class="f"><span class="lbl">Background</span><select data-ls="bg">${BG_KINDS.map(([v,l])=>`<option value="${v}"${k===v?" selected":""}>${l}</option>`).join("")}</select></label>
    ${k==="solid"?`<label class="f"><span class="lbl">Colour</span>${col("c0",b.color||"#0B1A3A")}</label>`:""}
    ${k==="gradient"||k==="animated"?`<label class="f"><span class="lbl">Colours</span><span class="checks">${col("c0",cs[0])}${col("c1",cs[1])}</span></label>`:""}
    ${k==="animated"?`<label class="f"><span class="lbl">Movement</span><select data-ls="motion"><option value="drift"${b.motion!=="cycle"?" selected":""}>Drifts along</option><option value="cycle"${b.motion==="cycle"?" selected":""}>Fades between them</option></select></label>`:""}
    <label class="f"><span class="lbl">Tint over it</span><span class="checks">${col("tint",d.tint?d.tint.color:"#1FA34A")}<select data-ls="tinta">${[0,10,25,40,50,65].map(v=>`<option value="${v}"${Math.round((d.tint?d.tint.opacity:0)*100)===v?" selected":""}>${v?v+"%":"None"}</option>`).join("")}</select></span></label>
    <label class="f"><span class="lbl">Filter</span><select data-ls="filter">${[["none","None"],["night","Night red"],["dim","Dim"]].map(([v,l])=>`<option value="${v}"${(d.filter||"none")===v?" selected":""}>${l}</option>`).join("")}</select></label>
    <label class="f"><span class="lbl">Brightness</span><select data-ls="brightness"><option value="">The display's</option>${[5,10,25,50,75,100].map(v=>`<option value="${v}"${d.brightness===v?" selected":""}>${v}%</option>`).join("")}</select></label>
    <fieldset class="wide"><div class="checks"><label><input type="checkbox" data-ls="quiet"${d.quiet?" checked":""}> Quiet: notifications wait in the tray and make no sound, unless they list this screen</label></div></fieldset>
    <p class="lay-note wide">${last?"The last screen shows whenever no other screen's rules hold.":"Shows while any of its rules (when) holds"+((d.when||[]).length?`: ${d.when.length} rule${d.when.length>1?"s":""}.`:". It has none yet, so only a notification or the state topic brings it up.")} Edit the rules in the message above.</p>
    <div class="acts wide"><button type="button" data-lsact="up"${i===0?" disabled":""}>Try it earlier</button><button type="button" data-lsact="down"${last?" disabled":""}>Try it later</button><button type="button" data-lsact="dup">Duplicate</button><button type="button" data-lsact="del"${SCREENS.length<2?" disabled":""}>Remove this screen</button></div>`;}
const showScr=x=>{layScr=x;laySel=0;live.mode=x;SCREEN_AUTO=false;renderScreens();syncBars();renderLay();};
/* Display settings is a box editor: each box has a name, a width, the notifications that may borrow it, and the screen's background.
   What a box shows isn't set here; box messages assign cards to it by name, from Home Assistant or the editor. */
const ACC_L=[["notice","Notices"],["advisory","Advisories"],["warning","Warnings"],["status","Status"]];
const setAccepts=(z,a)=>{z.accepts=a;z.take=[...new Set(a.map(t=>TIER_CAT[t]).filter(Boolean))];};
const cardLabel=c=>c.card+(c.data||c.entity?" · "+(c.data||c.entity):c.area?" · area "+c.area:c.card==="text"&&c.title?" · "+c.title:"");
function renderLay(){if(!SCREENS.includes(layScr))layScr=SCREENS[0];renderScrEd();const Zs=zonesOf(layScr,simSize),W=simDisp.W;if(laySel>=Zs.length)laySel=Zs.length-1;
  const fixed=Zs.reduce((a,z)=>a+(z.w==="*"?0:z.w),0),stars=Zs.filter(z=>z.w==="*").length,each=stars?Math.max(0,(W-fixed)/stars):0;
  $("layNote").textContent=`${SIZE_NAME[+simSize.slice(2)][0]} · 1×${simSize.slice(2)} · ${W} px wide`+(fixed>W?`. The fixed boxes add up to ${fixed} px, so the last ones are cut off.`:"");
  $("layBar").innerHTML=Zs.map((z,i)=>{const w=z.w==="*"?each:z.w,b=boxGet(z.box),n=b?b.cards.length:0,tk=z.accepts&&z.accepts.length?"Notifications can borrow it":"";
    return `<button type="button" class="lay-z" data-z="${i}" aria-pressed="${i===laySel}" style="flex:${Math.max(w,34)} 1 0"><b>${z.box}</b><span>${z.w==="*"?"Fill, "+Math.round(each)+" px":z.w+" px"}, ${n?n+" card"+(n>1?"s":""):"empty"}</span>${tk?`<em>${tk}</em>`:""}</button>`;}).join("");
  if(!Zs.length&&!DEMO){$("layEd").innerHTML=`<p class="lay-note wide">No boxes yet, so the display asks to be set up.</p><div class="acts wide"><button type="button" data-lact="add">Add a box</button></div>`;return;}
  const z=Zs[laySel];if(!z){$("layEd").innerHTML="";return;}const b=boxGet(z.box),wo=WOPTS.includes(z.w)?WOPTS:[...WOPTS,z.w].sort((p,q)=>(p==="*")-(q==="*")||p-q);
  if(DEMO){$("layEd").innerHTML=`<p class="lay-note wide"><b>${z.box}</b>: ${b&&b.cards.length?b.cards.map(cardLabel).join(", "):"nothing yet"}.</p>`;return;}
  $("layEd").innerHTML=`<label class="f"><span class="lbl">Name</span><input data-lz="box" value="${z.box}" spellcheck="false" autocomplete="off" aria-describedby="layNameNote"></label>
    <label class="f"><span class="lbl">Width</span><select data-lz="w">${wo.map(o=>`<option value="${o}"${String(o)===String(z.w)?" selected":""}>${o==="*"?"Fill what's left":o+" px"}</option>`).join("")}</select></label>
    <p class="lay-note wide" id="layNameNote">Lowercase letters, digits, _ and -. Every display with a box by this name shows what's sent to it.</p>
    <fieldset class="wide"><legend>Notifications that can borrow it</legend><div class="checks">${ACC_L.map(([t,l])=>`<label><input type="checkbox" data-ltake="${t}"${(z.accepts||[]).includes(t)?" checked":""}> ${l}</label>`).join("")}<label><input type="checkbox" data-lz="wide"${z.wide?" checked":""}> and cover the whole strip</label></div></fieldset>
    <div class="wide box-shows"><span class="lbl">What it shows</span>${b&&b.cards.length?`<ol>${b.cards.map(c=>`<li><code>${cardLabel(c)}</code></li>`).join("")}</ol>`:`<p>Nothing yet. Send a box message to <code>pixelbar/all/box/${z.box}</code>.</p>`}
      <button type="button" data-lact="cards">Edit its cards</button></div>
    <div class="acts wide"><button type="button" data-lact="left"${laySel===0?" disabled":""}>Move left</button><button type="button" data-lact="right"${laySel===Zs.length-1?" disabled":""}>Move right</button><button type="button" data-lact="add">Add a box after it</button><button type="button" data-lact="remove"${Zs.length<2?" disabled":""}>Remove it</button></div>`;}
const layChanged=()=>{renderLay();showMsg(layoutPayload());dirty=true;};
$("layScr").addEventListener("click",e=>{const b=e.target.closest("button[data-v]");if(!b)return;
  if(b.dataset.v==="__add"){let n=1;while(SCREENS.includes("screen"+n))n++;const name="screen"+n;SCREENS.splice(Math.max(0,SCREENS.length-1),0,name);SDEF[name]={style:"overlay",background:"sky"};zonesOf(name,simSize);LAYOUT[name][simSize]=[];showScr(name);layChanged();return;}
  showScr(b.dataset.v);});
const SCR_NAME=/^[a-z0-9_-]{1,32}$/;
$("layScrEd").addEventListener("change",e=>{const el=e.target,k=el.dataset.ls,d=SDEF[layScr];if(!k||!d)return;const b=bgOf(layScr),cs=b.colors||[b.color||"#0B1A3A","#1D3B6E"];
  if(k==="name"){const v=el.value.trim();if(!SCR_NAME.test(v)||v==="demo"||(v!==layScr&&SCREENS.includes(v))){el.setCustomValidity(v==="demo"?'"demo" is taken by the built-in demo':SCREENS.includes(v)?"Another screen has that name":"Lowercase letters, digits, _ and -");el.reportValidity();return;}
    el.setCustomValidity("");SCREENS[SCREENS.indexOf(layScr)]=v;SDEF[v]=d;delete SDEF[layScr];LAYOUT[v]=LAYOUT[layScr];delete LAYOUT[layScr];if(live.mode===layScr)live.mode=v;layScr=v;renderScreens();}
  else if(k==="style")d.style=el.value;
  else if(k==="bg"){const v=el.value;d.background=v==="sky"?"sky":v==="calm"?{type:"sky",calm:true}:v==="none"?"black":v==="solid"?{type:"solid",color:cs[0]}:{type:v,colors:cs.slice(0,2),...(v==="animated"?{motion:"drift",seconds:30}:{})};}
  else if(k==="c0"||k==="c1"){if(b.type==="solid")d.background={type:"solid",color:el.value.toUpperCase()};else{const c=[...cs];c[k==="c0"?0:1]=el.value.toUpperCase();d.background={...b,colors:c};}}
  else if(k==="motion")d.background={...b,motion:el.value};
  else if(k==="tint"||k==="tinta"){const a=k==="tinta"?+el.value/100:d.tint?d.tint.opacity:0.25,c=k==="tint"?el.value.toUpperCase():d.tint?d.tint.color:"#1FA34A";if(a>0)d.tint={color:c,opacity:a};else delete d.tint;}
  else if(k==="filter"){if(el.value==="none")delete d.filter;else d.filter=el.value;}
  else if(k==="brightness"){if(el.value)d.brightness=+el.value;else delete d.brightness;}
  else if(k==="quiet"){if(el.checked)d.quiet=true;else delete d.quiet;}
  layChanged();});
$("layScrEd").addEventListener("click",e=>{const b=e.target.closest("button[data-lsact]");if(!b||b.disabled)return;const a=b.dataset.lsact,i=SCREENS.indexOf(layScr);
  if(a==="starters"||a==="blank"){if(a==="starters")resetScreens(simSize,true);else{SCREENS.splice(0,SCREENS.length,"main");DEMO=false;SDEF={main:{style:"overlay",background:"sky"}};zonesOf("main",simSize);LAYOUT.main[simSize]=[];}
    SCREEN_AUTO=true;live.mode=pickScreen();showScr(a==="starters"?live.mode:"main");SCREEN_AUTO=a==="starters";layChanged();return;}
  if(a==="up"||a==="down"){const j=i+(a==="up"?-1:1);[SCREENS[i],SCREENS[j]]=[SCREENS[j],SCREENS[i]];}
  else if(a==="dup"){let n=2;while(SCREENS.includes(layScr+n))n++;const v=(layScr+n).slice(0,32);SCREENS.splice(i+1,0,v);SDEF[v]=JSON.parse(JSON.stringify(SDEF[layScr]));zonesOf(v,simSize);LAYOUT[v][simSize]=zonesOf(layScr,simSize).map(z=>({...z,show:[...z.show],accepts:[...z.accepts],take:[...z.take]}));layScr=v;}
  else if(a==="del"){SCREENS.splice(i,1);delete SDEF[layScr];layScr=SCREENS[Math.min(i,SCREENS.length-1)];if(!SCREENS.includes(live.mode))live.mode=layScr;}
  renderScreens();syncBars();layChanged();});
$("layBar").addEventListener("click",e=>{const b=e.target.closest("[data-z]");if(!b)return;laySel=+b.dataset.z;renderLay();});
$("layEd").addEventListener("change",e=>{const el=e.target,z=LAYOUT[layScr][simSize][laySel];if(!z)return;
  if(el.dataset.lz==="box"){const v=el.value.trim();if(!/^[a-z0-9_-]{1,32}$/.test(v)){el.setCustomValidity("Lowercase letters, digits, _ and -");el.reportValidity();return;}el.setCustomValidity("");z.box=v;}
  else if(el.dataset.lz==="w")z.w=el.value==="*"?"*":+el.value;else if(el.dataset.lz==="wide")z.wide=el.checked;
  else if(el.dataset.ltake){const t=el.dataset.ltake,a=z.accepts||[];setAccepts(z,el.checked?[...a,t]:a.filter(x=>x!==t));}
  layChanged();});
$("layEd").addEventListener("click",e=>{const b=e.target.closest("button[data-lact]");if(!b||b.disabled)return;const Zs=zonesOf(layScr,simSize),a=b.dataset.lact,z=Zs[laySel];
  if(a==="cards"){const cur=boxGet(z.box);loadJSON({topic:"pixelbar/all/box/"+z.box,note:"Retained. Every display with a box called "+z.box+" shows these cards, taking turns.",body:JSON.stringify({v:2,every:cur?cur.every:10,cards:cur?cur.cards:[{card:"clock"}]},null,2)});return;}
  if(a==="left"||a==="right"){const j=laySel+(a==="left"?-1:1);[Zs[laySel],Zs[j]]=[Zs[j],Zs[laySel]];laySel=j;}
  else if(a==="add"){let n=1;while(Zs.some(x=>x.box==="box"+n))n++;Zs.splice(Zs.length?laySel+1:0,0,Zb("box"+n,Zs.length?64:"*"));laySel=Zs.length>1?laySel+1:0;}else if(a==="remove"){Zs.splice(laySel,1);laySel=Math.max(0,laySel-1);}
  layChanged();});
$("layReset").addEventListener("click",()=>{if(DEMO)return;resetLayout(layScr,simSize);laySel=0;layChanged();});
renderScreens();renderLay();
/* ---------- JSON in: the display's reading of a payload, so any example can be edited, sent and drawn ---------- */
/* ---------- protocol v2: a pool of data, named boxes of cards, layouts made of boxes ----------
   Messages to "all" and to this display are kept apart, and this display's own wins. The simulator answers to any display name. */
function applyData(target,key,b){if(b===null){layerSet(POOL,key,target,null);poolRev++;return "Removed "+key+".";}
  const had=!!poolGet(key);layerSet(POOL,key,target,{value:b.value,unit:b.unit,attributes:b.attributes||{},updated:b.updated,stale_after:b.stale_after,at:Date.now(),rev:++poolRev});autoScreen();return (had?"Updated ":"Added ")+key+".";}
function applyBox(target,name,b){layerSet(BOXES,name,target,b===null?null:{cards:b.cards,every:b.every||10});renderLay();
  return b===null?"Emptied "+name+".":`The ${name} box has ${b.cards.length} card${b.cards.length===1?"":"s"}${LAYOUT_HAS(name)?"":", but this display's layout has no box called "+name+" yet"}.`;}
/* Layout boxes become zones: a zone with a box rotates that box's cards, and its tiers say which notifications may borrow it. */
/* A layout's screens as a list. Layouts from before the list named active, idle and sleep; those keep their old looks. */
function screensList(b){if(Array.isArray(b.screens))return b.screens;
  return ["sleep","active","idle"].filter(n=>b.screens[n]).map(n=>Object.assign({name:n},SDEF_DEFAULT[n],b.screens[n].background?{background:b.screens[n].background}:{},{boxes:b.screens[n].boxes}));}
const SCR_KEYS=["when","style","outline","effects","background","tint","filter","brightness","dim","quiet","clock_style"];
function applyLayout2(b){if(b===null){resetScreens(simSize);live.mode=layScr="demo";laySel=0;renderScreens();renderLay();return "No layout, so the demo screen.";}
  const list=screensList(b),names=list.map(x=>x.name);if(new Set(names).size!==names.length)throw new Error("Two screens have the same name. Each needs its own.");if(names.includes("demo"))throw new Error('"demo" is the screen a display shows before it has a layout. Call yours something else.');
  SCREENS.splice(0,SCREENS.length,...names);DEMO=false;SDEF={};
  for(const x of list){const o={};for(const k of SCR_KEYS)if(x[k]!==undefined)o[k]=x[k];SDEF[x.name]=o;zonesOf(x.name,simSize);LAYOUT[x.name][simSize]=x.boxes.map(z=>Zb(z.box,z.width==null||z.width==="fill"?"*":z.width,z.accepts||[],{spill:z.spill}));}
  if(list.some(x=>x.when&&x.when.length))SCREEN_AUTO=true;
  live.mode=SCREEN_AUTO||!SCREENS.includes(live.mode)?pickScreen():live.mode;if(!SCREENS.includes(layScr))layScr=live.mode;if(!SCREENS.includes(layScr))layScr=SCREENS[0];
  renderScreens();renderLay();syncBars();return `Layout applied to ${SZL[simSize]}: ${names.join(", ")}. Showing ${live.mode}.`;}
/* Where a card's data comes from: a key in the pool (entity ids are keys too), or its own value. */
function cardData(c){if(c.card==="lights"&&!c.data){if(c.area){const e=poolGet("area."+c.area+".light");return e?{...e,key:"area."+c.area+".light"}:{missing:"area."+c.area+".light"};}
    if(c.entities){const es=c.entities.map(k=>[k,poolGet(k)]);return {value:es.map(([k,e])=>e?{name:(e.attributes||{}).friendly_name||k,state:e.value,rgb_color:(e.attributes||{}).rgb_color,brightness:(e.attributes||{}).brightness}:{name:k,state:"unavailable"}),attributes:{},rev:es.reduce((a,[,e])=>a+(e?e.rev:0),0)+0.5};}}
  const k=c.data||c.entity;if(k){const e=poolGet(k);return e?{...e,key:k}:{missing:k};}
  if(c.value!==undefined||c.attributes!==undefined||c.unit!==undefined)return {value:c.value,unit:c.unit,attributes:c.attributes||{}};return null;}
const isStale=d=>!!(d&&d.stale_after&&Date.now()-(d.updated?Date.parse(d.updated):d.at)>d.stale_after*1000);
const HA_SKY=Object.fromEntries(HA_WX.map(([n,k])=>[n,k]));
/* A list of readings (a chart's history) is tested by its highest, so "above 0" means something in the window was. */
function listNum(v){if(!Array.isArray(v))return +v;const ns=v.filter(x=>typeof x==="number"&&isFinite(x));return ns.length?Math.max(...ns):+v[v.length-1];}
function whenOk(c){const w=c.when;if(!w)return true;
  if(w.weather){const cond=live.cond,wet=PRECIP.has(cond);if(!w.weather.some(x=>x==="wet"?wet:HA_SKY[x]===cond))return false;}
  if(w.above===undefined&&w.below===undefined&&w.equals===undefined&&w.not===undefined)return true;
  const d=w.data||w.entity?poolGet(w.data||w.entity):cardData(c);if(!d||d.missing)return false;const v=Array.isArray(d.value)?d.value[d.value.length-1]:d.value,n=listNum(d.value);
  if(w.above!==undefined&&!(n>w.above))return false;if(w.below!==undefined&&!(n<w.below))return false;
  if(w.equals!==undefined&&v!==w.equals)return false;if(w.not!==undefined&&v===w.not)return false;return true;}
/* A card plus its data, in the shape the card renderers draw. Cached until the card or its data changes. */
const NEEDS=new Set(["value","temperature","climate","gauge","chart","forecast","ticker","list","departures","sun","lights","media"]);
const sensCache=new WeakMap();
function cardSens(c,d){const cu=(v,f=F5,b=c)=>up(v,f,b);const hit=sensCache.get(c),rev=d?d.rev||0:-1;if(hit&&hit.rev===rev&&hit.d===d)return hit.o;
  const A=(d&&d.attributes)||{},v=d?d.value:undefined,num=x=>x==null||x===""||!isFinite(+x)?undefined:+x,str=x=>x==null?"":String(x),lbl=cu(c.label||A.label||"",F3),list=Array.isArray(v)?v:[];
  const unit=u=>/^°/.test(String(u||""))?"°":cu(u,F3),fmt=x=>c.decimals!=null&&isFinite(+x)?(+x).toFixed(c.decimals):str(x);let o;
  switch(c.card){
    case "value":o={type:"value",label:lbl,icon:iconName(c.icon||A.icon),value:cu(fmt(v),F5),unit:unit(c.unit!=null?c.unit:d&&d.unit),trend:c.trend,detail:cu(c.detail,F3)};break;
    case "temperature":o={type:"temperature",label:lbl,temperature:num(v)!==undefined?num(v):num(A.temperature),apparent_temperature:num(A.apparent_temperature),high:num(A.high),low:num(A.low)};break;
    case "climate":o={type:"climate",label:lbl,icon:c.icon?iconName(c.icon):undefined,value:str(num(v)!==undefined?+(+v).toFixed(1):v),hum:str(num(A.humidity)!==undefined?Math.round(A.humidity):""),hist:Array.isArray(A.history)?A.history.map(Number).filter(isFinite):null};break;
    case "gauge":o={type:"gauge",label:lbl,icon:iconName(c.icon||A.icon),value:str(v),unit:cu(c.unit!=null?c.unit:d&&d.unit,F3),min:c.min!=null?+c.min:0,max:c.max!=null?+c.max:100,bands:(c.bands||[{to:c.max!=null?+c.max:100,color:c.color||"#5AA2F5"}]).map(x=>[+x.to,rgbOf(x.color)||[110,190,255],cu(x.label,F3)]).sort((p,q)=>p[0]-q[0])};break;
    case "chart":o={type:"chart",label:lbl,icon:iconName(c.icon||A.icon),unit:cu(c.unit!=null?c.unit:d&&d.unit,F3),style:c.style||"area",smooth:!!c.smooth,interval:c.interval||60,values:list.map(Number).filter(isFinite),max:c.max,labels:c.labels?c.labels.map(l=>cu(l,F3)):undefined};break;
    case "forecast":o={type:"forecast",label:lbl,period:c.period==="daily"?"daily":"hourly",items:list.slice(0,c.count||12)};break;
    case "ticker":o={type:"ticker",label:lbl,icon:iconName(c.icon||A.icon),detail:cu(c.detail||A.detail||"",F3),speed:c.speed,cu:typeof c.change_unit==="string"?cu(c.change_unit,F3):undefined,items:list.map(x=>{const ch=+x.change||0;return [cu(x.label),cu(str(x.value)),(ch<0?"":"+")+ch,x.icon];})};break;
    case "list":o={type:"rooms",label:lbl,icon:iconName(c.icon||A.icon),items:list.map(x=>[cu(x.label,F3),str(x.value),x.unit!=null?unit(x.unit):unit(c.unit!=null?c.unit:d&&d.unit),rgbOf(x.color)])};break;
    case "departures":o={type:"departures",label:lbl,every:c.every,style:c.style==="board"?"board":"bullets",items:list.slice(0,24).map(x=>[cu(x.route,F3),rgbOf(x.color),cu(x.destination),String(Math.max(0,Math.round(+x.minutes||0))),cu(x.detail,F3)])};break;
    case "sun":{const at=x=>{const t=new Date(x);return isNaN(t)?null:[t.getHours(),t.getMinutes()];};o={type:"sun",label:lbl,rise:at(A.next_rising),set:at(A.next_setting)};break;}
    case "lights":o={type:"lights",label:lbl||"LIGHTS",icon:iconName(c.icon),items:list.map(x=>[cu(x.name,F3),Array.isArray(x.rgb_color)?x.rgb_color:null,x.state==="on",x.brightness])};break;
    case "media":{const dur=+A.media_duration||0,pos=+A.media_position||0;let at=Date.parse(A.media_position_updated_at)||Date.now();
      /* Players that stop reporting the position while playing would run past the end; then the reported position stands. */
      if(dur&&(Date.now()-at)/1000>dur-pos)at=Date.now();
      o={type:"media",icon:c.icon?iconName(c.icon):undefined,title:cu(A.media_title||""),sub:cu(A.media_artist||"",F3),dur,pos,at,playing:v==="playing"};break;}
    default:o={type:"text",tfont:c.font,label:cu(c.title||c.label||A.label||"",titleFont(c.font)||F5,c),icon:iconName(c.icon||A.icon),state:cu(c.message!=null?c.message:str(v),F3,c),detail:cu(c.detail,F3,c),big:c.big?cu(c.big.value,BIG,c):"",bunit:c.big?cu(c.big.unit,F3,c):"",btop:!!(c.big&&c.big.at==="top"),progress:c.progress,img:Array.isArray(c.images)&&c.images[0]?c.images[0].id:undefined,img2:Array.isArray(c.images)&&c.images[1]?c.images[1].id:undefined};}
  const col=rgbOf(c.color),fnt=c.card==="text"?c.big&&c.big.font:c.font;if(col)o.col=col;if(fnt&&fnt!=="pixel")o.font=fnt;
  if(!(c.card==="text"&&/\{/.test([c.title,c.message,c.detail,c.big&&c.big.value].join(""))))sensCache.set(c,{rev,d,o});return o;}
/* Draws any v2 card into a box. Cards whose data hasn't arrived say which key they're waiting for. */
/* The part a card's "color" paints, where the card has no colour of its own to set (text, value, chart and departures use it directly; a gauge's comes from its bands). */
const COLOR_ROLE={temperature:"value",climate:"value",list:"value",sun:"value",lights:"value",ticker:"value",media:"title"};
function drawCard2(fb,c,x,y,w,h,S){const role=c&&c.color&&COLOR_ROLE[c.card],pal=role?Object.assign({[role]:c.color},c.palette):c&&c.palette;
  return withHalo(fb,c&&c.outline!==undefined?outlineOf(c.outline):undefined,()=>drawCard2b(fb,c,x,y,w,h,S),c&&c.speed,pal);}
function drawCard2b(fb,c,x,y,w,h,S){if(!c||w<=0)return;const scr=S.scr||live.mode,kind=S.wkind||live.kind;
  if(c.card==="clock"){const ps=CLOCK_STYLE,ph=H12;if(c.style)CLOCK_STYLE=c.style;if(c.hours)H12=c.hours===12;try{drawZ(fb,"clock",x,y,w,h,S,scr,kind);}finally{CLOCK_STYLE=ps;H12=ph;}return;}
  if(c.card==="weather"||c.card==="caption"){drawZ(fb,c.card,x,y,w,h,S,scr,kind);return;}
  if(c.card==="date"){fb.pushClip(x,y,w,h);const s=dstr(S.now);fb.textO(F5,s,Math.round(x+(w-fb.tw(F5,s))/2),y+12,[255,236,210]);fb.popClip();return;}
  if(c.card==="image"){fb.pushClip(x,y,w,h);if(IMGS[c.id])drawImg(fb,c.id,Math.round(x+(w-IMGS[c.id].w)/2),y+Math.max(0,Math.floor((h-IMGS[c.id].h)/2)));else waitCard(fb,x,y,w,"PICTURE "+c.id);fb.popClip();return;}
  const d=cardData(c);if(d&&d.missing){fb.pushClip(x,y,w,h);waitCard(fb,x,y,w,d.missing);fb.popClip();return;}
  if(!d&&NEEDS.has(c.card)&&c.card!=="lights"){fb.pushClip(x,y,w,h);waitCard(fb,x,y,w,"DATA");fb.popClip();return;}
  const o=cardSens(c,d),SS=Object.assign({},S,{wkind:kind,scr});fb.pushClip(x,y,w,h);haloed(fb,f=>SRENDER[o.type](f,x,y,w,h,SS,o),x,y,w,h);
  if(isStale(d)){fb.scaleRect(Math.max(0,x),Math.max(0,y),w,h,0.45);staleX(fb,x+w-8,y+2);}fb.popClip();}
function waitCard(fb,x,y,w,what){fb.text(F3,"WAITING FOR",x+3,y+8,[110,115,130]);marquee(fb,F3,up(String(what),F3),x+3,y+16,w-6,[160,165,180],live.t||0);}
/* The cards a box can show right now, as zone keys "bx:<box>:<index>". */
const boxCard=k=>{const i=k.lastIndexOf(":"),b=boxGet(k.slice(3,i));return b?b.cards[+k.slice(i+1)]:null;};
function boxPick(name,t,i){const b=boxGet(name);if(!b)return null;const ok=b.cards.map((c,j)=>[c,j]).filter(([c])=>whenOk(c));if(!ok.length)return null;
  const durs=ok.map(([c])=>Math.max(1,c.show_for||b.every||10)),tot=durs.reduce((a,x)=>a+x,0);let p=(t+i*0.5*(b.every||10))%tot,j=0;while(p>=durs[j]){p-=durs[j];j++;}return "bx:"+name+":"+ok[j][1];}
const rgbOf=h=>{const m=/^#?([0-9a-f]{6})$/i.exec(String(h||""));return m?[0,2,4].map(i=>parseInt(m[1].substr(i,2),16)):null;};
/* Tokens, from the message's own since and until, as of now: the display keeps them current, so Home Assistant publishes once. */
const toks=(v,b={})=>{const now=Date.now(),s=b.since?Date.parse(b.since):NaN,u=b.until?Date.parse(b.until):NaN,el=isNaN(s)?0:Math.max(0,(now-s)/1000),re=isNaN(u)?0:Math.max(0,(u-now)/1000);
  return String(v==null?"":v).replace(/\{elapsed_min\}/g,String(Math.floor(el/60))).replace(/\{elapsed\}/g,Math.floor(el/60)+":"+String(Math.floor(el%60)).padStart(2,"0"))
    .replace(/\{since_time\}/g,isNaN(s)?"":hm(new Date(s))).replace(/\{remaining_min\}/g,String(Math.ceil(re/60))).replace(/\{until_time\}/g,isNaN(u)?"":hm(new Date(u)));};
/* Words for the display in a font: in capitals unless the card or notification says case "as_written". */
const up=(v,f=F5,b)=>fitText(toks(v,b),f,!(b&&b.case==="as_written")).trim();
const TIERS=["critical","warning","alert","notice","advisory","status","nudge"],TIER_RGB={critical:[255,84,70],warning:[255,84,70],alert:[255,190,110],notice:[255,170,70],advisory:[255,206,60],status:[110,190,255],nudge:[120,220,140]};
function applyNotify(key,b,x={}){const ik="json:"+key;
  for(const [k,d] of Object.entries(DEF))if(k!==ik&&(d.key||k)===key&&live.E.has(k))live.clear(k);
  if(b===null){live.clear(ik);return "Cleared "+key+".";}
  if(!TIERS.includes(b.tier))throw new Error('"tier" must be one of: '+TIERS.join(", ")+".");
  if(!b.title)throw new Error('"title" is required.');
  if(b.icon!==undefined&&!ICONS[b.icon])throw new Error(`There's no icon called "${b.icon}". The names are in What you can send.`);
  if(b.font!==undefined&&!FONTS.includes(b.font))throw new Error('"font" must be one of: '+FONTS.join(", ")+".");
  if(b.sensors!==undefined&&(!Array.isArray(b.sensors)||b.sensors.some(x=>typeof x!=="string")))throw new Error('"sensors" must be a list of sensor keys, like ["today", "forecast"].');
  const col=rgbOf(b.color)||TIER_RGB[b.tier],icon=b.icon||"bell",F=()=>({title:up(b.title,titleFont(b.tfont)||F5,b),message:up(b.message,F3,b),detail:up(b.detail,F3,b),big:b.big?up(b.big.value,BIG,b):"",unit:b.big?up(b.big.unit,F3):"",prog:progFrac(b.progress)}),f=F();
  const imgs=[],missing=[];if(b.images!==undefined){if(!Array.isArray(b.images))throw new Error('"images" must be a list: [{ "id": "...", "w": 28, "h": 28, "format": "rgb565", "data": "<base64>" }].');
    for(const o of b.images){if(!o||!o.id)throw new Error('Every picture needs an "id".');if(o.data!==undefined){if(o.format&&o.format!=="rgb565")throw new Error(`Picture ${o.id}: "format" must be "rgb565".`);IMGS[o.id]=dec565(o);}else if(!IMGS[o.id])missing.push(o.id);imgs.push(o.id);}}
  const ic=imgs[0]&&IMGS[imgs[0]]?(fb,cx,cy)=>drawImg(fb,imgs[0],cx-14,cy-14):(fb,cx,cy,t)=>ICONS[icon](fb,cx,cy,t,col);JNOTE[ik]=String(b.title);
  // Drawn fresh each frame, so tokens like {elapsed_min} keep counting.
  CARDS[ik]=()=>{const f=F();return {icon:ic,img:imgs[0],img2:imgs[1],col,title:f.title,l2:f.message,l3:f.detail,big:f.big||undefined,unit:f.unit||undefined,font:b.font,btop:!!(b.big&&b.big.at==="top"),tfont:b.tfont,fkey:ik,prog:f.prog};};
  const nb=()=>{const f=F();return {big:f.big||undefined,unit:f.unit||undefined,font:b.font,prog:f.prog};};
  ADVS[ik]={sev:b.tier==="advisory"?(col[1]<170?"watch":"adv"):"warn",tf:titleFont(b.tfont),ico:b.icon,img:imgs[0],key:ik,get n(){return nb();},col:b.tier!=="advisory"?rgbOf(b.color)||undefined:undefined,get t(){return F().title;},get l1(){return F().message;},get l2(){return F().detail;}};
  ALERTS[ik]={sev:"warn",tf:titleFont(b.tfont),icon:"tri",ico:b.icon,img:imgs[0],key:ik,get n(){return nb();},col:rgbOf(b.color)||undefined,get title(){return F().title;},get l1(){return F().message;},get l2(){return F().detail;},get long(){const f=F();return [f.message,f.detail].filter(Boolean).join(", ");}};
  const cols=Array.isArray(b.colors)?b.colors.map(rgbOf).filter(Boolean):[],secs=clamp(Math.round(+b.seconds||(b.until?(new Date(b.until)-Date.now())/1000:10))||10,1,5999);
  /* The message line with the detail after it, for the animations that have one line; pictures at the strip's ends for the ones with room there. */
  const md=()=>{const g=F();return [g.message,g.detail].filter(Boolean).join("  ");},ends=(fb,S)=>{if(imgs[0])drawImg(fb,imgs[0],2,2);if(imgs[1])drawImg(fb,imgs[1],S.W-30,2);};
  const ANIMS={goal:(fb,S)=>sGoal(fb,Object.assign({},S,{imgs,gcols:cols,gmsg:f.message,gdet:f.detail,gtitle:b.title&&b.title.trim()?up(b.title,F5,b):undefined},Array.isArray(b.score)?{score:b.score}:{})),weather:(fb,S)=>sWeatherNote(fb,S,{title:f.title,sensors:Array.isArray(b.sensors)?b.sensors:null,cards:Array.isArray(b.cards)?b.cards:null}),fireworks:(fb,S)=>{sFireworks(fb,S,{title:f.title,message:md(),colors:cols,cake:b.icon==="cake"});ends(fb,S);},live:(fb,S)=>sLive(fb,S,{title:f.title,message:md(),colors:cols}),raid:(fb,S)=>sRaid(fb,S,{title:f.title,message:md(),colors:cols}),confetti:(fb,S)=>{sConfetti(fb,S,{title:f.title,message:md(),colors:cols});ends(fb,S);},
    red_alert:(fb,S)=>{sRedAlert(fb,S,{title:f.title,message:md(),colors:cols});ends(fb,S);},countdown:(fb,S)=>sCountdown(fb,S,{title:f.title,message:md(),seconds:secs,colors:cols}),flag:(fb,S)=>sFlag(fb,S,{flag:b.flag,title:f.title,message:md()})};
  if(b.flag!==undefined&&!WAVE_FLAGS[b.flag])throw new Error('"flag" must be one of: '+Object.keys(WAVE_FLAGS).join(", ")+".");
  if(b.flags!==undefined&&(!Array.isArray(b.flags)||b.flags.some(x=>!PRIDE[x])))throw new Error('"flags" must be a list from: '+Object.keys(PRIDE).join(", ")+".");
  for(const k in THEMES)ANIMS[k]=(fb,S)=>sHoliday(fb,S,{theme:k,title:f.title,message:md(),flags:b.flags,night:b.night,colors:cols});
  // A Marketplace animation takes the strip like a built-in one; its plugin reads the words, colours and parts from the card each frame.
  if(isPluginKey(b.animation))ANIMS[b.animation]=(fb,S)=>{const pl=animPlugin(b.animation);if(!pl)return;const g=F();Object.assign(pl.P,{title:(g.title||"").trim()?g.title:undefined,message:g.message,detail:g.detail,colors:Array.isArray(b.colors)?b.colors:undefined,parts:b.parts,options:b.options,images:imgs});pl.frame(fb,S.ft!=null?S.ft:S.t);};
  if(b.animation!==undefined&&!ANIMS[b.animation])throw new Error('"animation" must be one of: '+Object.keys(ANIMS).join(", ")+", or a Marketplace animation, mp:<slug>.");
  const anim=b.animation?ANIMS[b.animation]:null,ol=outlineOf(b.outline);
  if(ol!==undefined)CARD_OUTLINE[ik]=ol;else delete CARD_OUTLINE[ik];
  if(b.effects!==undefined)CARD_FX[ik]=b.effects;else delete CARD_FX[ik];
  if(b.speed!==undefined)CARD_SPEED[ik]=b.speed;else delete CARD_SPEED[ik];
  if(b.palette&&typeof b.palette==="object")CARD_PALETTE[ik]=b.palette;else delete CARD_PALETTE[ik];
  const full=anim||((b.tier==="critical"||b.tier==="warning")?(fb,S)=>sAlert(fb,S,ALERTS[ik]):(fb,S)=>{const f=F();sTake(fb,S,{icon:ic,tf:titleFont(b.tfont),title:f.title,msg:f.message,det:f.detail,c0:col,c1:mix(col,[255,255,255],0.45),big:f.big||undefined,unit:f.unit||undefined,font:b.font,prog:f.prog,key:ik});});
  FULL[ik]=(fb,S)=>withHalo(fb,ol,()=>ol?haloed(fb,f=>full(f,S),0,0,S.W,S.H):full(fb,S),b.speed,b.palette);
  const t=b.tier,ongoing=t!=="alert"&&!(t==="notice"&&b.tray!=="until_cleared"),d={tier:t,icon,key,raw:1,card:ik,tray:"mini:"+icon+":"+hex(col),ctl:ongoing?["send","clear"]:["send"]};
  if(t==="critical"||t==="warning"){d.adv=ik;d.full=ik;}else if(t==="advisory")d.adv=ik;else if(t==="alert"){d.full=ik;if(anim){d.notray=1;d.dur=b.animation==="weather"?clamp(Math.round(+b.seconds||60),5,3600):b.animation==="countdown"?secs+4:THEMES[b.animation]||b.animation==="live"||b.animation==="fireworks"||b.animation==="flag"?10:8;}}
  if(t==="notice"&&b.tray==="until_cleared")d.keep=1;
  Object.assign(d,x);
  // An animation that runs to a time (a countdown, a weather round-up) holds the strip that long, unless the message set its own takeover.
  if(d.dur&&d.dl&&b.takeover===undefined)d.dl=Object.assign({},d.dl,{takeover:d.dur});
  DEF[ik]=d;if(b.sound!==undefined)SOUND_OF[ik]=b.sound;else delete SOUND_OF[ik];
  if(Array.isArray(b.screens))SCR.n.set(ik,new Set(b.screens.filter(x=>SCREENS.includes(x))));else SCR.n.delete(ik);
  const note=missing.length?` The display doesn't have ${missing.join(" or ")} yet, so it's drawn without ${missing.length>1?"them":"it"}.`:"";
  if(key.startsWith("__"))return note;if(live.E.has(ik)&&!b.renotify)return "Updated "+key+" in place."+note;
  live.set(ik,simT);return "Sent "+key+"."+note;}
function applySensor(key,b){if(b===null){live.removeSensor(key);return "Removed "+key+".";}
  const types=["value","climate","temperature","forecast","gauge","sun","rooms","ticker","departures","chart","text"];if(!types.includes(b.type))throw new Error('"type" must be one of: '+types.join(", ")+".");
  if(b.icon!==undefined&&!ICONS[b.icon])throw new Error(`There's no icon called "${b.icon}". The names are in What you can send.`);
  const str=v=>v==null?"":String(v),unit=u=>/^°/.test(String(u||""))?"°":up(u,F3),lbl=up(b.label||key,F3);let o;
  if(b.type==="climate")o={type:"climate",label:lbl,value:str(b.temperature),hum:str(b.humidity),seed:(key.length*1.7)%6,amp:2};
  else if(b.type==="value")o={type:"value",label:lbl,icon:b.icon,value:str(b.value),unit:unit(b.unit),detail:up(b.detail,F3)};
  else if(b.type==="gauge"){if(!Array.isArray(b.bands)||!b.bands.length)throw new Error('A gauge needs "bands": [{ "to": 800, "color": "#48C28A", "label": "Good" }, ...].');
    o={type:"gauge",label:lbl,icon:b.icon,value:str(b.value),unit:up(b.unit,F3),min:+b.min||0,max:+b.max||100,bands:b.bands.map(x=>[+x.to,rgbOf(x.color)||[110,190,255],up(x.label,F3)]).sort((p,q)=>p[0]-q[0])};}
  else if(b.type==="sun"){const at=v=>{const d=new Date(v);return isNaN(d)?null:[d.getHours(),d.getMinutes()];};o={type:"sun",label:lbl,rise:at(b.rising),set:at(b.setting)};}
  else if(b.type==="rooms"){if(!Array.isArray(b.items))throw new Error('"rooms" needs "items": [{ "label": "Living", "value": 21.4 }, ...].');o={type:"rooms",label:lbl,items:b.items.map(x=>[up(x.label,F3),str(x.value)])};}
  else if(b.type==="departures"){if(!Array.isArray(b.items))throw new Error('Departures need "items": [{ "route": "1", "color": "#EE352E", "destination": "...", "minutes": 3 }, ...].');
    o={type:"departures",label:lbl,style:b.style==="board"?"board":"bullets",items:b.items.slice(0,6).map(x=>[up(x.route,F3),rgbOf(x.color),up(x.destination),String(Math.max(0,Math.round(+x.minutes||0))),up(x.detail,F3)])};}
  else if(b.type==="ticker"){if(!Array.isArray(b.items))throw new Error('A ticker needs "items": [{ "label": "SHOP", "value": 112.4, "change": 1.8 }, ...].');
    if(b.items.some(x=>x&&x.icon!==undefined&&!ICONS[x.icon]))throw new Error("One of the items has an icon name that doesn't exist. The names are in What you can send.");
    o={type:"ticker",label:lbl,speed:b.speed,detail:up(b.detail,F3),cu:typeof b.change_unit==="string"?up(b.change_unit,F3):undefined,items:b.items.map(x=>{const c=+x.change||0;return [up(x.label),up(x.value),(c<0?"":"+")+c,x.icon];})};}
  else if(b.type==="temperature"){const n=v=>v==null||v===""||!isFinite(+v)?undefined:+v;o={type:"temperature",label:lbl,temperature:n(b.temperature),apparent_temperature:n(b.apparent_temperature),high:n(b.high),low:n(b.low)};}
  else if(b.type==="forecast"){if(!Array.isArray(b.items))throw new Error('A forecast needs "items": the hours or days from weather.get_forecasts.');if(b.items.some(x=>x&&x.condition!==undefined&&!HA_WX.some(h=>h[0]===x.condition)))throw new Error('Each item\'s "condition" must be one of Home Assistant\'s weather states.');
    o={type:"forecast",label:lbl,period:b.period==="daily"?"daily":"hourly",items:b.items.slice(0,12)};}
  else if(b.type==="chart"){if(!Array.isArray(b.values)||b.values.length<2||b.values.some(v=>!isFinite(+v)))throw new Error('A chart needs "values": [numbers, ...], at least two, oldest or soonest first.');
    o={type:"chart",label:lbl,unit:up(b.unit,F3),style:["rain","snow","bars","area"].includes(b.style)?b.style:"area",interval:Math.max(1,+b.interval||60),values:b.values.slice(0,96).map(v=>+v),max:b.max!=null&&isFinite(+b.max)?+b.max:undefined,labels:Array.isArray(b.labels)?b.labels.slice(0,3).map(l=>up(l,F3)):undefined};}
  else o={type:"text",label:lbl,icon:b.icon,state:up(b.state,F3),detail:up(b.detail,F3),big:b.big?up(b.big.value,BIG):"",bunit:b.big?up(b.big.unit,F3):""};
  if(b.font!==undefined&&!FONTS.includes(b.font))throw new Error('"font" must be one of: '+FONTS.join(", ")+".");
  const c=rgbOf(b.color);if(c)o.col=c;o.stale=!!b.stale;if(b.font&&b.font!=="pixel")o.font=b.font;
  SENS[key]=o;SCFG[key]={every:Math.max(5,+b.every||60),dwell:Math.max(2,+b.dwell||8)};
  SCR.s.set(key,new Set(Array.isArray(b.screens)?b.screens.filter(x=>SCREENS.includes(x)):["active","idle"]));
  document.querySelectorAll(`button[data-scr-t="s"][data-scr-k="${key}"]`).forEach(x=>x.setAttribute("aria-pressed",String(scrSet("s",key).has(x.dataset.scr))));
  const L=document.querySelector(`[data-slife="${key}"]`);if(L)L.textContent=sLife(SCFG[key]);
  if(key==="__preview")return "";if(!SCAT.some(r=>r[0]===key))JSENS.add(key);const had=live.SN.has(key);live.addSensor(key);renderLay();return (had?"Updated ":"Added ")+key+".";}
function applyImage(id,b){if(b===null){delete IMGS[id];return "Deleted picture "+id+".";}if(b.format&&b.format!=="rgb565")throw new Error('"format" must be "rgb565".');
  if(b.data===undefined)throw new Error('A picture needs "w", "h", "format": "rgb565" and "data" (base64).');IMGS[id]=dec565(Object.assign({},b,{id}));return `Stored picture ${id}, ${IMGS[id].w} × ${IMGS[id].h}.`;}
const imageMsg=id=>{const b=Object.assign({v:2},imgPayload(id));delete b.id;return {topic:"pixelbar/all/asset/image/"+id,note:"Retained, so a display that reboots gets it back. Cards then name it by id.",body:JSON.stringify(b,null,2)};};
const WX_EX={sunny:{temperature:22,humidity:40,wind_speed:12},"clear-night":{temperature:14,humidity:70,wind_speed:5},hail:{temperature:14,humidity:88,wind_speed:32}};
const EXTRA_HA={heavysnow:"snowy",hot:"sunny",cold:"sunny",smoke:"exceptional",freezing:"snowy-rainy",blizzard:"snowy",drizzle:"rainy",rainbow:"partlycloudy",aurora:"clear-night"};
/* The Code button on a weather state: the example message, with the caption and values the demo draws. */
function weatherMsg(ha){demoHA();const ex=ha.startsWith("extra:"),x=ex?ha.slice(6):null,cond=ex?EXTRA_HA[x]:ha,h=HA_WX.find(e=>e[0]===cond),day=ex?x!=="aurora":h[2]!==undefined?!!h[2]:true,kind=(ex?x:h[1])+(day?"-day":"");
  const body=Object.assign({v:2,condition:cond},ex?{extra:x}:{},{is_day:day,caption:demoWx(kind,new Date()).caption.map(l=>l.replace(/@/g,""))});
  return {topic:"pixelbar/all/weather",note:"Retained. Just the weather and its words; temperatures and the forecast are data."+(ex?" \"extra\" overrides the sky; \"condition\" stays Home Assistant's own state.":""),body:JSON.stringify(body,null,2)};}
function applyWeather(b){if(b===null)return "Nothing to clear; the display keeps its last weather.";
  if(b.caption!==undefined&&(!Array.isArray(b.caption)||b.caption.length>3||b.caption.some(x=>x!=null&&typeof x!=="string")))throw new Error('"caption" must be a list of up to 3 lines of text.');
  const wx={caption:b.caption?b.caption.map((x,i)=>x==null?null:up(x,i<2?F5:F3)):undefined};
  if(b.extra!==undefined){const x=EXTRAS.find(e=>e[0]===b.extra);if(!x)throw new Error('"extra" must be one of: '+EXTRAS.map(e=>e[0]).join(", ")+".");live.cond=x[0];live.wx=wx;if(b.is_day!==undefined)live.day=!!b.is_day;live.syncKind();syncBars();return `Weather set to the ${x[1]} extra, ${live.day?"day":"night"}.`;}
  const h=HA_WX.find(x=>x[0]===b.condition);
  if(!h)throw new Error('"condition" must be one of Home Assistant\'s weather states: '+HA_WX.map(x=>x[0]).join(", ")+".");
  live.cond=h[1];live.wx=wx;live.day=h[2]!==undefined?!!h[2]:(b.is_day!==undefined?!!b.is_day:live.day);live.syncKind();syncBars();return `Weather set to ${b.condition}, ${live.day?"day":"night"}.`;}
/* pixelbar/<room>/theme: a holiday scene in place of the weather sky on idle. An empty message goes back to the weather. */
function applyTheme(b){if(b===null||!b.theme){live.theme=null;live.themeO={};syncBars();return "Back to the weather.";}
  if(!THEMES[b.theme]&&!isPluginKey(b.theme))throw new Error('"theme" must be one of: '+Object.keys(THEMES).join(", ")+", or a Marketplace theme, mp:<slug>.");themeOf(b.theme);
  if(b.flags!==undefined&&(!Array.isArray(b.flags)||b.flags.some(x=>!PRIDE[x])))throw new Error('"flags" must be a list from: '+Object.keys(PRIDE).join(", ")+".");
  if(b.parts!==undefined&&(!b.parts||typeof b.parts!=="object"||Array.isArray(b.parts)))throw new Error('"parts" tunes the scene: { "leaves": { "amount": 200 }, "fireworks": { "on": false } }.');
  live.theme=b.theme;live.themeO={flags:b.flags,night:b.night,parts:b.parts};syncBars();return "Theme set to "+(THEMES[b.theme]||{name:b.theme}).name+"."+(bgOf(live.mode).type==="sky"?"":" It shows on screens with the sky behind them, faint on a faint sky.");}
function themeMsg(k){return {topic:"pixelbar/all/theme",note:"Retained. An empty message goes back to the weather.",body:JSON.stringify(Object.assign({v:2,theme:k},k==="pride"?{flags:["progress","trans","bi","pan","lesbian","nonbinary"]}:k==="hanukkah"?{night:8}:{}),null,2)};}
/* Material Design icon names, as Home Assistant entities carry them, mapped to the nearest PixelBar icon. */
const MDI_RAW={"door-open":"door","door-closed":"door_closed","garage-open":"garage","garage-variant":"garage",lock:"locked","lock-open":"lock","lock-open-variant":"lock",lightbulb:"bulb","lightbulb-on":"bulb","lightning-bolt":"bolt",flash:"bolt","water-alert":"leak","water-percent":"water",fire:"flame","smoke-detector":"smoke","molecule-co2":"co2","weather-sunny":"sun","weather-night":"moon","weather-snowy":"snowflake","ev-station":"charger","solar-power":"solar",television:"tv",cellphone:"phone","gamepad-variant":"game","book-open":"book","washing-machine":"washer","tumble-dryer":"dryer","robot-vacuum":"vacuum",stove:"oven","trash-can":"bin",delete:"bin",recycle:"recycling",bicycle:"bike","subway-variant":"metro",email:"mail",mailbox:"mail",flower:"plant","baby-face":"baby",paw:"pet",information:"info",alert:"warning","alert-circle":"warning","motion-sensor":"motion",run:"motion",account:"person",cctv:"camera","window-closed":"window","window-open":"window","package-variant":"package","package-variant-closed":"package","shield-home":"alarm","home-variant":"home","thermometer-lines":"thermometer","fan-speed-1":"fan","format-font":"font","format-text":"font","alphabetical":"font"};
const iconName=i=>{if(typeof i!=="string")return i===undefined?undefined:"info";const n=i.startsWith("mdi:")?i.slice(4):i;return ICONS[n]?n:ICONS[MDI_RAW[n]]?MDI_RAW[n]:ICONS[n.replace(/-/g,"_")]?n.replace(/-/g,"_"):"info";};
/* A v2 notification. Text and animation cards keep their full drawings; any other card is drawn as itself. */
const CARD2={},USER_KEYS=new Set();
function applyNotify2(key,b){if(b===null){NOTE_SCR.delete(key);autoScreen();return applyNotify(key,null);}
  if(b.screen){NOTE_SCR.set(key,{screen:b.screen,seq:++noteSeq,exp:b.expires?Date.parse(b.expires):0});SCREEN_AUTO=true;}else NOTE_SCR.delete(key);
  const has=b.screen&&SCREENS.includes(b.screen),said=b.screen?(has?` Showing the ${b.screen} screen while it lasts.`:` This display has no ${b.screen} screen, so that part does nothing here.`):"";
  if(!b.card){live.clear("json:"+key);autoScreen();return (has?"Showing the "+b.screen+" screen while "+key+" lasts.":said.trim());}
  const c=b.card,f={case:c.case||b.case,tfont:c.font,tier:b.tier,sound:b.sound,screens:b.screens,tray:b.tray,renotify:b.renotify,outline:c.outline,effects:c.effects,speed:c.speed,palette:c.palette,since:c.since||b.since};
  if(c.card==="animation")Object.assign(f,{title:c.title||" ",message:c.message,detail:c.detail,animation:c.name,colors:c.colors,images:c.images,seconds:c.seconds,until:c.until,flag:c.flag,flags:c.flags,night:c.night,cards:c.cards,score:c.score,parts:c.parts,options:c.options,icon:iconName(c.icon)});
  else if(c.card==="text"){const d=cardData(c),dv=d&&!d.missing&&d.value!=null?String(d.value):undefined;Object.assign(f,{title:c.title||c.label||" ",message:c.message!=null?c.message:dv,detail:c.detail,icon:iconName(c.icon),color:c.color,big:c.big,font:c.big&&c.big.font,images:c.images,until:c.until||b.until,progress:c.progress});}
  else Object.assign(f,{title:c.title||c.label||c.card,icon:iconName(c.icon),color:c.color});
  const ik="json:"+key,x={box:b.box,fallback:!!b.fallback,dl:deliveryOf(b),expiresAt:b.expires?Date.parse(b.expires):0};if(c.card!=="text"&&c.card!=="animation"){CARD2[ik]=c;x.card="c2:"+ik;}
  const msg=applyNotify(key,f,x);autoScreen();if(key!=="__preview"&&b.box&&!b.fallback&&!LAYOUT_HAS(b.box))return `This display has no box called ${b.box}, so it skips ${key}. A display with one shows it there.`+said;return msg+said;}
/* State and settings: what the room is doing picks the screen, using the display's active_when. */
const STATE2={},SET2={};
/* A time window in local time: from after until before (past midnight when before is earlier), on some days. */
const WDAYS=["sun","mon","tue","wed","thu","fri","sat"],hmMin=v=>{const [h,m]=String(v).split(":").map(Number);return h*60+m;};
function timeOk(w,d=new Date()){if(w.days&&!w.days.includes(WDAYS[d.getDay()]))return false;const n=d.getHours()*60+d.getMinutes(),a=w.after?hmMin(w.after):0,b=w.before?hmMin(w.before):1440;return a<=b?n>=a&&n<b:n>=a||n<b;}
/* A rule on a data key (or an entity, sent under its entity id): a number test, equals or not, or with no test, on
   (on, true, playing, home, a number above 0). A time rule holds during its window. A group {all:[...]} holds while every rule in it does. */
function ruleOk(r){if(r.all)return r.all.length>0&&r.all.every(ruleOk);if(r.time)return timeOk(r.time);const d=poolGet(r.data||r.entity);if(!d)return false;const v=Array.isArray(d.value)?d.value[d.value.length-1]:d.value;
  if(r.above!==undefined||r.below!==undefined){const n=listNum(d.value);return isFinite(n)&&(r.above===undefined||n>r.above)&&(r.below===undefined||n<r.below);}
  if(r.equals!==undefined)return v===r.equals;if(r.not!==undefined)return v!==r.not;return v===true||(typeof v==="number"&&v>0)||["on","true","playing","home"].includes(String(v).toLowerCase());}
const scrRuleOk=a=>typeof a==="object"?ruleOk(a):a==="always"||(a==="media"&&(STATE2.media==="playing"||STATE2.media==="paused"))||(a==="presence"&&!!STATE2.presence);
/* Notifications holding a screen up, by key: the newest wins while it lasts. */
const NOTE_SCR=new Map();let noteSeq=0;
function noteScreen(){let best=null;for(const [k,n] of NOTE_SCR){if(n.exp&&Date.now()>=n.exp){NOTE_SCR.delete(k);continue;}if(SCREENS.includes(n.screen)&&(!best||n.seq>best.seq))best=n;}return best&&best.screen;}
/* The state topic's screen, then a notification's, then the first screen whose rules hold; the last screen when none do. */
function pickScreen(){const has=x=>SCREENS.includes(x);if(STATE2.screen&&STATE2.screen!=="auto"&&has(STATE2.screen))return STATE2.screen;if(STATE2.sleep&&has("sleep"))return "sleep";
  const n=noteScreen();if(n)return n;for(const x of SCREENS.slice(0,-1))if((sdef(x).when||[]).some(scrRuleOk))return x;return SCREENS[SCREENS.length-1];}
/* Once anything drives the screen (state, rules, a notification's screen), new data and the clock can change it too. */
let SCREEN_AUTO=false;
function autoScreen(){if(!SCREEN_AUTO)return;const m=pickScreen();if(m!==live.mode){live.mode=m;layScr=m;laySel=0;syncBars();renderLay();}}
function applyState(b){for(const k of ["media","presence","sleep","screen"])delete STATE2[k];if(b)Object.assign(STATE2,b);delete STATE2.v;SCREEN_AUTO=true;live.mode=pickScreen();layScr=live.mode;syncBars();renderLay();return "The display is on "+live.mode+".";}
function applySettings(b){if(!b)return "Settings stay as they are.";if(b.clock_style)CLOCK_STYLE=b.clock_style;if(b.hours)H12=b.hours===12;if(b.buzzer!==undefined)buzzer=b.buzzer;
  /* Settings from before screens had their own rules still work, on the starter screens. */
  if(b.active_when&&SDEF.active)SDEF.active.when=b.active_when;if(b.sleep_when&&SDEF.sleep)SDEF.sleep.when=b.sleep_when;if(b.name)SET2.name=b.name;
  SET2.brightness=b.brightness;SET2.sensors=b.sensors||{};SET2.auto_brightness=b.auto_brightness||{};
  if(b.active_when||b.sleep_when)SCREEN_AUTO=true;if(SCREEN_AUTO)live.mode=pickScreen();layScr=live.mode;syncBars();renderLay();return "Settings applied.";}
function applyUpdate(b){if(!b)return "Nothing to install.";if(b.version===FW.ver)return "Already on "+b.version+".";
  live.sys={k:"update",t0:simT,net:"wifi",from:FW.ver,to:b.version,mqtt:!!BROKER};syncSys();dirty=true;return "Updating from "+FW.ver+" to "+b.version+".";}
function applySound(id,b){if(b===null){delete SND2[id];return "Deleted sound "+id+".";}SND2[id]={rtttl:b.rtttl,steps:b.steps};playSeq(soundSeq(id));return "Saved sound "+id+". Name it in a sound field.";}
function applyV2(r,b){switch(r.kind){case "data":return applyData(r.target,r.name,b);case "box":return applyBox(r.target,r.name,b);case "layout":return applyLayout2(b);case "notify":return applyNotify2(r.name,b);
  case "weather":return applyWeather(b);case "theme":return applyTheme(b);case "state":return applyState(b);case "settings":return applySettings(b);case "update":return applyUpdate(b);case "image":return applyImage(r.name,b);case "sound":return applySound(r.name,b);}return "";}
function sendJSON(empty){const topic=$("jsonTopic").value.trim(),out=$("jsonMsg");
  try{const txt=$("jsonText").value.trim();let b=null;if(!empty&&txt){try{b=JSON.parse(txt);}catch(e){throw new Error("That isn't valid JSON: "+e.message);}}
    const err=v2problem(topic,b);if(err)throw new Error(err);const r=v2route(topic);
    if(BROKER&&BROKER.connected&&$("brSend").checked){BROKER.publish(topic,b?JSON.stringify(b):"",retainFor(r,b));out.dataset.ok="1";out.textContent="Published to the broker. The display shows it when it comes back.";return;}
    if(r.kind==="data")USER_KEYS.add(r.name);const msg=applyV2(r,b);
    out.dataset.ok="1";out.textContent=msg;showMsg({topic,note:"Sent from the editor.",body:b?JSON.stringify(b,null,2):""});refreshUI();dirty=true;}
  catch(e){out.dataset.ok="";out.textContent=e.message;}}
/* The Try it display on a real broker. What arrives goes through the same intake as Send; problems go back as events. */
let BROKER=null;
const retainFor=(r,b)=>r.kind!=="notify"||!b||!["alert"].includes(b.tier)&&!!b.expires;
const SIM_ID=(()=>{try{let v=localStorage.getItem("pixelbar.simid");if(!v){v=Array.from({length:3},()=>Math.floor(Math.random()*256).toString(16).padStart(2,"0")).join("").toUpperCase();localStorage.setItem("pixelbar.simid",v);}return v;}catch(e){return "51E000";}})();
/* The virtual display's I²C bus: the same sensors a PixelBar board carries, with made-up readings. */
const SIM_SENSORS=[{id:"board_temp",kind:"temperature",unit:"°C",chip:"SHT40",addr:"0x44",name:"Board temperature"},{id:"board_humidity",kind:"humidity",unit:"%",chip:"SHT40",addr:"0x44",name:"Board humidity"},
  {id:"lux",kind:"illuminance",unit:"lx",chip:"VEML7700",addr:"0x10",name:"Light"}];
const SIM_T0=Date.now();
/* Readings that behave like the real thing: light follows the time of day, and the board warms with brightness. */
function simTelemetry(){const now=new Date(),h=now.getHours()+now.getMinutes()/60,day=Math.max(0,Math.sin((h-6.5)/13*Math.PI)),lux=Math.round(2+day*520+Math.random()*12);
  const ab=SET2.auto_brightness||{},mn=ab.min||5,mx=ab.max||100,dk=ab.dark_lux??3,br=ab.bright_lux||600;
  const bright=SET2.brightness==null||SET2.brightness==="auto"?Math.round(mn+(mx-mn)*clamp((Math.log10(Math.max(lux,0.1))-Math.log10(Math.max(dk,0.1)))/(Math.log10(br)-Math.log10(Math.max(dk,0.1))),0,1)):+SET2.brightness;
  const temp=+(30.5+bright*0.13+Math.sin(Date.now()/600000)*0.6).toFixed(1),vals={board_temp:temp,board_humidity:Math.round(34-(temp-30)*0.7),lux};
  const on=id=>!(SET2.sensors&&SET2.sensors[id]&&SET2.sensors[id].enabled===false),sensors={};for(const x of SIM_SENSORS)if(on(x.id))sensors[x.id]=vals[x.id];
  return {v:2,sensors,brightness:bright,rssi:-48-Math.round(Math.random()*8),uptime:Math.round((Date.now()-SIM_T0)/1000),heap:180000+Math.round(Math.random()*4000),simulated:true,at:new Date().toISOString()};}
const simInfo=name=>({v:2,id:SIM_ID,name,firmware:"pixelbar-site",version:FW.ver,virtual:true,sensors:SIM_SENSORS,size:simSize,width:simDisp.W,protocols:[2],boxes:[...new Set(SCREENS.flatMap(sc=>(LAYOUT[sc][simSize]||[]).map(z=>z.box)))],network:"wifi"});
function brokerIn(topic,txt,name){const r=v2route(topic);if(!r||["info","event","status"].includes(r.kind)||(r.target!=="all"&&r.target!==name))return;
  let b=null;if(txt.length){try{b=JSON.parse(txt);}catch(e){BROKER.event({event:"rejected",topic,reason:"That isn't valid JSON."});return;}}
  const err=v2problem(topic,b);if(err){BROKER.event({event:"rejected",topic,reason:err});return;}
  if(r.kind==="data")USER_KEYS.add(r.name);
  try{const msg=applyV2(r,b);showMsg({topic,note:"From the broker. "+msg,body:b?JSON.stringify(b,null,2):""});if(r.kind==="layout")BROKER.info();refreshUI();dirty=true;}
  catch(e){BROKER.event({event:"rejected",topic,reason:e.message});}}
const brSaved=()=>{try{return JSON.parse(localStorage.getItem("pixelbar.broker")||"{}");}catch(e){return {};}};
const brSave=auto=>{try{localStorage.setItem("pixelbar.broker",JSON.stringify({url:$("brUrl").value.trim(),name:$("brName").value.trim(),user:$("brUser").value.trim(),auto}));}catch(e){}};
{const s=brSaved();$("brUrl").value=s.url||"";$("brName").value=s.name||"";$("brUser").value=s.user||"";}
$("brGo").addEventListener("click",async()=>{const st=$("brState");
  if(BROKER){const b=BROKER;BROKER=null;brSave(false);$("brGo").textContent="Connect";st.textContent="Not connected";st.dataset.ok="";await b.end();return;}
  brConnect();});
/* Joins the broker in the fields. A display that was connected when the page closed joins again on the next visit. */
async function brConnect(){const st=$("brState");if(BROKER)return;
  const url=$("brUrl").value.trim(),name=$("brName").value.trim()||dispName();if(!/^wss?:\/\//.test(url)){st.textContent="The broker is a ws:// or wss:// address.";return;}
  if(!/^[a-z0-9_-]{1,32}$/.test(name)){st.textContent="The name is lowercase letters, digits, _ and -.";return;}
  if(location.protocol==="https:"&&url.startsWith("ws:")){st.textContent="From an https page the broker needs wss://.";return;}
  brSave(true);st.textContent="Connecting…";$("brGo").textContent="Disconnect";
  try{const {connectBroker}=await import("./broker.js");BROKER=connectBroker({url,name,username:$("brUser").value.trim(),password:$("brPass").value,info:()=>simInfo(name),
    onMessage:(t,txt)=>brokerIn(t,txt,name),onStatus:(text,ok)=>{st.textContent=text;st.dataset.ok=ok?"1":"";}});
    BROKER.name=name;try{BROKER.host=new URL(url).hostname;}catch(e){}
    clearInterval(brConnect.tele);brConnect.tele=setInterval(()=>{if(BROKER&&BROKER.connected)BROKER.publish(`pixelbar/${name}/telemetry`,JSON.stringify(simTelemetry()),true);},15000);}
  catch(e){st.textContent="Couldn't load the MQTT client: "+e.message;$("brGo").textContent="Connect";}}
/* What a data message looks like on a card, guessed from its shape, for the preview. */
function dataCard(key,b){const v=b.value,A=b.attributes||{},o=Array.isArray(v)&&v.find(x=>x&&typeof x==="object")||{},label=key.replace(/^[a-z_]+\./,"").replace(/_/g," ");
  const card=A.media_title!==undefined?"media":A.next_rising!==undefined?"sun":Array.isArray(v)?(typeof v[0]==="number"?"chart":"datetime" in o?"forecast":"route" in o?"departures":"change" in o?"ticker":"state" in o&&"name" in o?"lights":"list"):typeof v==="number"?(/°/.test(b.unit||"")?"temperature":"value"):"text";
  return card==="text"?{card,title:label,value:v,attributes:A}:{card,label,value:v,unit:b.unit,attributes:A};}
const ANIM_EX={weather:{v:1,key:"morning_weather",tier:"alert",animation:"weather",title:"Good morning",sensors:["today","forecast"],seconds:300,sound:"chime"},live:{v:1,key:"twitch_live",tier:"alert",animation:"live",title:"FireBall1725 is live",message:"Building an LED display, come hang out",colors:["#9146FF"],sound:"rising"},raid:{v:1,key:"twitch_raid",tier:"alert",animation:"raid",title:"From FireBall1725",message:"42 viewers",colors:["#FF5046"],sound:"alert"},red_alert:{v:1,key:"red_alert",tier:"critical",animation:"red_alert",title:"Red alert",message:"Tornado warning",sound:"alarm"},
  countdown:{v:1,key:"new_year",tier:"alert",animation:"countdown",title:"Happy new year",message:"2027",seconds:10,sound:"done"},
  flag:{v:1,key:"canada_day",tier:"alert",animation:"flag",flag:"canada",title:"Happy Canada Day",message:"1 July",sound:"chime"},
  confetti:{v:1,key:"offer",tier:"alert",animation:"confetti",title:"You did it",message:"Offer accepted",colors:["#FF7C45","#48C28A","#5AA2F5","#E8B53A"],sound:"rising"}};
const titleCase=s=>s.toLowerCase().replace(/\b[a-z]/g,m=>m.toUpperCase()).replace(/ Of /g," of ").replace(/'S\b/g,"'s");
function animExample(n){if(THEMES[n]){const b=Object.assign({v:1,key:n,tier:"alert",animation:n,title:titleCase(THEMES[n].title)},n==="remembrance"?{message:"11 November",sound:"none"}:{sound:"chime"},n==="pride"?{flags:["rainbow","trans","bi","pan"]}:{});return {topic:"pixelbar/all/notify/"+n,note:"",body:JSON.stringify(v2Notify(b),null,2)};}if(n==="goal")return payloadFor("goal","send");if(n==="fireworks")return payloadFor("bday","send");const b=ANIM_EX[n];return {topic:"pixelbar/all/notify/"+b.key,note:"",body:JSON.stringify(v2Notify(b),null,2)};}
/* Edit loads a message into the editor beside the list; on a phone the editor slides up as a sheet. */
let lastNote="";
function loadJSON(p){$("jsonTopic").value=p.topic;$("jsonText").value=p.body||"";if(ED)ED.setValue($("jsonText").value);$("jsonMsg").textContent="";lastNote=p.note||"";edTab("json");if(matchMedia("(max-width: 819px)").matches)edOpen(true);jsonPreview();}
$("jsonText").value=JSON.stringify({v:2,tier:"alert",sound:"siren",card:{card:"text",icon:"leak",title:"Water leak",message:"Under the laundry sink",color:"#5AA0FF"}},null,2);
$("jsonSend").addEventListener("click",()=>sendJSON(false));$("jsonEmpty").addEventListener("click",()=>sendJSON(true));
$("jsonTidy").addEventListener("click",()=>{try{$("jsonText").value=JSON.stringify(JSON.parse($("jsonText").value),null,2);if(ED)ED.setValue($("jsonText").value);$("jsonMsg").textContent="";}catch(e){$("jsonMsg").dataset.ok="";$("jsonMsg").textContent="That isn't valid JSON: "+e.message;}});
/* The Code button on every card and builder: the card's payload, with a way into the editor. */
$("viewTry").addEventListener("click",e=>{const b=e.target.closest("button[data-code]");if(!b)return;e.preventDefault();const k=b.dataset.k;if(b.dataset.code==="w"){loadJSON(weatherMsg(k));return;}if(b.dataset.code==="i"){loadJSON(imageMsg(k));return;}if(b.dataset.code==="ic"){loadJSON(iconMsg(k));return;}if(b.dataset.code==="ct"){loadJSON({topic:"pixelbar/all/box/example",note:"Retained. A box message with one card and its data inline.",body:JSON.stringify({v:2,cards:[typeCard(k,TYPE_EX[k])]},null,2)});return;}if(b.dataset.code==="snd"){loadJSON(soundMsg(k));return;}if(b.dataset.code==="tune"){loadJSON(tuneMsgs(+k)[0]);return;}if(b.dataset.code==="a"){loadJSON(animExample(k));return;}if(b.dataset.code==="t"){loadJSON(themeMsg(k));return;}loadJSON(b.dataset.code==="n"?payloadFor(k,DEF[k].ctl.includes("set")?"set":"send"):sensorPayload(k,"show"));});
/* Captions for the looks and assets cards, in the same order as a notification card: a name, the value you'd send, what it looks like, the fields it reads, then the buttons. */
const cardCap=({title,key,life,src,desc,fields,btns,chars})=>`<div class="cat-head"><b>${title}</b>${key?`<code class="keychip">${key}</code>`:""}${life?`<span class="life">${life}</span>`:""}</div>${src?`<p class="src">${src}</p>`:""}<p>${desc}</p>${chars?`<p class="chars">${chars.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"})[c])}</p>`:""}${fields&&fields.length?`<p class="fields">Reads ${fields.map(f=>`<code>${f}</code>`).join(" ")}</p>`:""}${btns?`<div class="acts">${btns}</div>`:""}`;
const WXNICE={clear:"Sunny and clear night",pcloudy:"Partly cloudy",overcast:"Cloudy",fog:"Fog",windy:"Windy",windyc:"Windy and cloudy",rain:"Rainy",pouring:"Pouring",lightning:"Lightning",storm:"Lightning and rain",hail:"Hail",snow:"Snowy",sleet:"Snowy and rainy",exceptional:"Exceptional"};
const WXDESC={clear:"The sun and a warm glow by day; a clear night with stars and a faint aurora.",pcloudy:"The sun or the moon with clouds drifting past.",overcast:"A low band of grey cloud.",fog:"Bands of fog drifting across.",windy:"Streaks of wind and a few fast clouds.",windyc:"Wind streaks under a heavy band of cloud.",
  rain:"Steady rain falling through cloud.",pouring:"Heavy, fast rain.",lightning:"Dark cloud with flashes of lightning and no rain.",storm:"Rain with lightning.",hail:"Hailstones bouncing.",snow:"Snow falling and settling along the bottom.",sleet:"Rain and snow mixed.",exceptional:"A warning-tinted sky for weather out of the ordinary.",
  heavysnow:"Twice the flakes, big ones in front, a sideways drift and deeper settled snow.",hot:"An orange sky with heat shimmer.",cold:"Frost creeping in from the edges, with crystals glinting.",smoke:"A brown-orange haze, the sun as a dim red disc, ash falling.",freezing:"Rain with icicles along the top and a glaze of ice along the bottom.",
  blizzard:"Heavy, wind-driven snow with slow white-outs.",drizzle:"Fine, sparse, slow rain.",rainbow:"An arc across a clearing sky; at night, a faint white moonbow.",aurora:"The northern lights across the whole strip."};
const THDESC={new_year:"Gold and silver fireworks with glitter falling.",valentines:"Hearts rising, with a big one beating.",lunar_new_year:"Red lanterns swaying on strings, gold sparkles and firecracker bursts.",pancake_day:"A pancake flipping out of a pan, and a stack with butter, syrup and lemon.",st_patricks:"Shamrocks drifting, and a rainbow into a pot of gold.",holi:"Clouds of coloured powder bursting and drifting.",
  easter:"A spring sky, painted eggs in the grass, tulips and a hopping bunny.",eid:"A crescent moon and star, with lanterns hanging and glowing.",pride:"A waving flag across the whole strip, changing every 6 seconds.",canada_day:"A Canadian flag waving on a pole, red and white fireworks, maple leaves falling.",fourth_of_july:"A US flag waving on a pole, with red, white and blue fireworks.",
  thanksgiving:"Autumn leaves tumbling at dusk, pumpkins and a hay bale.",halloween:"A full moon, bats, ghosts drifting by and jack-o'-lanterns on the hills.",dia_de_muertos:"Papel picado, a sugar skull, marigold petals and candles.",diwali:"A row of diyas flickering along the bottom, fireworks above.",remembrance:"Poppies falling slowly and one large poppy. Nothing flashes or bounces.",hanukkah:"A menorah with the candles for the night lit; its candles and flames take their own colours and flicker.",christmas:"A lit tree with presents, snow falling, and bulbs on a wire along the top."};
/* What you can send: every Home Assistant weather state, day and night. */
const wxDisps=[];
for(const [name,c] of [["sunny / clear-night","clear"],...HA_WX.filter(([n])=>n!=="sunny"&&n!=="clear-night"),...EXTRAS.map(([k,n])=>[n+" (extra)",k])]){
  const fig=document.createElement("figure"),pair=document.createElement("div"),cap=document.createElement("figcaption");pair.className="pair";
  for(const day of [1,0]){const cv=document.createElement("canvas");cv.setAttribute("role","img");cv.setAttribute("aria-label",`${name}, ${day?"day":"night"}`);pair.append(cv);const d=new Disp(cv,{id:"wx",cols:0,W:128});d.kind=c+(day?"-day":"");wxDisps.push(d);}
  const ex=name.includes("(extra)"),ha=ex?"extra:"+c:name.split(" / ")[0],nice=WXNICE[c]||(name.replace(" (extra)","").replace(/^./,m=>m.toUpperCase()));
  catOut("wx",{id:ha,title:nice,look:{kind:c+"-day"},chip:ex?"extra: "+c:name.replace(" / ",", "),src:"pixelbar/all/weather",desc:WXDESC[c]||"",msgs:()=>[weatherMsg(ha)],show:"plain"});
  cap.innerHTML=cardCap({title:nice,key:ex?"extra: "+c:name.replace(" / ",", "),life:ex?"PixelBar extra, day and night":"Day and night",src:"pixelbar/all/weather",desc:WXDESC[c]||"",fields:[ex?"extra":"condition","is_day","temperature","high","low","caption","forecast"],btns:`<button type="button" data-code="w" data-k="${ha}">Edit JSON</button>`});fig.append(pair,cap);$("wxGrid").append(fig);}
/* What you can send: every icon at both sizes, and the full-screen animations. */
const iconDisps=[];
/* Icons and pictures are tiles: the LEDs, the name to send, where it comes from, and buttons to copy the name or open an example. */
const iconTag=n=>STREAM_ICONS[n]?"Streaming":THEME_ICONS[n]?"Holiday":"";
function tile(grid,label,name,tag,info,btn){const fig=document.createElement("figure"),cv=document.createElement("canvas"),cap=document.createElement("figcaption");fig.className="tile";cv.setAttribute("role","img");cv.setAttribute("aria-label",label);
  cap.innerHTML=`<div class="tile-h"><code>${name}</code>${tag?`<span class="tag">${tag}</span>`:""}</div>${info?`<p>${info}</p>`:""}<div class="acts"><button type="button" data-copy="${name}">Copy</button>${btn}</div>`;fig.append(cv,cap);$(grid).append(fig);return cv;}
for(const n of Object.keys(ICONS)){catOut("icons",{id:n,title:n.replace(/_/g," "),chip:"icon: "+n,icon:n,look:{icon:n,W:36},desc:"",msgs:()=>[iconMsg(n)],show:"notify"});const d=new Disp(tile("iconGrid",`The ${n} icon, on a card and in the tray`,n,iconTag(n),"",`<button type="button" data-code="ic" data-k="${n}">Edit JSON</button>`),{id:"icon",cols:0,W:36});d.icon=n;iconDisps.push(d);}
for(const [id,name] of PICS){catOut("pics",{id,title:name,look:{pic:id,W:32},chip:"image: "+id,desc:`The ${name} crest, 28 × 28. Send it once, then name it in a card's images.`,show:"notify",
  msgs:()=>[imageMsg(id),{topic:"pixelbar/all/notify/crest_"+id.replace(/-/g,"_"),note:"",body:JSON.stringify({v:2,tier:"notice",card:{card:"text",images:[{id}],title:name,message:"A card with the crest"}},null,2)}]});const d=new Disp(tile("picGrid",`The ${name} crest, ${id}`,id,"Crest",`${name}, 28 × 28`,`<button type="button" data-code="i" data-k="${id}">Edit JSON</button>`),{id:"icon",cols:0,W:32});d.pic=id;iconDisps.push(d);}
const iconMsg=n=>({topic:"pixelbar/all/notify/my_"+n,note:"",body:JSON.stringify({v:2,tier:"notice",card:{card:"text",icon:n,title:n.replace(/_/g," "),message:"Sent from Home Assistant"}},null,2)});
const soundMsg=k=>({topic:"pixelbar/all/notify/"+k+"_test",note:"",body:JSON.stringify({v:2,tier:"notice",sound:k,card:{card:"text",icon:"bell",title:SOUNDS[k][0],message:"Plays "+k}},null,2)});
for(const [k,n,title,desc,fields] of [["goal","goal","Goal","The crest, GOAL! in the team's colours, confetti, then the score.",["colors","images","message","detail"]],["bday","fireworks","Fireworks","Bursts in your colours with the title dropping in, and a cake when the icon is cake.",["title","message","colors","icon"]],
  ["golive","live","Going live","A LIVE pill with pulsing rings, the title, and the stream title scrolling in the platform colour.",["title","message","colors"]],["raid","raid","Raid","Chevrons race across, RAID! drops in and shakes, then who it's from and how many came.",["title","message","colors"]],
  ["redalert","red_alert","Red alert","Red bars sweep out from the middle around the title. It breathes; it never flashes.",["title","message"]],["countdown","countdown","Countdown","Big numbers down to zero with a shrinking bar, then a burst and the title.",["seconds","until","title","message"]],
  ["canadaflag","flag","Flag","A full-height flag unfurls and waves beside the title: Canada by default, or the US or any pride flag.",["flag","title","message"]],
  ["confetti","confetti","Confetti","A burst from the middle, then confetti in your colours, with the title dropping in.",["title","message","colors"]],
  ["morningwx","weather","Weather","The sky full screen with the title, then the sensors you list (or this screen's own), for as long as you set.",["title","sensors","seconds"]]]){const fig=document.createElement("figure"),cv=document.createElement("canvas"),cap=document.createElement("figcaption");
  catOut("anims",{id:n,title,chip:"animation: "+n,look:{card:"full:"+k},src:"pixelbar/all/notify/<key>",desc,fields,msgs:()=>[animExample(n)],show:"notify"});
  cv.setAttribute("role","img");cv.setAttribute("aria-label",`The ${title} animation`);cap.innerHTML=cardCap({title,key:`animation: ${n}`,src:"pixelbar/all/notify/<key>",desc,fields,btns:`<button type="button" data-code="a" data-k="${n}">Edit JSON</button>`});fig.append(cv,cap);$("animGrid").append(fig);
  const d=new Disp(cv,{id:"cat",cols:0,W:catW()});d.card="full:"+k;catDisps.push(d);}
/* Sounds are rows: the notes drawn as bars (height is pitch, width is length), then the name, what it's for, and play. */
const soundBars=seq=>{const tot=seq.reduce((a,[,d])=>a+d,0)||1;let x=0,r="";for(const [f,d] of seq){if(f>0){const h=3+25*clamp(Math.log2(f/300)/Math.log2(4200/300),0,1);r+=`<rect x="${(x/tot*100).toFixed(2)}" y="${(30-h).toFixed(1)}" width="${Math.max(0.6,d/tot*100-0.6).toFixed(2)}" height="${h.toFixed(1)}" rx=".6"/>`;}x+=d;}return `<svg class="snd-bars" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">${r}</svg>`;};
$("soundRow").innerHTML=Object.entries(SOUNDS).filter(([k])=>k!=="none").map(([k,[l,seq,use]])=>{const dur=seq.reduce((a,[,d])=>a+d,0),n=seq.filter(([f])=>f>0).length;
  catOut("sounds",{id:k,title:l,chip:"sound: "+k,desc:(use?use[0].toUpperCase()+use.slice(1)+". ":"")+`${n} note${n===1?"":"s"}, ${dur.toFixed(1)} s.`,sound:k,msgs:()=>[soundMsg(k)],show:"notify"});
  return `<figure>${soundBars(seq)}<figcaption>${cardCap({title:l,key:`sound: ${k}`,life:`${n} note${n===1?"":"s"}, ${dur.toFixed(1)} s`,desc:use?use[0].toUpperCase()+use.slice(1)+".":"",btns:`<button type="button" class="primary" data-play="${k}">▶ Play</button><button type="button" data-code="snd" data-k="${k}">Edit JSON</button>`})}</figcaption></figure>`;}).join("");
/* Custom sounds: RTTTL inline, a tune saved once and named after, exact tones, and a pattern repeated. [id, title, what it shows, the sound field, the saved tune] */
const TUNES=[["rtttl","Your own tune","Any RTTTL tune, inline: a name, then d= the default note length, o= the octave and b= beats a minute, then the notes. Up to 128 notes.",{rtttl:"laundry:d=8,o=6,b=160:c,e,g,c7,p,g,4c7"}],
  ["dingdong","Ding dong","Two notes a third apart, like a doorbell. A dot makes a note half as long again.",{rtttl:"dingdong:d=4,o=5,b=100:e6,2c.6"}],
  ["fanfare","Fanfare","Sixteenths up to a long high note, with a rest (p) before it.",{rtttl:"fanfare:d=16,o=5,b=140:g,c6,e6,8g6,p,e6,2g6"}],
  ["saved","A tune saved by name","Sent once on pixelbar/all/asset/sound/<id>, retained, so every display keeps it. Any sound field then names it, like a built-in.","front_door",{id:"front_door",rtttl:"frontdoor:d=8,o=6,b=180:e,g,c7,p,c7,g,4e"}],
  ["steps","Exact tones","Frequency in Hz and length in milliseconds, 0 Hz for a rest. For a tone RTTTL can't name.",{steps:"3968:150,0:300,2381:150"}],
  ["repeat","A pattern, repeated","Any built-in pattern up to 10 times, with a short gap between.",{pattern:"alarm",repeat:3}]];
const tuneSpec=t=>t[4]?{rtttl:t[4].rtttl}:t[3];
function tuneMsgs(i){const [k,title,,snd,saved]=TUNES[i],note={topic:"pixelbar/all/notify/tune_"+k,note:"",body:JSON.stringify({v:2,tier:"notice",sound:snd,card:{card:"text",icon:"music",title,message:"Plays "+(saved?"the saved tune":"its own tune")}},null,2)};
  return saved?[{topic:"pixelbar/all/asset/sound/"+saved.id,note:"Retained, so a display that reboots still has it.",body:JSON.stringify({v:2,rtttl:saved.rtttl},null,2)},note]:[note];}
TUNES.forEach((t,i)=>{const [k,title,desc,snd,saved]=t,seq=soundSeq(tuneSpec(t)),dur=seq.reduce((a,[,d])=>a+d,0);
  catOut("sounds",{id:"tune_"+k,title,chip:saved?"sound: "+snd:Object.keys(snd)[0],desc,sound:tuneSpec(t),msgs:()=>tuneMsgs(i),show:"notify"});
  $("soundRow").insertAdjacentHTML("beforeend",`<figure>${soundBars(seq)}<figcaption>${cardCap({title,key:saved?`sound: ${snd}`:Object.keys(snd).map(x=>`${x}: ${snd[x]}`).join(", "),life:`${dur.toFixed(1)} s`,desc,
    btns:`<button type="button" class="primary" data-tune="${i}">▶ Play</button><button type="button" data-code="tune" data-k="${i}">Edit JSON</button>`})}</figcaption></figure>`);});
$("soundRow").addEventListener("click",e=>{const b=e.target.closest("[data-play]");if(b)playSeq(soundSeq(b.dataset.play));const tb=e.target.closest("[data-tune]");if(tb)playSeq(soundSeq(tuneSpec(TUNES[+tb.dataset.tune])));});
/* Every font the strip draws, each showing every character it has. Pixel is three sizes: big numbers, words, and the small print under them. */
const fontDisps=[];
const WORDS_MSG=k=>()=>[{topic:"pixelbar/all/box/main",note:"Retained. A text card: the title is in the pixel words face, the line under it in the small one.",
    body:JSON.stringify({v:2,cards:[{card:"text",title:"Pixel words",message:"and the small print"}]},null,2)}];
const NUM_MSG=(k,title)=>()=>[{topic:"pixelbar/all/box/main",note:"Retained. A value card in this font; a layout's clock_style takes the same names.",
    body:JSON.stringify({v:2,cards:[{card:"value",label:"In "+title.toLowerCase(),value:"12:45",font:k}]},null,2)}];
for(const [k,title,chip,note,msgs,fields=["font","clock_style"]] of [
  ["big","Pixel, big","font: pixel","The clock, big numbers and big words in the default font, 13 LEDs tall, with the same characters as the words face.",NUM_MSG("pixel","Pixel"),["font","clock_style","big"]],
  ["pixel","Pixel words","font: pixel","Titles and words, 7 LEDs tall: all of ASCII, Latin accents, Cyrillic and Greek, symbols (stars, hearts, suits, arrows, weather), box drawing and blocks that join into lines and bars, and half-width katakana; kana typed as hiragana or katakana shows too. Words show in capitals; case as_written keeps lowercase and accents as typed. A character it hasn't got shows as a hollow box.",WORDS_MSG(),["title","label","case"]],
  ["small","Pixel, small","small print","Labels, units and messages under a title, 5 LEDs tall. Capitals and ASCII only: lowercase shows as capitals and accents drop.",WORDS_MSG(),["message","unit"]],
  ["flip","Split-flap","font: flip","Dark tiles that flip when a character changes. Numbers alone get the big digits; with letters, every tile is the words face doubled.",NUM_MSG("flip","Split-flap")],
  ["nixie","Nixie","font: nixie","Glowing tubes with the other numerals ghosting behind. Digits, a minus, a point and a colon; any other character is an unlit tube.",NUM_MSG("nixie","Nixie")],
  ["space","Space","font: space","A heavy, rounded geometric face, capitals 14 LEDs tall, with lowercase, descenders and Latin accents. For a text card's title, big numbers and the clock.",NUM_MSG("space","Space"),["font","clock_style"]],
  ["retro64","Retro64","font: retro64","An 8 × 8 home-computer face in the style of the '80s machines: 2-LED uprights, lowercase with descenders, card suits, box drawing and Latin accents. A text card's title, or numbers and the clock at double size.",NUM_MSG("retro64","Retro64"),["font","clock_style"]],
  ["alagard","Alagard","font: alagard","A medieval blackletter face, 12 LEDs above the baseline, with descenders. By Hewett Tsoi (dafont.com/alagard.font), free to use with credit. A text card's title, big numbers and the clock.",NUM_MSG("alagard","Alagard"),["font","clock_style"]],
  ["celtic","Celtic Bit","font: celtic","Rounded medieval capitals drawn like brush strokes, 8 LEDs above the baseline. By Mirz (scriptmonkeys.us), free for personal and commercial projects with credit. A text card's title, big numbers and the clock.",NUM_MSG("celtic","Celtic Bit"),["font","clock_style"]],
  ["comicoro","Comicoro","font: comicoro","A thin, slanted, hand-drawn comic face. By jeti (dafont.com/comicoro.font), CC BY 4.0. A text card's title, or numbers and the clock at double size.",NUM_MSG("comicoro","Comicoro"),["font","clock_style"]],
  ["segment","7-segment","font: segment","An LED segment display in the card's colour, the unlit segments faintly there. Digits, the letters a segment display can make, a point after a digit and a colon; any other character is an unlit digit.",NUM_MSG("segment","7-segment")]]){
  const fig=document.createElement("figure"),cv=document.createElement("canvas"),cap=document.createElement("figcaption");
  const chars={big:charsText(BIG),pixel:charsText(F5),small:charsText(F3),flip:charsText(BIG),space:charsText(SPACE),retro64:charsText(R64),alagard:charsText(ALAGARD),celtic:charsText(CELTIC),comicoro:charsText(COMICORO),nixie:"Digits: 0123456789   Signs: -.:",segment:"Digits: 0123456789   Letters: AbCcdEFGHhIJLnoPqrStUuy   Signs: -_=°'\".:"}[k];
  // The catalogue lists the pixel face once, with its three sizes; this page keeps a sheet for each.
  if(k==="pixel")catOut("fonts",{id:k,title:"Pixel",chip,look:{font:k,W:128},desc:"The default face in three sizes: big, 13 LEDs tall, for the clock, big numbers and big words; words, 7 tall, for titles and labels; and the small print under them, 5 tall, capitals and ASCII only. All of ASCII, Latin accents, Cyrillic and Greek, symbols, box drawing that joins into lines and bars, and half-width katakana. Words show in capitals unless case is as_written; a character it hasn't got is a hollow box.",
    fields:["font","clock_style","big","title","label","case","message","unit"],show:"card",msgs,chars});
  else if(k!=="big"&&k!=="small")catOut("fonts",{id:k,title,chip,look:{font:k,W:128},desc:note,fields,show:"card",msgs,chars});
  cv.setAttribute("role","img");cv.setAttribute("aria-label",`Every character in ${title}`);cap.innerHTML=cardCap({title,key:chip,desc:note,fields})+`<label class="fonttry"><span>Try it</span><input type="text" data-fonttry="${k}" placeholder="Type something to see it in this font" autocomplete="off" spellcheck="false"></label>`;fig.append(cv,cap);$("fontGrid").append(fig);const d=new Disp(cv,{id:"cat",cols:0,W:128});d.font=k;fontDisps.push(d);
  cap.querySelector("[data-fonttry]").addEventListener("input",e=>{d.sample=e.target.value.trim();});}
/* Card types: one card per sensor "type", drawn from an example of it, with the fields it needs and the ones it can use. */
/* Card types: each one as a box message with its data inline, so the example draws on its own. Cards from the catalog's sensors use that sensor's data. */
const TYPE_EX={};
function typeCard(t,ex){if(t==="lights")return {card:"lights",area:"living_room"};if(t==="media")return {card:"media",entity:"media_player.living_room_tv"};
  const c=sensCard(ex),d=sensData(ex);delete c.data;c.value=d.value;if(d.unit&&["value","gauge","chart","list"].includes(t))c.unit=d.unit;if(d.attributes)c.attributes=d.attributes;return c;}
for(const [t,title,ex,desc,reads,opt] of [["value","Value","office","One reading with its unit and a trend arrow.",["value","unit"],["label","icon","trend","detail","decimals","color","font"]],
  ["climate","Climate","outside","Temperature, humidity and a 24-hour line.",["value","attributes.humidity","attributes.history"],["label","icon","color","font"]],
  ["temperature","Temperature","today","Temperature, feels like, high and low. Its icon follows the weather on screen.",["value","attributes.apparent_temperature","attributes.high","attributes.low"],["label","color","font"]],
  ["forecast","Forecast","forecast","Hours, or days with period daily, each with its weather icon. The list is weather.get_forecasts as it comes.",["value"],["period","count"]],
  ["gauge","Gauge","co2","A bar with coloured bands and words for each.",["value","unit"],["min","max","bands","label","icon","color"]],
  ["sun","Sun","sun","The next sunrise or sunset, with a countdown. Point it at sun.sun.",["attributes.next_rising","attributes.next_setting"],["color","font"]],
  ["list","List","rooms","Many readings on one card.",["value: label, value, unit"],["label","icon","color"]],
  ["ticker","Ticker","stocks","A scrolling line of items, each with its change in green or red.",["value: label, value, change"],["change_unit","label","icon","detail","speed"]],
  ["departures","Departures","nyc","Transit rows: route, destination, minutes and a note.",["value: route, destination, minutes, detail"],["style","color","speed"]],
  ["chart","Chart","rain","A series as an area or bars.",["value: numbers","unit"],["style","interval","labels","max","smooth","label","icon","color"]],
  ["text","Text","washer","Words, with an optional big number. Bound to data, the message is the value.",["value"],["title","message","detail","big","progress","images","icon","color"]],
  ["lights","Lights","","Lights in their own colours. The integration fills it from an area or a list of entities.",["value: name, state, rgb_color, brightness"],["area","entities","label","icon","color"]],
  ["media","Media","","What a media player is playing, with a bar that moves on its own.",["state","attributes.media_title","attributes.media_artist","attributes.media_position"],["entity","icon","color","speed"]]]){
  const fig=document.createElement("figure"),cv=document.createElement("canvas"),cap=document.createElement("figcaption");cv.setAttribute("role","img");cv.setAttribute("aria-label",`The ${title} card`);
  catOut("types",{id:t,title,chip:"card: "+t,look:{card:"c2:type:"+t},src:"In a box: pixelbar/all/box/<name>",desc,fields:[...reads,...opt],show:"card",
    msgs:()=>[{topic:"pixelbar/all/box/main",note:"Retained. A box message with one card and its data inline.",body:JSON.stringify({v:2,cards:[typeCard(t,TYPE_EX[t])]},null,2)}]});
  const chips=a=>a.map(f=>`<code>${f}</code>`).join(" ");TYPE_EX[t]=ex;CARD2["type:"+t]=t==="temperature"?{card:t,data:"outside_temperature"}:t==="forecast"?{card:t,data:"forecast_hourly"}:typeCard(t,ex);
  cap.innerHTML=cardCap({title,key:`card: ${t}`,src:"In a box: pixelbar/all/box/<name>",desc}).replace('<div class="acts">','')+`<p class="fields">Reads ${chips(reads)}</p><p class="fields">Options ${chips(opt)}</p><div class="acts"><button type="button" data-code="ct" data-k="${t}">Edit JSON</button></div>`;
  fig.append(cv,cap);$("typeGrid").append(fig);const d=new Disp(cv,{id:"cat",cols:0,W:catW()});d.card="c2:type:"+t;catDisps.push(d);}
/* What you can send: the holiday themes, as the idle screen shows them. */
const thDisps=[];
for(const [k,th] of Object.entries(THEMES)){catOut("themes",{id:k,title:th.name,chip:"theme: "+k,look:{theme:k},src:"pixelbar/all/theme",desc:THDESC[k]||"",msgs:()=>[themeMsg(k)],show:"plain"});const fig=document.createElement("figure"),cv=document.createElement("canvas"),cap=document.createElement("figcaption");cv.setAttribute("role","img");cv.setAttribute("aria-label",`The ${th.name} theme`);
  cap.innerHTML=cardCap({title:th.name,key:`theme: ${k}`,life:"Idle sky, or a notification",src:"pixelbar/all/theme",desc:THDESC[k]||"",fields:["theme",...(k==="pride"?["flags"]:k==="hanukkah"?["night"]:[])],btns:`<button type="button" data-code="t" data-k="${k}">Theme JSON</button><button type="button" data-code="a" data-k="${k}">Animation JSON</button>`});fig.append(cv,cap);$("thGrid").append(fig);
  const d=new Disp(cv,{id:"cat",cols:0,W:catW()});d.theme=k;thDisps.push(d);}
/* The catalogue in the Try it sidebar's order, every message built now: for pages that list the examples without this one's DOM.
   A notification's screens and expiry are this page's, so they're left out. */
const CAT_SECTIONS=[["Notifications",[["doors","Doors and security"],["weather","Weather alerts"],["house","Around the house"],
    ["fun","Sport and celebrations","Full-strip animations, with images like team crests from Team Tracker."],["stream","Streaming and socials","For streamers and creators. The sources are suggestions."],
    ["kids","For a home with kids","Ideas for a home with kids. The sources are suggestions."]]],
  ["Sensors",[["s-climate","Weather and climate"],["s-energy","Home and energy"],["s-money","Money"],["s-transit","Transit"],["s-stream","Streaming and socials"]]],
  ["Cards",[["types","Card types","How a card draws its data, with the fields each one reads."]]],
  ["Looks",[["wx","Weather skies","Every Home Assistant weather state, by day and by night."],["themes","Holiday themes","Replace the weather sky. Send one on pixelbar/all/theme, or as a notification animation."],
    ["fonts","Fonts","Set font on a card, or clock_style in a display's layout."],["anims","Animations","Full-strip animations a notification can play."]]],
  ["Assets",[["icons","Icons","Every icon. Send it by name in icon."],["pics","Pictures","Sent once on pixelbar/all/asset/image/<id>, then named by id."],["sounds","Sounds","The built-in patterns by name, then your own: RTTTL, a tune saved by name, exact tones, or a pattern repeated."]]]];
function catalogue(){
  const msg=m=>{let p=null;try{p=m.body?JSON.parse(m.body):null;}catch(e){}if(p&&/\/notify\//.test(m.topic)){delete p.screens;delete p.expires;}
    return {topic:m.topic,note:m.note||"",retain:/retained/i.test(m.note||"")&&!/not retained/i.test(m.note||""),payload:p};};
  return CAT_SECTIONS.map(([group,secs])=>({group,sections:secs.map(([id,title,sub])=>({id,title,sub:sub||"",items:(CAT_OUT[id]||[]).map(o=>({id:o.id,title:o.title,chip:o.chip||"",
    src:o.src||"",desc:o.desc||"",fields:o.fields||[],icon:o.icon||"",sound:o.sound||null,look:o.look||null,show:o.show,chars:o.chars||"",msgs:o.msgs().map(msg)}))}))}));}
const galleryDisps=[stageDisp,...lineup],all=[...galleryDisps,...tlDisps,...catDisps,simDisp,...iconDisps,...wxDisps,...thDisps,...fontDisps,prevDisp];

/* Where it goes: everything in millimetres, drawn to scale. A 16:9 screen of diagonal d is d*16/hypot(16,9) wide; the 34" ultrawide is 21.5:9 and the 49" is 32:9.
   Doors are 813 x 2032 mm with 70 mm trim, a light switch sits 1200 mm up, and a wall-hung strip is centred 1550 mm off the floor. */
const MONITORS={"24":[[24,16,9]],"27":[[27,16,9]],"34":[[34,21.5,9]],"49":[[49,32,9]],"2x27":[[27,16,9],[27,16,9]]};
const scr=(d,a,b)=>{const k=d*25.4/Math.hypot(a,b);return [a*k,b*k];};
function layoutStage(){const sz=byId(state.size),dW=sz.cols*160,dH=80,P=[],box=(cls,x,y,w,h,inner="")=>P.push({cls,x,y,w,h,inner});let SW,SH,sx,sy,rel;
  if(state.place==="tv"){const [tvW,tvH]=scr(state.tv,16,9),M=170,top=80,gap=90;SW=Math.max(tvW,dW)+2*M;SH=top+tvH+gap+dH+110;
    box("tv",(SW-tvW)/2,top,tvW,tvH,`<div class="screen"><span class="tv-label">${state.tv}″ TV · ${Math.round(tvW)} × ${Math.round(tvH)} mm</span></div>`);sx=(SW-dW)/2;sy=top+tvH+gap;
    rel=["Against the TV",dW>tvW?`${dW-Math.round(tvW)} mm wider than the TV`:`${Math.round(dW/tvW*100)}% of the TV's width`];}
  else if(state.place==="monitor"){const ms=MONITORS[state.mon].map(([d,a,b])=>scr(d,a,b)),mh=ms[0][1],mw=ms.reduce((t,[w])=>t+w,0)+(ms.length-1)*12,M=170,top=70,lift=150,deskY=top+mh+lift;
    SW=Math.max(mw,dW)+2*M;SH=deskY+40+90;let x=(SW-mw)/2;
    box("prop-desk",0,deskY,SW,40);
    for(const [w,h] of ms){box("prop-neck",x+w/2-30,top+h-10,60,lift+10);box("prop-base",x+w/2-120,deskY-14,240,14);
      box("tv",x,top,w,h,ms.length===1?`<div class="screen"><span class="tv-label">${state.mon}″ monitor · ${Math.round(w)} × ${Math.round(h)} mm</span></div>`:'<div class="screen"></div>');x+=w+12;}
    sx=(SW-dW)/2;sy=top+mh+30;const what=ms.length>1?"the pair of monitors":"the monitor";
    rel=["Against "+(ms.length>1?"the monitors":"the monitor"),dW>mw?`${dW-Math.round(mw)} mm wider than ${what}`:`${Math.round(dW/mw*100)}% of the width of ${what}`];}
  else{const M=260,top=220,fr=70,doorW=813,doorH=2032,floor=top+fr+doorH,dx=M;SW=M+doorW+2*fr+520+dW+M;SH=floor+150;
    box("prop-floor",0,floor,SW,150);box("prop-skirt",0,floor-100,SW,100);
    box("prop-frame",dx,top,doorW+2*fr,fr+doorH);box("prop-door",dx+fr,top+fr,doorW,doorH,'<div class="prop-panel" style="inset:6% 12% 56% 12%"></div><div class="prop-panel" style="inset:50% 12% 6% 12%"></div>');
    box("prop-knob",dx+fr+doorW-110,top+fr+doorH-1000-30,60,60);box("prop-switch",dx+doorW+2*fr+110,floor-1200-58,70,115);
    box("prop-label",dx,floor+30,doorW+2*fr,60,"Door 813 × 2032 mm");
    sx=dx+doorW+2*fr+520;sy=floor-1550-dH/2;rel=["Against a door",`${(dW/doorW).toFixed(1)}× the width of an 813 mm door`];}
  const pct=(v,t)=>(v/t*100)+"%";
  propsEl.innerHTML=P.map(o=>`<div class="${o.cls}" style="left:${pct(o.x,SW)};top:${pct(o.y,SH)};width:${pct(o.w,SW)};height:${pct(o.h,SH)}">${o.inner}</div>`).join("");
  /* Tall scenes (the wall) are capped at 640 px high so the page doesn't turn into one picture. */
  const dpr=window.devicePixelRatio||1,availCss=Math.min($("stageWrap").clientWidth,640*SW/SH),natural=availCss*dpr*2.5/SW,lp=natural>=1?Math.floor(natural):natural;
  stage.style.width=(SW*lp/(2.5*dpr))+"px";stage.style.aspectRatio=`${SW} / ${SH}`;
  Object.assign(stageCanvas.style,{left:pct(sx,SW),top:pct(sy,SH)});
  Object.assign(dimline.style,{left:pct(sx,SW),width:pct(dW,SW),top:pct(sy+dH+34,SH)});
  $("dimText").textContent=`${dW} mm`;
  if(lp>=1)stageDisp.resizePitch(lp);else{stageDisp.cssW=0;stageDisp.resize(dW*lp/(2.5*dpr));}
  const n=sz.cols;
  const facts=[["Model",`${SIZE_NAME[n][1]} (${SIZE_NAME[n][0]}), 1×${n}`],["Size",`${dW} × ${dH} mm`],rel,["Resolution",`${n*64} × 32 px`],["Panels",`${n} × 64×32 P2.5`],["Power at full white",`up to ${n*12} W (12 W per panel)`],["Text height","5×7 text 17.5 mm · clock 32.5 mm"]];
  $("facts").innerHTML=facts.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join("");dirty=true;}
/* A card in a list shows its preview across the top, up to 560 px. */
const prevW=d=>{const f=d.canvas.parentElement;return f.closest(".rows")?f.clientWidth-24:f.clientWidth;};
function layoutRacks(){for(const [rid,ds] of [["rack",lineup],["tlRack",tlDisps]]){const w=$(rid).clientWidth;if(!w)continue;const p=w/640;for(const d of ds)d.resize(d.W*p);}
  for(const d of catDisps){const w=prevW(d);if(w)d.resize(w);}
  for(const d of wxDisps){const w=d.canvas.clientWidth;if(w)d.resize(w);}
  for(const d of thDisps){const w=prevW(d);if(w)d.resize(w);}
  if(prevDisp){const w=prevDisp.canvas.parentElement.clientWidth;if(w)prevDisp.resize(w);}
  for(const d of fontDisps){const w=prevW(d);if(w)d.resize(w);}
  const sw=$("simWrap").clientWidth-28;if(sw>0)simDisp.resize(Math.min(sw,simDisp.W*5));dirty=true;}

document.querySelectorAll(".seg[data-key]").forEach(seg=>{const key=seg.dataset.key;
  seg.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    seg.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));const v=b.dataset.v;
    if(key==="tv"){state.tv=+v;walk.screen=true;walk.sized=true;layoutStage();const r=recSize();if(r)setSize(r);renderWalk();}
    else if(key==="mon"){state.mon=v;walk.screen=true;walk.sized=true;layoutStage();const r=recSize();if(r)setSize(r);renderWalk();}
    else if(key==="place"){state.place=v;walk.place=v;walk.screen=false;for(const k of ["tv","mon"])pressSeg(k,null);$("ctl-tv").hidden=v!=="tv";$("ctl-mon").hidden=v!=="monitor";layoutStage();renderWalk();}
    else if(key==="wx"){V=VARIANTS[v];buildTracks();renderEvents();}
    else if(key==="simsize"||key==="wiresize"){setSize(v);}
    else if(key==="mode"){showScr(v);refreshUI();}
    else if(key==="simwx"){live.cond=v;live.syncKind();}
    else if(key==="simsky"){live.day=v==="day";live.wx=null;live.syncKind();}
    else if(key==="clock"){H12=v==="12";}
    else{state[key]=+v;if(key==="bits"||key==="dim")buildLUT();}
    syncBars();dirty=true;});});
/* One size for the whole page: picking it on either tab sets both. */
function setSize(v){state.size=v;simSize=v;stageDisp.setSize(byId(v));simDisp.setSize(byId(v));
  const cw=catW();for(const d of [...catDisps,...thDisps,prevDisp]){const w=cw;if(d&&d.W!==w)d.setSize({id:"cat",cols:0,W:w});}
  for(const k of ["simsize","wiresize"])document.querySelectorAll(`.seg[data-key="${k}"] button`).forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===v)));
  layoutStage();layoutRacks();drawWiring();drawPins();drawS3Pins();drawAdapter();renderLay();if(typeof renderWalk==="function")renderWalk();}

/* How it's wired: panels from behind, two per chain, one controller board with the S3 and the RP2350B on it. */
function refreshHz(ppc){const shift=ppc*64/20e6;let row=0;for(let k=0;k<12;k++)row+=Math.max(shift,100e-9*2**k);return 1/(row*16);}
function drawWiring(){const svg=$("wireSvg");if(!svg)return;const n=byId(state.size).cols,ch=Math.ceil(n/2),W=1200,gap=8;
  const pw=Math.min(190,(W-120-(n-1)*gap)/n),ph=pw/2,total=n*pw+(n-1)*gap,x0=(W-total)/2,py=78,pb=py+ph;
  const px=i=>x0+i*(pw+gap),col=c=>`var(--ch${c+1})`;let h="";
  h+=`<text x="${x0}" y="30" class="wl">5 V to every panel's power socket</text>`;
  h+=`<path d="M${x0+pw/2} 46 H${px(n-1)+pw/2}" class="pw"/>`;
  for(let i=0;i<n;i++)h+=`<path d="M${px(i)+pw/2} 46 V${py}" class="pw"/>`;
  for(let i=0;i<n;i++){const c=Math.floor(i/2),first=i%2===0,x=px(i);
    h+=`<rect x="${x}" y="${py}" width="${pw}" height="${ph}" rx="3" class="panel-r" style="stroke:${col(c)}"/>`;
    h+=`<text x="${x+pw/2}" y="${py+ph/2+4}" text-anchor="middle" class="wt">P${i+1}</text>`;
    h+=`<rect x="${x+4}" y="${pb-16}" width="16" height="10" rx="2" class="port"/><text x="${x+12}" y="${pb-20}" text-anchor="middle" class="wl small">IN</text>`;
    h+=`<rect x="${x+pw-20}" y="${pb-16}" width="16" height="10" rx="2" class="port"/><text x="${x+pw-12}" y="${pb-20}" text-anchor="middle" class="wl small">OUT</text>`;
    if(!first) h+=`<path d="M${px(i-1)+pw-12} ${pb-6} C ${px(i-1)+pw-12} ${pb+22}, ${x+12} ${pb+22}, ${x+12} ${pb-6}" class="dl" style="stroke:${col(c)}"/>`;}
  // controller board: ESP32-S3-MINI-1 on the left, RP2354B on the right, quad SPI between them on the PCB
  const bw=760,bh=176,bx=(W-bw)/2,by=pb+120,cy=by+46,chh=84,cw=280,sx=bx+30,rx=bx+bw-30-cw;
  h+=`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="10" class="board"/>`;
  h+=`<text x="${bx+bw-18}" y="${by+bh-14}" text-anchor="end" class="wl">Controller board: both chips on one PCB</text>`;
  h+=`<rect x="${sx}" y="${cy}" width="${cw}" height="${chh}" rx="6" class="chipbox"/><text x="${sx+cw/2}" y="${cy+36}" text-anchor="middle" class="wt">ESP32-S3-MINI-1</text><text x="${sx+cw/2}" y="${cy+58}" text-anchor="middle" class="wl">WiFi, MQTT, draws every frame</text>`;
  h+=`<rect x="${rx}" y="${cy}" width="${cw}" height="${chh}" rx="6" class="chipbox"/><text x="${rx+cw/2}" y="${cy+36}" text-anchor="middle" class="wt">RP2354B</text><text x="${rx+cw/2}" y="${cy+58}" text-anchor="middle" class="wl">panel refresh, PIO, 12-bit</text>`;
  h+=`<path d="M${sx+cw} ${cy+chh/2} H${rx}" class="spi"/><text x="${(sx+cw+rx)/2}" y="${cy+chh/2-10}" text-anchor="middle" class="wl">quad SPI + SWD</text>`;
  for(let c=0;c<5;c++){const qx=rx+24+c*((cw-48)/4),used=c<ch;
    h+=`<rect x="${qx-11}" y="${by-6}" width="22" height="14" rx="2" class="${used?"cport":"port"}" ${used?`style="fill:${col(c)}"`:""}/>`;
    h+=`<text x="${qx}" y="${by+24}" text-anchor="middle" class="wl small">${used?"chain "+(c+1):"free"}</text>`;
    if(used){const ax=px(c*2)+12,midY=pb+56+c*6;h+=`<path d="M${qx} ${by-6} V${midY} H${ax} V${pb-6}" class="dl" style="stroke:${col(c)}"/>`;}}
  // sensors, sound and USB hang off the S3
  const items=[["SHTC3","temp + humidity","I2C"],["VEML7700","light level","I2C"],["PCF8563","clock, coin cell","I2C"],["STEMMA QT","add-on sensors","I2C"],["16 MB flash","images, assets","SPI"],["Ethernet","W5500, or DNP","SPI"],["Passive buzzer","PWM, any pitch","PWM"],["USB-C","flashing, logs","USB"]];
  const iw=134,ig=10,tot=items.length*iw+(items.length-1)*ig,ix0=(W-tot)/2,iy=by+bh+84,busY=iy-30,s3x=sx+cw/2;
  h+=`<path d="M${s3x} ${cy+chh} V${by+bh} V${busY} " class="dl" style="stroke:var(--bus)"/><path d="M${ix0+iw/2} ${busY} H${ix0+(items.length-1)*(iw+ig)+iw/2}" class="dl" style="stroke:var(--bus)"/>`;
  items.forEach(([t,sub,bus],k)=>{const x=ix0+k*(iw+ig);h+=`<path d="M${x+iw/2} ${busY} V${iy}" class="dl" style="stroke:var(--bus)"/><text x="${x+iw/2+6}" y="${busY+18}" class="wl small">${bus}</text>`;
    h+=`<rect x="${x}" y="${iy}" width="${iw}" height="60" rx="8" class="sensor"/><text x="${x+iw/2}" y="${iy+26}" text-anchor="middle" class="wt sm">${t}</text><text x="${x+iw/2}" y="${iy+46}" text-anchor="middle" class="wl small">${sub}</text>`;});
  const hx=20;h+=`<rect x="${hx}" y="${cy+6}" width="170" height="70" rx="8" class="ha"/><text x="${hx+85}" y="${cy+36}" text-anchor="middle" class="wt">Home Assistant</text><text x="${hx+85}" y="${cy+56}" text-anchor="middle" class="wl">WiFi or Ethernet</text>`;
  h+=`<path d="M${hx+170} ${cy+41} H${sx}" class="wifi"/>`;
  const px2=W-200,amps=n*2.5,psu=Math.ceil(amps*1.2);
  h+=`<rect x="${px2}" y="${cy-6}" width="180" height="${chh+12}" rx="8" class="psu"/><text x="${px2+90}" y="${cy+26}" text-anchor="middle" class="wt">5 V supply</text><text x="${px2+90}" y="${cy+48}" text-anchor="middle" class="wl">${psu} A or more</text><text x="${px2+90}" y="${cy+66}" text-anchor="middle" class="wl">${n*12} W at full white</text>`;
  h+=`<path d="M${px2+180} ${cy+chh/2} H${W-12} V46 H${px(n-1)+pw/2}" class="pw"/><path d="M${px2} ${cy+chh/2+26} H${bx+bw}" class="pw"/>`;
  const ly=iy+60+48;h+=`<path d="M40 ${ly-4} H70" class="dl" style="stroke:var(--ch1)"/><text x="78" y="${ly}" class="wl">chain ribbon</text>`;
  h+=`<path d="M190 ${ly-4} H220" class="spi"/><text x="228" y="${ly}" class="wl">quad SPI (on the board)</text>`;
  h+=`<path d="M400 ${ly-4} H430" class="pw"/><text x="438" y="${ly}" class="wl">5 V power</text>`;
  h+=`<path d="M530 ${ly-4} H560" class="dl" style="stroke:var(--bus)"/><text x="568" y="${ly}" class="wl">board I/O</text>`;
  h+=`<rect x="740" y="${ly-11}" width="16" height="12" rx="2" class="cport" style="fill:var(--ch1)"/><text x="764" y="${ly}" class="wl">chain port, buffered to 5 V on the board</text>`;
  svg.setAttribute("viewBox",`0 0 ${W} ${ly+16}`);svg.innerHTML=h;
  const hz=Math.round(refreshHz(2)),mbit=(n*64*32*24*120/1e6).toFixed(1);
  const facts=[["Panels",`${n}, in ${ch} chain${ch>1?"s":""} of 2`],["Chain ports",`${ch} of 5 used`],["Refresh",`about ${hz} Hz at 12-bit (by the maths)`],
    ["Frame data at 120 fps",`${mbit} Mbit/s of about 160 on quad SPI`],["Ribbons",`${ch} board to panel, ${n-ch} panel to panel, all standard 16-pin HUB75`],["Power",`${n*12} W full white, ${amps} A at 5 V`]];
  $("wireFacts").innerHTML=facts.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join("");}

/* ESP32-S3-MINI-1 module pads (datasheet table 3-1) and what the controller board uses them for. */
const S3NAME={1:"GND",2:"GND",3:"3V3",4:"IO0",5:"IO1",6:"IO2",7:"IO3",8:"IO4",9:"IO5",10:"IO6",11:"IO7",12:"IO8",13:"IO9",14:"IO10",15:"IO11",16:"IO12",17:"IO13",18:"IO14",19:"IO15",20:"IO16",21:"IO17",22:"IO18",23:"IO19",24:"IO20",25:"IO21",26:"IO26",27:"IO47",28:"IO33",29:"IO34",30:"IO48",31:"IO35",32:"IO36",33:"IO37",34:"IO38",35:"IO39",36:"IO40",37:"IO41",38:"IO42",39:"TXD0",40:"RXD0",41:"IO45",42:"GND",43:"GND",44:"IO46",45:"EN"};
const S3USE={4:["ink","BOOT button"],5:["i2c","I2C SDA"],6:["i2c","I2C SCL"],7:["avoid","strapping, left alone"],8:["swd","RP SWCLK"],9:["swd","RP SWDIO"],10:["swd","RP RUN"],11:["link","RP ready (in)"],
  13:["link","QSPI IO3"],14:["link","QSPI CS"],15:["link","QSPI IO0"],16:["link","QSPI CLK"],17:["link","QSPI IO1"],18:["link","QSPI IO2"],19:["buzz","Buzzer PWM"],20:["led","Status LED"],
  21:["opt","Presence TX"],25:["i2c","RTC interrupt"],22:["opt","Presence RX"],28:["spi3","Ethernet INT"],29:["spi3","Ethernet CS"],31:["spi3","SPI3 MOSI"],32:["spi3","SPI3 SCLK"],33:["spi3","SPI3 MISO"],34:["spi3","Ethernet RST"],35:["spi3","Flash CS"],23:["usb","USB D−"],24:["usb","USB D+"],26:["avoid","PSRAM on N4R2"],39:["ink","UART0 TX (debug)"],40:["ink","UART0 RX (debug)"],
  41:["avoid","strapping, left alone"],44:["avoid","strapping, left alone"],45:["ink","EN, reset button"],3:["power","3V3"]};
const S3COL={spi3:"var(--sev-notice)",link:"var(--pin-host)",swd:"var(--sev-home)",i2c:"var(--bus)",buzz:"var(--ch5)",led:"var(--ch4)",usb:"var(--ch2)",ink:"var(--ink)",opt:"var(--muted)",avoid:"var(--line)",power:"var(--sev-watch)",spare:"var(--line)",gnd:"var(--line)"};
function s3Role(pin){if(pin>45||S3NAME[pin]==="GND")return ["gnd","GND"];const u=S3USE[pin];return u||["spare","spare"];}
function drawS3Pins(){const svg=$("s3Svg");if(!svg)return;const x0=400,y0=60,w=400,keep=150,y1=y0+keep,hgt=440,pad=12,len=24;let h="";
  h+=`<rect x="${x0}" y="${y0}" width="${w}" height="${keep+hgt}" rx="8" class="chip"/>`;
  h+=`<rect x="${x0+8}" y="${y0+8}" width="${w-16}" height="${keep-24}" rx="4" class="keep"/><text x="${x0+w/2}" y="${y0+keep/2}" text-anchor="middle" class="wl">antenna keep-out: no copper under or near it</text>`;
  const lab=(pin,x,y,anchor,rot)=>{const nm=S3NAME[pin]||"GND",[k,t]=s3Role(pin),dim=k==="gnd"||k==="spare"||k==="avoid";
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="pl${dim?" dim":""}" ${rot||""}>${k==="gnd"?"GND":nm+(t&&k!=="power"?" · "+t:"")}</text>`;};
  const padR=(pin,x,y,ww,hh)=>{const [k]=s3Role(pin);return `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" rx="2" style="fill:${S3COL[k]}"/><text x="${x+ww/2}" y="${y+hh/2+3}" text-anchor="middle" class="pn">${pin}</text>`;};
  const step=hgt/16;
  for(let i=0;i<15;i++){const pin=1+i,y=y1+step*(i+1)-pad/2;h+=padR(pin,x0-len/2,y,len,pad)+lab(pin,x0-len/2-8,y+pad/2+4,"end");}
  for(let i=0;i<15;i++){const pin=31+i,y=y1+hgt-step*(i+1)-pad/2;h+=padR(pin,x0+w-len/2,y,len,pad)+lab(pin,x0+w+len/2+8,y+pad/2+4,"start");}
  const hstep=w/16;
  for(let i=0;i<15;i++){const pin=16+i,x=x0+hstep*(i+1)-pad/2,y=y0+keep+hgt-len/2,tx=x+pad/2+4,ty=y+len+8;h+=padR(pin,x,y,pad,len)+lab(pin,tx,ty,"end",`transform="rotate(-90 ${tx} ${ty})"`);}
  for(let i=0;i<15;i++){const pin=60-i,x=x0+hstep*(i+1)-pad/2,y=y1-len/2;h+=`<rect x="${x}" y="${y}" width="${pad}" height="${len}" rx="2" style="fill:var(--line)"/><text x="${x+pad/2}" y="${y+len/2+3}" text-anchor="middle" class="pn">${pin}</text>`;}
  h+=`<circle cx="${x0+20}" cy="${y1+18}" r="6" class="pin1"/><rect x="${x0+w/2-50}" y="${y1+hgt/2+60}" width="100" height="100" rx="3" style="fill:var(--line)"/><text x="${x0+w/2}" y="${y1+hgt/2+114}" text-anchor="middle" class="pn">61</text>`;
  h+=`<text x="${x0+w/2}" y="${y1+hgt/2-10}" text-anchor="middle" class="wt big">ESP32-S3-MINI-1</text><text x="${x0+w/2}" y="${y1+hgt/2+16}" text-anchor="middle" class="wl">15.4 × 20.5 mm, top view</text><text x="${x0+w/2}" y="${y1+hgt/2+36}" text-anchor="middle" class="wl">pads 42, 43, 46 to 65 are GND</text>`;
  svg.innerHTML=h;
  const row=(label,cells,colr)=>`<tr><th><span class="sw" style="background:${colr}"></span>${label}</th>${cells.map(c=>`<td>${c}</td>`).join("")}</tr>`,cell=(f,pin)=>`${f}<small>${S3NAME[pin]} · pin ${pin}</small>`;
  let t=`<table><tbody>`;
  t+=row("Link to the RP2350B",[cell("QSPI CLK",16),cell("QSPI CS",14),cell("IO0",15),cell("IO1",17),cell("IO2",18),cell("IO3",13),cell("RP ready",11)],S3COL.link);
  t+=row("Programs the RP2350B",[cell("SWCLK",8),cell("SWDIO",9),cell("RUN",10)],S3COL.swd);
  t+=row("Sensors (I2C)",[cell("SDA",5),cell("SCL",6),cell("RTC INT",25),"SHTC3<small>0x70, temp + humidity</small>","VEML7700<small>0x10, light</small>","PCF8563<small>0x51, clock</small>","STEMMA QT<small>add-on port</small>"],S3COL.i2c);
  t+=row("Sound and light",[cell("Buzzer PWM",19),cell("Status LED",20)],S3COL.buzz);
  t+=row("USB and debug",[cell("USB D−",23),cell("USB D+",24),cell("UART TX",39),cell("UART RX",40),cell("BOOT",4),cell("EN",45)],S3COL.usb);
  t+=row("Flash and Ethernet (SPI3)",[cell("SCLK",32),cell("MOSI",31),cell("MISO",33),cell("Flash CS",35),cell("Ethernet CS",29),cell("Ethernet INT",28),cell("Ethernet RST",34)],S3COL.spi3);
  t+=row("Presence sensor (optional)",[cell("TX",21),cell("RX",22)],S3COL.opt);
  t+=row("Left alone",[cell("strapping",7),cell("strapping",41),cell("strapping",44),cell("PSRAM (N4R2)",26)],S3COL.avoid);
  t+=row("Spare",["IO8<small>pin 12</small>","IO40 to IO42<small>pins 36 to 38</small>","IO47, IO48<small>pins 27, 30</small>"],S3COL.spare);
  $("s3Table").innerHTML=t+`</tbody></table>`;}

/* One chain port: RP2354B pins, two 74AHCT245 at 5 V, 33 ohm arrays, a standard 2x8 HUB75 header. */
function drawAdapter(){const svg=$("adSvg");if(!svg)return;let h="";
  const box=(x,y,w,hh,t,sub,cls)=>`<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="8" class="${cls||"blk"}"/><text x="${x+w/2}" y="${y+hh/2-(sub?4:-5)}" text-anchor="middle" class="wt">${t}</text>`+(sub?`<text x="${x+w/2}" y="${y+hh/2+16}" text-anchor="middle" class="wl">${sub}</text>`:"");
  const arrow=(x1,y,x2,lab,c)=>`<path d="M${x1} ${y} H${x2-6}" class="dl" style="stroke:${c}"/><path d="M${x2-8} ${y-5} L${x2} ${y} L${x2-8} ${y+5}" class="dl" style="stroke:${c}"/>`+(lab?`<text x="${(x1+x2)/2}" y="${y-8}" text-anchor="middle" class="wl small">${lab}</text>`:"");
  h+=box(30,70,170,210,"RP2354B","3.3 V logic");
  h+=box(290,50,190,100,"74AHCT245","colour: R1 G1 B1 R2 G2 B2","blk ic5");
  h+=box(290,190,190,100,"74AHCT245","CLK LAT OE A B C D E","blk ic5");
  h+=box(560,50,130,100,"33 Ω × 8","2 arrays of 4");h+=box(560,190,130,100,"33 Ω × 8","2 arrays of 4");
  h+=box(770,90,150,160,"HUB75 2×8","standard header","blk hdr5");
  h+=box(1010,120,160,100,"First panel","HUB75 IN");
  h+=arrow(200,100,290,"6 colour lines","var(--ch1)")+arrow(200,240,290,"8 shared lines","var(--ch2)");
  h+=arrow(480,100,560,"5 V","var(--ch1)")+arrow(480,240,560,"5 V","var(--ch2)");
  h+=arrow(690,100,770,"","var(--ch1)")+arrow(690,240,770,"","var(--ch2)");
  h+=`<path d="M920 170 H1010" class="rib"/><text x="965" y="160" text-anchor="middle" class="wl small">16-pin ribbon</text>`;
  h+=`<text x="385" y="32" text-anchor="middle" class="wl">BUF_EN_N holds both buffers off until firmware is ready</text><path d="M385 38 V50 M385 150 V190" class="ctl"/>`;
  h+=`<text x="845" y="280" text-anchor="middle" class="wl small">OE: 10 kΩ pull-up to 5 V, panels dark at power-up</text><text x="845" y="298" text-anchor="middle" class="wl small">pin 8 (E): solder jumper, open for 1/16 scan</text>`;
  h+=`<text x="115" y="300" text-anchor="middle" class="wl small">shared lines fan out to all 5 ports</text>`;
  svg.innerHTML=h;
  const HUB=["R1","G1","B1","GND","R2","G2","B2","E or GND","A","B","C","D","CLK","LAT","OE","GND"];
  let t=`<table><thead><tr><th colspan="4">HUB75 header, per chain</th></tr></thead><tbody>`;for(let i=0;i<16;i+=2)t+=`<tr><td class="pnum">${i+1}</td><td>${HUB[i]}</td><td class="pnum">${i+2}</td><td>${HUB[i+1]}</td></tr>`;t+=`</tbody></table>`;
  t+=`<table><thead><tr><th colspan="2">Parts, per chain port</th></tr></thead><tbody>`+[["2","74AHCT245PW buffer, TSSOP-20, 5 V"],["4","33 Ω × 4 resistor array, 0603"],["2","100 nF, one per buffer"],["1","10 kΩ OE pull-up to 5 V"],["1","2×8 SMD box header, 2.54 mm"],["1","solder jumper for pin 8 (E)"]].map(([q,d])=>`<tr><td class="pnum">${q}×</td><td>${d}</td></tr>`).join("")+`</tbody></table>`;
  t+=`<table><thead><tr><th colspan="2">Which ports to fit</th></tr></thead><tbody>`+[["S · 1×2","port 1"],["M · 1×4","ports 1 and 2"],["L · 1×6","ports 1 to 3"],["XL · 1×8","ports 1 to 4"],["XXL · 1×10","all five"]].map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join("")+`</tbody></table>`;
  $("adTables").innerHTML=t;}

/* Close-up of the TV sizer's strip: the first 120 LEDs at 4 px each, with round LED dots. */
let loupeMask=null,loupeKey="";
function drawLoupe(){const L=$("loupe");if(!L||!stageDisp.off||$("tab-tv").hidden)return;const dpr=window.devicePixelRatio||1,avail=L.parentElement.clientWidth,css=4,P=Math.round(css*Math.min(2,dpr)),n=Math.min(stageDisp.W,120,Math.floor(avail/css)),key=n+"/"+P;if(n<=0)return;
  if(key!==loupeKey){loupeKey=key;L.width=n*P;L.height=32*P;L.style.width=(n*css)+"px";const m=document.createElement("canvas");m.width=n*P;m.height=32*P;const c=m.getContext("2d");
    c.fillStyle=panelColor();c.fillRect(0,0,m.width,m.height);c.globalCompositeOperation="destination-out";c.beginPath();const r=P*0.4;
    for(let y=0;y<32;y++)for(let x=0;x<n;x++){const X=(x+.5)*P,Y=(y+.5)*P;c.moveTo(X+r,Y);c.arc(X,Y,r,0,Math.PI*2);}c.fill();loupeMask=m;}
  const c=L.getContext("2d");c.globalCompositeOperation="source-over";c.globalAlpha=1;c.imageSmoothingEnabled=false;c.drawImage(stageDisp.off,0,0,n,32,0,0,n*P,32*P);c.drawImage(loupeMask,0,0);
  c.globalCompositeOperation="lighter";c.globalAlpha=0.28;c.imageSmoothingEnabled=true;c.drawImage(stageDisp.off,0,0,n,32,0,0,n*P,32*P);c.globalCompositeOperation="source-over";c.globalAlpha=1;}

/* RP2354B QFN-80 pads (same as the RP2350B, from the datasheet figure), and what each GPIO does on the controller board. */
const PADS=(()=>{const L=["GPIO4","GPIO5","GPIO6","GPIO7","IOVDD","GPIO8","GPIO9","GPIO10","GPIO11","DVDD","GPIO12","GPIO13","GPIO14","GPIO15","IOVDD","GPIO16","GPIO17","GPIO18","GPIO19","GPIO20"],
  B=["GPIO21","GPIO22","GPIO23","IOVDD","GPIO24","GPIO25","GPIO26","GPIO27","IOVDD","XIN","XOUT","DVDD","SWCLK","SWDIO","RUN","GPIO28","GPIO29","GPIO30","GPIO31","GPIO32"],
  R=["IOVDD","GPIO33","GPIO34","GPIO35","GPIO36","GPIO37","GPIO38","GPIO39","GPIO40","IOVDD","DVDD","GPIO41","GPIO42","GPIO43","GPIO44","GPIO45","GPIO46","GPIO47","ADC_AVDD","IOVDD"],
  T=["VREG_AVDD","VREG_PGND","VREG_LX","VREG_VIN","VREG_FB","USB_DM","USB_DP","USB_OTP_VDD","QSPI_IOVDD","QSPI_SD3","QSPI_SCLK","QSPI_SD0","QSPI_SD2","QSPI_SD1","QSPI_SS","IOVDD","GPIO0","GPIO1","GPIO2","GPIO3"];
  return [...L,...B,...R,...T];})();
const RGBN=["R1","G1","B1","R2","G2","B2"];
function gpioRole(g){if(g<30)return {kind:"chain",chain:Math.floor(g/6),text:"C"+(Math.floor(g/6)+1)+" "+RGBN[g%6]};
  const m={30:"CLK",31:"A",32:"B",33:"C",34:"D",35:"E (spare)",36:"LAT",37:"OE"};if(m[g])return {kind:"ctrl",text:m[g]};
  const h={38:"SPI SCK",39:"SPI CS",40:"SPI IO0",41:"SPI IO1",42:"SPI IO2",43:"SPI IO3"};if(h[g])return {kind:"host",text:h[g]};const o={44:["ctrl","BUF_EN_N"],45:["host","RP ready"],46:["debug","debug TX"],47:["debug","debug RX"]};if(o[g])return {kind:o[g][0],text:o[g][1]};return {kind:"spare",text:"spare"};}
function padRole(name){const m=/^GPIO(\d+)$/.exec(name);if(m)return Object.assign({gpio:+m[1]},gpioRole(+m[1]));
  if(name==="SWCLK"||name==="SWDIO"||name==="RUN")return {kind:"debug",text:name};return {kind:"power",text:name};}
function drawPins(){const svg=$("pinSvg");if(!svg)return;const used=Math.ceil(byId(state.size).cols/2),S=440,x0=380,y0=210,pitch=S/21,ph=26,pw=13;let h="";
  const colOf=r=>r.kind==="chain"?(r.chain<used?`var(--ch${r.chain+1})`:"var(--line)"):r.kind==="ctrl"?"var(--ink)":r.kind==="host"?"var(--pin-host)":r.kind==="debug"?"var(--sev-home)":"var(--line)";
  const txtOf=(r,name)=>{if(r.kind==="power")return name;const g=r.gpio!=null?"GPIO"+r.gpio+" · ":"";return g+(r.kind==="chain"&&r.chain>=used?"C"+(r.chain+1)+" spare":r.text);};
  const dim=r=>r.kind==="power"||r.kind==="spare"||(r.kind==="chain"&&r.chain>=used);
  h+=`<rect x="${x0}" y="${y0}" width="${S}" height="${S}" rx="10" class="chip"/>`;
  h+=`<text x="${x0+S/2}" y="${y0+S/2-40}" text-anchor="middle" class="wt big">RP2354B</text><text x="${x0+S/2}" y="${y0+S/2-12}" text-anchor="middle" class="wl">QFN-80, 10 × 10 mm, 2 MB flash inside</text>`;
  h+=`<text x="${x0+S/2}" y="${y0+S/2+26}" text-anchor="middle" class="wl">PIO0 · colour data + CLK (GPIO0–31)</text><text x="${x0+S/2}" y="${y0+S/2+46}" text-anchor="middle" class="wl">PIO1 · rows, LAT, OE (GPIO16–47)</text><text x="${x0+S/2}" y="${y0+S/2+66}" text-anchor="middle" class="wl">PIO2 · quad SPI in from the S3</text>`;
  h+=`<circle cx="${x0+22}" cy="${y0+22}" r="7" class="pin1"/>`;
  PADS.forEach((name,i)=>{const r=padRole(name),c=colOf(r),t=txtOf(r,name),n=i+1,cls=dim(r)?"pl dim":"pl";let px,py,w,hh,tx,ty,anchor,rot="";
    if(i<20){const k=i;py=y0+pitch*(k+1)-pw/2;px=x0-ph;w=ph;hh=pw;tx=px-8;ty=py+pw/2+4;anchor="end";}
    else if(i<40){const k=i-20;px=x0+pitch*(k+1)-pw/2;py=y0+S;w=pw;hh=ph;tx=px+pw/2+4;ty=py+ph+8;anchor="end";rot=`transform="rotate(-90 ${tx} ${ty})"`;}
    else if(i<60){const k=i-40;py=y0+S-pitch*(k+1)-pw/2;px=x0+S;w=ph;hh=pw;tx=px+ph+8;ty=py+pw/2+4;anchor="start";}
    else{const k=i-60;px=x0+S-pitch*(k+1)-pw/2;py=y0-ph;w=pw;hh=ph;tx=px+pw/2+4;ty=py-8;anchor="start";rot=`transform="rotate(-90 ${tx} ${ty})"`;}
    h+=`<rect x="${px}" y="${py}" width="${w}" height="${hh}" rx="2" style="fill:${c}"/>`;
    const nx=i<20?px+w-3:i<40?px+w/2:i<60?px+3:px+w/2,ny=i<20?py+pw/2+3:i<40?py+ph-5:i<60?py+pw/2+3:py+10;
    h+=`<text x="${nx}" y="${ny}" text-anchor="${i<20?"end":i<40?"middle":i<60?"start":"middle"}" class="pn">${n}</text>`;
    h+=`<text x="${tx}" y="${ty}" text-anchor="${anchor}" class="${cls}" ${rot}>${t}</text>`;});
  svg.innerHTML=h;
  const row=(label,cells,col)=>`<tr><th><span class="sw" style="background:${col}"></span>${label}</th>${cells.map(c=>`<td>${c}</td>`).join("")}</tr>`;
  const padOf=g=>PADS.indexOf("GPIO"+g)+1;
  let t=`<table><thead><tr><th></th>${RGBN.map(n=>`<th>${n}</th>`).join("")}</tr></thead><tbody>`;
  for(let c=0;c<5;c++)t+=row(`Chain ${c+1}${c<used?"":" (spare)"}`,RGBN.map((_,k)=>{const g=c*6+k;return `GPIO${g}<small>pad ${padOf(g)}</small>`;}),c<used?`var(--ch${c+1})`:"var(--line)");
  t+=`</tbody></table><table><tbody>`;
  t+=row("Shared by all chains",[30,31,32,33,34,35,36,37].map(g=>`${gpioRole(g).text}<small>GPIO${g} · pad ${padOf(g)}</small>`),"var(--ink)");
  t+=row("Quad SPI from the S3",[38,39,40,41,42,43].map(g=>`${gpioRole(g).text.replace("SPI ","")}<small>GPIO${g} · pad ${padOf(g)}</small>`),"var(--pin-host)");
  t+=row("Programming",["SWCLK<small>pad 33</small>","SWDIO<small>pad 34</small>","RUN<small>pad 35</small>"],"var(--sev-home)");
  t+=row("Buffers, handshake, debug",[`BUF_EN_N<small>GPIO44 · pad ${padOf(44)}</small>`,`RP ready<small>GPIO45 · pad ${padOf(45)}</small>`,`debug TX<small>GPIO46 · pad ${padOf(46)}</small>`,`debug RX<small>GPIO47 · pad ${padOf(47)}</small>`],"var(--ink)");
  t+=`</tbody></table>`;$("pinTable").innerHTML=t;}
/* Tabs */
const TABS=["tv","demo","try","specs","wire"];
/* Boot and updates: the buttons play a system screen on the Try it display, and the first visit to Try it boots it. Skip ends it; setup mode only ends that way. */
function playSys(k,net,x){live.sys={k,t0:simT,net:net||"wifi",...x};syncSys();dirty=true;}
const MQTT_END=0.9+FL_LEN+3.3+(()=>{let a=0;for(const [txt,d] of NET_STEPS.wifi){a+=d;if(txt==="MQTT")break;}return a;})();
/* One frame of a system screen. A boot started by a saved broker waits on its MQTT step (up to 12 s) for the real connection;
   an update sent over MQTT reports its stage as events, then restarts into a boot on the new version. */
function sysStep(step){const sy=live.sys,e=simT-sy.t0;
  if(sy.k==="boot"&&sy.mqtt&&!sy.offline&&e>=MQTT_END-0.1&&!(BROKER&&BROKER.connected)){sy.held=(sy.held||0)+step;if(sy.held<12)sy.t0+=step;else sy.offline=true;}
  if(sy.k==="update"&&BROKER&&BROKER.connected&&sy.to){const {pr,stage}=updAt(e),pc=Math.floor(pr*10)*10;
    if(stage!==sy.lastStage||pc!==sy.lastPc){sy.lastStage=stage;sy.lastPc=pc;BROKER.event({event:"update",stage:stage.toLowerCase(),progress:Math.min(100,Math.floor(pr*100)),version:sy.to});}}
  if(sy.k==="update"&&e>=UPD_LEN){if(sy.to){FW.ver=sy.to;try{localStorage.setItem("pixelbar.fwver",FW.ver);}catch(x){}}live.sys={k:"boot",t0:simT,net:sy.net,mqtt:sy.mqtt,updated:sy.to};syncSys();}
  else if(sy.k==="boot"&&e>=bootLen(sy.net)){live.sys=null;syncSys();if(buzzer)beep("rising");
    if(BROKER&&BROKER.connected){BROKER.info();if(sy.updated)BROKER.event({event:"update",stage:"done",progress:100,version:sy.updated});}}}
function syncSys(){const b=$("sysSkip");b.hidden=!live.sys;if(live.sys)b.textContent=live.sys.k==="setup"?"Leave setup mode":"Skip";}
$("sysSkip").addEventListener("click",()=>{live.sys=null;syncSys();dirty=true;});
$("system").addEventListener("click",e=>{const b=e.target.closest("button[data-sys]");if(!b)return;playSys(b.dataset.sys,b.dataset.net);
  $("sim").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});});
let booted=false;
function showTab(name,focus){if(!TABS.includes(name))name="tv";if((name==="demo"||name==="try")&&!unlocked()){name="tv";lockHint();}if(name==="try"&&!booted){booted=true;const sv=brSaved();playSys("boot","wifi",{mqtt:!!(sv.auto&&sv.url)});if(sv.auto&&sv.url)brConnect();}
  for(const t of TABS){const on=t===name,btn=$("tabbtn-"+t);btn.setAttribute("aria-selected",String(on));btn.tabIndex=on?0:-1;$("tab-"+t).hidden=!on;}
  if(name==="demo")showDemoPick();
  if(name==="wire"){drawWiring();drawPins();drawS3Pins();drawAdapter();}
  if(focus)$("tabbtn-"+name).focus();
  try{history.replaceState(null,"","#"+name);}catch(e){}
  requestAnimationFrame(()=>{layoutStage();layoutRacks();dirty=true;});}
document.querySelector(".tabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b)showTab(b.dataset.tab);});
document.querySelector(".tabs").addEventListener("keydown",e=>{const i=TABS.indexOf(document.activeElement&&document.activeElement.dataset.tab);if(i<0)return;
  if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();showTab(TABS[(i+(e.key==="ArrowRight"?1:TABS.length-1))%TABS.length],true);}});

/* Try it controls */
/* Both copies of the controls (Where it goes and Try it) show the same state. */
function syncBars(){const sel=(key,v)=>document.querySelectorAll(`.seg[data-key="${key}"] button`).forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===v)));
  sel("simsize",simSize);document.querySelectorAll('select[data-key="simwx"]').forEach(x=>{x.value=live.cond;});document.querySelectorAll('select[data-key="simtheme"]').forEach(x=>{x.value=live.theme||"";});document.querySelectorAll('select[data-key="clockstyle"]').forEach(x=>{x.value=CLOCK_STYLE;});wxLabel();sel("simsky",live.day?"day":"night");sel("clock",H12?"12":"24");sel("mode",live.mode);
  document.querySelectorAll('[data-media="power"]').forEach(b=>{b.setAttribute("aria-pressed",String(live.tv));b.textContent=live.tv?"On":"Off";});
  document.querySelectorAll('[data-media="play"]').forEach(b=>{b.disabled=!live.tv;b.textContent=live.playing?"Pause":"Play";});
  document.querySelectorAll('[data-opt="buzzer"]').forEach(b=>{b.setAttribute("aria-pressed",String(buzzer));b.textContent=buzzer?"Buzzer on":"Buzzer off";});}
document.addEventListener("change",e=>{const el=e.target;if(el.matches&&el.matches('select[data-key="simwx"]')){live.cond=el.value;live.wx=null;live.syncKind();syncBars();dirty=true;}
  if(el.matches&&el.matches('select[data-key="clockstyle"]')){CLOCK_STYLE=FONTS.includes(el.value)?el.value:"pixel";syncBars();dirty=true;}
  if(el.matches&&el.matches('select[data-key="simtheme"]')){live.theme=el.value||null;live.themeO={};
    {const full=x=>bgOf(x).type==="sky";if(live.theme&&!full(live.mode)){const x=SCREENS.find(full);if(x){showScr(x);refreshUI();}}}syncBars();dirty=true;}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-media],[data-opt]");if(!b||b.disabled)return;
  if(b.dataset.media==="power")live.tv=!live.tv;else if(b.dataset.media==="play")live.playing=!live.playing;
  else if(b.dataset.opt==="buzzer"){buzzer=!buzzer;if(buzzer)beep("chime");}else if(b.dataset.opt==="clear"){live.clearAll();showMsg(null);}
  syncBars();refreshUI();dirty=true;});
syncBars();
function showMsg(p){if(!p){$("msgTopic").textContent="Message: none sent yet";$("payload").textContent="Press Set or Send on any card below to see the message Home Assistant would publish.";return;}
  $("msgTopic").textContent="Message: "+p.topic;$("payload").textContent=(p.body||"(empty)")+"\n\n// "+p.note;}
$("viewTry").addEventListener("click",e=>{const b=e.target.closest("button[data-act]");if(!b||b.disabled)return;const k=b.dataset.k,a=b.dataset.act;
  if(a==="set"||a==="send")live.set(k,simT);else if(a==="remind")live.remind(k);else if(a==="clear")live.clear(k);
  showMsg(payloadFor(k,a));refreshUI();});
$("viewTry").addEventListener("click",e=>{const b=e.target.closest("button[data-sact]");if(!b||b.disabled)return;e.preventDefault();const k=b.dataset.sk,a=b.dataset.sact;
  if(a==="add")live.addSensor(k);else live.removeSensor(k);showMsg(sensorPayload(k,a));refreshUI();dirty=true;});
$("viewTry").addEventListener("click",e=>{const b=e.target.closest("button[data-scr]");if(!b||b.disabled)return;e.preventDefault();const t=b.dataset.scrT,k=b.dataset.scrK,sc=b.dataset.scr,set=scrSet(t,k);
  if(set.has(sc)){if(set.size>1)set.delete(sc);}else set.add(sc);document.querySelectorAll(`button[data-scr-t="${t}"][data-scr-k="${k}"]`).forEach(x=>x.setAttribute("aria-pressed",String(set.has(x.dataset.scr))));
  if(t==="s"&&live.SN.has(k))showMsg(sensorPayload(k,"add"));else if(t==="n"&&live.E.has(k))showMsg(payloadFor(k,DEF[k].ctl[0]));refreshUI();dirty=true;});
$("viewTry").addEventListener("change",e=>{const el=e.target;
  if(el.matches("select[data-sset]")){const k=el.dataset.sk,f=el.dataset.sset;SCFG[k][f]=f==="show"?el.value:+el.value;const L=document.querySelector(`[data-slife="${k}"]`);if(L)L.textContent=sLife(SCFG[k]);if(live.SN.has(k))showMsg(sensorPayload(k,"add"));refreshUI();}
  else if(el.matches("select[data-snd]")){SOUND_OF[el.dataset.snd]=el.value;playSeq(soundSeq(el.value));}});
function refreshUI(){
  document.querySelectorAll("#viewTry button[data-act]").forEach(b=>{const on=live.E.has(b.dataset.k),a=b.dataset.act;
    if(a==="set"){b.setAttribute("aria-pressed",String(on));b.textContent=on?"Set ✓":"Set";}
    else if(a==="clear"||a==="remind")b.disabled=!on;});
  document.querySelectorAll("#viewTry button[data-sact]").forEach(b=>{const on=live.SN.has(b.dataset.sk);
    if(b.dataset.sact==="add"){b.setAttribute("aria-pressed",String(on));b.textContent=on?(b.dataset.sk==="custom"?"Added ✓, update":"Added ✓"):"Add";}else b.disabled=!on;});
  const items=[...live.E.values()].sort((a,b)=>a.added-b.added).map(e=>{const row=CATALOG.find(r=>r[0]===e.k);return `<span class="pill"><b>${row?row[1]:e.k==="custom"?"Your notification":JNOTE[e.k]?JNOTE[e.k]:e.k}</b><em>${live.state(e.k,simT)}</em></span>`;});
  if(live.tv)items.unshift(`<span class="pill"><b>Media device</b><em>${live.quiet?"hidden, house asleep":live.playing?"playing, in the rotation":"paused, in the rotation"}</em></span>`);
  items.unshift(`<span class="pill"><b>Screen</b><em>${live.mode}${DEMO?", until a layout arrives":""}${isQuiet(live.mode)?", quiet: only what you allow on it shows":""}${SCREEN_AUTO?", picked by its rules":""}</em></span>`);
  for(const k of live.SN.keys()){const row=SCAT.find(r=>r[0]===k);items.push(`<span class="pill"><b>${row?row[1]:SENS[k]?cap1(SENS[k].label):k}</b><em>${live.sState(k,simT)}</em></span>`);}
  $("active").innerHTML=items.join("");}
refreshUI();
function renderLights(){$("lightsRow").innerHTML=ROOMS.map(([nm,c,o])=>{const col=c?`rgb(${c.join(",")})`:"linear-gradient(90deg,#f55,#fd5,#5f8,#5cf,#b7f)";
  return `<button type="button" class="light" data-room="${nm}" aria-pressed="${o?"true":"false"}"><span class="bulb" style="background:${col}"></span>${cap1(nm)}</button>`;}).join("");}
renderLights();
$("lightsRow").addEventListener("click",e=>{const b=e.target.closest("button[data-room]");if(!b)return;const i=ROOMS.findIndex(r=>r[0]===b.dataset.room);if(i<0)return;
  const r=ROOMS.splice(i,1)[0];r[2]=r[2]?0:1;ROOMS.unshift(r);live.lightsUntil=simT+10;renderLights();dirty=true;});

/* timeline controls */
const DEMO_NAME={rain:"Rainy evening",snow:"Snowy evening",clear:"Clear summer night"};
function showDemoPick(){$("demoPick").hidden=false;$("demoRun").hidden=true;tlPlaying=false;}
function startDemo(wx){V=VARIANTS[wx];buildTracks();renderEvents();tlT=0;tlPlaying=true;setPlayLabel();$("demoName").textContent=DEMO_NAME[wx];
  $("demoPick").hidden=true;$("demoRun").hidden=false;requestAnimationFrame(()=>{layoutRacks();dirty=true;});}
document.querySelectorAll(".pick").forEach(b=>b.addEventListener("click",()=>startDemo(b.dataset.wx)));
$("demoBack").addEventListener("click",showDemoPick);
let tlT=0,tlPlaying=false,lastEv=-1;
const range=$("tlRange"),evList=$("events"),colOf={home:"--sev-home",status:"--sev-status",notice:"--sev-notice",alert:"--sev-notice",adv:"--sev-adv",watch:"--sev-watch",warn:"--sev-warn"};
let EVENTS=[];
function renderEvents(){EVENTS=tlEvents();lastEv=-1;
  $("markers").innerHTML=EVENTS.map(([t,,cls])=>`<span style="left:${t/TL_LEN*100}%;background:var(${colOf[cls]})"></span>`).join("");
  evList.innerHTML=EVENTS.map(([t,label,cls,chip],n)=>`<li data-n="${n}"><button type="button" data-t="${t}"><time>${Math.floor(t/60)}:${p2(t%60)}</time><span>${label}</span><span class="chip" style="color:var(${colOf[cls]})">${chip}</span></button></li>`).join("");}
renderEvents();
evList.addEventListener("click",e=>{const b=e.target.closest("button[data-t]");if(!b)return;tlT=Math.max(0,+b.dataset.t-0.5);dirty=true;});
range.addEventListener("input",()=>{tlT=+range.value;dirty=true;});
const playBtn=$("tlPlay");const setPlayLabel=()=>{playBtn.textContent=tlPlaying?"Pause":"Play";};setPlayLabel();
playBtn.addEventListener("click",()=>{tlPlaying=!tlPlaying;setPlayLabel();});
function updateReadout(){let n=0;EVENTS.forEach(([t],k)=>{if(tlT>=t)n=k;});
  if(n!==lastEv){lastEv=n;evList.querySelectorAll("li").forEach(li=>li.setAttribute("aria-current",String(+li.dataset.n===n)));}
  const s=Math.floor(tlT);$("tlReadout").innerHTML=`<b>${Math.floor(s/60)}:${p2(s%60)}</b> · ${EVENTS[n][1]}`;
  if(document.activeElement!==range)range.value=tlT.toFixed(2);}

try{const io=new IntersectionObserver(es=>{for(const e of es){const d=all.find(x=>x.canvas===e.target);if(d){d.visible=e.isIntersecting;if(d.visible)dirty=true;}}},{rootMargin:"80px"});all.forEach(d=>io.observe(d.canvas));}catch(e){}
try{const ro=new ResizeObserver(()=>{layoutStage();layoutRacks();});ro.observe($("stageWrap"));ro.observe($("rack"));ro.observe($("tlRack"));ro.observe($("cat-doors"));ro.observe($("simWrap"));}catch(e){window.addEventListener("resize",()=>{layoutStage();layoutRacks();});}
const rebuildMasks=()=>{all.forEach(d=>{if(d.cssW)d.buildMask();});dirty=true;};
try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",rebuildMasks);}catch(e){}
try{new MutationObserver(rebuildMasks).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});}catch(e){}

let tAcc=0,last=performance.now(),lastQ=-1,uiT=0;const deltas=[];
function showHz(){const s=[...deltas].sort((a,b)=>a-b),med=s[Math.floor(s.length/2)],hz=Math.round(1/med/10)*10;
  $("hz").textContent=`Your screen refreshes at about ${hz} Hz, so animation here tops out at ${hz} fps.`;}
/* One display failing must never stop the others, so each draw is guarded and the next frame is queued first. */
const safe=(label,fn)=>{try{fn();}catch(e){if(!safe.seen.has(label)){safe.seen.add(label);console.error("["+label+"]",e);}}};safe.seen=new Set();
function tick(now){requestAnimationFrame(tick);const dt=(now-last)/1000;last=now;demoHA();
  if(deltas.length<90&&dt>0){deltas.push(dt);if(deltas.length===90)showHz();}
  const step=clamp(dt,0,0.1);if(!state.paused)tAcc+=step;if(tlPlaying&&!$("tab-demo").hidden&&!$("demoRun").hidden)tlT=(tlT+step)%TL_LEN;
  simT+=step;if(live.sys)sysStep(step);live.update(simT);live.sensorsUpdate(simT);if(live.tv&&live.playing)live.pos=(live.pos+step)%NP.dur;
  if(simT-uiT>0.25){uiT=simT;refreshUI();}
  const q=Math.floor((tAcc+tlT+simT)*state.fps);
  if(q!==lastQ||dirty){lastQ=q;dirty=false;const t=Math.floor(tAcc*state.fps)/state.fps,nowD=new Date();
    const sq=Math.floor(simT*state.fps)/state.fps,liveS=d=>({W:d.W,H:32,id:d.size.id,t:sq+3.3,traw:sq,score:live.score,now:nowD,np:live.pos,npPaused:!live.playing,st:{cond:condOf(live.kind)},wxp:live.wx,theme:live.theme,flags:live.themeO.flags,night:live.themeO.night,parts:live.themeO.parts,opened:live.opened(),pkgAt:live.pkgAt()});
    for(const d of galleryDisps){if(!d.visible||!d.cssW)continue;safe("display "+d.size.id,()=>d.present(composeLive(d,liveS(d),live.frame(d.size.id,sq),mkProg(sq,state.trans===1))));}
    if(stageDisp.visible&&stageDisp.cssW)safe("loupe",drawLoupe);
    const tq=Math.floor(tlT*state.fps)/state.fps;
    for(const d of tlDisps){if(!d.visible||!d.cssW)continue;safe("demo "+d.size.id,()=>d.present(tlCompose(d,tq,state.trans===1)));}
    if(simDisp.visible&&simDisp.cssW)safe("try it",()=>simDisp.present(composeLive(simDisp,liveS(simDisp),live.frame(simSize,sq),mkProg(sq,state.trans===1))));
    for(const d of [...catDisps,...iconDisps,...wxDisps,...fontDisps,...thDisps]){if(!d.visible||!d.cssW)continue;safe("look "+(d.card||d.icon||d.pic||d.kind||d.font||d.theme),()=>drawLook(d,t,nowD));}
    safe("preview",()=>drawPreview(t,nowD));
    safe("readout",updateReadout);}}
/* One catalogue preview, by what it shows: a card or full-strip animation, an icon or picture, a sky, a font or a theme. Other pages draw the same ones. */
let THUMB_N=0;
function drawLook(d,t,nowD){const fb=d.fb;fb.noClip();fb.clear();
  if(d.card){const cS={W:d.W,H:32,id:"cat",t:t+3.3,now:nowD,opened:new Date(nowD.getTime()-300000),pkgAt:new Date(nowD.getTime()-1500000)};
    if(d.card.startsWith("full:")){const k=d.card.slice(5),len=ANIM_LEN[k]||10;FULL[k](fb,Object.assign(cS,{ft:t%len,score:[2,1]}));}else drawCard(fb,d.card,0,0,d.W,32,cS);}
  else if(d.pic)drawImg(fb,d.pic,2,2);
  else if(d.icon){ICONS[d.icon](fb,12,16,t,[255,190,110]);vsep(fb,24,32);miniIcon(fb,d.icon,30,16,t,[255,190,110]);}
  else if(d.kind)sWeather(fb,{W:d.W,H:32,t:t+3.3,now:nowD},d.kind);
  else if(d.font){if(d.sample)fontTry(fb,d.font,d.sample,t,"try"+d.font);else fontSheet(fb,d.font,t,"sheet");}
  else if(d.msgs){if(d._p===undefined){d._p=null;try{for(const m of d.msgs){const r=v2route(m.topic);if(r&&r.kind==="data"&&m.payload)applyV2(r,m.payload);}
      const m=d.msgs.find(x=>{const r=v2route(x.topic);return r&&r.kind!=="data";})||d.msgs[0];d._p=prevFor(m.topic,m.payload,"__thumb"+(++THUMB_N));}catch(e){d._p=null;}}
    if(d._p)drawPrev(fb,d._p,{W:d.W,H:32,id:"cat",t:t+3.3,now:nowD,opened:new Date(nowD.getTime()-300000),pkgAt:new Date(nowD.getTime()-1500000)},t);}
  else if(d.theme){const th=themeOf(d.theme);if(th)th.bg(fb,{W:d.W,H:32,t:t+3.3,parts:d.parts},1);}
  d.present(fb);}
/* A clock counting seconds in one of the fonts, centred on a 96-LED strip. */
function fontSample(fb,font,t,key){const s=Math.floor(t),str=p2(Math.floor(s/60)%60)+":"+p2(s%60),W=fb.W;
  if(font==="flip"){const w=flipW(str);flipText(fb,str,Math.round((W-w)/2),8,{key,t});}else if(font==="nixie"){const w=nixieW(str);nixieText(fb,str,Math.round((W-w)/2),8,{t});}else if(font==="segment"){const w=segW(str);segText(fb,str,Math.round((W-w)/2),8);}else{const w=fb.tw(BIG,str);fb.text(BIG,str,Math.round((W-w)/2),9,[255,236,210]);}}
/* A font's whole character set, wrapped to the strip, each line centred. What doesn't fit on 32 rows goes onto pages, turning every 3 s; the split-flap shows its big digits on a page of their own. */
const SHEET_TXT=(F,col)=>({segs:charGroups(F).map(g=>g[1]),h:F.h,lh:F.h+(F.h>9?3:F.h>5?2:2),w:s=>{let w=0,gap=0;for(const c of s){gap=F.g[c].j?0:1;w+=F.g[c].w+gap;}return w-gap;},draw:(fb,s,x,y)=>fb.text(F,s,x,y,col)});
const SHEETS={big:()=>SHEET_TXT(BIG,[255,236,210]),space:()=>SHEET_TXT(SPACE,[255,236,210]),retro64:()=>SHEET_TXT(R64,[255,236,210]),alagard:()=>SHEET_TXT(ALAGARD,[255,236,210]),celtic:()=>SHEET_TXT(CELTIC,[255,236,210]),comicoro:()=>SHEET_TXT(COMICORO,[255,236,210]),pixel:()=>SHEET_TXT(F5,[255,236,210]),small:()=>SHEET_TXT(F3,[255,236,210]),
  flip:()=>({segs:["0123456789",...charGroups(BIG).map(g=>g[1].replace(/[0-9:]/g,"")).filter(Boolean)],h:16,lh:16,w:flipW,draw:(fb,s,x,y,key,t)=>flipText(fb,s,x,y,{key,t})}),
  nixie:()=>({segs:[Object.keys(NIX).join("")+"\n-.:"],h:15,lh:16,w:s=>nixieW(s),draw:(fb,s,x,y,key,t)=>nixieText(fb,s,x,y,{t})}),
  segment:()=>({segs:["0123456789","ABCDEFGHIJ","LNOPQRSTUY","chou-_=°'\""],h:16,lh:16,w:segW,draw:(fb,s,x,y)=>segText(fb,s,x,y)})};
const SHEET_PAGES={};
function sheetPages(font,W,H){const id=font+"@"+W+"x"+H;if(SHEET_PAGES[id])return SHEET_PAGES[id];const S=SHEETS[font]();
  const per=Math.max(1,Math.floor((H-S.h)/S.lh)+1),pages=[];
  for(const seg of S.segs||[S.chars.join("")]){const lines=[];let cur="";for(const c of seg){if(c==="\n"||cur&&S.w(cur+c)>W-4){lines.push(cur);cur="";if(c==="\n")continue;}cur+=c;}if(cur)lines.push(cur);
    for(let i=0;i<lines.length;i+=per)pages.push(lines.slice(i,i+per));}
  return SHEET_PAGES[id]={S,pages};}
/* Your own words in a font, for trying it: as written (the small face in capitals), wrapped by word, a page every 3 s when they don't fit. */
const TRY_FONT={big:BIG,pixel:F5,small:F3,flip:BIG,space:SPACE,retro64:R64,alagard:ALAGARD,celtic:CELTIC,comicoro:COMICORO};const TRY_KEEP={nixie:/[^0-9:. -]/g,segment:/[^0-9A-Za-z:. _='"°-]/g};const TRY_PAGES={};
function fontTry(fb,font,text,t,key){if(!SHEETS[font])return;const W=fb.W,H=fb.H||32,id=font+"@"+W+"x"+H+":"+text;
  if(!TRY_PAGES[id]){const S=SHEETS[font](),F=TRY_FONT[font],str=F?fitText(text,F,font==="small"):String(text).replace(TRY_KEEP[font]||/[^0-9:. -]/g," ");
    const per=Math.max(1,Math.floor((H-S.h)/S.lh)+1),lines=[];let cur="";
    for(const word of str.split(" ")){const cand=cur?cur+" "+word:word;if(!cur||S.w(cand)<=W-4){cur=cand;continue;}lines.push(cur);cur=word;}
    if(cur)lines.push(cur);
    // A word too long for the strip breaks where it has to.
    const fit=[];for(const ln of lines){let c="";for(const ch of ln){if(c&&S.w(c+ch)>W-4){fit.push(c);c="";}c+=ch;}if(c)fit.push(c);}
    const pages=[];for(let i=0;i<fit.length;i+=per)pages.push(fit.slice(i,i+per));
    const keys=Object.keys(TRY_PAGES);if(keys.length>40)delete TRY_PAGES[keys[0]];
    TRY_PAGES[id]={S,pages:pages.length?pages:[[""]]};}
  const {S,pages}=TRY_PAGES[id],pg=pages[Math.floor(t/3)%pages.length],hh=(pg.length-1)*S.lh+S.h,y0=Math.round((H-hh)/2);
  pg.forEach((ln,i)=>S.draw(fb,ln,Math.round((W-S.w(ln))/2),y0+i*S.lh,key+":t"+i,t));}
function fontSheet(fb,font,t,key){if(!SHEETS[font])return fontSample(fb,font,t,key);const W=fb.W,H=fb.H||32,{S,pages}=sheetPages(font,W,H),pg=pages[Math.floor(t/3)%pages.length];
  const hh=(pg.length-1)*S.lh+S.h,y0=Math.round((H-hh)/2);
  pg.forEach((ln,i)=>S.draw(fb,ln,Math.round((W-S.w(ln))/2),y0+i*S.lh,key+":"+i,t));}
/* What a value looks like on the strip, for the editor's picker: a width in LEDs (and a height for square things like icons), a time for the still, and a draw for the live preview. */
const AFULL={goal:"goal",fireworks:"bday",live:"golive",raid:"raid",red_alert:"redalert",countdown:"countdown",confetti:"confetti",weather:"morningwx",flag:"canadaflag"};
function edVisual(list,k){const S=(W,t,now)=>({W,H:32,id:"cat",t,ft:t,now,score:[2,1],opened:new Date(now-300000),pkgAt:new Date(now-1500000)});
  if(list==="icons"&&ICONS[k])return {W:24,H:24,pw:40,still:1,draw:(fb,t)=>ICONS[k](fb,Math.floor(fb.W/2),Math.floor(fb.H/2),t,[255,190,110])};
  if(list==="anims"){if(THEMES[k])return {W:128,still:4,draw:(fb,t,now)=>sHoliday(fb,S(128,t%10,now),{theme:k,title:THEMES[k].title})};
    const f=AFULL[k];if(f&&FULL[f])return {W:128,still:3.5,draw:(fb,t,now)=>FULL[f](fb,S(128,t%(ANIM_LEN[f]||10),now))};}
  if(list==="themes"&&THEMES[k])return {W:128,still:3,draw:(fb,t,now)=>{THEMES[k].bg(fb,{W:128,H:32,t},1);bigClock(fb,{now,t},5,5,[255,236,210],{outline:1});}};
  if(list==="conditions"||list==="extras"){const e=HA_WX.find(x=>x[0]===k),kind=e?e[1]+(e[2]===0?"":"-day"):EXTRAS.some(x=>x[0]===k)?k+"-day":null;if(kind)return {W:128,still:3,draw:(fb,t,now)=>sWeather(fb,{W:128,H:32,t,now},kind)};}
  if(list==="fonts"&&FONTS.includes(k))return {W:96,still:1,draw:(fb,t)=>fontSample(fb,k,t,"edfont")};
  if(list==="sensors"&&SENS[k])return {W:128,still:3,draw:(fb,t,now)=>drawCard(fb,"sn:"+k,0,0,128,32,S(128,t,now))};
  if((list==="flags"||list==="wave_flags")&&WAVE_FLAGS[k])return {W:64,still:1,draw:(fb,t)=>wavyFlag(fb,0,0,64,32,t,1,flagCol(k,64,32),1.2,0.16)};
  return null;}
/* Stills are drawn once and copied, since the picker redraws its rows on every keystroke. */
const edStills=new Map();
function edThumb(list,k){const id=list+":"+k;let src=edStills.get(id);
  if(src===undefined){const v=edVisual(list,k);src=null;
    if(v)try{const H=v.H||32,fb=new FB(v.W,H);v.draw(fb,v.still,new Date());src=document.createElement("canvas");src.width=v.W;src.height=H;const c=src.getContext("2d"),img=c.createImageData(v.W,H);
      for(let i=0;i<v.W*H;i++){for(let j=0;j<3;j++)img.data[i*4+j]=clamp(Math.round(fb.d[i*3+j]),0,255);img.data[i*4+3]=255;}c.putImageData(img,0,0);}catch(e){src=null;}
    edStills.set(id,src);}
  if(!src)return null;const cv=document.createElement("canvas");cv.width=src.width;cv.height=src.height;cv.getContext("2d").drawImage(src,0,0);return cv;}
/* The live preview beside the picker, drawn as real LEDs until the panel closes. */
function edPreview(list,k){const v=edVisual(list,k);if(!v)return null;const cv=document.createElement("canvas"),W=v.pw||v.W,d=new Disp(cv,{id:"cat",cols:0,W}),t0=performance.now(),now=new Date();
  const frame=()=>{const t=(performance.now()-t0)/1000;if(!cv.isConnected){if(t<1)requestAnimationFrame(frame);return;}
    if(!d.cssW)d.resize(Math.min(256,W*(W<64?3:2)));const fb=d.fb;fb.noClip();fb.clear();try{v.draw(fb,t,now);}catch(e){}d.present(fb);requestAnimationFrame(frame);};
  requestAnimationFrame(frame);return cv;}
/* ---------- Try it workspace: the sidebar picks a pane, search filters every pane at once, the editor sits beside the list ---------- */
let curPane=["notify",""];
const ITEMS=':is(.catalog figure,.icons figure,.tiles figure,.wx-grid figure,.lights-row button)',NOSEARCH=["settings","saved","system"];
function showPane(p,grp=""){curPane=[p,grp];document.querySelectorAll("#tryPanes .pane").forEach(s=>s.hidden=s.dataset.pane!==p);
  const pane=document.querySelector(`#tryPanes .pane[data-pane="${p}"]`);pane.querySelectorAll(".cat-group[data-grp]").forEach(g=>g.hidden=!!grp&&g.dataset.grp!==grp);
  const ph=pane.querySelector(".pane-head");if(ph&&pane.querySelector(".cat-group[data-grp]"))ph.hidden=!!grp;
  document.querySelectorAll("#trySide [data-pane]").forEach(b=>b.setAttribute("aria-current",String(b.dataset.pane===p&&(b.dataset.grp===undefined||(b.dataset.grp||"")===grp))));
  layoutRacks();dirty=true;}
$("trySide").addEventListener("click",e=>{const b=e.target.closest("[data-pane]");if(!b)return;if($("trySearch").value){$("trySearch").value="";trySearch("");}showPane(b.dataset.pane,b.dataset.grp||"");
  paneTop();});
/* Picking a category takes you back to the top of the list, just under the pinned display. */
function paneTop(){const sim=$("sim"),pinned=getComputedStyle(sim).position==="sticky"?sim.offsetHeight:0,y=$("tryPanes").getBoundingClientRect().top+scrollY-pinned-8;
  if(Math.abs(scrollY-y)>4)scrollTo({top:y,behavior:document.hidden||matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});}
function trySearch(q){q=q.trim().toLowerCase();const P=$("tryPanes"),note=$("searchNote");
  if(!q){P.classList.remove("searching");P.querySelectorAll("[data-miss]").forEach(e=>e.removeAttribute("data-miss"));note.hidden=true;showPane(...curPane);return;}
  P.classList.add("searching");let n=0;
  P.querySelectorAll(".pane").forEach(s=>{if(NOSEARCH.includes(s.dataset.pane)){s.hidden=true;return;}let m=0;s.querySelectorAll(ITEMS).forEach(el=>{const hit=el.textContent.toLowerCase().includes(q);el.toggleAttribute("data-miss",!hit);if(hit)m++;});s.hidden=!m;n+=m;
    s.querySelectorAll(".cat-group").forEach(g=>g.hidden=!g.querySelector(ITEMS.replace(/\)$/,"):not([data-miss])")));const h=s.querySelector(".pane-head");if(h)h.hidden=false;});
  document.querySelectorAll("#trySide [data-pane]").forEach(b=>b.setAttribute("aria-current","false"));
  note.hidden=false;note.textContent=n?`${n} match${n===1?"":"es"} for “${q}”`:`Nothing matches “${q}”. Try a word like leak, live or snow.`;layoutRacks();dirty=true;}
$("trySearch").addEventListener("input",e=>trySearch(e.target.value));
$("trySearch").addEventListener("keydown",e=>{if(e.key==="Escape"){e.target.value="";trySearch("");}});
document.addEventListener("keydown",e=>{if(e.key!=="/"||$("tab-try").hidden)return;const t=e.target;if(t.matches&&t.matches("input,textarea,select,[contenteditable]"))return;e.preventDefault();$("trySearch").focus();});
function sideCounts(){const c=sel=>document.querySelectorAll(sel).length,set=(sel,n)=>{const i=document.querySelector(sel+" i");if(i)i.textContent=n;};
  set('#trySide [data-pane="notify"][data-grp=""]',c('#tryPanes .pane[data-pane="notify"] .catalog figure'));
  document.querySelectorAll('#trySide [data-pane="notify"][data-grp]:not([data-grp=""])').forEach(b=>{b.querySelector("i").textContent=c("#cat-"+b.dataset.grp+" figure");});
  document.querySelectorAll('#trySide [data-pane="sensors"][data-grp]:not([data-grp=""])').forEach(b=>{b.querySelector("i").textContent=c("#cat-s-"+b.dataset.grp+" figure");});
  for(const [p,sel] of [["sensors\"][data-grp=\"","#cat-sensors figure"],["types","#typeGrid figure"],["lights","#lightsRow button"],["wx","#wxGrid figure"],["themes","#thGrid figure"],["fonts","#fontGrid figure"],["anims","#animGrid figure"],["icons","#iconGrid figure"],["pics","#picGrid figure"],["sounds","#soundRow figure"]])set(`#trySide [data-pane="${p}"]`,c(sel));}
/* The editor's tabs: the JSON editor, and the two builders. */
function edTab(t){document.querySelectorAll("#tryEditor [data-etab]").forEach(el=>{if(el.getAttribute("role")==="tab")el.setAttribute("aria-selected",String(el.dataset.etab===t));else el.hidden=el.dataset.etab!==t;});layoutRacks();dirty=true;}
document.querySelector("#tryEditor .ed-tabs").addEventListener("click",e=>{const b=e.target.closest("[data-etab]");if(b)edTab(b.dataset.etab);});
function edOpen(on){$("tryEditor").classList.toggle("open",on);$("edToggle").setAttribute("aria-expanded",String(on));if(on)layoutRacks();}
$("edToggle").addEventListener("click",()=>edOpen(!$("tryEditor").classList.contains("open")));
/* Copy: the topic, the JSON, or a Home Assistant mqtt.publish action to paste into an automation. */
async function copyText(txt,btn){let ok=true;try{await navigator.clipboard.writeText(txt);}catch(e){const ta=document.createElement("textarea");ta.value=txt;document.body.append(ta);ta.select();try{ok=document.execCommand("copy");}catch(_){ok=false;}ta.remove();}
  if(btn){const o=btn.dataset.label||btn.textContent;btn.dataset.label=o;btn.textContent=ok?"Copied":"Select and copy";setTimeout(()=>{btn.textContent=o;},1300);}}
function asYAML(){const topic=$("jsonTopic").value.trim(),txt=$("jsonText").value.trim();let body=txt;try{body=JSON.stringify(JSON.parse(txt));}catch(e){}
  const retain=lastNote?/^Retained/.test(lastNote):!/\/notify\//.test(topic);return "action: mqtt.publish\ndata:\n  topic: "+topic+"\n  retain: "+retain+"\n  payload: '"+body.replace(/'/g,"''")+"'\n";}
$("tryEditor").addEventListener("click",e=>{const b=e.target.closest("[data-copy]");if(!b)return;e.preventDefault();const k=b.dataset.copy;copyText(k==="topic"?$("jsonTopic").value.trim():k==="json"?$("jsonText").value:asYAML(),b);});
$("viewTry").addEventListener("click",e=>{const b=e.target.closest("button[data-copy]");if(!b)return;copyText(b.dataset.copy,b);});
/* The preview above the editor builds whatever is typed, without sending it, and says what's wrong if it can't. */
let PREV=null,prevT=0;
/* What one message looks like on its own: the preview above the editor and a catalogue thumbnail both draw it. key names the notification
   it plays as. Throws a sentence when it can't; null for messages that only change the display (layouts, settings, sounds). */
function prevFor(topic,b,key="__preview"){const r=v2route(topic);if(!r)throw new Error(v2problem(topic,null));
  const err=v2problem(topic,b);if(err)throw new Error(err);
  if(r.kind==="notify"){applyNotify2(key,b);const d=DEF["json:"+key];if(!d)return null;const anim=b.card&&b.card.card==="animation";return d.full&&FULL["json:"+key]&&(d.tier==="alert"||anim)?{k:"full",card:"json:"+key}:d.adv?{k:"card",card:"adv:json:"+key}:{k:"card",card:d.card};}
  if(r.kind==="data")return {k:"c2",card:dataCard(r.name,b)};
  if(r.kind==="box")return {k:"box",cards:b.cards,every:b.every||10};
  if(r.kind==="theme"){if(!THEMES[b.theme]&&!isPluginKey(b.theme))throw new Error('"theme" must be one of: '+Object.keys(THEMES).join(", ")+", or a Marketplace theme, mp:<slug>.");themeOf(b.theme);return {k:"theme",th:b.theme,flags:b.flags,night:b.night,parts:b.parts};}
  if(r.kind==="weather"){const x=b.extra&&EXTRAS.find(e=>e[0]===b.extra),h=HA_WX.find(e=>e[0]===b.condition),day=h&&h[2]!==undefined?!!h[2]:b.is_day!==false;
    return {k:"wx",kind:(x?x[0]:h[1])+(day?"-day":""),wxp:{caption:Array.isArray(b.caption)?b.caption.map((c,i)=>c==null?null:up(c,i<2?F5:F3)):undefined}};}
  if(r.kind==="image")return {k:"img",img:dec565(Object.assign({},b,{id:r.name}))};
  return null;}
function drawPrev(fb,P,S,t){const W=S.W;
  if(P.k==="full")FULL[P.card](fb,Object.assign({},S,{ft:t%10,score:[2,1]}));else if(P.k==="card")drawCard(fb,P.card,0,0,W,32,S);
  else if(P.k==="c2")drawCard2(fb,P.card,0,0,W,32,Object.assign({},S,{scr:"active"}));
  else if(P.k==="box"){const ok=P.cards.filter(whenOk),c=ok.length?ok[Math.floor(t/Math.min(P.every,4))%ok.length]:null;if(c)drawCard2(fb,c,0,0,W,32,Object.assign({},S,{scr:"active"}));}
  else if(P.k==="theme"){const th=themeOf(P.th);if(th)th.bg(fb,Object.assign({},S,{flags:P.flags,night:P.night,parts:P.parts}),1);}else if(P.k==="wx")sWeather(fb,Object.assign({},S,{wxp:P.wxp}),P.kind);
  else if(P.k==="img"){const im=P.img;for(let j=0;j<im.h;j++)for(let i=0;i<im.w;i++){const c=im.px[j*im.w+i];if(c[0]+c[1]+c[2]>9)fb.px(2+i,2+j,c);}}}
function jsonPreview(){const note=$("jsonPrevNote"),topic=$("jsonTopic").value.trim(),txt=$("jsonText").value.trim();PREV=null;PREV_ERR=null;note.classList.remove("err");
  try{const r=v2route(topic);if(!r)throw new Error(v2problem(topic,null));if(!txt){note.textContent="An empty message clears it.";dirty=true;return;}
    let b;try{b=JSON.parse(txt);}catch(e){throw new Error("That isn't valid JSON yet: "+e.message);}
    PREV=prevFor(topic,b);
    if(!PREV){note.textContent=r.kind==="sound"?"Send it to hear it.":r.kind==="layout"?"Layouts change the display above when you send them.":"This changes the display above when you send it.";dirty=true;return;}
    note.textContent="Preview of this message on your bar";}
  catch(e){note.textContent=e.message;note.classList.add("err");if(!/valid JSON yet/.test(e.message))PREV_ERR=e.message;}prevT=0;dirty=true;if(ED)ED.relint();}
let prevTimer=0;for(const id of ["jsonText","jsonTopic"])$(id).addEventListener("input",()=>{clearTimeout(prevTimer);prevTimer=setTimeout(jsonPreview,250);});
function drawPreview(t,nowD){if(!prevDisp||!prevDisp.visible||!prevDisp.cssW)return;const fb=prevDisp.fb,W=prevDisp.W,S={W,H:32,id:"cat",t:t+3.3,now:nowD,opened:new Date(nowD.getTime()-300000),pkgAt:new Date(nowD.getTime()-1500000)};fb.noClip();fb.clear();
  if(PREV)drawPrev(fb,PREV,S,t);
  prevDisp.present(fb);}
/* Saved displays: each design lives in this browser's storage, and Export and Import move them as a file. */
const DKEY="pixelbar.displays.v1",slug=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,32)||"display";
let DS={cur:null,list:[]};try{const v=JSON.parse(localStorage.getItem(DKEY)||"null");if(v&&Array.isArray(v.list))DS=v;}catch(e){}
const saveDS=()=>{try{localStorage.setItem(DKEY,JSON.stringify(DS));return true;}catch(e){return false;}};
/* A saved display is its place, size, clock and v2 layout. Displays saved before v2 keep everything but their zones, which become the default boxes for their size. */
function captureDisplay(name){return {v:2,name,topic:"pixelbar/"+slug(name),place:state.place,tv:state.tv,mon:state.mon,size:simSize,clock:H12?"12":"24",clock_style:CLOCK_STYLE,layout:DEMO?null:JSON.parse(layoutPayload().body)};}
function applyDisplay(d){if(!d||(d.v!==1&&d.v!==2)||typeof d!=="object")throw new Error("That isn't a PixelBar display.");
  const size=SIZE_IDS.includes(d.size)?d.size:simSize;if(size!==simSize)setSize(size);
  if(FONTS.includes(d.clock_style))CLOCK_STYLE=d.clock_style;H12=d.clock==="12";if(["tv","monitor","wall"].includes(d.place))walkFrom(d);
  const lay=d.v===2&&d.layout?{...d.layout,screens:screensList(d.layout)}:null;
  if(lay&&!v2problem("pixelbar/"+slug(d.name||"display")+"/layout",lay))applyLayout2(lay);else applyLayout2(null);
  for(const k of [...live.SN.keys()])if(SCFG[k])live.removeSensor(k);
  syncBars();refreshUI();renderLay();dirty=true;}
function renderSaved(msg){const sel=$("dispSel"),cur=DS.list.find(d=>d.id===DS.cur);
  sel.innerHTML=`<option value="">${DS.list.length?"Unsaved design":"No saved displays yet"}</option>`+DS.list.map(d=>`<option value="${d.id}">${d.name.replace(/[<&"]/g,"")} · ${({"1x2":"S","1x4":"M","1x6":"L","1x8":"XL","1x10":"XXL"})[d.state.size]||d.state.size}</option>`).join("");
  sel.value=cur?cur.id:"";if(document.activeElement!==$("dispName"))$("dispName").value=cur?cur.name:"";
  $("dispSaved").querySelector('[data-disp="delete"]').disabled=!cur;$("dispSaved").querySelector('[data-disp="export"]').disabled=!DS.list.length;if(msg!=null)$("dispMsg").textContent=msg;}
const dispSay=m=>{$("dispMsg").textContent=m;};
let delArm=0;
$("dispSaved").addEventListener("click",e=>{const b=e.target.closest("button[data-disp]");if(!b||b.disabled)return;const a=b.dataset.disp,cur=DS.list.find(d=>d.id===DS.cur);
  if(a!=="delete"&&delArm){delArm=0;$("dispSaved").querySelector('[data-disp="delete"]').textContent="Delete";}
  if(a==="save"){const name=($("dispName").value||"").trim()||(cur?cur.name:"Living room"),same=DS.list.find(d=>d.name.toLowerCase()===name.toLowerCase()),tgt=cur||same,st=captureDisplay(name);
    if(tgt){tgt.name=name;tgt.state=st;tgt.saved=Date.now();}else{const id=Date.now().toString(36);DS.list.push({id,name,state:st,saved:Date.now()});DS.cur=id;}if(tgt)DS.cur=tgt.id;
    renderSaved(saveDS()?`Saved ${name}.`:"This browser won't store it. Use Export to keep a copy.");}
  else if(a==="new"){DS.cur=null;applyLayout2(null);saveDS();$("dispName").value="";renderSaved("A fresh layout. Name it and save it.");$("dispName").focus();}
  else if(a==="delete"){if(!cur)return;if(!delArm){delArm=1;b.textContent="Press again to delete";setTimeout(()=>{if(delArm){delArm=0;b.textContent="Delete";}},3000);return;}
    delArm=0;b.textContent="Delete";DS.list=DS.list.filter(d=>d.id!==cur.id);DS.cur=null;saveDS();renderSaved(`Deleted ${cur.name}.`);}
  else if(a==="export"){const blob=new Blob([JSON.stringify({v:2,app:"pixelbar",displays:DS.list.map(d=>d.state)},null,2)],{type:"application/json"}),u=URL.createObjectURL(blob),l=document.createElement("a");
    l.href=u;l.download="pixelbar-displays.json";document.body.append(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);dispSay(`Exported ${DS.list.length} display${DS.list.length===1?"":"s"}.`);}
  else if(a==="import")$("dispFile").click();});
$("dispFile").addEventListener("change",async e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(!f)return;
  try{const j=JSON.parse(await f.text()),arr=Array.isArray(j.displays)?j.displays:[j];let first=null,n=0;
    for(const st of arr){if(!st||!((st.v===1&&st.screens)||(st.v===2&&st.layout)))continue;const name=String(st.name||"Display").slice(0,32),old=DS.list.find(d=>d.name.toLowerCase()===name.toLowerCase());
      if(old){old.state=Object.assign({},st,{name});old.saved=Date.now();first=first||old;}else{const d={id:Date.now().toString(36)+n,name,state:Object.assign({},st,{name}),saved:Date.now()};DS.list.push(d);first=first||d;}n++;}
    if(!n)throw new Error("That file has no PixelBar displays in it.");applyDisplay(first.state);DS.cur=first.id;saveDS();renderSaved(`Imported ${n} display${n===1?"":"s"}.`);}
  catch(err){dispSay(err instanceof SyntaxError?"That file isn't valid JSON.":err.message);}});
$("dispSel").addEventListener("change",e=>{const d=DS.list.find(x=>x.id===e.target.value);if(!d){DS.cur=null;saveDS();renderSaved("");return;}try{applyDisplay(d.state);DS.cur=d.id;saveDS();renderSaved(`Showing ${d.name}.`);}catch(err){dispSay(err.message);}});
/* Pick your bar: where it goes, how big the screen is, the size, a name. Saving it opens Demo and Try it; a saved bar from an earlier visit opens them straight away. */
const SZL={"1x2":"S","1x4":"M","1x6":"L","1x8":"XL","1x10":"XXL"},BAR_MM=id=>byId(id).cols*160,walk={place:null,screen:false,sized:false};let walkOpen=false;
const unlocked=()=>walkOpen||DS.list.length>0;
function pressSeg(key,v){document.querySelectorAll(`.seg[data-key="${key}"] button`).forEach(b=>b.setAttribute("aria-pressed",String(v!=null&&b.dataset.v===String(v))));}
function screenW(){if(state.place==="tv")return scr(state.tv,16,9)[0];if(state.place==="monitor"){const ms=MONITORS[state.mon].map(([d,a,b])=>scr(d,a,b));return ms.reduce((t,[w])=>t+w,0)+(ms.length-1)*12;}return null;}
function recSize(){const w=screenW();if(w==null)return null;const fit=SIZE_IDS.filter(id=>BAR_MM(id)<=w);return fit.length?fit[fit.length-1]:SIZE_IDS[0];}
function walkFrom(d){state.place=d.place;walk.place=d.place;walk.screen=true;walk.sized=true;if(d.tv)state.tv=+d.tv;if(d.mon&&MONITORS[d.mon])state.mon=d.mon;pressSeg("place",d.place);pressSeg("tv",state.tv);pressSeg("mon",state.mon);
  $("ctl-tv").hidden=d.place!=="tv";$("ctl-mon").hidden=d.place!=="monitor";layoutStage();}
function renderWalk(){const p=walk.place,show3=!!p&&(p==="wall"||walk.screen),bar=!!p&&walk.sized;
  /* No bar in the drawing until there's a size: a suggestion from the screen size, or one picked. After that it stays through changes of spot. */
  document.querySelector(".stage-in").classList.toggle("nobar",!bar);$("nobarNote").textContent=p==="wall"?"The bar shows up here once you've picked a size.":"The bar shows up here once you've picked a screen size.";$("step2").hidden=!p||p==="wall";$("step3").hidden=!show3;$("step4").hidden=!show3;
  $("step2q").textContent=p==="monitor"?"How big is the monitor?":"How big is the TV?";
  const w=screenW(),rec=recSize();
  $("sizePick").innerHTML=SIZE_IDS.map(id=>{const mm=BAR_MM(id),d=w==null?null:mm-w,note=d==null?byId(id).cols+" panels":d<=0?`${Math.round(-d/2)} mm spare each side`:`${Math.round(d/2)} mm past each edge`;
    return `<button type="button" class="size-opt" data-size="${id}" aria-pressed="${id===simSize}"><span class="sz"><b>${SZL[id]}</b><span class="mm">${mm} mm</span></span><em>${note}</em>${id===rec?"<i>Best fit</i>":""}</button>`;}).join("");
  {const cur=DS.list.find(d=>d.id===DS.cur);if(cur&&document.activeElement!==$("walkName"))$("walkName").value=cur.name;}
  $("walkSaved").hidden=!DS.list.length;$("walkSavedList").innerHTML=DS.list.map(d=>{const n=d.name.replace(/[<&"]/g,"");return `<span class="bar-chip"><button type="button" data-load="${d.id}" aria-pressed="${d.id===DS.cur}">${n} · ${SZL[d.state.size]||d.state.size}</button><button type="button" class="x" data-del="${d.id}" aria-label="Delete ${n}">×</button></span>`;}).join("");
  for(const t of ["demo","try"]){const b=$("tabbtn-"+t),l=!unlocked();b.classList.toggle("locked",l);b.setAttribute("aria-disabled",String(l));if(l)b.title="Pick your bar first";else b.removeAttribute("title");}}
function lockHint(){const h=$("walkHint");h.textContent="Pick your bar first. Demo and Try it open after step 4.";h.classList.add("hint-on");$("h-walk").scrollIntoView({behavior:"smooth",block:"start"});}
$("sizePick").addEventListener("click",e=>{const b=e.target.closest("[data-size]");if(b){walk.sized=true;setSize(b.dataset.size);}});
$("walkUse").addEventListener("click",()=>{const def={tv:"Living room",monitor:"Office",wall:"Hallway"}[state.place]||"Living room",name=($("walkName").value||"").trim()||def,same=DS.list.find(d=>d.name.toLowerCase()===name.toLowerCase()),st=captureDisplay(name);
  if(same){same.state=st;same.saved=Date.now();DS.cur=same.id;}else{const id=Date.now().toString(36);DS.list.push({id,name,state:st,saved:Date.now()});DS.cur=id;}
  walkOpen=true;const ok=saveDS();renderSaved();renderWalk();$("walkDone").hidden=false;document.querySelector("#step4 .name-row").hidden=true;$("walkDoneMsg").textContent=`${name}: ${SZL[simSize]}, ${BAR_MM(simSize)} mm wide.`+(ok?" Saved in this browser.":" This browser won't keep it, so it's here until you close the page.");
  const h=$("walkHint");h.classList.remove("hint-on");h.textContent="Four steps. Demo and Try it open once you have one.";});
$("walkDone").addEventListener("click",e=>{const b=e.target.closest("[data-goto]");if(b)showTab(b.dataset.goto,true);});
/* The X deletes a saved bar straight away, with Undo for a few seconds instead of a confirmation. */
let undoT=0;
function walkSay(msg,undo){const h=$("walkHint");clearTimeout(undoT);h.classList.remove("hint-on");h.textContent=msg;if(undo){const u=document.createElement("button");u.type="button";u.className="undo";u.textContent="Undo";u.addEventListener("click",()=>{undo();walkSay("Four steps. Demo and Try it open once you have one.");});h.append(" ",u);
  undoT=setTimeout(()=>walkSay("Four steps. Demo and Try it open once you have one."),6000);}}
$("walkSavedList").addEventListener("click",e=>{const x=e.target.closest("[data-del]");if(x){const i=DS.list.findIndex(d=>d.id===x.dataset.del);if(i<0)return;const [gone]=DS.list.splice(i,1),wasCur=DS.cur===gone.id;if(wasCur)DS.cur=null;saveDS();renderSaved();renderWalk();
    walkSay(`Deleted ${gone.name}.`,()=>{DS.list.splice(i,0,gone);if(wasCur)DS.cur=gone.id;saveDS();renderSaved();renderWalk();});return;}
  const b=e.target.closest("[data-load]");if(!b)return;const d=DS.list.find(x=>x.id===b.dataset.load);if(!d)return;try{applyDisplay(d.state);DS.cur=d.id;saveDS();renderSaved();renderWalk();}catch(err){}});
/* New weather on Pick your bar: a different random sky each press, by day or night. */
function wxLabel(){const n=wxName(live.kind);$("wxNow").textContent=n?n.charAt(0)+n.slice(1).toLowerCase()+", "+(live.day?"day":"night"):"";}
$("wxRoll").addEventListener("click",()=>{let c;do c=CONDS[Math.floor(Math.random()*CONDS.length)];while(c===live.cond);live.cond=c;live.day=Math.random()<0.5;live.wx=null;live.syncKind();syncBars();wxLabel();dirty=true;});
/* Every visit opens on a random size, weather and sky, on the idle screen, with no theme. */
/* The page plays Home Assistant: it publishes example data and fills the default boxes with the same messages the examples show.
   It republishes when the demo's weather, media or lights change, as an automation would. */
const DEMO_BOXES={time:[{card:"clock"}],now:[{card:"temperature",data:"outside_temperature"}],today:[{card:"temperature",data:"outside_temperature"}],
  main:[{card:"temperature",data:"outside_temperature"},{card:"climate",data:"inside",label:"Inside"},{card:"forecast",data:"forecast_hourly"}],
  more:[{card:"forecast",data:"forecast_hourly"},{card:"climate",data:"inside",label:"Inside"},{card:"lights",area:"living_room"}],
  forecast:[{card:"forecast",data:"forecast_hourly"}],inside:[{card:"climate",data:"inside",label:"Inside"}],tomorrow:[{card:"forecast",data:"forecast_daily",period:"daily"}],
  lights:[{card:"lights",area:"living_room"},{card:"media",entity:"media_player.living_room_tv",when:{entity:"media_player.living_room_tv",not:"off"}}],
  glance:[{card:"caption"},{card:"temperature",data:"outside_temperature"},{card:"forecast",data:"forecast_hourly"}],words:[{card:"caption"}],
  outlook:[{card:"chart",data:"rain_next_hours",label:"Rain, next 2 hours",style:"rain",interval:15,when:{weather:["wet"]}},{card:"forecast",data:"forecast_hourly"}],
  rain:[{card:"chart",data:"rain_next_hours",label:"Rain, next 2 hours",style:"rain",interval:15,when:{weather:["wet"]}}]};
function demoHA(force){const kind=live.kind,sig=kind+"|"+live.tv+"|"+live.playing+"|"+ROOMS.map(r=>r[2]).join("");if(!force&&demoHA.sig===sig)return;demoHA.sig=sig;
  const now=new Date(),w=demoWx(kind,now),cond=(HA_WX.find(h=>h[1]===kBase(kind))||[EXTRA_HA[kBase(kind)]||"cloudy"])[0],F=fcFor(kind),D=demoDaily(kind,now),pub=(k,b)=>{if(!USER_KEYS.has(k))applyData("all",k,Object.assign({v:2},b));};
  pub("outside_temperature",{value:w.temperature,unit:"°C",attributes:{friendly_name:"Outside",apparent_temperature:w.apparent_temperature,high:w.high,low:w.low}});
  pub("forecast_hourly",{unit:"°C",value:F.temps.slice(0,8).map((t,i)=>{const d=new Date(now);d.setMinutes(0,0,0);d.setHours(d.getHours()+1+i);return {datetime:isoT(d),condition:cond,temperature:t,precipitation_probability:F.pops[i]};})});
  pub("forecast_daily",{unit:"°C",value:D.temps.map((t,i)=>{const d=new Date(now);d.setDate(d.getDate()+1+i);d.setHours(12,0,0,0);return {datetime:isoT(d),condition:i?["partlycloudy","rainy","sunny","cloudy"][(i-1)%4]:cond,temperature:t,precipitation_probability:D.pops[i]};})});
  pub("inside",{value:21.4,unit:"°C",attributes:{humidity:45,history:[20.6,20.4,20.3,20.5,21.0,21.6,21.9,21.7,21.4]}});
  pub("rain_next_hours",{value:isSnow(kind)?[1.2,1.6,2.1,1.8,1.1,0.6,0.3,0.1,0]:[5,3.5,2.5,3.3,1.7,0.7,0.3,0.1,0],unit:isSnow(kind)?"cm/h":"mm/h"});
  pub("area.living_room.light",{value:ROOMS.map(([nm,c,o])=>({name:nm,state:o?"on":"off",rgb_color:c||undefined}))});
  pub("media_player.living_room_tv",{value:live.tv?(live.playing?"playing":"paused"):"off",attributes:{friendly_name:"Living room TV",media_title:NP.title,media_artist:"S2 E5",media_duration:NP.dur,media_position:Math.round(live.pos||0),media_position_updated_at:isoT(now)}});
  if(force)for(const [n,cards] of Object.entries(DEMO_BOXES))applyBox("all",n,{v:2,cards});dirty=true;}
demoHA(true);
{const pick=a=>a[Math.floor(Math.random()*a.length)];live.cond=pick(CONDS);live.day=Math.random()<0.5;live.syncKind();wxLabel();setSize(pick(SIZE_IDS));syncBars();refreshUI();}
{const d=DS.list.find(x=>x.id===DS.cur);if(d){try{applyDisplay(d.state);}catch(e){DS.cur=null;}}renderSaved();renderWalk();}
showPane("notify","");sideCounts();
/* The rich editor: it reads the page's own lists, so a new icon or theme shows up in the typeahead on its own. */
/* The rich editor's lists: the page's own, so a new icon or theme shows up in the typeahead on its own. */
const edDesc=(o,f)=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,f(k,v)]));
function edLists(){const desc=edDesc;return {icons:desc(ICONS,()=>""),sounds:desc(SOUNDS,(k,v)=>v[0]+(v[2]?", for "+v[2]:"")),fonts:{pixel:"The default 5 × 7 face.",flip:"Split-flap tiles that flip when a character changes.",nixie:"Nixie tubes, numbers only."},
      anims:Object.assign({weather:"The sky with the sensors you list, for a few minutes.",goal:"Team colours, crests and the score.",fireworks:"Bursts in your colours, with the title.",confetti:"A burst, then confetti in your colours.",red_alert:"Red bars sweeping out around the title.",countdown:"Big numbers down to zero, then the title.",live:"A LIVE pill and the stream title, in the platform colour.",raid:"Chevrons racing across, then RAID!",flag:"A waving flag beside the title."},desc(THEMES,(k,v)=>v.name+" scene, with the title.")),
      sensors:Object.fromEntries(Object.keys(SENS).filter(k=>k!=="custom"&&k!=="__preview").map(k=>[k,(SCAT.find(r=>r[0]===k)||[0,""])[1]])),themes:desc(THEMES,(k,v)=>v.name),conditions:Object.fromEntries(HA_WX.map(([n])=>[n,""])),extras:Object.fromEntries(EXTRAS.map(([k,n])=>[k,n])),flags:desc(PRIDE,()=>""),wave_flags:WAVE_FLAGS,
      datakeys:Object.fromEntries([...POOL.keys()].sort().map(k=>{const e=poolGet(k),v=e&&e.value;return [k,Array.isArray(v)?v.length+" items":v==null?"":String(v)+(e.unit?" "+e.unit:"")];})),
      boxes:Object.fromEntries([...new Set([...SCREENS.flatMap(sc=>(LAYOUT[sc][simSize]||[]).map(z=>z.box)),...BOXES.keys()])].filter(Boolean).map(n=>[n,LAYOUT_HAS(n)?"On this display's layout":"Not on this display's layout"])),
      pics:Object.fromEntries(Object.keys(IMGS).map(k=>[k,""]))};}
ED=makeEditor($("jsonText"),{topic:()=>$("jsonTopic").value,thumb:edThumb,preview:edPreview,play:k=>playSeq(soundSeq(k)),validate:()=>PREV_ERR,onLink:p=>{if($("trySearch").value){$("trySearch").value="";trySearch("");}showPane(p);paneTop();},lists:edLists});
jsonPreview();
/* The sidebar and editor stick just under the display, whatever its height. */
try{new ResizeObserver(()=>$("viewTry").style.setProperty("--simH",$("sim").offsetHeight+"px")).observe($("sim"));}catch(e){}
for(const d of iconDisps)d.resize(d.pic?128:144);
layoutStage();layoutRacks();requestAnimationFrame(tick);
{const h=(location.hash||"").slice(1);if(TABS.includes(h)&&h!=="tv")showTab(h);}
/* First visit: what PixelBar is, that this is a demo, and where to follow along. Closing it is remembered in this browser so it doesn't come back. */
{const IK="pixelbar.intro.v1",dlg=$("intro");let seen=false;try{seen=localStorage.getItem(IK)==="1";}catch(e){}
  const done=()=>{try{localStorage.setItem(IK,"1");}catch(e){}};dlg.addEventListener("close",done);dlg.addEventListener("click",e=>{if(e.target===dlg){done();dlg.close();}});
  $("introGo").addEventListener("click",()=>{done();dlg.close();showTab("tv");});dlg.querySelector(".intro-discord").addEventListener("click",done);if(!seen&&dlg.showModal)dlg.showModal();}
})();
