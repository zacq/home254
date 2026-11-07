import { cache } from "react";
import { db } from "@/db";
import { content } from "@/db/schema";
import { BLOCKS, type Block, type BlockKey, type ContentValue, type Item } from "@/lib/content-schema";

const storedContent = cache(async () => {
  try {
    const rows = await db.select().from(content);
    return new Map(rows.map((r) => [r.key, r.value]));
  } catch {
    return new Map<string, unknown>();
  }
});

export async function getContent<K extends BlockKey>(key: K): Promise<ContentValue<K>> {
  const stored = (await storedContent()).get(key);
  const b: Block = BLOCKS[key];
  if (b.kind === "list") return (Array.isArray(stored) ? stored : b.defaults) as ContentValue<K>;
  return { ...b.defaults, ...(stored as Item | undefined) } as ContentValue<K>;
}

export const isCustomised = async (key: BlockKey) => (await storedContent()).has(key);
