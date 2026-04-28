import { Normal } from "../../src/component/physics/Collision.js";
import { sweptAABB } from "../../src/util/Geometry.js";
describe('Collisions', () => {
    test('Sweep horizontal left', () => {
        const velocity = { x: 1.5, y: 0 };
        const rect = { topLeft: { x: 0.5, y: -0.5 }, bottomRight: { x: 1.5, y: 0.5 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(0.5 / 1.5, 5),
            normal: Normal.LEFT,
        });
    });
    test('Sweep horizontal right', () => {
        const velocity = { x: -1.5, y: 0 };
        const rect = { topLeft: { x: -1.5, y: -0.5 }, bottomRight: { x: -0.5, y: 0.5 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(0.5 / 1.5, 5),
            normal: Normal.RIGHT,
        });
    });
    test('Sweep vertical top', () => {
        const velocity = { x: 0, y: 2.5 };
        const rect = { topLeft: { x: -0.5, y: 1.5 }, bottomRight: { x: 0.5, y: 4 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(1.5 / 2.5, 5),
            normal: Normal.TOP,
        });
    });
    test('Sweep vertical bottom', () => {
        const velocity = { x: 0, y: -2.5 };
        const rect = { topLeft: { x: -0.5, y: -4 }, bottomRight: { x: 0.5, y: -1.5 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(1.5 / 2.5, 5),
            normal: Normal.BOTTOM,
        });
    });
    test('Sweep XYYX', () => {
        const velocity = { x: 0.5, y: 2 };
        const rect = { topLeft: { x: 0, y: 1 }, bottomRight: { x: 1, y: 2 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(1 / 2, 5),
            normal: Normal.TOP,
        });
    });
    test('Sweep XYXY', () => {
        const velocity = { x: 1, y: 1.25 };
        const rect = { topLeft: { x: 0, y: 1 }, bottomRight: { x: 1, y: 2 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(1 / 1.25, 5),
            normal: Normal.TOP,
        });
    });
    test('Sweep YXXY', () => {
        const velocity = { x: 2, y: 0.5 };
        const rect = { topLeft: { x: 1, y: 0 }, bottomRight: { x: 2, y: 1 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(1 / 2, 5),
            normal: Normal.LEFT,
        });
    });
    test('Sweep YXYX', () => {
        const velocity = { x: 1.25, y: 1 };
        const rect = { topLeft: { x: 1, y: 0 }, bottomRight: { x: 2, y: 1 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(1 / 1.25, 5),
            normal: Normal.LEFT,
        });
    });
    test('Miss negative', () => {
        const velocity = { x: -1.25, y: -1 };
        const rect = { topLeft: { x: 1, y: 0 }, bottomRight: { x: 2, y: 1 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toBeUndefined();
    });
    test('Miss positive', () => {
        const velocity = { x: 2, y: 3 };
        const rect = { topLeft: { x: 2, y: 1 }, bottomRight: { x: 3, y: 2 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toBeUndefined();
    });
    test('Miss horizontal', () => {
        const velocity = { x: 2, y: 0 };
        const rect = { topLeft: { x: 2, y: 1 }, bottomRight: { x: 3, y: 2 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toBeUndefined();
    });
    test('Miss vertical', () => {
        const velocity = { x: 0, y: 2 };
        const rect = { topLeft: { x: 2, y: 1 }, bottomRight: { x: 3, y: 2 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toBeUndefined();
    });
    test('Miss zero', () => {
        const velocity = { x: 0, y: 0 };
        const rect = { topLeft: { x: 0.5, y: -0.5 }, bottomRight: { x: 1.5, y: 1.5 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toBeUndefined();
    });
    test('Miss by start time', () => {
        const velocity = { x: 3, y: 1 };
        const rect = { topLeft: { x: 1, y: 0 }, bottomRight: { x: 2, y: 1 } };
        const result = sweptAABB(rect, velocity, 2.5 / 3);
        expect(result).toBeUndefined();
    });
    test('Hit with start time', () => {
        const velocity = { x: 3, y: 1 };
        const rect = { topLeft: { x: 1, y: 0 }, bottomRight: { x: 2, y: 1 } };
        const result = sweptAABB(rect, velocity, 1.5 / 3);
        expect(result).toEqual({
            normal: Normal.LEFT,
            time: expect.closeTo(1.5 / 3 + 1 / 3, 5),
        });
    });
    test('Starts horizontal', () => {
        const velocity = { x: 1.5, y: 0 };
        const rect = { topLeft: { x: -0.5, y: -0.5 }, bottomRight: { x: 1.5, y: 0.5 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(0, 5),
            normal: Normal.PREVIOUS,
        });
    });
    test('Starts vertical', () => {
        const velocity = { x: 0, y: 1 };
        const rect = { topLeft: { x: -0.5, y: -0.5 }, bottomRight: { x: 1.5, y: 0.5 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(0, 5),
            normal: Normal.PREVIOUS,
        });
    });
    test('Starts diagonal', () => {
        const velocity = { x: 1.5, y: 1.9 };
        const rect = { topLeft: { x: -0.5, y: -0.5 }, bottomRight: { x: 1.5, y: 0.5 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(0, 5),
            normal: Normal.PREVIOUS,
        });
    });
    test('Starts zero', () => {
        const velocity = { x: 0, y: 0 };
        const rect = { topLeft: { x: -0.5, y: -0.5 }, bottomRight: { x: 1.5, y: 0.5 } };
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(0, 5),
            normal: Normal.PREVIOUS,
        });
    });
});
//# sourceMappingURL=Geometry.test.js.map