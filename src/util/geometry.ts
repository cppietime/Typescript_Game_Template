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

export const originRectToTl = (rect: OriginRect) => {
    return {
        topLeft: {x: rect.origin.x - rect.size.x / 2, y: rect.origin.y - rect.size.y / 2},
        size: rect.size,
    } satisfies TlRect;
};

export const tlRectToOrigin = (rect: TlRect) => {
    return {
        origin: {x: rect.topLeft.x + rect.size.x / 2, y: rect.topLeft.y + rect.size.y / 2},
        size: rect.size,
    } satisfies OriginRect;
};

export const rectContains = (rect: OriginRect, pt: Vec2) =>
    pt.x >= rect.origin.x - rect.size.x / 2 &&
    pt.y >= rect.origin.y - rect.size.y / 2 &&
    pt.x < rect.origin.x + rect.size.x / 2 &&
    pt.y < rect.origin.y + rect.size.y / 2;
