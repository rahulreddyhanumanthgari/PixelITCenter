// content/site.ts marks headings for the dark design: `*word*` is an accent
// word, ` | ` a preferred line break, `**phrase**` a bold phrase. The light
// design sets copy plainly, so it strips that markup.
export function plain(text: string): string {
  return text.replace(/\*\*?/g, "").replace(/\s*\|\s*/g, " ");
}
