(() => {
  'use strict';
  // Far silhouettes move slowly. Only the bright front layer is solid.
  const palettes=[
    {top:'#190f22',sky:'#b94219',far:'#68301a',near:'#25101d',light:'#fd8036',edge:'#ffc25c'},
    {top:'#0d1535',sky:'#176471',far:'#124966',near:'#141737',light:'#43bee0',edge:'#77faef'},
    {top:'#1c0b21',sky:'#923634',far:'#791b2c',near:'#260916',light:'#ff4e39',edge:'#ff825b'},
    {top:'#10102d',sky:'#43376a',far:'#47327a',near:'#180d33',light:'#9b7cfd',edge:'#c1a8ff'},
    {top:'#150e2a',sky:'#613654',far:'#732252',near:'#220c32',light:'#f251a0',edge:'#ff83c7'}
  ];
  const tau=2*Math.PI;
  function polygon(c,points,fill,stroke){
    c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);
    c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}
  }
  function disk(c,x,y,r,fill){c.beginPath();c.arc(x,y,r,0,tau);c.fillStyle=fill;c.fill();}
  function ring(c,x,y,r,width,ink){
    c.beginPath();c.arc(x,y,r,0,tau);c.strokeStyle=ink;c.lineWidth=width;c.stroke();
  }
  function box(c,x,y,w,h,ink){c.fillStyle=ink;c.fillRect(x,y,w,h);}
  function wheel(c,x,y,r,angle,fill,edge){
    const pts=[];for(let i=0;i<48;i++){
      const a=angle+i*tau/48,rad=i%4===1||i%4===2?r:r*.81;
      pts.push([x+Math.cos(a)*rad,y+Math.sin(a)*rad]);
    }
    polygon(c,pts,fill,edge);ring(c,x,y,r*.57,2,edge);disk(c,x,y,r*.16,edge);
  }
  function foundry(c,x,y,k,t,p){
    box(c,x-58,y-108,92,102,p.near);
    polygon(c,[[x-66,y-106],[x-56,y-123],[x+25,y-123],[x+45,y-106]],p.far);
    box(c,x-48,y-159,12,39,p.near);box(c,x-51,y-163,18,5,p.near);
    for(let j=0;j<4;j++)box(c,x-44+j*16,y-92,9,27,p.light);
    for(let j=0;j<3;j++)box(c,x-50,y-83+j*7,64,3,p.near);
    wheel(c,x+55,y-63,42,t*.0012+k,p.far,p.light);
    wheel(c,x+18,y-24,23,-t*.0021,p.near,p.light);
    box(c,x-88,y-12,192,6,p.near);
  }
  function cavern(c,x,y,k,t,p){
    for(const [dx,dy,h,w,slant,face] of [[-54,9,114,36,-22,p.far],[-16,2,171,47,23,p.light],[44,16,96,32,31,p.far]]){
      const a=x+dx,b=y+dy,tip=a+slant;
      polygon(c,[[a-w,b],[a-w*.6,b-h*.65],[tip,b-h],[a+w,b-h*.53],[a+w*.48,b]],p.far,p.light);
      polygon(c,[[tip,b-h],[a+7,b-h*.5],[a+w*.48,b],[a+w,b-h*.53]],face);
      polygon(c,[[a-w*.6,b-h*.65],[tip,b-h],[a+7,b-h*.5]],p.near);
    }
  }
  function fortress(c,x,y,k,t,p){
    // The distant keep has ribbed vaults and irregular broken spires.
    const cap=y-130-(Math.abs(k)%3)*17;
    polygon(c,[[x-94,y],[x-76,cap+24],[x-54,cap+8],[x-49,cap-43],[x-39,cap-13],
      [x-22,cap+2],[x+2,cap-8],[x+19,cap-61],[x+26,cap-15],[x+48,cap+3],[x+57,cap-21],[x+70,cap+26],[x+94,y]],p.near);
    for(let j=0;j<3;j++){
      const a=x-56+j*46,top=cap+28+(j%2)*12;
      polygon(c,[[a-13,y],[a-13,top+15],[a,top],[a+13,top+15],[a+13,y]],p.far);
      box(c,a-2,top+12,3,y-top-12,p.near);
      box(c,a-10,top+18,1.5,28,p.light);
    }
  }
  function abbey(c,x,y,k,t,p){
    const top=y-152;
    const arch=(a,b,w,h,ink)=>polygon(c,[[a-w,b],[a-w,b-h*.68],[a-w*.63,b-h*.86],[a,b-h],[a+w*.63,b-h*.86],[a+w,b-h*.68],[a+w,b]],ink);
    arch(x,y,52,157,p.near);arch(x,y-7,35,128,p.light);arch(x,y-9,30,117,p.far);
    box(c,x-2,top+38,4,106,p.light);box(c,x-27,top+85,54,3,p.light);
    for(const side of [-1,1]){
      const a=x+57*side;box(c,a-3,top+29,6,125,p.near);
      polygon(c,[[a-7,top+32],[a,top-10],[a+7,top+32]],p.near);
    }
    if(k%2===0){
      const a=x+88+Math.sin(t*.0009)*18;
      polygon(c,[[x+88,top+2],[a+1,y-55],[a-1,y-55]],p.light);
      disk(c,a,y-51,9,p.light);disk(c,a,y-51,5,p.near);
    }
  }
  function actuator(c,x,y,k,t,p){
    const cy=y-116,r=k%2===0?66:40;
    for(const side of [-1,1]){
      box(c,x+r*side-6,cy,12,y-cy,p.near);
      box(c,x+r*side-3,cy+14,6,32,p.light);
    }
    disk(c,x,cy,r,p.near);ring(c,x,cy,r-2,3,p.light);
    for(let j=0;j<8;j++){
      const a=j*tau/8+t*.00012,b=a+tau/8,ap=r*(.31+.065*Math.sin(t*.0017));
      polygon(c,[[x+(r-6)*Math.cos(a),cy+(r-6)*Math.sin(a)],[x+(r-6)*Math.cos(b),cy+(r-6)*Math.sin(b)],
        [x+ap*Math.cos(b+.6),cy+ap*Math.sin(b+.6)],[x+ap*Math.cos(a+.6),cy+ap*Math.sin(a+.6)]],j%2?p.far:p.light);
    }
    disk(c,x,cy,r*.2,p.far);
  }
  const vistas=[foundry,cavern,fortress,abbey,actuator];
  function interior(c,level,x,width,ground,p){
    const n=level.demon,span=[146,152,174,166,134][n],t=x*.32;
    for(let j=-1;j<Math.ceil(width/span)+1;j++){
      const px=j*span-t%span,base=ground-(n===3?17:7);
      if(n===0){
        for(const y of [60,140,203]){
          box(c,px,y,span,9,p.far);box(c,px,y+1,span,2,p.light);
          box(c,px+38,y-5,7,19,p.near);
        }
        box(c,px+84,30,12,ground,p.near);
        wheel(c,px+90,160,28,x*.0014,p.near,p.light);
      }else if(n===1){
        polygon(c,[[px,base],[px+18,base-105],[px+74,base-202],[px+121,base-113],[px+span,base]],p.far,p.light);
        polygon(c,[[px+18,base-105],[px+74,base-202],[px+66,base-56]],p.light);
        polygon(c,[[px+74,base-202],[px+121,base-113],[px+66,base-56]],p.near);
      }else if(n===2||n===3){
        const y=n===2?78:51;
        polygon(c,[[px,base],[px,y+40],[px+span*.26,y],[px+span*.5,y-21],[px+span*.74,y],[px+span,y+40],[px+span,base],
          [px+span-12,base],[px+span-12,y+47],[px+span*.72,y+11],[px+span*.5,y-7],[px+span*.28,y+11],[px+12,y+47],[px+12,base]],p.near,p.far);
        if(n===2){
          const lamp=px+span*.5;box(c,lamp-1,y-4,2,49,p.light);
          polygon(c,[[lamp-7,y+41],[lamp+7,y+41],[lamp+3,y+56],[lamp-3,y+56]],p.light);
          polygon(c,[[lamp-3,y+43],[lamp+3,y+43],[lamp,y+53]],p.edge);
        }else{
          ring(c,px+span/2,y+56,25,3,p.light);
          for(let k=0;k<6;k++){const a=k*tau/6;ring(c,px+span/2+11*Math.cos(a),y+56+11*Math.sin(a),9,1,p.light);}
        }
      }else{
        for(let k=0;k<3;k++){
          const y=55+k*67;
          polygon(c,[[px,y],[px+span*.26,y],[px+span*.46,y+21],[px+span*.85,y+21],[px+span*.85,y+24],[px+span*.44,y+24],[px+span*.24,y+3],[px,y+3]],p.light);
          ring(c,px+span*.87,y+22,4,2,p.light);
        }
        box(c,px+21,13,7,ground,p.near);
      }
    }
  }
  const lights=[
    ['#bf4b1b','#185993','#a03f2c','#754132'],
    ['#1285ad','#762ab8','#224578','#307166','#5e3d90'],
    ['#c32935','#c52f17','#48345f','#65324f','#9b342b'],
    ['#533ea4','#22639b','#3d406c','#62467d','#375378','#4b3670'],
    ['#a42c74','#4c39a4','#5b3066','#824537','#363e73','#673953','#793351']
  ];
  // The outer silhouette is the collision face. All luminous trim is inset.
  function girder(c,x,y,w,h,p){
    if(w<=0||h<=0)return;
    box(c,x,y,w,h,'#070914');
    box(c,x+2,y+2,w-4,Math.min(3,h-2),p.edge);
    if(h<10)return;
    box(c,x+3,y+6,w-6,h-9,p.far);
    const cols=Math.max(1,Math.round((w-8)/26)),rows=Math.max(1,Math.round((h-8)/25));
    const sx=(w-8)/cols,sy=(h-8)/rows;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const a=x+4+col*sx,b=y+5+row*sy,cw=sx-1,ch=sy-1;
      box(c,a,b,cw,ch,p.near);
      polygon(c,[[a+1,b+1],[a+cw-2,b+1],[a+cw*.56,b+ch*.55],[a+1,b+ch-2]],p.far);
      polygon(c,[[a+1,b+1],[a+cw*.42,b+1],[a+1,b+ch*.41]],p.light);
      box(c,a+2,b+1,Math.max(1,cw-4),1,p.light);
      if(ch>15&&cw>12){box(c,a+cw-4,b+ch-5,2,3,p.light);box(c,a+3,b+ch-5,Math.min(5,cw*.24),1,p.edge);}
    }
    box(c,x+1,y,w-2,1.3,'#f9fcff');box(c,x+1,y+h-2,w-2,1,p.light);
  }
  function tooth(c,x,y,w,h,sign,p){
    const tip=y+sign*h,a=x+w/2;
    polygon(c,[[x,y],[a,tip],[x+w,y]],'#070912',p.edge);
    polygon(c,[[a,tip-sign*4],[x+w-3,y+sign],[a+2,y+sign]],p.light);
    polygon(c,[[a,tip-sign*5],[a-3,y+sign*6],[a+1,y+sign*4]],'#dffaff');
  }
  function hangingTooth(c,x,ground,o,p){
    const base=ground-o.height-30;
    girder(c,x,-2,o.width,Math.max(3,base+2),p);
    tooth(c,x,base,o.width,30,1,p);
  }
  function spikeBed(c,left,ground,o,screen,p){
    const n=Math.ceil(o.width/24),step=o.width/n;
    const first=Math.max(0,Math.floor(-left/step)),last=Math.min(n,Math.ceil((screen-left)/step));
    box(c,left,ground,o.width,14,'#090a16');
    for(let i=first;i<last;i++)tooth(c,left+i*step,ground,step,o.height,-1,p);
    box(c,left,ground+1,o.width,3,p.light);
  }
  function rail(c,x,ground,o,p){
    const sign=o.height?1:-1,base=o.height?ground-257:ground,body=o.depth*.54;
    const ceiling=base+sign*body,teeth=Math.max(2,Math.round(o.width/24)),w=o.width/teeth;
    girder(c,x,Math.min(base,ceiling),o.width,body,p);
    for(let i=0;i<teeth;i++)tooth(c,x+i*w,ceiling,w,o.depth-body,sign,p);
  }
  function lightWell(c,x,width,ground,p,demon){
    const bands=[76,96,88,106,84],step=bands[demon],scroll=x*.21;
    const span=step*2,first=Math.floor(scroll/span)-1,last=first+Math.ceil(width/span)+2;
    c.globalAlpha=.18;
    for(let k=first;k<=last;k++){
      const a=k*span-scroll,dy=Math.abs(k%3)*13;
      polygon(c,[[a+3,34],[a+57,34],[a+143,ground],[a+94,ground]],p.light);
      box(c,a+step,ground-132-dy,step-6,2,p.light);
      polygon(c,[[a+13,52+dy],[a+37,43+dy],[a+64,53+dy],[a+42,62+dy]],p.light);
    }
    c.globalAlpha=1;
  }
  function machinery(c,x,width,p,demon){
    // Suspended trusses and backlit ribbing define the roof above the route.
    const shift=x*.54,span=156,first=Math.floor(shift/span)-1;
    const dark=p.near;
    for(let k=first;k<first+Math.ceil(width/span)+3;k++){
      const a=k*span-shift,deep=31+(Math.abs(k)%3)*7;
      polygon(c,[[a,0],[a+span,0],[a+span,15],[a+112,15],[a+93,deep],[a+56,deep],[a+37,17],[a,17]],dark);
      polygon(c,[[a+43,16],[a+59,deep-4],[a+87,deep-4],[a+106,16],[a+101,16],[a+85,deep-8],[a+61,deep-8],[a+49,16]],p.far);
      box(c,a+65,deep-3,17,1.5,p.light);
      for(let j=0;j<3;j++)box(c,a+13+j*6,12,3,2,p.light);
      if((k+demon)%3===0){
        const y=deep+24+(Math.abs(k)%4)*4;
        box(c,a+72,deep,1,y-deep,p.light);
        polygon(c,[[a+68,y],[a+73,y-6],[a+78,y],[a+73,y+8]],p.light);
      }
    }
  }
  function portal(c,px,cy,phase,tint,kind){
    c.save();c.translate(px,cy);
    c.globalAlpha=.14;
    for(const r of [24,19]){
      c.beginPath();c.ellipse(0,0,r,63+r*.15,0,0,tau);c.fillStyle=tint;c.fill();
    }
    c.globalAlpha=1;
    for(let j=0;j<14;j++){
      const a=j*tau/14,b=a+tau/14*.82;
      polygon(c,[[19*Math.cos(a),63*Math.sin(a)],[19*Math.cos(b),63*Math.sin(b)],
        [12*Math.cos(b),55*Math.sin(b)],[12*Math.cos(a),55*Math.sin(a)]],
        j%3===0?'#f5ffff':tint,'#101223');
    }
    c.beginPath();c.ellipse(0,0,10,54,0,0,tau);c.strokeStyle=tint;c.lineWidth=1.5;c.stroke();
    for(let k=0;k<7;k++){
      const t=(phase+k/7)%1;
      c.globalAlpha=(1-t)*.85;box(c,-29+t*24,(k*31%85)-41,2.3,2.3,tint);
    }
    c.globalAlpha=1;
    if(kind==='invert'||kind==='upright'){
      const dir=kind==='invert'?-1:1;
      polygon(c,[[-7,-3*dir],[0,5*dir],[7,-3*dir],[0,1*dir]],'#ffffff');
    }
    c.restore();
  }
  function background(c,level,x,width,ground,section){
    const p=palettes[level.demon],gradient=c.createLinearGradient?.(0,0,0,ground);
    if(gradient?.addColorStop){gradient.addColorStop(0,p.top);const inks=lights[level.demon],blend=Math.max(0,Math.min(1,(x-level.chapters[section].x)/135));
      const current=inks[section],prev=inks[Math.max(0,section-1)];
      const rgb=[1,3,5].map(j=>Math.round(parseInt(prev.slice(j,j+2),16)*(1-blend)+parseInt(current.slice(j,j+2),16)*blend));
      gradient.addColorStop(.65,'rgb('+rgb.join(',')+')');gradient.addColorStop(1,p.far);}
    box(c,0,0,width,ground,gradient?.addColorStop?gradient:p.sky);
    const focus=width*.61+Math.sin(x*.0006)*width*.13;
    const halo=c.createRadialGradient?.(focus,ground*.68,8,focus,ground*.68,ground*.98);
    if(halo?.addColorStop){
      halo.addColorStop(0,p.light+'a3');halo.addColorStop(.47,p.light+'52');halo.addColorStop(1,p.light+'00');
      box(c,0,0,width,ground,halo);
    }
    const period=[245,202,250,192,222][level.demon];
    for(let k=-1;k<Math.ceil(width/period)+2;k++){
      const n=Math.floor(x*.13/period)+k,px=k*period-(x*.13%period),h=54+Math.abs(n*43)%100;
      if(level.demon===3){
        if(n%3===0){disk(c,px+60,63,32,p.light);disk(c,px+70,56,30,p.sky);}
        polygon(c,[[px-25,ground],[px+20,ground-h],[px+65,ground-h*.56],[px+112,ground-h*1.22],[px+period+16,ground]],p.far);
      }else if(level.demon===1){
        polygon(c,[[px-40,0],[px+20,59+(h%62)],[px+45,30],[px+64,76],[px+102,0]],p.far);
      }else{
        box(c,px,ground-h,period*.68,h,p.far);
        for(let j=0;j<4;j++)box(c,px+j*22,ground-h-16-(j%2)*12,9,29,p.far);
      }
    }
    lightWell(c,x,width,ground,p,level.demon);
    c.globalAlpha=.64;
    for(let i=0;i<29;i++){
      const px=((i*137-x*.055)%width+width)%width,py=17+(i*61)%187;
      box(c,px,py,i%7===0?2:1,2,p.light);
    }
    if(section%3===2||level.demon===3&&section===1){interior(c,level,x,width,ground,p);}
    else{
      for(let k=-1;k<Math.ceil(width/period)+1;k++){
        const n=Math.floor(x*.36/period)+k,px=k*period-(x*.36%period);
        vistas[level.demon](c,px+period/2,ground+5+(Math.abs(n)%2)*17,n,x,p);
      }
    }
    c.globalAlpha=1;machinery(c,x,width,p,level.demon);
    if(section%2){c.globalAlpha=.08;box(c,0,0,width,ground,p.edge);c.globalAlpha=1;}
  }
  function gate(c,o,left,ground,level){
    const p=palettes[level.demon],D=globalThis.lectioPlusDash,w=o.width;
    const xs=o.profile?o.profile.map(point=>point[0]):[0,o.bevel,w-o.bevel,w];
    for(const upper of [false,true]){
      const sign=upper?-1:1,edge=upper?0:ground;
      const face=xs.map(dx=>[left+dx,ground-o.height-(upper?o.opening:0)+sign*D.gateRelief(o,o.x+dx)]);
      polygon(c,[[left,edge],...face,[left+w,edge]],p.near);
      polygon(c,[...face,...face.slice().reverse().map(([vx,vy])=>[vx,vy+sign*3])],p.edge);
      const flat=o.profile?ground-o.height-(upper?o.opening:0):face[1][1],body=Math.abs(edge-flat);
      polygon(c,[...face.map(([vx,vy])=>[vx,vy+sign*5]),...face.slice().reverse().map(([vx,vy])=>[vx,vy+sign*9])],p.far);
      for(let j=0;j<3;j++){
        const dx=left+w*.5+(j-1)*7;
        box(c,dx,flat+sign*13,4,2,p.light);
      }
      if(level.demon===2){
        for(let j=2;j<face.length-1;j+=2){
          const [vx,vy]=face[j];polygon(c,[[vx,vy+sign*3],[vx+4,vy+sign*12],[vx,vy+sign*9]],'#fff7cc');
        }
        if(upper&&body>57){
          const ey=flat-51;
          for(const side of [-1,1]){
            const a=left+w*.5+side*4;
            polygon(c,[[a,ey+4],[a+side*w*.25,ey-7],[a+side*w*.21,ey+5],[a+side*w*.07,ey+9]],'#fff5b0');
            box(c,a+side*w*.13,ey,2.6,6,p.near);
          }
        }
      }else if(level.demon===1){
        polygon(c,[[left+4,edge],[left+w*.55,flat+sign*7],[left+w-4,edge]],p.far,p.light);
      }else{
        for(let y=Math.min(edge,flat)+15;y<Math.max(edge,flat)-12;y+=18){
          box(c,left+w*.3,y,w*.4,3,p.far);
          box(c,left+w*.35,y,w*.19,1,p.light);
        }
        for(const dx of [.12,.88])disk(c,left+w*dx,flat+sign*24,2.5,p.light);
      }
    }
  }
  function passage(c,o,left,ground,p){
    for(const upper of [false,true]){
      const y0=ground-(upper?o.upper:o.height),y1=ground-(upper?o.endHigh:o.endLow);
      const edge=upper?0:ground,sign=upper?-1:1,right=left+o.width;
      polygon(c,[[left,edge],[left,y0],[right,y1],[right,edge]],p.near);
      polygon(c,[[left,y0],[right,y1],[right,y1+sign*2],[left,y0+sign*2]],p.edge);
      for(let i=8;i<o.width-19;i+=24){
        const y=y0+(y1-y0)*i/o.width;
        polygon(c,[[left+i,y+sign*8],[left+i+16,y+sign*11],[left+i+6,y+sign*20]],p.far);
      }
    }
  }
  function saw(c,x,y,r,time,tint){
    const vertices=[];
    for(let i=0;i<36;i++){
      const a=i*tau/36+time*.007,rad=i%3===0?r*.68:i%3===1?r:r*.81;
      vertices.push([x+rad*Math.cos(a),y+rad*Math.sin(a)]);
    }
    polygon(c,vertices,'#172034','#fff0dc');disk(c,x,y,r*.55,tint);disk(c,x,y,r*.35,'#24203a');disk(c,x,y,2.3,'#fff5df');
  }
  globalThis.lectioPlusDashScenery={background,gate,passage,saw,palettes,girder,tooth,hangingTooth,spikeBed,rail,portal};
})();
