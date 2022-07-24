import {Fragment, useState} from 'react'
import { IoClipboardOutline } from '@react-icons/all-files/io5/IoClipboardOutline'
import { IoRefresh } from '@react-icons/all-files/io5/IoRefresh'
import type { projects } from '@prisma/client'
export default function ProjectCard({ project, usage = {received: 0, sent: 0}, total = {received: 0, sent: 0}, tier }: { project: projects, usage?: { received: number, sent: number }, total?: { received: number, sent: number }, tier: number }) {
  const [revealToken, setRevealToken] = useState(false)
  
  return (
    <div className="border border-gray-100 bg-white rounded-xl p-5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base">{project.name}</h3>
        <h3 className="text-sm text-gray-500">{project.region}</h3>
      </div>

      <div className="flex justify-between text-sm mt-1">
        <span className="font-medium">Received Events</span>
        <span className="text-gray-500">{usage.received.toLocaleString()} / {tier.toLocaleString()}</span>
      </div>
      <div className="bg-gray-50 h-2 rounded-lg overflow-hidden">
        <div className="bg-indigo-100 rounded-lg h-full" style={{ width: `${(total.received / tier) * 100}%` }}>
          <div className="bg-indigo-500 rounded-lg h-full" style={{ width: `${(usage.received / total.received) * 100}%` }} />
        </div>
      </div>

      <div className="flex justify-between text-sm mt-4">
        <span className="font-medium">Sent Events</span>
        <span className="text-gray-500">{usage.sent.toLocaleString()} / {tier.toLocaleString()}</span>
      </div>
      <div className="bg-gray-50 h-2 rounded-lg overflow-hidden">
        <div className="bg-blue-100 rounded-lg h-full" style={{ width: `${(total.sent / tier) * 100}%` }}>
          <div className="bg-blue-500 rounded-lg h-full" style={{ width: `${(usage.sent / total.sent) * 100}%` }} />
        </div>
      </div>

      <div className="text-sm mt-4">
        <span className="font-medium text-sm">Access Token</span>
        <div className="border relative border-gray-100 bg-gray-50 rounded-md py-2 px-3 text-gray-800 font-mono" onMouseEnter={() => setRevealToken(true)} onMouseLeave={() => setRevealToken(false)}>
          {revealToken ? project.access_token : <Fragment><span>hook_</span><span style={{filter:'blur(4px)'}}>AbCDefGhIJKlMnOpQrsTUVWxYz01</span></Fragment>}
          <div className="absolute cursor-pointer top-1 right-1 h-7 w-7 flex items-center justify-center bg-white rounded border border-gray-100">
            <IoRefresh className="text-base" onClick={() => alert('Sorry this isnt implemented yet')} />
          </div>
          <div className="absolute cursor-pointer top-1 right-9 h-7 w-7 flex items-center justify-center bg-white rounded border border-gray-100">
            <IoClipboardOutline className="text-base" onClick={() => navigator.clipboard.writeText(project.access_token)} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function NewProjectCard() {
  return (
    <div className="border border-gray-100 bg-white rounded-xl p-5">
      {/* <div className="flex justify-between items-center mb-6">
        <h3 className="text-base">New Project</h3>
        <h3 className="text-sm text-gray-500"></h3>
      </div> */}
      <form className="flex flex-col" method="post" action="/projects">
        <div className="text-sm mt-2 flex flex-col">
          <span className="font-medium text-sm">Project Name</span>
          <input className="border relative outline-none border-gray-100 bg-gray-50 rounded-md py-2 px-3 text-gray-800 font-mono" name="name" />
        </div>
        <div className="text-sm mt-4 flex flex-col">
          <span className="font-medium text-sm">Region</span>
          <input className="border relative outline-none border-gray-100 bg-gray-50 rounded-md py-2 px-3 text-gray-800 font-mono" name="region" disabled value="Hetzner HEL1-DC1" />
        </div>
        <button className="bg-white border self-end mt-4 w-44 text-sm border-gray-100 rounded-lg py-2 px-3 text-gray-800" type="submit">Create Project</button>
      </form>
    </div>
  )
}