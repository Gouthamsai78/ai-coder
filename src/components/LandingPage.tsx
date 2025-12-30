import React, { useRef, useState, useEffect } from 'react';
import Hero from './ui/animated-shader-hero';
import {
    Sparkles,
    Play,
    Terminal,
    Lock,
    Zap,
    Code2,
    Shield,
    Key,
    MessageSquare,
    Eye,
    Rocket,
    Github,
    ArrowRight
} from 'lucide-react';

// Scroll Animation Hook
const useScrollAnimation = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1, rootMargin: '50px' }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return { ref, isVisible };
};

// Magnetic Link Component
const MagneticLink: React.FC<{ href: string; children: React.ReactNode; className?: string }> = ({ href, children, className = "" }) => {
    const linkRef = useRef<HTMLAnchorElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!linkRef.current) return;
        const rect = linkRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        setPosition({ x: x * 0.3, y: y * 0.3 });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <a
            ref={linkRef}
            href={href}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            className={`inline-block transition-transform duration-200 ease-out ${className}`}
        >
            {children}
        </a>
    );
};

// Typing Code Component
const TypingCode: React.FC = () => {
    const [text, setText] = useState('');
    const fullText = `const App = () => {
  // AI generating...
  return (
    <Dashboard />
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
            className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 transition-colors hover:bg-white/10 ${className}`}
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

// Animated Step Component
const AnimatedStep: React.FC<{ number: number; title: string; description: string; icon: React.ReactNode; delay: number }> = ({ number, title, description, icon, delay }) => {
    const { ref, isVisible } = useScrollAnimation();

    return (
        <div
            ref={ref}
            className={`flex flex-col items-center text-center scroll-animate ${isVisible ? 'animate' : ''}`}
            style={{ animationDelay: `${delay}s` }}
        >
            <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                    {icon}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-black">
                    {number}
                </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-sm max-w-xs">{description}</p>
        </div>
    );
};

// Animated Counter
const AnimatedCounter: React.FC<{ value: string; label: string; delay: number }> = ({ value, label, delay }) => {
    const { ref, isVisible } = useScrollAnimation();

    return (
        <div
            ref={ref}
            className={`text-center scroll-animate ${isVisible ? 'animate' : ''}`}
            style={{ animationDelay: `${delay}s` }}
        >
            <div className="text-4xl md:text-5xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400">
                {value}
            </div>
            <div className="text-gray-500 text-sm uppercase tracking-wider">{label}</div>
        </div>
    );
};

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    const featuresAnimation = useScrollAnimation();
    const ctaAnimation = useScrollAnimation();

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
            <section
                ref={featuresAnimation.ref}
                className={`relative z-10 -mt-10 md:-mt-20 pb-12 md:pb-24 px-4 md:px-6 scroll-animate ${featuresAnimation.isVisible ? 'animate' : ''}`}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 stagger-children">

                        {/* Card 1: AI Generation (Large) */}
                        <SpotlightCard className="md:col-span-2 md:row-span-2 group scroll-animate">
                            <div className="h-full flex flex-col justify-between relative overflow-hidden">
                                <div>
                                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6">
                                        <Code2 className="text-orange-400 w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Generative UI System</h3>
                                    <p className="text-gray-400 max-w-lg text-base md:text-lg">
                                        Our advanced AI understands design intent. Describe a "modern dark mode dashboard" and watch it generate layout, typography, and interactivity in seconds.
                                    </p>
                                </div>

                                {/* Mock UI Animation */}
                                <div className="mt-8 relative h-48 md:h-64 bg-black/50 rounded-xl border border-white/5 overflow-hidden font-mono text-sm text-gray-300 p-4">
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
                        <SpotlightCard className="scroll-animate scroll-delay-100">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                                <Play className="text-blue-400 w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-white mb-2">Live Preview</h3>
                            <p className="text-sm md:text-base text-gray-400">
                                See changes instantly. The built-in preview engine renders components in real-time.
                            </p>
                        </SpotlightCard>

                        {/* Card 3: Deploy */}
                        <SpotlightCard className="scroll-animate scroll-delay-200">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                                <Zap className="text-green-400 w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-white mb-2">Instant Deploy</h3>
                            <p className="text-sm md:text-base text-gray-400">
                                Ship to production in one click. We handle hosting via GitHub Gist.
                            </p>
                        </SpotlightCard>

                        {/* Card 4: Security (Wide) */}
                        <SpotlightCard className="md:col-span-3 scroll-animate scroll-delay-300">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="flex-1">
                                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                                        <Lock className="text-purple-400 w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Enterprise-Grade Security</h3>
                                    <p className="text-gray-400">
                                        Your code belongs to you. Everything runs in your browser. Your API keys stay local. No data is stored on our servers.
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
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-black via-black/95 to-black">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
                        <p className="text-gray-400 max-w-xl mx-auto">Three simple steps to go from idea to deployed app</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
                        <AnimatedStep
                            number={1}
                            title="Describe Your App"
                            description="Type what you want to build in plain English. The AI understands context, design patterns, and best practices."
                            icon={<MessageSquare className="w-7 h-7 text-orange-400" />}
                            delay={0.1}
                        />
                        <AnimatedStep
                            number={2}
                            title="Watch It Build"
                            description="See your code generate in real-time with live preview. Edit, refine, and iterate with conversational AI."
                            icon={<Eye className="w-7 h-7 text-blue-400" />}
                            delay={0.2}
                        />
                        <AnimatedStep
                            number={3}
                            title="Deploy Instantly"
                            description="One click to deploy via GitHub Gist. Share your creation with the world in seconds."
                            icon={<Rocket className="w-7 h-7 text-green-400" />}
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 md:py-24 px-4 md:px-6 border-y border-white/5">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <AnimatedCounter value="100%" label="Free to Use" delay={0.1} />
                        <AnimatedCounter value="<1s" label="Preview Speed" delay={0.2} />
                        <AnimatedCounter value="1-Click" label="Deploy" delay={0.3} />
                        <AnimatedCounter value="∞" label="Possibilities" delay={0.4} />
                    </div>
                </div>
            </section>

            {/* Marquee Section */}
            <section className="py-16 md:py-24 overflow-hidden">
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
            </section>

            {/* CTA Section */}
            <section
                ref={ctaAnimation.ref}
                className={`py-20 md:py-32 px-4 md:px-6 scroll-animate ${ctaAnimation.isVisible ? 'animate' : ''}`}
            >
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Ready to Build at <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400">Lightning Speed</span>?
                    </h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
                        Join developers who are shipping faster with AI-powered coding. No credit card required, no sign up needed.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={onGetStarted}
                            className="group relative inline-flex h-14 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black"
                        >
                            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#ff6b35_0%,#9333ea_50%,#ff6b35_100%)]" />
                            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-black px-8 py-1 text-base font-semibold text-white backdrop-blur-3xl transition-all hover:bg-black/80 gap-2">
                                Start Building Now
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                        <MagneticLink
                            href="https://github.com/goutham-sai"
                            className="inline-flex h-14 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 text-base font-medium text-white hover:bg-white/10 transition-colors gap-2"
                        >
                            <Github className="w-5 h-5" />
                            View on GitHub
                        </MagneticLink>
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
                                Empowering developers to build the future, faster. The world's first truly agentic coding platform.
                            </p>
                        </div>
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <h4 className="text-white font-bold mb-4 md:mb-6">Product</h4>
                            <ul className="space-y-3 md:space-y-4 text-gray-400 text-sm md:text-base">
                                <li><MagneticLink href="#" className="hover:text-white transition-colors">Features</MagneticLink></li>
                                <li><MagneticLink href="#" className="hover:text-white transition-colors">Integrations</MagneticLink></li>
                                <li><MagneticLink href="#" className="hover:text-white transition-colors">Pricing</MagneticLink></li>
                                <li><MagneticLink href="#" className="hover:text-white transition-colors">Changelog</MagneticLink></li>
                            </ul>
                        </div>
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <h4 className="text-white font-bold mb-4 md:mb-6">Connect</h4>
                            <ul className="space-y-3 md:space-y-4 text-gray-400 text-sm md:text-base">
                                <li><MagneticLink href="https://github.com/goutham-sai" className="hover:text-white transition-colors">GitHub</MagneticLink></li>
                                <li><MagneticLink href="#" className="hover:text-white transition-colors">Twitter</MagneticLink></li>
                                <li><MagneticLink href="#" className="hover:text-white transition-colors">Discord</MagneticLink></li>
                                <li><MagneticLink href="https://github.com/goutham-sai" className="hover:text-white transition-colors">Contact</MagneticLink></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-xs md:text-sm text-gray-600 gap-4 md:gap-0">
                        <p>© 2025 AI Coder by Goutham Sai. All rights reserved.</p>
                        <div className="flex gap-8">
                            <MagneticLink href="#" className="hover:text-gray-400">Privacy Policy</MagneticLink>
                            <MagneticLink href="#" className="hover:text-gray-400">Terms of Service</MagneticLink>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
