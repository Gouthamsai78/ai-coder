import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { MessageSquare, Code2, Rocket } from 'lucide-react';
import SectionHeader from './shared/SectionHeader';

const steps = [
    {
        number: '01',
        title: 'Describe Your App',
        description: 'Type what you want to build in plain English. The AI understands context, design patterns, and best practices.',
        icon: <MessageSquare className="w-7 h-7 text-orange-400" />,
        gradient: 'from-orange-500/20 to-purple-500/20',
    },
    {
        number: '02',
        title: 'Watch It Build',
        description: 'See your code generate in real-time with live preview. Edit, refine, and iterate with conversational AI.',
        icon: <Code2 className="w-7 h-7 text-blue-400" />,
        gradient: 'from-blue-500/20 to-cyan-500/20',
    },
    {
        number: '03',
        title: 'Deploy Instantly',
        description: 'One click to deploy to a hosted URL or CodePen. Share your creation with the world in seconds.',
        icon: <Rocket className="w-7 h-7 text-green-400" />,
        gradient: 'from-green-500/20 to-emerald-500/20',
    },
];

const HowItWorksSection: React.FC = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section className="relative py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-black via-black/95 to-black overflow-hidden">
            <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none" />
            <div className="max-w-6xl mx-auto relative z-10" ref={ref}>
                <SectionHeader
                    title="How It Works"
                    subtitle="Three simple steps to go from idea to deployed app"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {steps.map((step, i) => (
                        <div
                            key={step.number}
                            className="text-center"
                            style={{
                                opacity: isInView ? 1 : 0,
                                transform: isInView ? 'translateY(0)' : 'translateY(30px)',
                                transition: `all 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.15}s`,
                            }}
                        >
                            <div className="relative mb-6 inline-flex">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center border border-white/10`}>
                                    {step.icon}
                                </div>
                                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-black">
                                    {step.number}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
