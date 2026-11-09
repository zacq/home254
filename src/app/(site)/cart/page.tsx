import { PageHeader } from "@/components/Bits";
import { CartView } from "@/components/CartView";
import { zones } from "@/lib/queries";

export const metadata = { title: "Your cart", robots: { index: false } };

export default async function CartPage() {
  const z = await zones();
  return (
    <>
      <PageHeader title="Your cart" />
      <CartView zones={z.map((x) => ({ id: x.id, name: x.name }))} />
    </>
  );
}
