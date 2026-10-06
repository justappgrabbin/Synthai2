import {useLocation} from 'wouter';
export default function ComputerDesktop(){
 const [,navigate]=useLocation();
 return <section style={{height:'100dvh',display:'flex',flexDirection:'column'}} aria-label="Computer app hub"><header style={{padding:'8px 12px',display:'flex',alignItems:'center',gap:14}}><button onClick={()=>navigate('/')} style={{padding:8}}>← SynthAI home</button><strong>Your computer</strong></header><iframe src="/computer/index.html?host=synthai2" title="Computer app hub" style={{border:0,width:'100%',flex:1,minHeight:0}} /></section>;
}
