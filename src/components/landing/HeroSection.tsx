import { Sparkles, Zap, Bug } from 'lucide-react';
import Hero from '../ui/animated-shader-hero';
import { AnimatedShinyText } from '../ui/animated-shiny-text';
import { analytics } from '../../utils/analytics';

interface HeroSectionProps {
    onGetStarted: () => void;
}

const YOUTUBE_VIDEO_URL = 'https://youtu.be/oLGHMdPOyzg?si=2SZbezYZ8nRJiKaG';

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
    return (
        <Hero
            trustBadge={{
                text: 'Free & Open Source AI Coding Assistant',
                icons: [<Sparkles key="sparkle" className="w-4 h-4 text-yellow-300" />],
            }}
            headline={{
                line1: 'Code at the',
                line2: 'Speed of Thought',
            }}
            subtitle="Transform plain English into production-ready full-stack applications. No boilerplate. No account needed. Just describe what you want and watch AI build it."
            buttons={{
                primary: {
                    text: 'Start Building Free',
                    onClick: onGetStarted,
                },
                secondary: {
                    text: 'See How It Works',
                    onClick: () => {
                        analytics.track('see_how_it_works_clicked', { source: 'hero' });
                        window.open(YOUTUBE_VIDEO_URL, '_blank', 'noopener,noreferrer');
                    },
                },
            }}
        >
            <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-full">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <AnimatedShinyText className="text-xs sm:text-sm font-medium text-emerald-300" shimmerWidth={80}>
                        Gemini 3.6 Flash now default — faster, cheaper, smarter
                    </AnimatedShinyText>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-full">
                    <Bug className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs sm:text-sm font-medium text-blue-300">
                        Streaming errors fixed — all Gemini models now stable
                    </span>
                </div>
            </div>
        </Hero>
    );
};

export default HeroSection;
