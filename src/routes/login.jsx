import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/auth/LoginPage";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
  head: () => ({ meta: [{ title: "Connexion — GridArt" }] }),
});