import { createFileRoute } from "@tanstack/react-router";
import { WeightsPage } from "@/components/foster/pages/WeightsPage";

export const Route = createFileRoute("/weights")({
  head: () => ({
    meta: [
      { title: "Kitten Weights | Foster Tracker" },
      {
        name: "description",
        content:
          "Weigh-in history and growth percentages for every kitten in your foster litter.",
      },
      { property: "og:title", content: "Kitten Weights | Foster Tracker" },
      {
        property: "og:description",
        content: "Track kitten growth gram by gram across every weigh-in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WeightsPage,
});