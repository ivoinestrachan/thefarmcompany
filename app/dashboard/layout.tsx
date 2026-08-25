import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard · The Farming Company",
  robots: { index: false, follow: false },
};

export default async function OsLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
