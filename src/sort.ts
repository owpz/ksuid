import { KSUID } from "./ksuid";

/**
 * Sorts the given array of KSUIDs in ascending order (in place).
 * Implements quicksort to match the Go implementation.
 */
export function sort(ids: KSUID[]): void {
  if (ids.length <= 1) return;
  quickSort(ids, 0, ids.length - 1);
}

/**
 * Checks whether an array of KSUIDs is sorted in ascending order.
 */
export function isSorted(ids: KSUID[]): boolean {
  if (ids.length === 0) return true;

  let min = ids[0];
  for (let i = 1; i < ids.length; i++) {
    const current = ids[i];
    if (min.compare(current) > 0) {
      return false;
    }
    min = current;
  }
  return true;
}

/**
 * Compare two KSUIDs - utility function matching Go's Compare
 */
export function compare(a: KSUID, b: KSUID): number {
  return a.compare(b);
}

/**
 * Quicksort implementation for KSUID arrays (matches Go implementation)
 */
function quickSort(a: KSUID[], lo: number, hi: number): void {
  if (lo < hi) {
    const pivot = a[hi];
    let i = lo - 1;

    for (let j = lo; j < hi; j++) {
      if (a[j].compare(pivot) < 0) {
        i++;
        [a[i], a[j]] = [a[j], a[i]]; // Swap
      }
    }

    i++;
    if (a[hi].compare(a[i]) < 0) {
      [a[i], a[hi]] = [a[hi], a[i]]; // Swap
    }

    quickSort(a, lo, i - 1);
    quickSort(a, i + 1, hi);
  }
}
