import { ArrowRight, Play, MessageCircle } from 'lucide-react';
import MagneticButton from './shared/MagneticButton';
import { analytics } from '../../utils/analytics';

interface CTASectionProps {
    onGetStarted: () => void;
}

const YOUTUBE_VIDEO_URL = 'https://youtu.be/oLGHMdPOyzg?si=2SZbezYZ8nRJiKaG';
const WHATSAPP_URL = 'https://chat.whatsapp.com/KywQwl2CXFmBSDHIau12Cb';

const CTASection: React.FC<CTASectionProps> = ({ onGetStarted }) => {
    return (
        <section className="relative py-20 md:py-28 px-4 md:px-6 overflow-hidden">
            <div className="absolute inset-0 bg-dot-pattern opacity-20 pointer-events-none" />
            <div className="max-w-4xl mx-auto text-center relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                    Ready to Build at{' '}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400">
                        Lightning Speed
                    </span>
                    ?
                </h2>
                <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
                    Join developers who are shipping faster with AI-powered coding. 100% free — just bring your free API key.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <MagneticButton
                        onClick={onGetStarted}
                        className="group relative inline-flex h-14 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black"
                    >
                        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#ff6b35_0%,#9333ea_50%,#ff6b35_100%)]" />
                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-black px-8 py-1 text-base font-semibold text-white backdrop-blur-3xl transition-all hover:bg-black/80 gap-2">
                            Start Building Now
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </MagneticButton>
                    <MagneticButton
                        onClick={() => {
                            analytics.track('see_how_it_works_clicked', { source: 'cta' });
                            window.open(YOUTUBE_VIDEO_URL, '_blank', 'noopener,noreferrer');
                        }}
                        className="inline-flex h-14 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 text-base font-medium text-white hover:bg-white/10 transition-colors gap-2"
                    >
                        <Play className="w-5 h-5 text-red-500" />
                        See How It Works
                    </MagneticButton>
                </div>

                {/* Community CTA */}
                <div className="mt-8">
                    <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-green-500/30 bg-green-500/10 text-sm text-green-400 hover:bg-green-500/20 transition-colors"
                        onClick={() => analytics.track('whatsapp_clicked', { source: 'cta' })}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Join 100+ developers on WhatsApp
                    </a>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
