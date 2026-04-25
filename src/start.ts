import {Game} from './game.js';

const main = (): void => {
    console.log('Main');
    window.addEventListener('load', onLoad);
};

const onLoad = (): void => {
    console.log('onLoad');
    const game = new Game();
};

main();
