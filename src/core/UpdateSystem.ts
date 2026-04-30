import { entityHas, type Entity } from "../component/entity/Entity.js";
import { UuidPool } from "../component/entity/Uuid.js";
import type { Game } from "../game.js";
import {hasTick, type TickEntity} from "../component/physics/Tick.js";
import type { ContainsEntityFn, EntitySystem, EntitySystemPredicate } from "./EntitySystem.js";

export class UpdateSystem implements EntitySystem {
    updateUuids: Set<number> = new Set();

    predicate(entity: Entity<any>): boolean {
        return hasTick(entity);
    }

    reset() {
        this.updateUuids.clear();
    }

    update(game: Game) {
        for (const uuid of this.updateUuids) {
            const entity = UuidPool.get(uuid);
            if (entity === undefined || !hasTick(entity) || !entity.isAlive) {
                this.updateUuids.delete(uuid);
                continue;
            }
            entity.components.tick(game, entity);
        }
    }

    addEntity(entity: TickEntity) {
        this.updateUuids.add(entity.uuid);
    }

    removeEntity(id: number) {
        this.updateUuids.delete(id);
    }

    containsEntity(id: number): boolean {
        return this.updateUuids.has(id);
    }
}