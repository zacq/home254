import { PageHeader } from "@/components/Bits";
import { CheckoutForm } from "@/components/CheckoutForm";
import { zones } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [z, s] = await Promise.all([zones(), getSettings()]);
  return (
    <>
      <PageHeader title="Checkout" intro="Guest checkout — no account needed." />
      <CheckoutForm
        zones={z}
        warrantyPct={Number(s.warrantyPct)}
        pedestalPrice={Number(s.pedestalPrice)}
        podCap={Number(s.podCap)}
        depositThreshold={Number(s.depositThreshold)}
        depositPct={Number(s.depositPct)}
      />
    </>
  );
}
