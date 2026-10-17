'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=+process.env.PORT||3000,PUB=path.join(__dirname,'public');
const DATA=path.join(__dirname,'data');fs.mkdirSync(DATA,{recursive:true});
const DBF=path.join(DATA,'db.json');

// Complete lab curriculum
const LABS=[
  {num:1,title:'Introduction to Lab Equipment and Logic Gates',desc:'Study digital trainer, breadboard, ICs, and verify truth tables of basic gates',objectives:['Learn lab equipment','Verify logic gate truth tables','Understand IC pin configurations'],topics:['Breadboard setup','TTL chips','AND, OR, NOT, NAND, NOR, XOR gates','Truth tables']},
  {num:2,title:'Introduction to Verilog and SynaptiCAD',desc:'Learn Verilog HDL design methodology and simulation tools',objectives:['Understand Verilog syntax','Learn module structure','Use simulation tools'],topics:['Verilog basics','Module definition','Testbenches','SynaptiCAD introduction']},
  {num:3,title:'De Morgan\'s Law and Distributive Law',desc:'Apply and verify De Morgan\'s and Distributive laws using gates and Verilog',objectives:['Understand boolean algebra','Apply De Morgan\'s laws','Simplify expressions'],topics:['De Morgan\'s Law','Distributive Law','Boolean algebra','Circuit optimization']},
  {num:4,title:'Boolean Expression Simplification',desc:'Simplify complex boolean expressions to minimal literals',objectives:['Simplify boolean expressions','Minimize gate count','Implement optimized circuits'],topics:['Karnaugh maps','Boolean properties','Expression minimization']},
  {num:5,title:'Adders and Subtractors Design',desc:'Design and implement half/full adders and subtractors',objectives:['Design adders','Design subtractors','Understand carry propagation'],topics:['Half adder','Full adder','Half subtractor','Full subtractor','Ripple carry','Verilog arithmetic']},
  {num:6,title:'Gray Code Converter',desc:'Design binary to gray and gray to binary code converters',objectives:['Understand gray code','Implement converters','Verify conversion logic'],topics:['Binary to Gray conversion','Gray to Binary conversion','Code converters']},
  {num:7,title:'BCD to Excess-3 Converter',desc:'Design and implement BCD and Excess-3 code converters',objectives:['Understand BCD and Excess-3','Implement converters','Verify truth tables'],topics:['BCD code','Excess-3 code','Code conversion','Truth table verification']},
  {num:8,title:'Magnitude Comparator',desc:'Design 2-bit and 4-bit magnitude comparators',objectives:['Compare binary numbers','Implement comparators','Understand comparison logic'],topics:['Magnitude comparison','Equality checking','Greater/less than logic']},
  {num:9,title:'Multiplexer and De-Multiplexer',desc:'Design and implement multiplexers and de-multiplexers',objectives:['Understand signal routing','Implement MUX/DEMUX','Study IC 74150 and 74154'],topics:['Multiplexer','De-multiplexer','Data selection','Signal routing']},
  {num:10,title:'Encoder and Decoder',desc:'Design and implement encoders and decoders',objectives:['Encode binary data','Decode data','Study IC 7445 and 74147'],topics:['Encoder','Decoder','Priority encoder','Binary encoding']},
  {num:11,title:'Flip-Flops Study',desc:'Study and verify SR, D, JK, and T flip-flops',objectives:['Understand flip-flop operation','Verify truth tables','Study IC characteristics'],topics:['SR flip-flop','D flip-flop','JK flip-flop','T flip-flop','Edge triggering']},
  {num:12,title:'Shift Register Design',desc:'Design and implement serial and parallel shift registers',objectives:['Design shift registers','Convert serial to parallel','Implement shift operations'],topics:['Serial shift register','Parallel shift register','SIPO','PISO']},
  {num:13,title:'Decade Counter Implementation',desc:'Design and verify mod-10 decade counter',objectives:['Implement counters','Count cycles','Verify decade counter'],topics:['Counter design','Mod-10 counter','Counter reset','IC 7490']}
];

let D={
  users:[],
  sessions:{},
  site:{
    set:{name:'Circuit Studio Pro',tagline:'Master Digital Logic Design',hero:'Build • Simulate • Learn Electronics',color:'#6d28d9',banner:'',freeLesson:4},
    blocks:[
      {id:1,title:'🎯 Learn by Doing',text:'13 complete lab exercises with interactive trainers'},
      {id:2,title:'💻 Verilog & Hardware',text:'HDL simulation and breadboard implementation'},
      {id:3,title:'📊 Master Boolean Logic',text:'From basic gates to complex digital systems'}
    ],
    lessons:LABS.map((l,i)=>({num:l.num,title:l.title,desc:l.desc,objectives:l.objectives,topics:l.topics,interactive:true})),
    reference:[
      {title:'Boolean Algebra Laws',content:'De Morgan\'s Laws:\n(A·B)\' = A\' + B\'\n(A+B)\' = A\'·B\'\n\nAssociative: (A+B)+C = A+(B+C)\nCommutative: A+B = B+A\nDistributive: A(B+C) = AB + AC'},
      {title:'Truth Table - AND Gate',content:'A | B | Y\n0 | 0 | 0\n0 | 1 | 0\n1 | 0 | 0\n1 | 1 | 1\n\nY = A·B'},
      {title:'Truth Table - OR Gate',content:'A | B | Y\n0 | 0 | 0\n0 | 1 | 1\n1 | 0 | 1\n1 | 1 | 1\n\nY = A + B'},
      {title:'IC Pinouts',content:'IC 7408 (AND) - Pins 1,2,3 for first gate\nIC 7432 (OR) - Pins 1,2,3 for first gate\nIC 7404 (NOT) - Pin 1 input, Pin 2 output\nIC 7400 (NAND) - Pins 1,2,3 for first gate\nPower: Pin 14 = VCC, Pin 7 = GND'},
      {title:'Verilog Syntax',content:'module gate(A, B, Y);\n  input A, B;\n  output Y;\n  assign Y = A & B; // AND\nendmodule\n\nCommon operators:\n& (AND), | (OR), ~ (NOT)\n^ (XOR), ~ (NAND)'}
    ]
  }
};

try{D=JSON.parse(fs.readFileSync(DBF,'utf8'))}catch(e){}

// Create admin user if not exists
if(!D.users.find(u=>u.role==='admin')){
  const salt=crypto.randomBytes(16).toString('hex');
  const hash=crypto.scryptSync('admin123',salt,64).toString('hex');
  D.users.push({id:crypto.randomUUID(),email:'admin@gmail.com',name:'Admin',role:'admin',salt,hash,joined:Date.now()});
  fs.writeFileSync(DBF,JSON.stringify(D));
  console.log('\n✅ Admin account created\nEmail: admin@gmail.com\nPassword: admin123\n');
}

const save=()=>{try{fs.writeFileSync(DBF,JSON.stringify(D))}catch(e){console.error('Save:',e)}};

const hashPw=(pw,salt)=>crypto.scryptSync(pw,salt,64).toString('hex');
const okPw=(u,pw)=>u.hash===hashPw(pw,u.salt);

const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')).map(a=>[a[0],decodeURIComponent(a[1]||'')]));

const userOf=req=>{
  const t=cookies(req).sid,s=t&&D.sessions[t];
  if(!s||s.exp<Date.now())return null;
  return D.users.find(u=>u.id===s.uid)||null;
};

const sess=(res,u,remember)=>{
  const t=crypto.randomBytes(32).toString('hex'),ms=remember?30*864e5:864e5;
  D.sessions[t]={uid:u.id,exp:Date.now()+ms};
  save();
  const maxAge=Math.floor(ms/1000);
  return `sid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
};

const body=req=>new Promise((ok,no)=>{
  let b='',n=0;
  req.on('data',c=>{n+=c.length;if(n>1e6){no(new Error('Too large'));req.destroy()}else b+=c});
  req.on('end',()=>{try{ok(b?JSON.parse(b):{})}catch{no(new Error('Bad JSON'))}});
});

const send=(res,code,obj,h={})=>{
  res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store',...h});
  res.end(JSON.stringify(obj));
};

async function api(req,res,p){
  try{
    const m=req.method,me=userOf(req);
    
    // Bootstrap endpoint
    if(p==='/bootstrap'&&m==='GET'){
      return send(res,200,{
        me:me?{id:me.id,email:me.email,name:me.name,role:me.role}:null,
        site:D.site,
        notifs:D.notifs||[]
      });
    }
    
    // Lessons endpoint
    if(p==='/lessons'&&m==='GET'){
      const free=D.site.set.freeLesson||4;
      const lessons=D.site.lessons.map((l,i)=>({...l,accessible:(i+1)<=free||!!me}));
      return send(res,200,{lessons});
    }
    
    // Reference endpoint (no auth required)
    if(p==='/reference'&&m==='GET'){
      return send(res,200,{reference:D.site.reference||[]});
    }
    
    // Register
    if(m==='POST'&&p==='/register'){
      const b=await body(req);
      const e=(b.email||'').toLowerCase();
      if(!e.match(/@gmail\.com$/i))return send(res,400,{error:'Gmail only'});
      if(!b.password||b.password.length<6)return send(res,400,{error:'Min 6 chars'});
      if(D.users.find(u=>u.email===e))return send(res,400,{error:'Email exists'});
      const salt=crypto.randomBytes(16).toString('hex');
      const u={id:crypto.randomUUID(),email:e,name:b.name||'User',role:'user',salt,hash:hashPw(b.password,salt),joined:Date.now()};
      D.users.push(u);save();
      return send(res,200,{ok:1},{'Set-Cookie':sess(res,u,true)});
    }
    
    // Login
    if(m==='POST'&&p==='/login'){
      const b=await body(req);
      const e=(b.email||'').toLowerCase();
      const u=D.users.find(x=>x.email===e);
      if(!u||!okPw(u,b.password||''))return send(res,401,{error:'Wrong credentials'});
      return send(res,200,{ok:1},{'Set-Cookie':sess(res,u,!!b.remember)});
    }
    
    // Logout
    if(m==='POST'&&p==='/logout'){
      const t=cookies(req).sid;if(t)delete D.sessions[t];save();
      return send(res,200,{ok:1},{'Set-Cookie':'sid=; Path=/; Max-Age=0'});
    }
    
    // Require login for remaining endpoints
    if(!me)return send(res,401,{error:'Not logged in'});
    
    // Update profile
    if(m==='PUT'&&p==='/me'){
      const b=await body(req);
      if(b.name)me.name=String(b.name).slice(0,50);
      save();return send(res,200,{ok:1});
    }
    
    // Admin dashboard
    if(m==='GET'&&p==='/admin/dashboard'&&me.role==='admin'){
      return send(res,200,{users:D.users.length,sessions:Object.keys(D.sessions).length});
    }
    
    // Admin users list
    if(m==='GET'&&p==='/admin/users'&&me.role==='admin'){
      return send(res,200,{users:D.users.map(u=>({id:u.id,email:u.email,name:u.name,role:u.role}))});
    }
    
    send(res,404,{error:'Not found'});
  }catch(e){
    console.error('API error:',p,e.message);
    send(res,500,{error:'Server error'});
  }
}

http.createServer(async(req,res)=>{
  try{
    res.setHeader('Access-Control-Allow-Origin','*');
    const url=new URL(req.url,'http://x');
    const p=decodeURIComponent(url.pathname);
    
    if(p.startsWith('/api/')){
      return await api(req,res,p.slice(4));
    }
    
    const f=path.join(PUB,p==='/'?'index.html':p);
    if(!f.startsWith(PUB))return send(res,403,{error:'Forbidden'});
    
    fs.readFile(f,(err,data)=>{
      if(err){res.writeHead(404);return res.end('Not found')}
      const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
      res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'text/plain'});
      res.end(data);
    });
  }catch(e){
    console.error('Server error:',e.message);
    res.writeHead(500,{'Content-Type':'application/json'});
    res.end(JSON.stringify({error:'Server error'}));
  }
}).listen(PORT,'0.0.0.0',()=>{const os=require('os');const ips=Object.values(os.networkInterfaces()).flat().filter(i=>i&&i.family==='IPv4'&&!i.internal).map(i=>i.address);
  console.log(`\n✅ Circuit Studio Pro is running\n   On this computer:  http://localhost:${PORT}`);ips.forEach(ip=>console.log(`   On WiFi / phones:  http://${ip}:${PORT}`));console.log('   (phones and other devices on the same WiFi can open the WiFi address)\n')});
