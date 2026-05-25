import { redirect } from "next/navigation";

// Sign-up is handled by the same sign-in flow (Google OAuth + magic link).
// Redirect new visitors to /sign-in where they can create an account.
export default function SignUpPage() {
  redirect("/sign-in");
}
