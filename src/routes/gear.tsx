import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { REGIONS, regionLabel } from "@/lib/domain";
import { GearGrid, type GearItem } from "@/components/gear-list";

export const Route = createFileRoute("/gear")({
  head: () => ({
    meta: [
      { title: "Our gear & sponsor codes — MassageNow" },
      {
        name: "description",
        content:
          "The small kit each MassageNow group works with — bands, balls, rollers, gua sha and cupping — plus the sponsor codes that come with each group's focus area.",
      },
      { property: "og:title", content: "Our gear & sponsor codes — MassageNow" },
      {
        property: "og:description",
        content:
          "A short, cheap kit per group, with sponsor discounts. Nothing here is required to take part.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GearPage,
});

function GearPage() {
  const { data: items, isLoading } = useQuery({
    queryKey: ["gear-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gear_items")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GearItem[];
    },
  });

  const shared = (items ?? []).filter((i) => !i.region);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14">
      <h1 className="text-4xl">Our gear</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Every group works with a short, cheap kit. Sponsors give each group a code for the pieces that
        fit its focus area — you can ignore all of it and still take part, and no technique is
        required of anyone.
      </p>
      <p className="mt-4 max-w-2xl border-l-2 border-accent pl-4 text-sm text-muted-foreground">
        Buying a tool is not treatment. Check the{" "}
        <Link to="/safety" className="underline underline-offset-4">
          safety protocol
        </Link>{" "}
        and each technique's contraindications before you use anything on this page.
      </p>

      {isLoading ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading the kit…</p>
      ) : (
        <>
          <section className="mt-12">
            <h2 className="text-2xl">Shared starter kit</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Used across every group, one piece per technique.
            </p>
            <GearGrid items={shared} />
          </section>

          {REGIONS.map((region) => {
            const forRegion = (items ?? []).filter((i) => i.region === region.value);
            if (!forRegion.length) return null;
            return (
              <section key={region.value} className="mt-14">
                <h2 className="text-2xl">{regionLabel(region.value)} groups</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Extra pieces and codes that come with groups focused on this area.
                </p>
                <GearGrid items={forRegion} />
              </section>
            );
          })}
        </>
      )}

      <div className="mt-16">
        <Link to="/groups" className="text-sm font-semibold underline underline-offset-4">
          See which groups are forming →
        </Link>
      </div>
    </div>
  );
}
