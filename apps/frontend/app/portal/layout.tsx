import type { Metadata } from "next";
import "@/themes/light/dashboard.css";

// The portal (/portal and everything under it): kept out of search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return children;
}
