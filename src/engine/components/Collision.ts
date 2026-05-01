import type { PhysicsSystem } from "../systems/PhysicsSystem.js";
import {TouchType} from "../../engine/data/types/Inputs.js";
import type { Game } from "../../Game.js";
import { GeometryModule, type OriginRect } from "../util/Geometry.js";
import { IdMap } from "../util/IdMap.js";
import { createFactory } from "../util/Typing.js";
import { entityHas, type Entity, type With } from "../entity/Entity.js";
import { UNASSIGNED } from "../entity/Uuid.js";
import { hasVelocity, type OriginEntity } from "./Physical.js";

/*
entity:
boxset[]

boxset:
entity id
isSolid
layer[]
mask[]
box[]

collision:
[boxset, boxset]
time
normal
isValid

trigger:
[boxset, boxset]
time
normal

system:
[entity, entity][]
entity -> set<entity>
entity -> collision[]
entity -> time
heap<collision>
queue<trigger>
set<[boxset id, boxset id]>

frame:
calculate entity bounding boxes including velocity
sweep and prune -> pairs of potential entity collisions
initialize empty heap of collisions
initialize queue of pending triggers
initialize set of queued trigger pairs
per sets eA, eB in sets of each entity pair, if layer and mask intersect:
	find earliest swept collision between any box in eA with eB
	if any, add to queue
while heap is not empty:
	pop earliest collision event
	if invalid, discard
	if either set is nonsolid and not in set, add trigger to queue and set
	if both sets are solid:
		update position, velocity, and local time for each entity
		invalidate all collisions in heap involving either entity
		recalculate collisions for all SAP pairs involving either entity: for each entity E:
            for every entity F paired with E in SAP:
                calculate collisions as above
run each trigger in queue
*/

export enum Normal {
    TOP,
    LEFT,
    RIGHT,
    BOTTOM,
    PREVIOUS,
};

export type CollisionFn = (collision: CollisionEvent) => void;
export type TouchFn = (touch: TouchEvent) => boolean;

// Largely immutable, constructed per event
export type CollisionEvent = {
    self: CollisionSet,
    trigger: CollisionSet,
    layers: Set<number>,
    invLayers: Set<number>,
    isSolid: boolean,
    isValid: boolean,
    normal: Normal,
    time: number,
};

export type TouchEvent = {
    self: CollisionSet,
    event: TouchType,
    priority: number,
};
export const createTouchEvent = createFactory<TouchEvent, "priority">({priority: 0});
export function compareTouchEvent (a: TouchEvent, b: TouchEvent): number {
    return b.priority - a.priority;
};

// Largely immutable, lives with entity
export type CollisionSet = {
    uuid: number,
    entityId: number,
    isSolid: boolean,
    layers: Set<number>,
    mask: Set<number>,
    rects: OriginRect[],
    onCollide?: CollisionFn | undefined,
    touchMask?: Set<TouchType>,
    onTouch?: TouchFn | undefined,
    touchPriority?: number,
};
export const createCollisionSet = createFactory<CollisionSet, "uuid" | "entityId" | "isSolid" | "layers" | "mask">({
    uuid: UNASSIGNED,
    entityId: UNASSIGNED,
    isSolid: false,
    layers: new Set(),
    mask: new Set(),
});

export type CollisionComponent = {
    collisionSets: CollisionSet[],
};

type WithCollision = With<CollisionComponent, "collision">;
export type CollisionEntity = Entity<WithCollision> & OriginEntity;
export const hasCollision = (entity: Entity<any>): entity is CollisionEntity => entityHas<CollisionEntity>(entity, ["collision", "origin"]);

export const CollisionModule = {
    collisionSetMap: new IdMap<CollisionSet>(),

    cleanup: (game: Game, data: CollisionEntity) => {
        game.physicsSystem.removeCollider(data.uuid);
    },

    matchingLayers: (layers: Set<number>, mask: Set<number>): Set<number> => {
        const match = new Set<number>();
        for (const layer of layers) {
            if (mask.has(layer)) {
                match.add(layer);
            }
        }
        return match;
    },

    invertNormal: (normal: Normal): Normal => {
        switch (normal) {
            case Normal.BOTTOM:
                return Normal.TOP;
            case Normal.TOP:
                return Normal.BOTTOM;
            case Normal.LEFT:
                return Normal.RIGHT;
            case Normal.RIGHT:
                return Normal.LEFT;
            case Normal.PREVIOUS:
                return Normal.PREVIOUS;
        }
    },

    invert: (collisionEvent: CollisionEvent): CollisionEvent => {
        return {
            self: collisionEvent.trigger,
            trigger: collisionEvent.self,
            layers: collisionEvent.invLayers,
            invLayers: collisionEvent.layers,
            isSolid: collisionEvent.isSolid,
            isValid: collisionEvent.isValid,
            time: collisionEvent.time,
            normal: CollisionModule.invertNormal(collisionEvent.normal),
        };
    },

    registerCollision: (physicsSystem: PhysicsSystem, uuid: number) => {
        physicsSystem.addCollider(uuid);
    },

    calculateBoundingBox: (data: CollisionEntity & OriginEntity): OriginRect => {
        let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
        for (const collisionSet of data.components.collision.collisionSets) {
            for (const rect of collisionSet.rects) {
                const topLeft = GeometryModule.OriginRect.topLeft(rect);
                const bottomRight = GeometryModule.OriginRect.bottomRight(rect);
                minX = Math.min(minX, topLeft.x);
                minY = Math.min(minY, topLeft.y);
                maxX = Math.max(maxX, bottomRight.x);
                maxY = Math.max(maxY, bottomRight.y);
            }
        }
        let {origin: {x, y}, inWorld: relative} = data.components.origin;
        if (!relative) {
            ({x, y} = data.game.renderSystem.screenToWorld({x, y}));
        }
        return GeometryModule.TlRect.toOrigin({topLeft: {x: minX + x, y: minY + y}, size: {x: maxX - minX, y: maxY - minY}});
    },

    updateCollisions: (physicsSystem: PhysicsSystem, data: CollisionEntity & OriginEntity) => {
        const handle = physicsSystem.getHandle(data.uuid);
        if (handle === undefined) {
            return;
        }
        const box = CollisionModule.calculateBoundingBox(data);
        const topLeft = GeometryModule.OriginRect.topLeft(box);
        const bottomRight = GeometryModule.OriginRect.bottomRight(box);
        let [minX, minY] = [topLeft.x, topLeft.y];
        let [maxX, maxY] = [bottomRight.x, bottomRight.y];
        if (hasVelocity(data)) {
            const vel = data.components.velocity;
            minX = Math.min(minX, minX + vel.x);
            maxX = Math.max(maxX, maxX + vel.x);
            minY = Math.min(minY, minY + vel.y);
            maxY = Math.max(maxY, maxY + vel.y);
        }
        handle.left.pos = minX;
        handle.right.pos = maxX;
        handle.top.pos = minY;
        handle.bottom.pos = maxY;
    },
};
