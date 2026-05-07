import type { CollisionComponent, CollisionEntity, CollisionEvent, CollisionSet } from "../../../engine/components/Collision.js";
import { createOriginComponent, type SizeEntity, type VelocityEntity } from "../../../engine/components/Physical.js";
import type { RenderComponent, RenderEntity } from "../../../engine/components/RenderComponent.js";
import type { TickComponent, TickEntity } from "../../../engine/components/Tick.js";
import { type Entity, entityHas } from "../../../engine/entity/Entity.js";
import { UNASSIGNED, UuidPool } from "../../../engine/entity/Uuid.js";
import { Game } from "../../../engine/Game.js";
import { createVec2, type OriginRect, type Vec2 } from "../../../engine/util/Geometry.js";
import { LAYERS } from "../../data/Constants.js";
import {hasPlayer, type PlayerEntity} from "../Player.js";

export type EnemyComponent = {
    attack: number,
    health: number,
    speed: number,
};
type WithEnemy = {enemy: EnemyComponent};
export type EnemyEntity = CollisionEntity & RenderEntity & VelocityEntity & SizeEntity & Entity<WithEnemy> & TickEntity;
export const hasEntity = (entity: Entity<any>): entity is EnemyEntity => entityHas(entity, ["enemy"]);

export const EnemyModule = {
    create: (
        game: Game,
        collision: CollisionComponent,
        size: Vec2,
        render: RenderComponent,
        enemy: EnemyComponent,
    ): EnemyEntity => {
        const ent: EnemyEntity = {
            uuid: UNASSIGNED,
            game: game,
            isAlive: true,
            components: {
                collision: collision,
                size: size,
                renderable: render,
                enemy: enemy,
                origin: createOriginComponent({origin: createVec2({})}),
                velocity: createVec2({}),
                tick: EnemyModule.update as TickComponent,
            },
        };
        return ent;
    },

    createHitBox: (rects: OriginRect[]): CollisionSet => {
        const set: CollisionSet = {
            isSolid: false,
            uuid: UNASSIGNED,
            entityId: UNASSIGNED,
            layers: new Set<number>([]),
            mask: new Set([LAYERS.PLAYER]),
            rects: rects,
            onCollide: EnemyModule.onHit,
        };
        return set;
    },

    createHurtBox: (rects: OriginRect[]): CollisionSet => {
        const set: CollisionSet = {
            isSolid: false,
            uuid: UNASSIGNED,
            entityId: UNASSIGNED,
            layers: new Set<number>([LAYERS.ENEMY]),
            mask: new Set([LAYERS.PROJECTILE]),
            rects: rects,
            onCollide: EnemyModule.onHurt,
        };
        return set;
    },

    update: (game: Game, data: EnemyEntity) => {
        let player: PlayerEntity | undefined = undefined;
        for (const entity of UuidPool.uuidMap.values()) {
            if (!hasPlayer(entity)) {
                continue;
            }
            player = entity;
            break;
        }
        if (player === undefined) {
            return;
        }
        const playerPos = player.components.origin.origin;
        const enemyPos = data.components.origin.origin;
        const speed = data.components.enemy.speed;
        const diff = createVec2({x: playerPos.x - enemyPos.x, y: playerPos.y - enemyPos.y});
        const mag = Math.hypot(diff.x, diff.y);
        if (Math.abs(mag) > 1e-6){
            data.components.velocity = createVec2({x: diff.x / mag * speed, y: diff.y / mag * speed});
        }
    },

    onHit: (collision: CollisionEvent) => {
        const enemy = UuidPool.get(collision.self.entityId);
        if (enemy === undefined || !hasEntity(enemy)) {
            return;
        }
        const player = UuidPool.get(collision.trigger.entityId);
        if (player === undefined || !hasPlayer(player)) {
            return;
        }
        const damage = enemy.components.enemy.attack;
        console.log(`Enemy does ${damage} to player!`);
    },

    onHurt: (collision: CollisionEvent) => {
        const enemy = UuidPool.get(collision.self.entityId);
        if (enemy === undefined || !hasEntity(enemy)) {
            return;
        }
        enemy.game.destroyEntity(enemy.uuid);
        console.log('Enemy is dead!');
    },
};
