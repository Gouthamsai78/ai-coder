import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface WordsPullUpProps {
    text: string;
    className?: string;
    showAsterisk?: boolean;
    style?: React.CSSProperties;
}

const WordsPullUp: React.FC<WordsPullUpProps> = ({ text, className = '', showAsterisk = false, style }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const words = text.split(' ');

    return (
        <div ref={ref} className={`flex flex-wrap ${className}`} style={style}>
            {words.map((word, i) => (
                <span key={i} className="inline-flex overflow-hidden">
                    <motion.span
                        className="inline-block"
                        initial={{ y: 20, opacity: 0 }}
                        animate={isInView ? { y: 0, opacity: 1 } : {}}
                        transition={{
                            y: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.4, delay: i * 0.08 },
                        }}
                    >
                        {showAsterisk && i === words.length - 1 ? (
                            <>
                                {word.slice(0, -1)}
                                <span className="relative">
                                    {word.slice(-1)}
                                    <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
                                </span>
                            </>
                        ) : (
                            word
                        )}
                    </motion.span>
                    {i < words.length - 1 && <span>&nbsp;</span>}
                </span>
            ))}
        </div>
    );
};

export default WordsPullUp;
