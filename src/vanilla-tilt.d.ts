declare module 'vanilla-tilt' {
    export default class VanillaTilt {
        static init(element: HTMLElement | HTMLElement[], options?: Record<string, unknown>): void;
        destroy(): void;
    }
}
