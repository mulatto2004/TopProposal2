import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Middleware handles the main redirect, but double-check here for safety
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main content area — offset by sidebar width */}
      <div className="pl-60">
        <main className="min-h-screen p-8">{children}</main>
      </div>
    </div>
  );
}
