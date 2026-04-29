import { entityHas, type Entity } from "../component/entity/Entity.js";
import { UuidPool } from "../component/entity/Uuid.js";
import { CollisionModule, hasCollision, Normal, type CollisionEntity, type CollisionEvent } from "../component/physics/Collision.js";
import { hasOrigin, hasVelocity, type OriginEntity } from "../component/physics/Physical.js";
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

    static colliderTimeVel(ent: CollisionEntity, localTime: Map<number, number>, deltaTime: number): {time: number, velocity: Vec2} {
        const time = localTime.get(ent.uuid)!;
        const velocity = hasVelocity(ent) ? ent.components.velocity : {x: 0, y: 0};
        return {time: time, velocity: {x: velocity.x * deltaTime, y: velocity.y * deltaTime}};
    }

    static colliderStartingPos(ent: CollisionEntity, velocity: Vec2, startTime: number, localTime: Map<number, number>): Vec2 {
        const currentPos = ent.components.origin;
        const t = startTime - localTime.get(ent.uuid)!;
        return {
            x: currentPos.x + t * velocity.x,
            y: currentPos.y + t * velocity.y,
        };
    }

    static collisionsFromPair(pair: [number, number], localTime: Map<number, number>, deltaTime: number): CollisionEvent[] {
        const entities = pair.map(id => UuidPool.get(id));
        const noneMissing = (es: (Entity<{}> | undefined)[]): es is [CollisionEntity, CollisionEntity] =>
            !es.some(e => e == undefined || !hasCollision(e));
        if (!noneMissing(entities)) {
            return [];
        }
        const [a, b] = entities;
        const {time: aTime, velocity: aVel} = PhysicsSystem.colliderTimeVel(a, localTime, deltaTime);
        const {time: bTime, velocity: bVel} = PhysicsSystem.colliderTimeVel(b, localTime, deltaTime);
        const relVel: Vec2 = {x: aVel.x - bVel.x, y: aVel.y - bVel.y};
        const initialTime = Math.max(aTime, bTime);
        const aPos = PhysicsSystem.colliderStartingPos(a, aVel, initialTime, localTime);
        const bPos = PhysicsSystem.colliderStartingPos(b, bVel, initialTime, localTime);

        const collisions: CollisionEvent[] = [];
        for (const setA of a.components.collision.collisionSets) {
            bSetLoop: for (const setB of b.components.collision.collisionSets) {
                let firstSweep: SweepResult | undefined;
                const layers = CollisionModule.matchingLayers(setB.layers, setA.mask);
                const invLayers = CollisionModule.matchingLayers(setA.layers, setB.mask);
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

    static readonly EPSILON = 5e-2; // Design question. Experimental?
    static resolveCollisionFor(entity: CollisionEntity, collision: CollisionEvent, localTime: Map<number, number>, deltaTime: number) {
        if (hasVelocity(entity)) {
            const ellapsed = (collision.time - (localTime.get(entity.uuid) ?? 0)) * deltaTime;
            const vel = entity.components.velocity;
            entity.components.origin.x += ellapsed * vel.x * (1 - PhysicsSystem.EPSILON);
            entity.components.origin.y += ellapsed * vel.y * (1 - PhysicsSystem.EPSILON);
            switch (collision.normal) {
                case Normal.LEFT:
                    vel.x = Math.min(vel.x, 0);
                    break;
                case Normal.RIGHT:
                    vel.x = Math.max(vel.x, 0);
                    break;
                case Normal.TOP:
                    vel.y = Math.min(vel.y, 0);
                    break;
                case Normal.BOTTOM:
                    vel.y = Math.max(vel.y, 0);
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
            if (entity === undefined || !hasCollision(entity) || !entity.isAlive) {
                deadColliders.add(colliderId);
                continue;
            }
            this.collisionState.localTime.set(entity.uuid, 0);
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
        const deltaTime = game.deltaTime;
        for (const pair of xPairs) {
            if (yPairs.has(pair)) {
                PhysicsSystem.writeCandidatesMap(pair, this.collisionState.candidatesMap);
                const collisions = PhysicsSystem.collisionsFromPair(pair, this.collisionState.localTime, deltaTime);
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
            const inverse = CollisionModule.invert(nextCollision);
            // Ignore static solid collisions
            // Messy, probably buggy, but I dunno how to deal with that
            if (nextCollision.isSolid && nextCollision.normal !== Normal.PREVIOUS) {
                // Resolve solid collisions
                const selfEnt = UuidPool.get(nextCollision.self.entityId)! as CollisionEntity;
                const triggerEnt = UuidPool.get(nextCollision.trigger.entityId)! as CollisionEntity;

                PhysicsSystem.resolveCollisionFor(selfEnt, nextCollision, this.collisionState.localTime, deltaTime);
                PhysicsSystem.resolveCollisionFor(triggerEnt, inverse, this.collisionState.localTime, deltaTime);
                
                this.collisionState.localTime.set(selfEnt.uuid, nextCollision.time);
                this.collisionState.localTime.set(triggerEnt.uuid, nextCollision.time);

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
                const collisions = PhysicsSystem.collisionsFromPair(pair, this.collisionState.localTime, deltaTime);
                for (const collision of collisions) {
                    this.collisionState.priorityQueue.insert(collision);
                    selfEvents.push(collision);
                    triggerEvents.push(collision);
                }
            }
            // Check if this pair of box sets already has a trigger registered
            const key: [number, number] = [nextCollision.self.uuid, nextCollision.trigger.uuid];

            if (!this.collisionState.firedTriggers.has(key)) {
                // If not, register it
                this.collisionState.firedTriggers.add(key);
                this.collisionState.eventQueue.push(nextCollision, inverse);
            }
        }

        // Fire all registered collision events
        for (const collision of this.collisionState.eventQueue) {
            if (collision.layers.size > 0) collision.self.onCollide?.(collision);
            //if (collision.invLayers.size > 0) collision.trigger.onCollide?.(CollisionModule.invert(collision));
        }

        // Resolve remaining velocities
        for (const colliderId of this.colliderIds) {
            const entity = UuidPool.get(colliderId) as CollisionEntity;
            if (!hasVelocity(entity)) {
                continue;
            }
            const localTime = this.collisionState.localTime.get(colliderId) ?? 0;
            if (localTime >= 1) {
                continue;
            }
            const origin = entity.components.origin;
            const velocity = entity.components.velocity;
            const ellapsed = (1 - localTime) * deltaTime;
            origin.x += velocity.x * ellapsed;
            origin.y += velocity.y * ellapsed;
        }
    }

};