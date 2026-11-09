import Link from "next/link";
import type { ReactNode } from "react";
import { getAdmin, type Role } from "@/lib/auth";
import { logout } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const ALL: Role[] = ["owner", "pricing", "sales", "content", "fulfilment"];
const LINKS: [string, string, Role[]][] = [
  ["/admin", "Dashboard", ALL],
  ["/admin/orders", "Orders", ["owner", "sales", "fulfilment"]],
  ["/admin/messages", "Messages", ["owner", "sales", "fulfilment"]],
  ["/admin/leads", "Leads", ["owner", "sales", "pricing"]],
  ["/admin/customers", "Customers", ["owner", "sales"]],
  ["/admin/products", "Products", ["owner", "content", "pricing"]],
  ["/admin/categories", "Categories", ["owner", "content"]],
  ["/admin/pricing", "Pricing", ["owner", "pricing"]],
  ["/admin/deals", "Deals & codes", ["owner", "pricing"]],
  ["/admin/rewards", "Rewards", ["owner"]],
  ["/admin/content", "Content", ["owner", "content"]],
  ["/admin/reviews", "Reviews", ["owner", "content"]],
  ["/admin/zones", "Delivery & install", ["owner", "content"]],
  ["/admin/reports", "Reports", ["owner"]],
  ["/admin/settings", "Settings", ["owner"]],
  ["/admin/users", "Users", ["owner"]],
  ["/admin/audit", "Audit log", ["owner"]],
  ["/admin/account", "My account", ALL],
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdmin();
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <header className="sticky top-0 z-30 bg-brand-dark text-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2">
          <Link href="/admin" className="font-extrabold">Store admin</Link>
          <Link href="/" className="text-xs underline">View site</Link>
          {admin && (
            <form action={logout} className="ml-auto">
              <button className="rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold">Log out</button>
            </form>
          )}
        </div>
        {admin && (
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2" aria-label="Admin">
            {LINKS.filter(([, , roles]) => roles.includes(admin.role)).map(([h, l]) => (
              <Link key={h} href={h} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/15">{l}</Link>
            ))}
          </nav>
        )}
      </header>
      <div className="mx-auto max-w-6xl p-3 sm:p-5">{children}</div>
    </div>
  );
}
