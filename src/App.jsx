import { useState } from 'react'
import VoiceChat from './pages/VoiceChat';
import './App.css'
import Sidebar from './components/Sidebar'
import RealtimeTrans from './pages/RealtimeTrans';

function App() {
  const [page,setPage] = useState("rt");

  const vc = ()=>{
    setPage("vc");
  }
  const rt = ()=>{
    setPage("rt");
  }

  return (
    <>
    <div className="container flex h-screen">
      <Sidebar vc={vc} rt={rt}/>
      <div>{(page=="vc")?<VoiceChat />:<RealtimeTrans />}</div>
      </div>
    </>
  )
}

export default App
