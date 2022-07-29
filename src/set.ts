import { Indices } from "./indices";

export class IndexSet<
  U = Record<string, string>,
  T extends Indices<U> = Indices<U>
> {
  hasIndexMap: { [key in T]: boolean } = {} as { [key in T]: boolean };
  hasNotIndexMap: { [key in T]: boolean } = {} as { [key in T]: boolean };

  constructor(public fillingUp = true) {}

  indices(): T[] | null {
    if (this.fillingUp) {
      // Collect results from present indices
      const results: T[] = [];
      for (const key of Object.keys(this.hasIndexMap)) {
        // Check each key for index presence
        if (this.hasIndex(key as T)) {
          results.push(key as T);
        }
      }
      return results;
    } else {
      // If emptying out, there's no way to know what indices are present
      return null;
    }
  }

  nonIndices(): T[] | null {
    if (this.fillingUp) {
      // If filling up, there's no way to know what indices are present
      return null;
    } else {
      // Collect results from non-present indices
      const results: T[] = [];
      for (const key of Object.keys(this.hasNotIndexMap)) {
        // Check each key for index presence
        if (!this.hasIndex(key as T)) {
          results.push(key as T);
        }
      }
      return results;
    }
  }

  addAll() {
    this.fillingUp = false;
    this.hasIndexMap = {} as { [key in T]: boolean };
    this.hasNotIndexMap = {} as { [key in T]: boolean };
  }

  removeAll() {
    this.fillingUp = true;
    this.hasIndexMap = {} as { [key in T]: boolean };
    this.hasNotIndexMap = {} as { [key in T]: boolean };
  }

  hasIndex(index: T): boolean {
    // Check if the index is in the map
    if (this.fillingUp) return this.hasIndexMap[index] === true;
    // Negative set; check the has not index map
    return !this.hasNotIndexMap[index] === true;
  }

  addIndex(index: T) {
    if (this.fillingUp) {
      // Filling up, add the index
      this.hasIndexMap[index] = true;
    } else {
      // Emptying out, clear the index
      this.hasNotIndexMap[index] = false;
    }
  }

  removeIndex(index: T) {
    if (this.fillingUp) {
      // Filling up, remove the index
      this.hasIndexMap[index] = false;
    } else {
      // Emptying out, add the index
      this.hasNotIndexMap[index] = true;
    }
  }
}
