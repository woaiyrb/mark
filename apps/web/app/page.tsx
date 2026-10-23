import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const headerList = await headers();
  const cookie = headerList.get("cookie");
  if (!cookie && process.env.NODE_ENV === "production") {
    redirect("https://skills.network");
  }

  // The product always opens on the sign-in page. /login reads the session
  // from the browser and routes by role from there:
  //   teacher (author) -> /dashboard, learner -> /learner/:assignmentId,
  //   admin            -> email verification code.
  // Someone who already has a session gets a one-click "continue" button, so
  // this extra step never locks anyone out.
  redirect("/login");
}
