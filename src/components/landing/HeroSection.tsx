import { Sparkles } from 'lucide-react';
import Hero from '../ui/animated-shader-hero';
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
        />
    );
};

export default HeroSection;
