import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { Rocket, Cpu, Search, MessageSquare } from 'lucide-react';
import SectionHeader from './shared/SectionHeader';

const changelog = [
    {
        date: 'June 2026',
        title: 'One-click Deploy',
        description: 'Deploy your generated site instantly to a hosted URL. No configuration needed.',
        icon: <Rocket className="w-5 h-5" />,
        color: 'text-green-400',
        bg: 'bg-green-500/10',
    },
    {
        date: 'June 2026',
        title: 'Free AI Models',
        description: 'All models are now free. No paid API keys required — just bring your free key.',
        icon: <Cpu className="w-5 h-5" />,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
    },
    {
        date: 'June 2026',
        title: 'SEO Optimization',
        description: 'Auto-generated meta tags, sitemap, and robots.txt for every deployed site.',
        icon: <Search className="w-5 h-5" />,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
    },
    {
        date: 'June 2026',
        title: 'Feedback System',
        description: 'Roast us! Send feedback directly from the app. We read every message.',
        icon: <MessageSquare className="w-5 h-5" />,
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
    },
];

const ChangelogSection: React.FC = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section className="relative py-20 md:py-28 px-4 md:px-6 bg-gradient-to-b from-black via-black/95 to-black">
            <div className="absolute inset-0 bg-dot-pattern opacity-20 pointer-events-none" />
            <div className="max-w-4xl mx-auto relative z-10" ref={ref}>
                <SectionHeader
                    title="What's New"
                    subtitle="Recent updates and improvements"
                />

                <div className="space-y-6">
                    {changelog.map((entry, i) => (
                        <div
                            key={entry.title}
                            className="flex gap-4 md:gap-6 items-start"
                            style={{
                                opacity: isInView ? 1 : 0,
                                transform: isInView ? 'translateY(0)' : 'translateY(20px)',
                                transition: `all 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.1}s`,
                            }}
                        >
                            {/* Timeline dot */}
                            <div className="flex flex-col items-center shrink-0">
                                <div className={`w-10 h-10 rounded-xl ${entry.bg} flex items-center justify-center ${entry.color}`}>
                                    {entry.icon}
                                </div>
                                {i < changelog.length - 1 && (
                                    <div className="w-px h-full min-h-[40px] bg-white/10 mt-2" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="pb-8">
                                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{entry.date}</p>
                                <h3 className="text-lg font-bold text-white mb-1">{entry.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{entry.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ChangelogSection;
