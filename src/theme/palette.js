export const BRAND_COLORS = [
  '#041218',
  '#275d71',
  '#429195',
  '#a1d0be',
  '#e6d9ac',
  '#e29f37',
  '#bd6c27',
  '#ad471e',
  '#a02f1f',
  '#8e2d2b',
];

export function colorForIndex(i) {
  return BRAND_COLORS[i % BRAND_COLORS.length];
}
