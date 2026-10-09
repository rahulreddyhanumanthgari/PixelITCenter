// Where every Portal Login link goes. For now the portal is a page on this
// site (/portal); once portal.pixelitcenter.com is live, set
// NEXT_PUBLIC_PORTAL_URL=https://portal.pixelitcenter.com and every link moves.
// (Its own file: site.ts exports a `process` section that hides Node's.)
export const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || "/portal";
