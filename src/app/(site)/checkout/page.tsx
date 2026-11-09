import { PageHeader } from "@/components/Bits";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getCustomer } from "@/lib/customer-auth";
import { DELIVERY_SLOTS } from "@/lib/orders";
import { zones } from "@/lib/queries";

export const metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [z, c] = await Promise.all([zones(), getCustomer()]);
  return (
    <>
      <PageHeader title="Checkout" intro={c ? `Signed in as ${c.name || `+${c.phone}`}.` : "Guest checkout is fine — no account needed."} />
      <CheckoutForm
        zones={z.map((x) => ({ id: x.id, name: x.name }))}
        slots={DELIVERY_SLOTS}
        member={c ? { name: c.name ?? "", phone: c.phone, email: c.email ?? "" } : null}
      />
    </>
  );
}
