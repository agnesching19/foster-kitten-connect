import { createFileRoute } from "@tanstack/react-router";
import { LitterPage } from "@/components/foster/pages/LitterPage";

export const Route = createFileRoute("/litter")({
  head: () => ({
    meta: [
      { title: "Litter Box Log | Foster Tracker" },
      {
        name: "description",
        content:
          "See when the litter box was last changed and the full maintenance history.",
      },
      { property: "og:title", content: "Litter Box Log | Foster Tracker" },
      {
        property: "og:description",
        content: "Litter box change history for your foster room.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LitterPage,
});