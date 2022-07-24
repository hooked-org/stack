import { prisma } from "~/db.server";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import NavBar from "~/components/NavBar";
import ProjectCard, { NewProjectCard } from "~/components/ProjectCard";
import TotalUsageBar from "~/components/TotalUsageBar";
import type { SafeUser} from "~/db.server";
import { userToSafeUser } from "~/db.server";
import { userFromCookie } from "~/token.server";
import type { projects } from "@prisma/client";

function randomString(length: number, chars: string) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await userFromCookie(request)
  const period = (new Date()).getFullYear()*100 + ((new Date()).getMonth() + 1)
  const projects = await prisma.projects.findMany({
    where: {
      owner: user.id
    }
  })
  const usages = await prisma.usage.findMany({
    where: {
      user: user.id,
      period: period
    }
  })
  const totalUsage = { received: 0, sent: 0 }
  const projectUsage = projects.reduce((acc, project) => {
    const usage = usages.find(u => u.project === project.id) || { received: 0, sent: 0 }
    totalUsage.received += usage.received
    totalUsage.sent += usage.sent
    return { ...acc, [project.id]: usage }
  }, {}) as Record<number, { received: number, sent: number }>

  return json({ user: userToSafeUser(user), projects, usage: projectUsage, totalUsage })
};

export const action: ActionFunction = async ({ request, params }) => {
  if (request.method !== "POST") return null
  const user = await userFromCookie(request)
  const body = await request.formData()
  const [name] = [body.get("name"), body.get("region")]
  if (!name) return null
  // random string a-z0-9 with length of 
  const project = await prisma.projects.create({
    data: {
      name: String(name),
      owner: user.id,
      region: 'Hetzner HEL1-DC1',
      access_token: `hook_${randomString(28, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')}`
    }
  })
  console.log(project)
  return json({ project })
}

export default function Index() {
  const { user, projects, usage, totalUsage } = useLoaderData<{
    user: SafeUser,
    projects: projects[],
    totalUsage: { received: number, sent: number },
    usage: Record<number, { received: number, sent: number }>
  }>()
  return (
    <div className="flex flex-col items-center w-full bg-gray-50">
      <NavBar user={user} />
      <div className="max-w-5xl mt-8 w-full grid gap-2 grid-cols-2">
        <TotalUsageBar total={totalUsage} tier={user.tier} />
        {projects.map(project => <ProjectCard key={project.id} project={project} usage={usage[project.id]} total={totalUsage} tier={user.tier} />)}
        <NewProjectCard />
      </div>
    </div>
  );
}
