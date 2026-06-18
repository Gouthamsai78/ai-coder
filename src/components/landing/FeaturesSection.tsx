import { useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { Bot, Zap, GitCompare, Search, BarChart3, Rocket } from 'lucide-react';
import SectionHeader from './shared/SectionHeader';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
    index: number;
    isInView: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, gradient, index, isInView }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative group rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-white/20"
            style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
                transition: `all 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.1}s`,
            }}
        >
            {/* Spotlight effect */}
            <div
                className="pointer-events-none absolute -inset-px transition duration-300"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,182,255,0.1) 0%, transparent 40%)`,
                }}
            />

            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-5`}>
                    {icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
            </div>
        </div>
    );
};

const FeaturesSection: React.FC = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    const features = [
        {
            icon: <Bot className="w-6 h-6 text-blue-400" />,
            title: 'Multi-Provider AI',
            description: 'Switch between Google Gemini, Claude, and GPT-4 with one click. Use the best model for your task.',
            gradient: 'bg-blue-500/20',
        },
        {
            icon: <Zap className="w-6 h-6 text-yellow-400" />,
            title: 'Real-Time Streaming',
            description: 'Watch code appear in the editor as AI generates it. No waiting, no loading screens.',
            gradient: 'bg-yellow-500/20',
        },
        {
            icon: <GitCompare className="w-6 h-6 text-emerald-400" />,
            title: 'Smart Diff Review',
            description: 'See exactly what changed with visual diffs. Apply or reject AI modifications before they take effect.',
            gradient: 'bg-emerald-500/20',
        },
        {
            icon: <Search className="w-6 h-6 text-purple-400" />,
            title: 'Web Search Integration',
            description: 'AI searches the web for latest library versions, API docs, and best practices before generating code.',
            gradient: 'bg-purple-500/20',
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-rose-400" />,
            title: 'SEO-Aware Generation',
            description: 'Auto-generates meta tags, Open Graph, sitemap.xml, and robots.txt for search engine optimization.',
            gradient: 'bg-rose-500/20',
        },
        {
            icon: <Rocket className="w-6 h-6 text-orange-400" />,
            title: 'One-Click Deploy',
            description: 'Deploy to a hosted URL, CodePen, or GitHub Gist instantly. Share your creation with the world.',
            gradient: 'bg-orange-500/20',
        },
    ];

    return (
        <section id="features" className="relative py-20 md:py-32 px-4 md:px-6 bg-black">
            <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none" />
            <div className="max-w-7xl mx-auto relative z-10" ref={ref}>
                <SectionHeader
                    title="Everything you need to build"
                    subtitle="A complete AI-powered development environment in your browser. No installs. No config. Just code."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {features.map((feature, i) => (
                        <FeatureCard
                            key={feature.title}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.description}
                            gradient={feature.gradient}
                            index={i}
                            isInView={isInView}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
