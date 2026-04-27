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

export const RectModule = {
    Origin: {
        toTl: (rect: OriginRect): TlRect => {
            return {
                topLeft: {x: rect.origin.x - rect.size.x / 2, y: rect.origin.y - rect.size.y / 2},
                size: rect.size,
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
    },
    rectContains: (rect: OriginRect, pt: Vec2) => {
        return pt.x >= rect.origin.x - rect.size.x / 2 &&
        pt.y >= rect.origin.y - rect.size.y / 2 &&
        pt.x < rect.origin.x + rect.size.x / 2 &&
        pt.y < rect.origin.y + rect.size.y / 2
    }
};