import { binarySearch, insertionSort } from '../../src/util/Algorithm';

describe('test insertion sort', () => {
    test('test insertion sort', () => {
        const nums = [1, 36, 1, 24, 8, 120, 0];
        const expected = [...nums].sort((a, b) => a - b);
        insertionSort(nums, (a, b) => a - b);
        expect(nums).toEqual(expected)
    });
});

describe('test binary search', () => {
    test('find each', () => {
        const data = [1, 2, 3, 4, 5];
        data.forEach((needle, expected) => {
            const idx = binarySearch(data, (a, b) => a - b, needle);
            expect(idx).toEqual(expected);
        });
    });
    
    test('less than first', () => {
        const data = [1, 2, 3, 4, 5];
        const needle = -1;
        const idx = binarySearch(data, (a, b) => a - b, needle);
        expect(idx).toEqual(0);
    });
    
    test('greater than last', () => {
        const data = [1, 2, 3, 4, 5];
        const needle = 6;
        const idx = binarySearch(data, (a, b) => a - b, needle);
        expect(idx).toEqual(data.length);
    });
    
    test('intermediate', () => {
        const data = [1, 2, 3, 4, 5];
        data.forEach((needle, expected) => {
            needle -= 0.5;
            const idx = binarySearch(data, (a, b) => a - b, needle);
            expect(idx).toEqual(expected);
        });
    });
});