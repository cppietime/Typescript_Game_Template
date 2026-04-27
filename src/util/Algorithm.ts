export type Comparator<T> = (a: T, b: T) => number;

export const insertionSort = <T>(array: T[], cmpFn: Comparator<T>) => {
    for (let i = 1; i < array.length; i++) {
        innerLoop: for (let j = i; j > 0; j--) {
            const a = array[j]!;
            const b = array[j - 1]!;
            const cmp = cmpFn(a, b);
            if (cmp >= 0) break innerLoop;
            [array[j], array[j - 1]] = [b, a];
        }
    }
};