import { redirect } from "next/navigation";
import { PageHeader } from "@/components/Bits";
import { SignInForm } from "@/components/SignInForm";
import { getCustomer } from "@/lib/customer-auth";
import { getRewardsConfig } from "@/lib/rewards";

export const metadata = { title: "Sign in or join Rewards", robots: { index: false } };

// Only same-site paths are allowed as the return address.
const safeNext = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/account");

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const [member, cfg] = await Promise.all([getCustomer(), getRewardsConfig()]);
  if (member) redirect(safeNext(next));
  return (
    <>
      <PageHeader title="Sign in or join free" intro={`Use your phone number. No password needed. Members earn points on every purchase with ${cfg.name}.`} />
      <div className="container-x py-6">
        <SignInForm next={safeNext(next)} bonus={cfg.signupBonus} rewardsName={cfg.name} />
      </div>
    </>
  );
}
