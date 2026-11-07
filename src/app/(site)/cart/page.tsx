import { PageHeader } from "@/components/Bits";
import { CartView } from "@/components/CartView";
import { zones } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Your cart", robots: { index: false } };

export default async function CartPage() {
  const [z, s] = await Promise.all([zones(), getSettings()]);
  return (
    <>
      <PageHeader title="Your cart" />
      <CartView zones={z} warrantyPct={Number(s.warrantyPct)} pedestalPrice={Number(s.pedestalPrice)} />
    </>
  );
}
