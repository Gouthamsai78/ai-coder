import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface TextSegment {
    text: string;
    className?: string;
}

interface WordsPullUpMultiStyleProps {
    segments: TextSegment[];
    className?: string;
    style?: React.CSSProperties;
}

const WordsPullUpMultiStyle: React.FC<WordsPullUpMultiStyleProps> = ({ segments, className = '', style }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    // Flatten all segments into individual words with their styles
    const allWords: { word: string; className: string; index: number }[] = [];
    let globalIndex = 0;

    for (const segment of segments) {
        const words = segment.text.split(' ');
        for (const word of words) {
            allWords.push({
                word,
                className: segment.className || '',
                index: globalIndex,
            });
            globalIndex++;
        }
    }

    return (
        <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`} style={style}>
            {allWords.map((item) => (
                <span key={item.index} className="inline-flex overflow-hidden">
                    <motion.span
                        className={`inline-block ${item.className}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={isInView ? { y: 0, opacity: 1 } : {}}
                        transition={{
                            y: { duration: 0.5, delay: item.index * 0.08, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.4, delay: item.index * 0.08 },
                        }}
                    >
                        {item.word}
                    </motion.span>
                    <span>&nbsp;</span>
                </span>
            ))}
        </div>
    );
};

export default WordsPullUpMultiStyle;
