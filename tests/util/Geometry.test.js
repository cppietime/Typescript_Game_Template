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
        // TODO
    });
    test('Sweep XYXY', () => {
        // TODO
    });
    test('Sweep YXXY', () => {
        // TODO
    });
    test('Sweep YXYX', () => {
        // TODO
    });
    test('Miss negative', () => {
        // TODO
    });
});
//# sourceMappingURL=Geometry.test.js.map