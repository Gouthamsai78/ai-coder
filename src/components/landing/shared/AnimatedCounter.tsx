import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedCounterProps {
    value: number;
    suffix?: string;
    prefix?: string;
    label: string;
    duration?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    suffix = '',
    prefix = '',
    label,
    duration = 2000,
}) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (!isInView || hasAnimated.current) return;
        hasAnimated.current = true;

        const startTime = performance.now();
        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [isInView, value, duration]);

    return (
        <div ref={ref} className="text-center">
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400 mb-2">
                {prefix}{count}{suffix}
            </div>
            <div className="text-gray-500 text-xs sm:text-sm uppercase tracking-wider">{label}</div>
        </div>
    );
};

export default AnimatedCounter;
