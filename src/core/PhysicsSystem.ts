import type { Collider } from "../component/physics/Collision.js";

type SapEdge = {
    pos: number,
    isBeginning: boolean,
    uuid: number,
};

type ColliderHandle = {
    left: SapEdge,
    right: SapEdge,
    top: SapEdge,
    bottom: SapEdge,
};

export class PhysicsSystem {
    // These two lists store the edges of the bounding box of possible collisions.
    // I.e. if the object is moving, it should encompass everything between current and proposed position.
    readonly edgesX: SapEdge[] = [];
    readonly edgesY: SapEdge[] = [];
    readonly colliderHandles = new Map<number, ColliderHandle>();

    addCollider(collider: Collider) {
        const left: SapEdge = {pos: 0, isBeginning: true, uuid: collider.uuid};
        const right: SapEdge = {pos: 0, isBeginning: false, uuid: collider.uuid};
        const top: SapEdge = {pos: 0, isBeginning: true, uuid: collider.uuid};
        const bottom: SapEdge = {pos: 0, isBeginning: false, uuid: collider.uuid};
        this.edgesX.push(left, right);
        this.edgesY.push(top, bottom);
        this.colliderHandles.set(collider.uuid, {left: left, right: right, top: top, bottom: bottom});
    }

    getHandle(uuid: number) {
        return this.colliderHandles.get(uuid);
    }

};