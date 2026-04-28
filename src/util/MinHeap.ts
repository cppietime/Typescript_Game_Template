import type { Comparator } from "./Algorithm";


export class MinHeap<T> {
    compareFn: Comparator<T>;
    heap: T[];

    constructor(compareFn: Comparator<T>, heap?: T[]) {
        this.compareFn = compareFn;
        this.heap = heap ?? [];

        MinHeap.heapify(this.heap, this.compareFn);
    }

    static siftUp<T>(heap: T[], compareFn: Comparator<T>, index: number, offset: number = 0) {
        while (index > 0) {
            const parentIndex = index >> 1;
            const [a, b] = [heap[index + offset]!, heap[parentIndex + offset]!];
            const cmp = compareFn(a, b);
            if (cmp >= 0) {
                break;
            }
            [heap[index + offset], heap[parentIndex + offset]] = [b, a];
            index = parentIndex;
        }
    }

    static siftDown<T>(heap: T[], compareFn: Comparator<T>, index: number = 0, offset: number = 0, length: number = -1) {
        if (length == -1) length = heap.length - offset;
        while ((index << 1) + 1 < length) {
            const leftIndex = (index << 1) + 1;
            const rightIndex = leftIndex + 1;
            let minIndex = index;
            if (compareFn(heap[minIndex + offset]!, heap[leftIndex + offset]!) > 0) {
                minIndex = leftIndex;
            }
            if (rightIndex < length && compareFn(heap[minIndex + offset]!, heap[rightIndex + offset]!) > 0) {
                minIndex = rightIndex;
            }
            if (minIndex === index) {
                break;
            }
            [heap[index + offset], heap[minIndex + offset]] = [heap[minIndex + offset]!, heap[index + offset]!];
            index = minIndex;
        }
    }

    static heapify<T>(heap: T[], compareFn: Comparator<T>, offset: number = 0, length: number = -1) {
        if (length == -1) length = heap.length - offset;
        for (let i = 1; i < length; i++) {
            MinHeap.siftUp(heap, compareFn, i, offset);
        }
    }

    static deHeapify<T>(heap: T[], compareFn: Comparator<T>, offset: number = 0, length: number = -1) {
        if (length == -1) length = heap.length - offset;
        for (let i = length - 1; i > 0; i--) {
            [heap[offset], heap[offset + i]] = [heap[offset + i]!, heap[offset]!];
            MinHeap.siftDown(heap, compareFn, 0, offset, i);
        }
    }

    static sort<T>(heap: T[], compareFn: Comparator<T>) {
        MinHeap.heapify(heap, compareFn, 0, -1);
        MinHeap.deHeapify(heap, compareFn, 0, -1);
        heap.reverse();
    }

    insert(value: T) {
        this.heap.push(value);
        MinHeap.siftUp(this.heap, this.compareFn, this.heap.length - 1);
    }

    peek(): T | undefined {
        if (this.heap.length == 0) {
            return undefined;
        }
        return this.heap[0];
    }

    pop(): T | undefined {
        if (this.heap.length == 0) {
            return undefined;
        }
        const length = this.heap.length;
        [this.heap[0], this.heap[length - 1]] = [this.heap[length - 1]!, this.heap[0]!];
        const value = this.heap.pop();
        if (this.heap.length > 0) {
            MinHeap.siftDown(this.heap, this.compareFn);
        }
        return value;
    }

    clear() {
        this.heap.length = 0;
    }

    length(): number {
        return this.heap.length;
    }

    [Symbol.iterator](): Iterator<T> {
        return {
            next: (): IteratorResult<T> => {
                if (this.length() === 0) {
                    return {value: undefined, done: true};
                }
                return {value: this.pop()!, done: false};
            }
        };
    }
};