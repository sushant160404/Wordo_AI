import React from 'react';
import { IoIosMic } from "react-icons/io";
import { HiOutlineTranslate } from "react-icons/hi";

function Sidebar(props) {
  return (
    <aside
      className="bg-gray-900 fixed top-0 left-0 z-10 xl:h-screen xl:w-64"
      style={{
        transition: 'all 0.6s ease-out',
      }}
    >
      <div className="flex flex-col h-screen pt-12 align-center">
        <h1 className='text text-white mt-6'>WORDO</h1>
        <ul className="space-y-2 grid grid-rows-2 mt-15">
          <li><button className="btn" onClick={props.vc}><IoIosMic className='size-7'/>Speaking Practice</button></li>
          <li><button className="btn" onClick={props.rt}><HiOutlineTranslate className='size-7'/>Realtime Translation</button></li>
          
        </ul>
      </div>
    </aside>
  )
}

export default Sidebar