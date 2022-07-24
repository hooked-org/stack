import { Link, useLocation } from "@remix-run/react";
import type { SafeUser } from "~/db.server";

export default function NavBar({ user }: { user: SafeUser }) {
  const location = useLocation()
  const links = [
    { to: "projects", label: "Projects" },
    { to: "billing", label: "Billing" },
    { to: "account", label: "Account" }
  ]
  const activeLink = location.pathname.split("/")[1]
  return (
    <div className="w-full flex flex-col items-center border-b border-b-gray-200 pt-2 bg-white">
      <div className="max-w-5xl w-full flex items-center h-20">
        <div className="h-10 w-10 bg-gray-100 rounded-full mr-4 mb-0.5"/>
        <h2 className="font-normal text-xl">{user.name}</h2>
        <div className="flex-1" />
        <div className="h-12 w-12 bg-gray-100 rounded-full"/>
      </div>
      <div className="max-w-5xl w-full flex items-center text-sm">
        {links.map(({to, label}) => (
          to === activeLink ?
            <Link to={'/'+to}><div className="cursor-pointer font-semibold transition-colors -mb-px border-b border-b-indigo-500 py-2 px-5">{label}</div></Link> :
            <Link to={'/'+to}><div className="cursor-pointer hover:border-b-gray-400 hover:border-b hover:-mb-px transition-colors py-2 px-5">{label}</div></Link>
        ))}
      </div>
    </div>
  );
}


