import { insertionSort } from '../../src/util/Algorithm';
describe('test insertion sort', () => {
    test('test insertion sort', () => {
        const nums = [1, 36, 1, 24, 8, 120, 0];
        const expected = [...nums].sort((a, b) => a - b);
        insertionSort(nums, (a, b) => a - b);
        expect(nums).toEqual(expected);
    });
});
//# sourceMappingURL=Algorithm.test.js.map