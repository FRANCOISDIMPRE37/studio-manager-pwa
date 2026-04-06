import{useState,useEffect}from'react';import{useLocation}from'wouter';import{trpc}from'@/lib/trpc';import{useEmployeSession,EmployeSession}from'@/contexts/EmployeSessionContext';import{toast}from'sonner';
export default function EcranPIN(){
const[,nav]=useLocation();
const{setEmploye}=useEmployeSession();
const[step,setStep]=useState('sel');
const[selId,setSelId]=useState(0);
const[pin,setPin]=useState('');
const{data:emps}=trpc.studioUsers.listForPin.useQuery();
const login=trpc.studioUsers.loginWithPin.useMutation({
onSuccess:(d)=>{setEmploye({...d.employe,loginAt:new Date().toISOString()} as EmployeSession);nav('/clients');},
onError:(e)=>toast.error(e.message||'PIN incorrect'),
});
useEffect(()=>{if(pin.length===4&&selId)login.mutate({employeId:selId,pin});},[pin]);
const t='var(--brand-text)',c='var(--brand-cyan)',n='var(--brand-navy)',m='var(--brand-text-muted)';
const bs={padding:'12px 20px',borderRadius:12,border:`1px solid ${c}`,background:'rgba(131,208,245,0.1)',color:c,cursor:'pointer',margin:4,fontFamily:'Outfit',fontWeight:700};
const ks=['1','2','3','4','5','6','7','8','9','','0','X'];
return(
<div style={{minHeight:'100vh',background:n,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
{step==='sel'&&<>
<h1 style={{color:t,fontFamily:'Outfit',fontWeight:900,fontSize:28,marginBottom:24}}>Studio Manager</h1>
<p style={{color:m,marginBottom:24}}>Qui etes-vous ?</p>
<div style={{display:'flex',flexWrap:'wrap',gap:12,justifyContent:'center',maxWidth:400}}>
{emps?.map((e:any)=><button key={e.id} onClick={()=>{if(!e.hasPinSet)return;setSelId(e.id);setPin('');setStep('pin');}} style={{...bs,opacity:e.hasPinSet?1:0.4}}>{e.prenom}</button>)}
</div>
</>}
{step==='pin'&&<>
<p style={{color:m,marginBottom:16}}>Code PIN (4 chiffres)</p>
<div style={{display:'flex',gap:8,marginBottom:24}}>{[0,1,2,3].map(i=><div key={i} style={{width:16,height:16,borderRadius:'50%',background:i<pin.length?c:'rgba(255,255,255,0.2)'}}/>)}</div>
<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,maxWidth:240}}>
{ks.map((k,i)=><button key={i} onClick={()=>{if(!k)return;if(k==='X')setPin(p=>p.slice(0,-1));else if(pin.length<4)setPin(p=>p+k);}} style={{height:60,borderRadius:12,border:'1px solid var(--brand-border)',background:k?'rgba(255,255,255,0.07)':'transparent',color:t,fontSize:20,fontWeight:700,cursor:k?'pointer':'default',visibility:k?'visible':'hidden'}}>{k==='X'?'←':k}</button>)}
</div>
<button onClick={()=>{setStep('sel');setPin('');}} style={{...bs,marginTop:16,background:'none',border:'none',color:m}}>Retour</button>
</>}
</div>
);
}
