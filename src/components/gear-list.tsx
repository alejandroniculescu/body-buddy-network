import type { Tables } from "@/integrations/supabase/types";

export type GearItem = Tables<"gear_items">;

export function GearCard({ item }: { item: GearItem }) {
  return (
    <article className="flex flex-col rounded-sm border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.category}</p>
      <h3 className="mt-1 text-lg">{item.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
      {item.why_it_helps ? (
        <p className="mt-3 text-sm">
          <span className="font-semibold">Why it helps: </span>
          {item.why_it_helps}
        </p>
      ) : null}

      <div className="mt-auto pt-5">
        {item.price_note ? (
          <p className="text-xs text-muted-foreground">Typically {item.price_note}</p>
        ) : null}
        {item.sponsor_name ? (
          <div className="mt-3 rounded-sm bg-secondary/70 p-3 text-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {item.sponsor_name}
            </p>
            {item.sponsor_offer ? <p className="mt-1">{item.sponsor_offer}</p> : null}
            {item.sponsor_code ? (
              <p className="mt-2 font-display tracking-[0.12em]">Code: {item.sponsor_code}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function GearGrid({ items }: { items: GearItem[] }) {
  if (!items.length) {
    return <p className="mt-4 text-sm text-muted-foreground">Nothing listed here yet.</p>;
  }
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <GearCard key={item.id} item={item} />
      ))}
    </div>
  );
}
