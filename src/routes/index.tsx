import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/foster/pages/DashboardPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Foster Kitten Tracker | Every Batch in One Place" },
      {
        name: "description",
        content:
          "Track foster momma cats and their kittens: batches, feedings, weights, bathroom logs and litter changes.",
      },
      {
        property: "og:title",
        content: "Foster Kitten Tracker | Every Batch in One Place",
      },
      {
        property: "og:description",
        content:
          "A dashboard for foster carers: batches, feedings, weigh-ins and litter box history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});
