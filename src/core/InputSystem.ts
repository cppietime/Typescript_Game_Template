import { State, Trigger } from "../data/inputs.js";

export class InputSystem {
    triggerMapping: Map<Trigger, (() => void)[]>;
    activeStates: Set<State>;

    constructor() {
        this.triggerMapping = new Map();
        this.activeStates = new Set();

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

    setupInputs() {
            // Keyboard inputs
            window.addEventListener('keydown', (ev: KeyboardEvent) => {
                switch (ev.key.toLowerCase()) {
                    case 'escape':
                        this.triggerInput(Trigger.PAUSE);
                        break;
                    
                    case 'w':
                    case 'arrowup':
                        this.setState(State.UP, true);
                        break;
                    case 'a':
                    case 'arrowleft':
                        this.setState(State.LEFT, true);
                        break;
                    case 's':
                    case 'arrowdown':
                        this.setState(State.DOWN, true);
                        break;
                    case 'd':
                    case 'arrowright':
                        this.setState(State.RIGHT, true);
                        break;
                }
            });

            window.addEventListener('keyup', (ev: KeyboardEvent) => {
                switch (ev.key.toLowerCase()) {
                    case 'w':
                    case 'arrowup':
                        this.setState(State.UP, false);
                        break;
                    case 'a':
                    case 'arrowleft':
                        this.setState(State.LEFT, false);
                        break;
                    case 's':
                    case 'arrowdown':
                        this.setState(State.DOWN, false);
                        break;
                    case 'd':
                    case 'arrowright':
                        this.setState(State.RIGHT, false);
                        break;
                }
            });
        };

    registerTrigger(input: Trigger, callback: () => void) {
        this.triggerMapping.get(input)?.push(callback);
    }

    isPressed(state: State): boolean {
        return this.activeStates.has(state);
    }
}