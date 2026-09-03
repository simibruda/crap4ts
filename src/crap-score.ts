export function calculateCrap(
  complexity: number,
  coveragePercent: number | null | undefined,
): number | null {
  if (coveragePercent == null) {
    return null;
  }
  const cc = complexity;
  const uncovered = 1.0 - coveragePercent / 100.0;
  return cc * cc * uncovered * uncovered * uncovered + cc;
}
