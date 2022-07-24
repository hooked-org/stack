import { createCookie } from "@remix-run/node";

export const userPrefs = createCookie("user-prefs", {
  maxAge: 1000 * 60 * 60 * 24 * 3,
});

export const getCookie = async (request: any) => (await userPrefs.parse(request.headers.get("Cookie"))) || {}