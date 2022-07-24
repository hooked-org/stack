import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import NavBar from "~/components/NavBar";
import type { SafeUser} from "~/db.server";
import { userToSafeUser } from "~/db.server";
import { userFromCookie } from "~/token.server";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await userFromCookie(request)
  return json({ user: userToSafeUser(user) })
};

export default function Account() {
  const { user } = useLoaderData<{ user: SafeUser }>()
  return (
    <div className="flex flex-col items-center w-full bg-gray-50">
      <NavBar user={user} />
      <div className="max-w-5xl mt-8 w-full grid gap-2 grid-cols-2">
        Nothing here yet :)
      </div>
    </div>
  );
}
