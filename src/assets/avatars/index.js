// Avatar options, enumerated from disk rather than hardcoded — drop a new
// aNN.svg in this folder and it shows up in the picker automatically.
//
// Spec calls for `public/avatars/aNN.svg` enumerated at runtime, but a
// static SPA has no filesystem access in the browser to list a public/
// folder's contents. Vite's `import.meta.glob` gives the same "no
// hardcoded list" property at build time instead, so the source files
// live here (import.meta.glob only sees files inside the module graph,
// not the public/ dir) and are exposed as URLs.
const modules = import.meta.glob('./*.svg', { eager: true, query: '?url', import: 'default' });

export const AVATARS = Object.keys(modules)
  .sort()
  .map((path) => {
    const id = path.replace('./', '').replace('.svg', '');
    return { id, url: modules[path] };
  });

export function avatarUrlFor(avatarId) {
  return AVATARS.find((a) => a.id === avatarId)?.url ?? AVATARS[0]?.url;
}
