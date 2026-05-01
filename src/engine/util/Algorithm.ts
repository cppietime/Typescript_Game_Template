export type Comparator<T, U = T> = (a: T, b: U) => number;

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

export const binarySearch = <T, N>(array: T[], cmpFn: Comparator<T, N>, needle: N): number => {
    let [l, h] = [0, array.length];
    
    while (l < h) {
        const m = (l + h) >> 1;
        const elem = array[m]!;
        const cmp = cmpFn(elem, needle);
        if (cmp === 0) {
            return m;
        } else if (cmp > 0) {
            // needle < elem
            h = m;
        } else {
            // needle > elem
            l = m + 1;
        }
    }

    return l;
};

export const modulo = (a: number, b: number): number => ((a % b) + b) % b;
