import { Inter, Space_Grotesk } from "next/font/google";

// The approved typography, shared by both designs: Space Grotesk for display,
// Inter for text. Root layouts put `fontVariables` on <html>.

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Display face for headings: a modern grotesk with an editorial character.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const fontVariables = `${inter.variable} ${spaceGrotesk.variable}`;
