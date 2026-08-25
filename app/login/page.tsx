import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AuthForm from "@/components/os/AuthForm";

export const metadata: Metadata = {
  title: "Sign in · farmOS",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await getUser()) redirect("/dashboard");
  return <AuthForm mode="login" />;
}
