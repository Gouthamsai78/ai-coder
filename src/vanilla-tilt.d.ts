declare module 'vanilla-tilt' {
    interface VanillaTiltOptions {
        max?: number;
        speed?: number;
        glare?: boolean;
        'max-glare'?: number;
        scale?: number;
        perspective?: number;
        reverse?: boolean;
        reset?: boolean;
        easing?: string;
        transition?: boolean;
        axis?: 'x' | 'y' | null;
        gyroscope?: boolean;
        gyroscopeMinAngleX?: number;
        gyroscopeMaxAngleX?: number;
        gyroscopeMinAngleY?: number;
        gyroscopeMaxAngleY?: number;
    }

    export default class VanillaTilt {
        static init(element: HTMLElement | HTMLElement[], options?: VanillaTiltOptions): void;
        destroy(): void;
    }
}
