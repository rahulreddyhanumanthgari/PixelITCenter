import type { Metadata } from "next";
import { site } from "@/content/site";

const title = `${site.name} | Technology Services & IT Staffing`;

/** Page metadata shared by the dark and light root layouts. */
export const siteMetadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  // /light is only how "/" is served in the light version, so it points
  // search engines back to "/".
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
  },
};
