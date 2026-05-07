import { hasLifecycle, LifecycleEntity, LifecycleEvent } from "../components/LifecycleComponent.js";
import { type Entity } from "../entity/Entity.js";
import { UuidPool } from "../entity/Uuid.js";
import './EntitySystem.js';
import { type EntitySystem, EntitySystemPredicate, RemoveEntityFn } from "./EntitySystem.js";

export class LifecycleSystem implements EntitySystem {
    private readonly entities = new Set<number>();

    predicate(ent: Entity<any>): boolean {
        return hasLifecycle(ent);
    }

    addEntity(entity: Entity<any>) {
        if (!hasLifecycle(entity) || this.containsEntity(entity.uuid)) {
            return;
        }
        this.entities.add(entity.uuid);
        entity.components.lifecycle.onCreate(entity, LifecycleEvent.CREATE);
    }

    removeEntity(uuid: number) {
        if (!this.containsEntity(uuid)) {
            return;
        }
        const entity = UuidPool.get(uuid);
        if (entity === undefined || !hasLifecycle(entity)) {
            return;
        }
        entity.components.lifecycle.onDestroy(entity, LifecycleEvent.DESTROY);
    }

    containsEntity(uuid: number): boolean {
        return this.entities.has(uuid);
    }
    
};