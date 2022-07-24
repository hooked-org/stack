import { json, redirect } from "@remix-run/node"
import type { LoaderFunction, MetaFunction, LinksFunction }  from "@remix-run/node"
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react"
import LoginPage from "./routes/login"
import styles from "./styles/app.css"
import { userFromCookie } from "./token.server"
import React from "react"
import type { users } from "@prisma/client"

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "hooked.sh - Dashboard",
  viewport: "width=device-width,initial-scale=1",
})

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const user = await userFromCookie(request)
    return json({ authenticated: true, user })
  } catch(e) {
    if (new URL(request.url).pathname !== '/login') {
      return redirect('/login')
    } else {
      return json({ authenticated: false })
    }
  }
};

export default function App() {
  const { user, authenticated } = useLoaderData()
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        { authenticated ? <Outlet context={user} /> : <LoginPage /> }
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
