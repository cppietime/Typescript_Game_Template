import { Normal } from "../component/physics/Collision.js";

export type Vec2 = {
    x: number,
    y: number,
};

export type OriginRect = {
    origin: Vec2,
    size: Vec2,
};

export type TlRect = {
    topLeft: Vec2,
    size: Vec2,
};

export type CornerRect = {
    topLeft: Vec2,
    bottomRight: Vec2,
};

export const RectModule = {
    Origin: {
        toTl: (rect: OriginRect): TlRect => {
            return {
                topLeft: {x: rect.origin.x - rect.size.x / 2, y: rect.origin.y - rect.size.y / 2},
                size: rect.size,
            };
        },
        toCorner: (rect: OriginRect): CornerRect => {
            return {
                topLeft: {x: rect.origin.x - rect.size.x / 2, y: rect.origin.y - rect.size.y / 2},
                bottomRight: {x: rect.origin.x + rect.size.x / 2, y: rect.origin.y + rect.size.y / 2},
            };
        },
        topLeft: (rect: OriginRect): Vec2 => {
            return {x: rect.origin.x - rect.size.x / 2, y: rect.origin.y - rect.size.y / 2};
        },
        bottomRight: (rect: OriginRect): Vec2 => {
            return {x: rect.origin.x + rect.size.x / 2, y: rect.origin.y + rect.size.y / 2};
        }
    },
    TopLeft: {
        toOrigin: (rect: TlRect): OriginRect =>{
            return {
                origin: {x: rect.topLeft.x + rect.size.x / 2, y: rect.topLeft.y + rect.size.y / 2},
                size: rect.size,
            };
        },
        toCorner: (rect: TlRect): CornerRect => {
            return {
                topLeft: rect.topLeft,
                bottomRight: {x: rect.topLeft.x + rect.size.x, y: rect.topLeft.y + rect.size.y},
            };
        },
    },
    rectContains: (rect: OriginRect, pt: Vec2) => {
        return pt.x >= rect.origin.x - rect.size.x / 2 &&
        pt.y >= rect.origin.y - rect.size.y / 2 &&
        pt.x < rect.origin.x + rect.size.x / 2 &&
        pt.y < rect.origin.y + rect.size.y / 2
    }
};

export type SweepResult = {
    time: number,
    normal: Normal,
};

/**
 * Performs a swept AABB collision check in the time interval [startTime, 1].
 * @param rect AABB transformed relative to origin
 * @param velocity Relative velocity of origin point to `rect`
 * @param startTime Starting time before beginning collision check
 * @returns If no collision, undefined. Otherwise, the time of collision and normal direction first collided.
 */
export function sweptAABB(rect: CornerRect, velocity: Vec2, startTime: number): SweepResult | undefined {
    let tMin: number, tMax: number, normal: Normal;
    if (velocity.x === 0) {
        // Vertical ray
        if (rect.topLeft.x > 0 || rect.bottomRight.x < 0) {
            return undefined;
        }
        else if (velocity.y === 0) {
            if (rect.topLeft.y > 0 || rect.bottomRight.y < 0) {
                return undefined;
            }
            return {time: startTime, normal: Normal.PREVIOUS};
        }
        const tLo = rect.topLeft.y / velocity.y;
        const tHi = rect.bottomRight.y / velocity.y;
        if (tLo > tHi) {
            tMin = tHi;
            tMax = tLo;
            normal = Normal.BOTTOM;
        } else {
            tMin = tLo;
            tMax = tHi;
            normal = Normal.TOP;
        }
    } else if (velocity.y == 0) {
        // Horizontal ray
        if (rect.topLeft.y > 0 || rect.bottomRight.y < 0) {
            return undefined;
        }
        const tLo = rect.topLeft.x / velocity.x;
        const tHi = rect.bottomRight.x / velocity.x;
        if (tLo > tHi) {
            tMin = tHi;
            tMax = tLo;
            normal = Normal.RIGHT;
        } else {
            tMin = tLo;
            tMax = tHi;
            normal = Normal.LEFT;
        }
    } else {
        const tLoX = rect.topLeft.x / velocity.x;
        const tHiX = rect.bottomRight.x / velocity.x;
        const tLoY = rect.topLeft.y / velocity.y;
        const tHiY = rect.bottomRight.y / velocity.y;
        const tMinX = Math.min(tLoX, tHiX);
        const tMaxX = Math.max(tLoX, tHiX);
        const tMinY = Math.min(tLoY, tHiY);
        const tMaxY = Math.max(tLoY, tHiY);
        if (tMinX > tMinY) {
            tMin = tMinX;
            normal = velocity.x > 0 ? Normal.LEFT : Normal.RIGHT;
        } else {
            tMin = tMinY;
            normal = velocity.y > 0 ? Normal.TOP : Normal.BOTTOM;
        }
        tMax = Math.min(tMaxX, tMaxY);
    }
    if (tMin > tMax) {
        return undefined;
    }
    if (tMin < 0) {
        if (tMax < 0) {
            return undefined;
        }
        return {time: startTime, normal: Normal.PREVIOUS};
    }
    if (tMin + startTime > 1) {
        return undefined;
    }
    return {time: tMin + startTime, normal: normal};
}
