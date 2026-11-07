import { redirect } from "next/navigation";
import { getAdmin, type Role } from "@/lib/auth";

// Owner passes every check; other roles must be listed.
export async function guard(...roles: Role[]) {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  if (roles.length && a.role !== "owner" && !roles.includes(a.role)) redirect("/admin?denied=1");
  return a;
}
