/**
 * Header wrapper: a transparent fixed strip; the visible header is the
 * floating rounded bar inside it (styled in themes/light/light.css). No
 * blur or background of its own, so the particles beside the bar stay sharp.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  return <header className="fixed inset-x-0 top-0 z-50">{children}</header>;
}
