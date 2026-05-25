import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignInForm from "./SignInForm";

export const metadata = { title: "Sign In" };

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#2A5080] flex items-center justify-center p-4">
      <SignInForm />
    </div>
  );
}
