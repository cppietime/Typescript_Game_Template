import { entityHas, type Entity } from "../component/entity/Entity.js";
import { UuidPool } from "../component/entity/Uuid.js";
import { CollisionModule, Normal, type CollisionEvent } from "../component/physics/Collision.js";
import type { Game } from "../game.js";
import { insertionSort } from "../util/Algorithm.js";
import { CustomSet } from "../util/CustomSet.js";
import { RectModule, sweptAABB, type CornerRect, type OriginRect, type SweepResult, type Vec2 } from "../util/Geometry.js";
import { MinHeap } from "../util/MinHeap.js";

type SapEdge = {
    pos: number,
    isBeginning: boolean,
    uuid: number,
};

function sapEdgeCmp(left: SapEdge, right: SapEdge): number {
    return left.pos - right.pos;
}

type SapHandle = {
    left: SapEdge,
    right: SapEdge,
    top: SapEdge,
    bottom: SapEdge,
};

type ECU = Entity<"collision" | "uuid">;
type ECUR = Entity<"collision" | "uuid" | "rect">;

type CollisionState = {
    candidatePairs: [number, number][],
    candidatesMap: Map<number, number[]>,
    involvedEvents: Map<number, CollisionEvent[]>,
    localTime: Map<number, number>,
    priorityQueue: MinHeap<CollisionEvent>,
    eventQueue: CollisionEvent[],
    firedTriggers: CustomSet<[number, number]>,
};

function resetCollisionState(state: CollisionState) {
    state.candidatePairs.length = 0;
    state.candidatesMap.clear();
    state.involvedEvents.clear();
    state.localTime.clear();
    state.priorityQueue.clear();
    state.eventQueue.length = 0;
    state.firedTriggers.clear();
}

export class PhysicsSystem {
    // These two lists store the edges of the bounding box of possible collisions.
    // I.e. if the object is moving, it should encompass everything between current and proposed position.
    readonly edgesX: SapEdge[] = [];
    readonly edgesY: SapEdge[] = [];
    readonly sapHandles = new Map<number, SapHandle>();
    readonly colliderIds: Set<number> = new Set();
    readonly collisionState: CollisionState = {
        candidatePairs: [],
        candidatesMap: new Map(),
        involvedEvents: new Map(),
        localTime: new Map(),
        priorityQueue: new MinHeap((a, b) => a.time - b.time),
        eventQueue: [],
        firedTriggers: CustomSet.pairSet(),
    };

    addCollider(uuid: number) {
        const left: SapEdge = {pos: 0, isBeginning: true, uuid: uuid};
        const right: SapEdge = {pos: 0, isBeginning: false, uuid: uuid};
        const top: SapEdge = {pos: 0, isBeginning: true, uuid: uuid};
        const bottom: SapEdge = {pos: 0, isBeginning: false, uuid: uuid};
        this.edgesX.push(left, right);
        this.edgesY.push(top, bottom);
        this.sapHandles.set(uuid, {left: left, right: right, top: top, bottom: bottom});
        this.colliderIds.add(uuid);
    }

    getHandle(uuid: number) {
        return this.sapHandles.get(uuid);
    }

    removeCollider(uuid: number) {
        this.sapHandles.delete(uuid);
    }

    static sweepAndPrune(edges: SapEdge[]) {
        const activeSets: Set<number> = new Set();
        const candidates: CustomSet<[number, number]> = CustomSet.pairSet();
        for (const {isBeginning, uuid} of edges) {
            if (isBeginning) {
                activeSets.add(uuid);
            } else {
                activeSets.delete(uuid);
                activeSets.forEach((id) => {
                    candidates.add([uuid, id]);
                });
            }
        }
        return candidates;
    }

    static writeCandidatesMap(pair: [number, number], map: Map<number, number[]>) {
        const [a, b] = pair;
        if (!map.has(a)) {
            map.set(a, []);
        }
        if (!map.has(b)) {
            map.set(b, []);
        }
        map.get(a)!.push(b);
        map.get(b)!.push(a);
    }

    static colliderTimeVel(ent: ECUR, localTime: Map<number, number>): {time: number, velocity: Vec2} {
        const time = localTime.get(ent.components.uuid.uuid)!;
        const velocity = entityHas(ent, "velocity") ? ent.components.velocity : {x: 0, y: 0};
        return {time: time, velocity: velocity};
    }

    static colliderStartingPos(ent: ECUR, startTime: number, localTime: Map<number, number>): Vec2 {
        const currentPos = ent.components.rect.origin;
        if (!entityHas(ent, "velocity")) {
            return currentPos;
        }
        const velocity = ent.components.velocity;
        const t = startTime - localTime.get(ent.components.uuid.uuid)!;
        return {
            x: currentPos.x + t * velocity.x,
            y: currentPos.y + t * velocity.y,
        };
    }

    static collisionsFromPair(pair: [number, number], localTime: Map<number, number>): CollisionEvent[] {
        const entities = pair.map(id => UuidPool.get(id));
        const noneMissing = (es: (Entity<"uuid"> | undefined)[]): es is [ECUR, ECUR] =>
            !es.some(e => e == undefined || !entityHas(e, "collision") || !entityHas(e, "rect"));
        if (!noneMissing(entities)) {
            return [];
        }
        const [a, b] = entities;
        const {time: aTime, velocity: aVel} = PhysicsSystem.colliderTimeVel(a, localTime);
        const {time: bTime, velocity: bVel} = PhysicsSystem.colliderTimeVel(b, localTime);
        const relVel: Vec2 = {x: aVel.x - bVel.x, y: aVel.y - bVel.y};
        const initialTime = Math.max(aTime, bTime);
        const aPos = PhysicsSystem.colliderStartingPos(a, initialTime, localTime);
        const bPos = PhysicsSystem.colliderStartingPos(b, initialTime, localTime);

        const collisions: CollisionEvent[] = [];
        for (const setA of a.components.collision.collisionSets) {
            bSetLoop: for (const setB of b.components.collision.collisionSets) {
                let firstSweep: SweepResult | undefined;
                const layers = CollisionModule.matchingLayers(setA.layers, setB.mask);
                const invLayers = CollisionModule.matchingLayers(setB.layers, setA.mask);
                if (layers.size === 0 && invLayers.size === 0) {
                    continue bSetLoop;
                }
                for (const rectA of setA.rects) {
                    const {topLeft: tlA, bottomRight: brA} = RectModule.Origin.toCorner(rectA);
                    bRectLoop: for (const rectB of setB.rects) {
                        const {topLeft: tlB, bottomRight: brB} = RectModule.Origin.toCorner(rectB);
                        const topLeft = {x: tlB.x + bPos.x - brA.x - aPos.x, y: tlB.y + bPos.y - brA.y - aPos.y};
                        const bottomRight = {x: brB.x + bPos.x - tlA.x - aPos.x, y: brB.y + bPos.y - tlA.y - aPos.y};
                        const sweep = sweptAABB({topLeft: topLeft, bottomRight: bottomRight}, relVel, initialTime);
                        if (sweep === undefined) {
                            continue bRectLoop;
                        }
                        if (firstSweep === undefined || sweep.time < firstSweep.time) {
                            firstSweep = sweep;
                        }
                    }
                }
                if (firstSweep !== undefined) {
                    // There was a collision
                    const collision = {
                        self: setA,
                        trigger: setB,
                        layers: layers,
                        invLayers: invLayers,
                        isValid: true,
                        normal: firstSweep.normal,
                        time: firstSweep.time,
                        isSolid: setA.isSolid && setB.isSolid,
                    } satisfies CollisionEvent;
                    collisions.push(collision);
                }
            }
        }
        return collisions;
    }

    static resolveCollisionFor(entity: ECUR, collision: CollisionEvent, localTime: Map<number, number>) {
        if (entityHas(entity, "velocity")) {
            const ellapsed = collision.time - (localTime.get(entity.components.uuid.uuid) ?? 0);
            entity.components.rect.origin.x += ellapsed * entity.components.velocity.x;
            entity.components.rect.origin.y += ellapsed * entity.components.velocity.y;
            switch (collision.normal) {
                case Normal.LEFT:
                case Normal.RIGHT:
                    entity.components.velocity.x = 0;
                    break;
                case Normal.TOP:
                case Normal.BOTTOM:
                    entity.components.velocity.y = 0;
                    break;
            }
        }
    }

    checkCollisions(game: Game) {
        resetCollisionState(this.collisionState);

        // Update bounding boxes
        const deadColliders: Set<number> = new Set();
        for (const colliderId of this.colliderIds) {
            const entity = UuidPool.get(colliderId);
            if (entity === undefined || !entityHas(entity, "collision") || !entityHas(entity, "rect") || !entity.components.uuid.alive) {
                deadColliders.add(colliderId);
                continue;
            }
            this.collisionState.localTime.set(entity.components.uuid.uuid, 0);
            CollisionModule.updateCollisions(this, entity);
        }

        insertionSort(this.edgesX, sapEdgeCmp);
        insertionSort(this.edgesY, sapEdgeCmp);

        for (const deadCollider of deadColliders) {
            this.colliderIds.delete(deadCollider);
        }

        // Sweep and prune
        // X
        const xPairs = PhysicsSystem.sweepAndPrune(this.edgesX);
        // Y
        const yPairs = PhysicsSystem.sweepAndPrune(this.edgesY);
        for (const pair of xPairs) {
            if (yPairs.has(pair)) {
                PhysicsSystem.writeCandidatesMap(pair, this.collisionState.candidatesMap);
                const collisions = PhysicsSystem.collisionsFromPair(pair, this.collisionState.localTime);
                for (const collision of collisions) {
                    this.collisionState.priorityQueue.insert(collision);
                    pair.forEach((id) => {
                        if (!this.collisionState.involvedEvents.has(id)) {
                            this.collisionState.involvedEvents.set(id, []);
                        }
                        this.collisionState.involvedEvents.get(id)!.push(collision);
                    });
                }
            }
        }

        for (const nextCollision of this.collisionState.priorityQueue) {
            if (!nextCollision.isValid) {
                continue;
            }
            if (nextCollision.isSolid) {
                // Ignore static solid collisions
                // Messy, probably buggy, but I dunno how to deal with that
                if (nextCollision.normal === Normal.PREVIOUS) {
                    continue;
                }

                // Resolve solid collisions
                const selfEnt = UuidPool.get(nextCollision.self.entityId)! as ECUR;
                const triggerEnt = UuidPool.get(nextCollision.trigger.entityId)! as ECUR;

                PhysicsSystem.resolveCollisionFor(selfEnt, nextCollision, this.collisionState.localTime);
                PhysicsSystem.resolveCollisionFor(triggerEnt, nextCollision, this.collisionState.localTime);
                
                this.collisionState.localTime.set(selfEnt.components.uuid.uuid, nextCollision.time);
                this.collisionState.localTime.set(triggerEnt.components.uuid.uuid, nextCollision.time);

                // Invalidate all remaining collisions of both entities
                const selfEvents = this.collisionState.involvedEvents.get(nextCollision.self.entityId)!;
                for (const collision of selfEvents.values()) {
                    collision.isValid = false;
                }
                const triggerEvents = this.collisionState.involvedEvents.get(nextCollision.trigger.entityId)!;
                for (const collision of triggerEvents.values()) {
                    collision.isValid = false;
                }
                selfEvents.length = 0;
                triggerEvents.length = 0;

                // Recalculate collisions involving either entity and add back to priority queue
                const pair: [number, number] = [nextCollision.self.entityId, nextCollision.trigger.entityId];
                const collisions = PhysicsSystem.collisionsFromPair(pair, this.collisionState.localTime);
                for (const collision of collisions) {
                    this.collisionState.priorityQueue.insert(collision);
                    selfEvents.push(collision);
                    triggerEvents.push(collision);
                }
            } else {
                // Check if this pair of box sets already has a trigger registered
                const key: [number, number] = [nextCollision.self.uuid, nextCollision.trigger.uuid];

                if (!this.collisionState.firedTriggers.has(key)) {
                    // If not, register it
                    this.collisionState.firedTriggers.add(key);
                    this.collisionState.eventQueue.push(nextCollision);
                }
            }
        }

        // Fire all registered collision events
        for (const collision of this.collisionState.eventQueue) {
            if (collision.layers.size > 0) collision.self.onCollide?.(collision);
            if (collision.invLayers.size > 0) collision.trigger.onCollide?.(CollisionModule.invert(collision));
        }

        // Resolve remaining velocities
        for (const colliderId of this.colliderIds) {
            const entity = UuidPool.get(colliderId) as ECUR;
            if (!entityHas(entity, "velocity")) {
                continue;
            }
            const localTime = this.collisionState.localTime.get(colliderId) ?? 0;
            if (localTime >= 1) {
                continue;
            }
            const origin = entity.components.rect.origin;
            const velocity = entity.components.velocity;
            const ellapsed = 1 - localTime;
            origin.x += velocity.x * ellapsed;
            origin.y += velocity.y * ellapsed;
        }
    }

};