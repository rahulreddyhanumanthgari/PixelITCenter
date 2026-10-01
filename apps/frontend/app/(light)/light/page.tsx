import LightHome from "@/themes/light/LightHome";

// The light design. Visitors who chose it get this at "/" through the
// rewrite in next.config.ts; /light also works directly.
export default function Page() {
  return <LightHome />;
}
