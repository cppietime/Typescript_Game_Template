import { MinHeap } from "../../src/util/MinHeap";
describe('Min heap', () => {
    test('Heap sort', () => {
        const data = [1, 94, 6, 3, 6, 1, 42, 2, 2];
        const expected = [...data].sort((a, b) => a - b);
        const cmp = (a, b) => a - b;
        MinHeap.sort(data, cmp);
        console.log(data, '\n', expected);
        expect(data).toEqual(expected);
    });
});
//# sourceMappingURL=MinHeap.test.js.map