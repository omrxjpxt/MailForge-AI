import { redirect } from "next/navigation";

export default function Home() {
  // Directly redirect to the dashboard (the application entry point)
  redirect("/dashboard");
}
