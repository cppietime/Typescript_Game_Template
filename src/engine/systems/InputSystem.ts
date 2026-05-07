import { State, Trigger } from "../../game/data/Inputs.js";
import {TouchType} from "../../engine/data/types/Inputs.js";
import type { Game } from "../Game.js";
import { createOriginRect, createVec2, type Vec2 } from "../util/Geometry.js";
import { IdMap } from "../util/IdMap.js";

export type InputRegion = {
    predicate: (click: ClickState, regionStates: Set<State>) => boolean
};

export type TouchListener = (click: ClickState) => void;

export type ClickState = {
    position: Vec2,
    down: boolean,
    initial: boolean,
};

export class InputSystem {
    private readonly game: Game;
    private readonly triggerMapping: Map<Trigger, (() => void)[]> = new Map();
    private readonly activeStates: Set<State> = new Set();
    private readonly currentClick: ClickState = {position: createVec2({}), down: false, initial: false};
    private readonly regionStates: Set<State> = new Set();
    
    inputRegions: IdMap<InputRegion> = new IdMap();
    touchListeners: IdMap<TouchListener> = new IdMap();

    constructor(game: Game) {
        this.game = game;

        this.reset();
    }

    reset() {
        this.triggerMapping.clear();
        this.activeStates.clear();
        this.currentClick.down = false;
        this.inputRegions.clear()
        this.regionStates.clear();
        this.touchListeners.clear()

        for (const key of Object.keys(Trigger) as (keyof typeof Trigger)[]) {
            const input = Trigger[key];
            this.triggerMapping.set(input, []);
        }

        this.setupInputs();
    }

    triggerInput(input: Trigger) {
        this.triggerMapping.get(input)?.forEach(cb => cb());
    }

    setState(state: State, status: boolean) {
        if (status) {
            this.activeStates.add(state);
        } else {
            this.activeStates.delete(state);
        }
    }

    queueRegion(state: State) {
        this.regionStates.add(state);
    }

    private touchStart(pos: Vec2) {
        this.setClickPos(pos);
        this.currentClick.down = true;
        this.currentClick.initial = true;
        this.updateRegionStates();
        for (const listener of this.touchListeners.values()) {
            listener(this.currentClick);
        }
        this.game.physicsSystem.fireInputEvents(this.game, TouchType.BEGIN, createOriginRect({
            origin: this.game.renderSystem.positionOnCanvas(pos),
            size: createVec2({}),
        }));
    }

    private touchEnd(pos: Vec2) {
        this.currentClick.down = false;
        this.currentClick.initial = false;
        this.updateRegionStates();
        this.game.physicsSystem.fireInputEvents(this.game, TouchType.END, createOriginRect({
            origin: this.game.renderSystem.positionOnCanvas(pos),
            size: createVec2({}),
        }));
    }

    private touchMove(pos: Vec2) {
        this.setClickPos(pos);
        this.currentClick.initial = false;
        this.updateRegionStates();
        this.game.physicsSystem.fireInputEvents(this.game, TouchType.MOVE, createOriginRect({
            origin: this.game.renderSystem.positionOnCanvas(pos),
            size: createVec2({}),
        }));
    }

    private touchToOffset(pos: Vec2): Vec2 {
        const rect = this.game.canvas.getBoundingClientRect();
        const l = rect.left;
        const t = rect.top;
        return createVec2({x: pos.x - l, y: pos.y - t});
    }

    setupInputs() {
            // Mouse/touch inputs
            this.game.canvas.addEventListener('mousedown', (ev: MouseEvent) => {
                this.touchStart(createVec2({x: ev.offsetX, y: ev.offsetY}))
            });
            this.game.canvas.addEventListener('touchstart', (ev: TouchEvent) => {
                const touch = ev.changedTouches[0];
                if (touch === undefined) {
                    return;
                }
                this.touchStart(this.touchToOffset(createVec2({x: touch.clientX, y: touch.clientY})));
            });
            this.game.canvas.addEventListener('mouseup', (ev: MouseEvent) => {
                this.touchEnd(createVec2({x: ev.offsetX, y: ev.offsetY}));
            });
            this.game.canvas.addEventListener('touchend', (ev: TouchEvent) => {
                const touch = ev.changedTouches[0];
                if (touch === undefined) {
                    return;
                }
                this.touchEnd(this.touchToOffset(createVec2({x: touch.clientX, y: touch.clientY})));
            });
            this.game.canvas.addEventListener('mousemove', (ev: MouseEvent) => {
                this.touchMove(createVec2({x: ev.offsetX, y: ev.offsetY}));
            });
            this.game.canvas.addEventListener('touchmove', (ev: TouchEvent) => {
                const touch = ev.changedTouches[0];
                if (touch === undefined) {
                    return;
                }
                this.touchMove(this.touchToOffset(createVec2({x: touch.clientX, y: touch.clientY})));
                ev.preventDefault();
            });
    }

    fireTouchEvent() {
        if (this.currentClick.down) {
            this.game.physicsSystem.fireInputEvents(this.game, TouchType.TOUCHING, createOriginRect({
                origin: this.currentClick.position,
                size: createVec2({}),
            }));
        }
    }

    private setClickPos(pos: Vec2) {
        this.currentClick.position = this.game.positionOnCanvas(pos);
    }

    updateRegionStates() {
        this.regionStates.clear();
        for (const inputRegion of this.inputRegions.values()) {
            if (inputRegion.predicate(this.currentClick, this.regionStates)) {
                return;
            }
        }
    }

    onInterrupt() {
        // Call this when UI pops up to reset click status
        this.currentClick.down = false;
        this.updateRegionStates();
    }

    registerTrigger(input: Trigger, callback: () => void) {
        this.triggerMapping.get(input)?.push(callback);
    }

    isPressed(state: State): boolean {
        return this.activeStates.has(state) || this.regionStates.has(state);
    }

    clearRegions() {
        this.regionStates.clear();
    }


}