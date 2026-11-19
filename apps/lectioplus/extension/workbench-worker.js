// Runs only inside an opaque-origin sandbox worker. No Lectio data or storage
// is passed here. Network access is blocked by the sandbox's CSP.
'use strict';
const blob=(data,type='text/javascript')=>URL.createObjectURL(new Blob([data],{type}));
let activeRun=0,pendingInput=null,inputSerial=0;
self.onmessage=async({data})=>{
  if(data?.type==='stdin'){
    if(data.id===activeRun&&pendingInput&&data.requestId===pendingInput.requestId&&typeof data.value==='string'&&data.value.length<=4096&&!/[\r\n]/.test(data.value)){
      const resolve=pendingInput.resolve;pendingInput=null;resolve(data.value);
    }
    return;
  }
  if(activeRun)return;
  const {id,payload:p,files}=data;activeRun=id;
  let text='',trace=[],pending='',pendingStream='stdout',lastFlush=0,flushTimer,running=false;
  const flush=()=>{clearTimeout(flushTimer);flushTimer=null;while(pending){const chunk=pending.slice(0,8192);pending=pending.slice(chunk.length);self.postMessage({id,type:'progress',phase:'output',stream:pendingStream,text:chunk});}lastFlush=Date.now();};
  const send=(type,value)=>{if(type==='result'||type==='error')flush();if(type==='progress'&&value.phase==='working')running=true;self.postMessage({id,type,...value});};
  const output=(value,stream='stdout')=>{if(!value)return;if(text.length+value.length>100000)throw Error('Programmet skrev mere end 100.000 tegn.');if(stream!==pendingStream)flush();text+=value;pendingStream=stream;pending+=value;if(pending.length>=1024||Date.now()-lastFlush>=100)flush();else if(!flushTimer)flushTimer=setTimeout(flush,100);};
  const write=(value,stream='stdout')=>output(String(value)+'\n',stream);
  try{
    if(p.language==='python'){
      send('progress',{phase:'loading',stage:'wasm'});
      // Report an unsupported engine/CSP or damaged binary before the loader's
      // internal instantiateWasm hook can swallow the exception and hang.
      await WebAssembly.compile(files.wasm);
      // Pyodide 314 installs its own instantiateWasm hook. Passing wasmBinary
      // to the Emscripten factory alone does not prevent its earlier fetch.
      // Resolve that one virtual URL from the bytes supplied by our host;
      // no request to this address (or any other network URL) is made.
      const runtimeBase='https://lectioplus.invalid/python/',fetchBlob=globalThis.fetch.bind(globalThis);
      globalThis.fetch=async(resource,options)=>{
        const url=typeof resource==='string'?resource:resource?.url||String(resource);
        if(url===runtimeBase+'pyodide.asm.wasm')return new Response(files.wasm,{headers:{'Content-Type':'application/wasm'}});
        if(url.startsWith('blob:'))return fetchBlob(resource,options);
        throw Error('Python kører offline. Eksterne filer kan ikke hentes her.');
      };
      send('progress',{phase:'loading',stage:'modules'});
      const {loadPyodide}=await import(blob(files.py));const {default:create}=await import(blob(files.asm));
      send('progress',{phase:'loading',stage:'python'});
      let rejectStartup,py;
      const failed=new Promise((_,reject)=>rejectStartup=reject),instantiateStreaming=WebAssembly.instantiateStreaming;
      WebAssembly.instantiateStreaming=(...args)=>{
        const promise=Promise.resolve().then(()=>instantiateStreaming.apply(WebAssembly,args));
        promise.catch(rejectStartup);return promise;
      };
      try{
        py=await Promise.race([failed,loadPyodide({indexURL:runtimeBase,createPyodideModule:settings=>create({...settings,wasmBinary:new Uint8Array(files.wasm),onAbort:message=>rejectStartup(Error(String(message)))}),stdLibURL:blob(files.stdlib,'application/zip'),lockFileContents:files.lock,jsglobals:{},stdout:value=>write(value),stderr:value=>write(value,'stderr')})]);
      }finally{WebAssembly.instantiateStreaming=instantiateStreaming;}
      // Preserve partial lines, input prompts and UTF-8 instead of adding a
      // newline to every callback from Pyodide's default batched handler.
      const stdout=new TextDecoder(),stderr=new TextDecoder();
      py.setStdout({write:bytes=>{output(stdout.decode(bytes,{stream:true}));return bytes.length;}});
      py.setStderr({write:bytes=>{output(stderr.decode(bytes,{stream:true}),'stderr');return bytes.length;}});
      const lines=String(p.stdin||'').split('\n');let inputIndex=0;py.setStdin({stdin:()=>inputIndex<lines.length?lines[inputIndex++]:null});
      py.globals.set('_lxp_read_input',()=>new Promise(resolve=>{
        const requestId=++inputSerial;pendingInput={requestId,resolve};flush();
        send('progress',{phase:'input',requestId});
      }));
      py.globals.set('_lxp_payload',JSON.stringify({code:p.code,trace:Boolean(p.trace),interactiveInput:p.interactiveInput===true,tests:Array.isArray(p.tests)?p.tests.slice(0,25):[],entry:p.entry||'',mode:p.mode||'function'}));
      send('progress',{phase:'working'});
      const result=await py.runPythonAsync(`
import json as _json, sys as _sys, io as _io, contextlib as _contextlib, math as _math
import builtins as _builtins
from pyodide.ffi import run_sync as _run_sync, can_run_sync as _can_run_sync
_p = _json.loads(_lxp_payload)
def _terminal_input(prompt='', /):
    if not _can_run_sync():
        raise RuntimeError('Denne browser understøtter ikke interaktivt input. Opdatér Chrome/Edge, eller vælg Forudfyldte svar under Input.')
    _sys.stdout.write(str(prompt))
    _sys.stdout.flush()
    _sys.stderr.flush()
    return _run_sync(_lxp_read_input())
_frames = []
def _snapshot(frame, event, arg):
    if frame.f_code.co_filename == '<elevkode>' and event == 'line' and len(_frames) < 300:
        safe = {}
        for key, value in list(frame.f_locals.items())[:30]:
            if not key.startswith('_'):
                if type(value) in (str, int, float, bool, type(None)):
                    safe[key] = str(value)[:200]
                elif type(value) in (list, tuple, dict):
                    safe[key] = str(value)[:200]
        _frames.append({'line': frame.f_lineno, 'variables': safe})
    return _snapshot
def _equal(a, b):
    if isinstance(a, (int, float)) and not isinstance(a, bool) and isinstance(b, (int, float)) and not isinstance(b, bool):
        if isinstance(b, int):
            if isinstance(a, int) or a.is_integer():
                return a == b
            # JSON cannot distinguish an expected 2.0 from 2. Allow only
            # rounding noise near that integer, never a wrong whole value.
            return _math.isfinite(a) and abs(a-b) <= max(1e-8, 4*_math.ulp(a))
        return _math.isclose(a,b,rel_tol=1e-8,abs_tol=1e-8)
    if isinstance(a,(list,tuple)) and isinstance(b,list):
        return len(a)==len(b) and all(_equal(x,y) for x,y in zip(a,b))
    if isinstance(a,dict) and isinstance(b,dict):
        return a.keys()==b.keys() and all(_equal(a[k],b[k]) for k in a)
    return type(a)==type(b) and a==b
class _LimitedOutput(_io.StringIO):
    def write(self, value):
        if self.tell() + len(value) > 100000:
            raise RuntimeError('Programmet skrev mere end 100.000 tegn.')
        return super().write(value)
_checks=[]
if _p['tests']:
    for _case in _p['tests']:
        _out=_LimitedOutput(); _scope={'__name__':'__main__'}
        _original_input, _original_stdin = _builtins.input, _sys.stdin
        _test_stdin = _io.TextIOWrapper(_io.BytesIO(''.join(str(line) + chr(10) for line in _case.get('stdin', [])).encode('utf-8')), encoding='utf-8')
        def _test_input(prompt='', /):
            # Match Python input/EOF semantics, but omit prompts from grading.
            # Imported input() and sys.stdin share the same per-case stream.
            str(prompt)
            line = _sys.stdin.readline()
            if line == '':
                raise EOFError('EOF when reading a line')
            return line.removesuffix(chr(10))
        try:
            _sys.stdin, _builtins.input = _test_stdin, _test_input
            with _contextlib.redirect_stdout(_out):
                exec(compile(_p['code'],'<elevkode>','exec'),_scope)
                _actual=_scope[_p['entry']](*_case.get('args',[])) if _p['mode']=='function' else _out.getvalue()
            _expected=_case['expected']
            # print() may add one final newline. Spaces and extra blank lines
            # are part of the answer and must not be silently stripped.
            if _p['mode'] != 'function' and isinstance(_expected, str) and _actual == _expected + chr(10):
                _actual = _expected
            _passed=_equal(_actual,_expected)
            _checks.append({'passed':_passed,'actual':str(_actual)[:1000],'expected':str(_expected)[:1000]})
        except Exception as e:
            _checks.append({'passed':False,'error':type(e).__name__+': '+str(e)[:1000]})
        finally:
            _builtins.input, _sys.stdin = _original_input, _original_stdin
            _test_stdin.close()
else:
    _original_input = _builtins.input
    try:
        if _p.get('interactiveInput', False): _builtins.input = _terminal_input
        if _p['trace']: _sys.settrace(_snapshot)
        exec(compile(_p['code'],'<elevkode>','exec'),{'__name__':'__main__'})
    finally:
        _builtins.input = _original_input
        _sys.settrace(None)
        _sys.stdout.flush()
        _sys.stderr.flush()
_json.dumps({'trace':_frames,'checks':_checks})
`);
      output(stdout.decode());output(stderr.decode(),'stderr');
      const parsed=JSON.parse(result);send('result',{result:{text,...parsed}});
    }else if(p.language==='javascript'){
      send('progress',{phase:'working'});
      const log={log:(...args)=>write(args.map(v=>typeof v==='string'?v:JSON.stringify(v)).join(' ')),error:(...args)=>write(args.join(' '),'stderr'),warn:(...args)=>write(args.join(' '),'stderr')};
      await new Function('console','input',`"use strict"; return (async()=>{${p.code}\n})();`)(log,()=>String(p.stdin||''));send('result',{result:{text,trace}});
    }else if(p.language==='sql'){
      send('progress',{phase:'loading',stage:'sql'});
      const init=new Function(files.sql+'; return initSqlJs;')();const SQL=await init({wasmBinary:new Uint8Array(files.sqlWasm)}),db=new SQL.Database();
      db.run("CREATE TABLE fag(id INTEGER PRIMARY KEY,navn TEXT); INSERT INTO fag VALUES(1,'Matematik'),(2,'Kemi'),(3,'Programmering'); CREATE TABLE opgaver(id INTEGER PRIMARY KEY,fag_id INTEGER,titel TEXT,minutter INTEGER); INSERT INTO opgaver VALUES(1,1,'Trekanter',30),(2,2,'Stofmængde',45),(3,3,'Løkker',20),(4,1,'Grafer',25);");
      send('progress',{phase:'working'});const results=[];for(const statement of db.iterateStatements(p.code)){const values=[];while(statement.step()){if(values.length>=1000)throw Error('Resultatet overstiger 1.000 rækker. Brug LIMIT.');values.push(statement.get());}results.push({columns:statement.getColumnNames(),values});if(results.length>20)throw Error('Højst 20 forespørgsler pr. kørsel.');}db.close();send('result',{result:{text:'Kørsel afsluttet. Øvelsesdatabasen nulstilles ved næste kørsel.',tables:results}});
    }else{
      send('progress',{phase:'working'});const flags=String(p.flags||'g');if(!/^[dgimsuvy]*$/.test(flags))throw Error('Ukendte regex-flag.');const re=new RegExp(p.code,flags.includes('g')?flags:flags+'g');const matches=[];for(const m of String(p.stdin||'').matchAll(re)){matches.push({text:m[0],index:m.index,groups:m.slice(1)});if(matches.length>=1000)break;}send('result',{result:{text:JSON.stringify(matches,null,2),matches}});
    }
  }catch(error){send('error',{message:(running?'':'Kørselsmiljøet kunne ikke starte [LXP28-RUNTIME]: ')+String(error?.message||error).slice(0,12000)});}
  finally{activeRun=0;pendingInput=null;}
};
self.postMessage({type:'worker-ready',protocol:3});
