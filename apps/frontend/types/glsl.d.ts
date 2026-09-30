// .glsl files are imported as plain strings via raw-loader (see next.config.ts).
declare module "*.glsl" {
  const source: string;
  export default source;
}
