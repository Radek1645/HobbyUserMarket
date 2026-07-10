import { getCurrentUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";

export default async function ModLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50/80">
      <div className="mx-auto max-w-5xl px-4 py-2 text-xs font-medium text-amber-900">
        God Mode · admin
      </div>
      {children}
    </div>
  );
}
