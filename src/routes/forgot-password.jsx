import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "@/components/auth/ForgotPasswordPage";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  component: ForgotPasswordPage,
  head: () => ({ meta: [{ title: "Mot de passe oublié — GridArt" }] }),
});