import { createFileRoute } from "@tanstack/react-router";
import { PoopsPage } from "@/components/foster/pages/PoopsPage";

export const Route = createFileRoute("/poops")({
  head: () => ({
    meta: [
      { title: "Bathroom Log | Foster Tracker" },
      {
        name: "description",
        content:
          "Bathroom log for momma cat and kittens, so nothing gets missed during a foster stay.",
      },
      { property: "og:title", content: "Bathroom Log | Foster Tracker" },
      {
        property: "og:description",
        content: "Log momma and kitten bathroom visits with notes and timings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PoopsPage,
});