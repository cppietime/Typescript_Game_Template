import { Normal } from "../../src/component/physics/Collision.js";
import { createVec2, sweptAABB, type CornerRect, type SweepResult, type Vec2 } from "../../src/util/Geometry.js";

describe('Default factories', () => {
    test('Create default vec2', () => {
        const vec = createVec2({});
        expect(vec).toEqual({x: 0, y: 0});
    });
    test('Create half-default vec2', () => {
        const vec = createVec2({x: 4});
        expect(vec).toEqual({x: 4, y: 0});
    });
    test('Create nondefault vec2', () => {
        const vec = createVec2({x: 1, y: 3});
        expect(vec).toEqual({x: 1, y: 3});
    });
});

describe('Collisions', () => {
    test('Sweep horizontal left', () => {
        const velocity: Vec2 = {x: 1.5, y: 0};
        const rect: CornerRect = {topLeft: {x: 0.5, y: -0.5}, bottomRight: {x: 1.5, y: 0.5}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(0.5 / 1.5, 5),
            normal: Normal.LEFT,
        } satisfies SweepResult);
    });
    test('Sweep horizontal right', () => {
        const velocity: Vec2 = {x: -1.5, y: 0};
        const rect: CornerRect = {topLeft: {x: -1.5, y: -0.5}, bottomRight: {x: -0.5, y: 0.5}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(0.5 / 1.5, 5),
            normal: Normal.RIGHT,
        } satisfies SweepResult);
    });
    test('Sweep vertical top', () => {
        const velocity: Vec2 = {x: 0, y: 2.5};
        const rect: CornerRect = {topLeft: {x: -0.5, y: 1.5}, bottomRight: {x: 0.5, y: 4}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(1.5 / 2.5, 5),
            normal: Normal.TOP,
        } satisfies SweepResult);
    });
    test('Sweep vertical bottom', () => {
        const velocity: Vec2 = {x: 0, y: -2.5};
        const rect: CornerRect = {topLeft: {x: -0.5, y: -4}, bottomRight: {x: 0.5, y: -1.5}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(1.5 / 2.5, 5),
            normal: Normal.BOTTOM,
        } satisfies SweepResult);
    });
    test('Sweep XYYX', () => {
        const velocity: Vec2 = {x: 0.5, y: 2};
        const rect: CornerRect = {topLeft: {x: 0, y: 1}, bottomRight: {x: 1, y: 2}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(1 / 2, 5),
            normal: Normal.TOP,
        } satisfies SweepResult);
    });
    test('Sweep XYXY', () => {
        const velocity: Vec2 = {x: 1, y: 1.25};
        const rect: CornerRect = {topLeft: {x: 0, y: 1}, bottomRight: {x: 1, y: 2}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(1 / 1.25, 5),
            normal: Normal.TOP,
        } satisfies SweepResult);
    });
    test('Sweep YXXY', () => {
        const velocity: Vec2 = {x: 2, y: 0.5};
        const rect: CornerRect = {topLeft: {x: 1, y: 0}, bottomRight: {x: 2, y: 1}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(1 / 2, 5),
            normal: Normal.LEFT,
        } satisfies SweepResult);
    });
    test('Sweep YXYX', () => {
        const velocity: Vec2 = {x: 1.25, y: 1};
        const rect: CornerRect = {topLeft: {x: 1, y: 0}, bottomRight: {x: 2, y: 1}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(1 / 1.25, 5),
            normal: Normal.LEFT,
        } satisfies SweepResult);
    });
    test('Miss negative', () => {
        const velocity: Vec2 = {x: -1.25, y: -1};
        const rect: CornerRect = {topLeft: {x: 1, y: 0}, bottomRight: {x: 2, y: 1}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toBeUndefined();
    });
    test('Miss positive', () => {
        const velocity: Vec2 = {x: 2, y: 3};
        const rect: CornerRect = {topLeft: {x: 2, y: 1}, bottomRight: {x: 3, y: 2}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toBeUndefined();
    });
    test('Miss horizontal', () => {
        const velocity: Vec2 = {x: 2, y: 0};
        const rect: CornerRect = {topLeft: {x: 2, y: 1}, bottomRight: {x: 3, y: 2}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toBeUndefined();
    });
    test('Miss vertical', () => {
        const velocity: Vec2 = {x: 0, y: 2};
        const rect: CornerRect = {topLeft: {x: 2, y: 1}, bottomRight: {x: 3, y: 2}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toBeUndefined();
    });
    test('Miss zero', () => {
        const velocity: Vec2 = {x: 0, y: 0};
        const rect: CornerRect = {topLeft: {x: 0.5, y: -0.5}, bottomRight: {x: 1.5, y: 1.5}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toBeUndefined();
    });
    test('Miss by start time', () => {
        const velocity: Vec2 = {x: 3, y: 1};
        const rect: CornerRect = {topLeft: {x: 1, y: 0}, bottomRight: {x: 2, y: 1}};
        const result = sweptAABB(rect, velocity, 2.5 / 3);
        expect(result).toBeUndefined();
    });
    test('Hit with start time', () => {
        const velocity: Vec2 = {x: 3, y: 1};
        const rect: CornerRect = {topLeft: {x: 1, y: 0}, bottomRight: {x: 2, y: 1}};
        const result = sweptAABB(rect, velocity, 1.5 / 3);
        expect(result).toEqual({
            normal: Normal.LEFT,
            time: expect.closeTo(1.5 / 3 + 1 / 3, 5),
        } satisfies SweepResult);
    });
    test('Starts horizontal', () => {
        const velocity: Vec2 = {x: 1.5, y: 0};
        const rect: CornerRect = {topLeft: {x: -0.5, y: -0.5}, bottomRight: {x: 1.5, y: 0.5}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(0, 5),
            normal: Normal.PREVIOUS,
        } satisfies SweepResult);
    });
    test('Starts vertical', () => {
        const velocity: Vec2 = {x: 0, y: 1};
        const rect: CornerRect = {topLeft: {x: -0.5, y: -0.5}, bottomRight: {x: 1.5, y: 0.5}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(0, 5),
            normal: Normal.PREVIOUS,
        } satisfies SweepResult);
    });
    test('Starts diagonal', () => {
        const velocity: Vec2 = {x: 1.5, y: 1.9};
        const rect: CornerRect = {topLeft: {x: -0.5, y: -0.5}, bottomRight: {x: 1.5, y: 0.5}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(0, 5),
            normal: Normal.PREVIOUS,
        } satisfies SweepResult);
    });
    test('Starts zero', () => {
        const velocity: Vec2 = {x: 0, y: 0};
        const rect: CornerRect = {topLeft: {x: -0.5, y: -0.5}, bottomRight: {x: 1.5, y: 0.5}};
        const result = sweptAABB(rect, velocity, 0);
        expect(result).toEqual({
            time: expect.closeTo(0, 5),
            normal: Normal.PREVIOUS,
        } satisfies SweepResult);
    });
});