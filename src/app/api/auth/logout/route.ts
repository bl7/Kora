import { getSessionCookieName } from "@/lib/auth";
import { jsonOk } from "@/lib/http";

export async function POST() {
  const response = jsonOk({ message: "Logged out" });

  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

