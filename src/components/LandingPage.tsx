import React, { useRef, useState, useEffect } from 'react';
import Hero from './ui/animated-shader-hero';
import {
    Sparkles,
    ArrowRight,
    Play,
    Terminal,
    Lock,
    Zap,
    Code2,
    Shield,
    Key
} from 'lucide-react';

// Typing Code Component
const TypingCode: React.FC = () => {
    const [text, setText] = useState('');
    const fullText = `const App = () => {
  // Generating component...
  return (
    <div className="hero">
      Hello World
    </div>
  );
}`;

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex <= fullText.length) {
                setText(fullText.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 50);

        return () => clearInterval(interval);
    }, []);

    return (
        <pre className="font-mono text-sm text-gray-300 p-4 overflow-hidden">
            <code>{text}</code>
            <span className="animate-pulse inline-block w-2 h-4 bg-orange-500 ml-1 align-middle"></span>
        </pre>
    );
};

// Spotlight Card Component
const SpotlightCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10 ${className}`}
        >
            <div
                className="pointer-events-none absolute -inset-px transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,182,255,0.1) 0%, transparent 40%)`
                }}
            />
            <div className="relative z-10">{children}</div>
        </div>
    );
};

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    return (
        <div className="relative bg-black min-h-screen selection:bg-orange-500/30">
            <Hero
                trustBadge={{
                    text: "Free & Open Source AI Coding Assistant",
                    icons: [<Sparkles key="sparkle" className="w-4 h-4 text-yellow-300" />]
                }}
                headline={{
                    line1: "Code at the",
                    line2: "Speed of Thought"
                }}
                subtitle="Transform plain English into production-ready full-stack applications. No boilerplate. No setup. Just describe what you want and watch AI build it."
                buttons={{
                    primary: {
                        text: "Start Building Free",
                        onClick: onGetStarted
                    },
                    secondary: {
                        text: "Watch Demo",
                        onClick: () => console.log('Demo clicked')
                    }
                }}
            />

            {/* Features Bento Grid */}
            <section className="relative z-10 -mt-10 md:-mt-20 pb-12 md:pb-24 px-4 md:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                        {/* Card 1: AI Generation (Large) */}
                        <SpotlightCard className="md:col-span-2 md:row-span-2 group">
                            <div className="h-full flex flex-col justify-between relative overflow-hidden">
                                <div>
                                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6">
                                        <Code2 className="text-orange-400 w-6 h-6" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-4">Generative UI System</h3>
                                    <p className="text-gray-400 max-w-lg text-lg">
                                        Our advanced AI understands design intent. Describe a "modern dark mode dashboard" and watch it generate layout, typography, and interactivity in seconds.
                                    </p>
                                </div>

                                {/* Mock UI Animation */}
                                <div className="mt-8 relative h-64 bg-black/50 rounded-xl border border-white/5 overflow-hidden font-mono text-sm text-gray-300 p-4">
                                    <div className="absolute top-0 left-0 w-full h-8 bg-white/5 flex items-center px-4 gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                    </div>
                                    <div className="pt-8 opacity-50 group-hover:opacity-100 transition-opacity duration-500 h-full">
                                        <TypingCode />
                                    </div>
                                </div>
                            </div>
                        </SpotlightCard>

                        {/* Card 2: Live Preview */}
                        <SpotlightCard>
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                                <Play className="text-blue-400 w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-white mb-2">Live Preview</h3>
                            <p className="text-sm md:text-base text-gray-400">
                                See changes instantly. The built-in preview engine renders React components in real-time.
                            </p>
                        </SpotlightCard>

                        {/* Card 3: Deploy */}
                        <SpotlightCard>
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                                <Zap className="text-green-400 w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-white mb-2">Instant Deploy</h3>
                            <p className="text-sm md:text-base text-gray-400">
                                Ship to production in one click. We handle the build pipeline and hosting.
                            </p>
                        </SpotlightCard>

                        {/* Card 4: Security (Wide) */}
                        <SpotlightCard className="md:col-span-3">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="flex-1">
                                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                                        <Lock className="text-purple-400 w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-4">Enterprise-Grade Security</h3>
                                    <p className="text-gray-400">
                                        Your code belongs to you. We process everything locally in your browser where possible, and use secure, encrypted channels for AI inference. No data is used to train our models.
                                    </p>
                                </div>
                                <div className="flex-1 w-full relative h-32 md:h-full min-h-[120px] bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl border border-white/5 flex items-center justify-center">
                                    <div className="flex gap-8 opacity-50">
                                        <Lock className="w-8 h-8 text-white/20" />
                                        <Shield className="w-8 h-8 text-white/20" />
                                        <Key className="w-8 h-8 text-white/20" />
                                    </div>
                                </div>
                            </div>
                        </SpotlightCard>
                    </div>

                    {/* Infinite Marquee */}
                    <div className="mt-16 md:mt-32">
                        <p className="text-center text-gray-500 text-xs md:text-sm font-medium tracking-wider uppercase mb-6 md:mb-8">Trusted by developers from</p>
                        <div className="relative flex overflow-x-hidden group">
                            <div className="animate-marquee whitespace-nowrap flex gap-8 md:gap-16 text-gray-600 font-bold text-lg md:text-2xl uppercase tracking-widest opacity-30">
                                <span>Google</span>
                                <span>Meta</span>
                                <span>Netflix</span>
                                <span>Vercel</span>
                                <span>Amazon</span>
                                <span>Microsoft</span>
                                <span>Stripe</span>
                                <span>Uber</span>
                            </div>
                            <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex gap-8 md:gap-16 text-gray-600 font-bold text-lg md:text-2xl uppercase tracking-widest opacity-30">
                                <span>Google</span>
                                <span>Meta</span>
                                <span>Netflix</span>
                                <span>Vercel</span>
                                <span>Amazon</span>
                                <span>Microsoft</span>
                                <span>Stripe</span>
                                <span>Uber</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-black pt-12 md:pt-24 pb-8 md:pb-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
                        <div className="col-span-1 md:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
                            <div className="flex items-center gap-2 mb-4 md:mb-6">
                                <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                                    <Terminal className="text-black w-4 h-4" />
                                </div>
                                <span className="text-xl font-bold text-white">AI Coder</span>
                            </div>
                            <p className="text-gray-400 max-w-sm text-sm md:text-base">
                                Empowering developers to build the future, faster. The world's first truly agentic coding platform component.
                            </p>
                        </div>
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <h4 className="text-white font-bold mb-4 md:mb-6">Product</h4>
                            <ul className="space-y-3 md:space-y-4 text-gray-400 text-sm md:text-base">
                                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                            </ul>
                        </div>
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <h4 className="text-white font-bold mb-4 md:mb-6">Company</h4>
                            <ul className="space-y-3 md:space-y-4 text-gray-400 text-sm md:text-base">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="https://github.com/goutham-sai" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-xs md:text-sm text-gray-600 gap-4 md:gap-0">
                        <p>© 2025 AI Coder. All rights reserved.</p>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-gray-400">Privacy Policy</a>
                            <a href="#" className="hover:text-gray-400">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
