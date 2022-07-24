import SnazzyBackground from "~/components/SnazzyBackground"
import { FaGithub } from "@react-icons/all-files/fa/FaGithub"
import type { ActionArgs, LoaderFunction} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { getCookie, userPrefs } from "~/cookies";
import CodeSample from "~/components/CodeSample";
import { prisma } from "~/db.server"
import { createToken, getRandomKey } from "~/token.server";
import type { users } from "@prisma/client";

export async function action({ request }: ActionArgs) {
  const state = Math.random().toString(36).substring(2)
  const url = `https://github.com/login/oauth/authorize?client_id=96a68011e4bce144b225&scope=user&state=${state}`
  const cookie = await getCookie(request)
  cookie['state'] = state
  return redirect(url, {
    headers: {
      "Set-Cookie": await userPrefs.serialize(cookie),
    },
  })
}

// TODO: clean this up,,, a lot.... lol
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  if (url.searchParams.has("code")) {
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    const cookie = await getCookie(request)
    if (cookie.state === state && code) {
      const coderes = await fetch(`https://github.com/login/oauth/access_token?client_id=96a68011e4bce144b225&client_secret=13cf73aa77c28ea974a9f78869aa6d4bf59ac8b8&code=${code}`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
        }
      })
      let codejson = await coderes.json()
      if (!codejson.access_token) return redirect('/login')
      const userres = await fetch(`https://api.github.com/user`, { headers: { Authorization: `token ${codejson.access_token}` } })
      try {
        const gh_user = await userres.json()
        if (!gh_user.id) return redirect('/login')
        const connectedUser = await prisma.connections.findFirst({ where: { service: "github", connected_account: String(gh_user.id) } })
        let user: users
        if (connectedUser?.user) {
          user = await prisma.users.findFirstOrThrow({ where: { id: connectedUser.user } })
          if (!user) return redirect('/login')
        } else {
          const token = getRandomKey(32)
          const newUser = await prisma.users.create({
            data: {
              email: gh_user.email,
              name: gh_user.name ?? gh_user.login,
              token,
              tier: 0
            }
          })
          await prisma.connections.create({
            data: {
              service: "github",
              connected_account: String(gh_user.id),
              user: newUser.id
            }
          })
          user = newUser
        }
        let cookieToken = createToken(String(user.id), user.token, 60 * 60 * 24 * 7)
        cookie.token = cookieToken.token
        return redirect('/projects', {
          headers: {
            "Set-Cookie": await userPrefs.serialize(cookie, {expires: new Date(cookieToken.expires * 1000)}),
          },
        })
      } catch(e) {
        console.log(e)
      }
    }
  }
  return redirect('/login')
};

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col lg:flex-row items-center justify-center h-4/5 w-full relative">
        <div className="flex flex-col items-center lg:items-start">
          <h1 className="text-gray-100 font-bold text-7xl">hooked.sh</h1>
          <h2 className="text-gray-200 text-2xl">WebSockets over HTTP</h2>

          <form className="mt-10 group" method="post" action="/login">
            <button className={`
              flex
              transition-all
              items-center
              bg-black
              border-2
              border-white
              text-white
              translate-y-0
              group-hover:-translate-y-px
              group-active:translate-y-0
              group-hover:bg-white
              group-hover:text-black
              px-5
              py-2.5
              text-sm
              rounded-lg`}>
              <FaGithub className="text-2xl mr-2"/>
              Sign In with GitHub
            </button>
          </form>
        </div>
        <CodeSample />
        <SnazzyBackground />
      </div>
      <div className="flex-1">

      </div>
    </div>
  );
}
