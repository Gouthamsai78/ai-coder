declare module 'vanilla-tilt' {
    export default class VanillaTilt {
        static init(element: HTMLElement | HTMLElement[], options?: any): void;
        destroy(): void;
    }
}
