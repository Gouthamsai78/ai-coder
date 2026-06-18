import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import WordsPullUp from './WordsPullUp';
import WordsPullUpMultiStyle from './WordsPullUpMultiStyle';

// ─── Animated Letter (scroll-linked opacity) ──────────────────────
const AnimatedLetter: React.FC<{
    char: string;
    progress: ReturnType<typeof useTransform>;
    index: number;
    totalChars: number;
}> = ({ char, progress, index, totalChars }) => {
    const charProgress = index / totalChars;
    const opacity = useTransform(
        progress,
        [charProgress - 0.1, charProgress + 0.05],
        [0.2, 1]
    );

    return (
        <motion.span style={{ opacity }} className="inline">
            {char === ' ' ? '\u00A0' : char}
        </motion.span>
    );
};

// ─── Hero Section ─────────────────────────────────────────────────
const HeroSection: React.FC = () => {
    const navItems = ['Our story', 'Collective', 'Workshops', 'Programs', 'Inquiries'];

    return (
        <section className="relative h-screen p-4 md:p-6">
            <div className="relative h-full w-full overflow-hidden rounded-2xl md:rounded-[2rem]">
                {/* Background Video */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                    src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
                />

                {/* Noise Overlay */}
                <div className="noise-overlay opacity-[0.7] mix-blend-overlay pointer-events-none" />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

                {/* Navbar */}
                <nav className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-black rounded-b-2xl md:rounded-b-3xl px-4 py-2 md:px-8">
                        <div className="flex items-center gap-3 sm:gap-6 md:gap-12 lg:gap-14">
                            {navItems.map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                                    className="text-[10px] sm:text-xs md:text-sm transition-colors"
                                    style={{ color: 'rgba(225, 224, 204, 0.8)' }}
                                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#E1E0CC'; }}
                                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'rgba(225, 224, 204, 0.8)'; }}
                                >
                                    {item}
                                </a>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-8 lg:p-12">
                    <div className="grid grid-cols-12 gap-4 items-end">
                        {/* Heading - 8 columns */}
                        <div className="col-span-12 lg:col-span-8">
                            <WordsPullUp
                                text="Prisma"
                                className="text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw] font-medium leading-[0.85] tracking-[-0.07em]"
                                style={{ color: '#E1E0CC' }}
                                showAsterisk
                            />
                        </div>

                        {/* Description + Button - 4 columns */}
                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 pb-4">
                            <motion.p
                                className="text-primary/70 text-xs sm:text-sm md:text-base leading-[1.2]"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            >
                                Prisma is a worldwide network of visual artists, filmmakers and storytellers bound not by place, status or labels but by passion and hunger to unlock potential through our unique perspectives.
                            </motion.p>

                            <motion.button
                                className="group flex items-center gap-2 bg-primary text-black rounded-full pl-5 pr-1 py-1 font-medium text-sm sm:text-base w-fit"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ gap: '0.75rem' }}
                            >
                                Join the lab
                                <span className="flex items-center justify-center bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform">
                                    <ArrowRight className="w-4 h-4 text-primary" />
                                </span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// ─── About Section ────────────────────────────────────────────────
const AboutSection: React.FC = () => {
    const textRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: textRef,
        offset: ['start 0.8', 'end 0.2'],
    });

    const bodyText = "Over the last seven years, I have worked with Parallax, a Berlin-based production house that crafts cinema, series, and Noir Studio in Paris. Together, we have created work that has earned international acclaim at several major festivals.";

    return (
        <section id="our-story" className="bg-black py-16 md:py-24 px-4 md:px-6">
            <div className="max-w-6xl mx-auto bg-[#101010] rounded-2xl md:rounded-3xl p-8 md:p-12 lg:p-16 text-center">
                {/* Label */}
                <p className="text-primary text-[10px] sm:text-xs mb-6 md:mb-8">Visual arts</p>

                {/* Multi-style heading */}
                <WordsPullUpMultiStyle
                    segments={[
                        { text: 'I am Marcus Chen,', className: 'font-normal' },
                        { text: 'a self-taught director.', className: 'italic font-serif' },
                        { text: 'I have skills in color grading, visual effects, and narrative design.', className: 'font-normal' },
                    ]}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl max-w-3xl leading-[0.95] sm:leading-[0.9] mb-8 md:mb-12"
                    style={{ color: '#DEDBC8' }}
                />

                {/* Body text with scroll-linked opacity */}
                <div ref={textRef} className="max-w-3xl mx-auto">
                    <p className="text-[#DEDBC8] text-xs sm:text-sm md:text-base leading-relaxed">
                        {bodyText.split('').map((char, i) => (
                            <AnimatedLetter
                                key={i}
                                char={char}
                                progress={scrollYProgress}
                                index={i}
                                totalChars={bodyText.length}
                            />
                        ))}
                    </p>
                </div>
            </div>
        </section>
    );
};

// ─── Feature Card ─────────────────────────────────────────────────
interface FeatureCardProps {
    index: number;
    number: string;
    title: string;
    icon?: string;
    video?: string;
    items?: string[];
    isInView: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ index, number, title, icon, video, items, isInView }) => {
    if (video) {
        return (
            <motion.div
                className="relative overflow-hidden rounded-xl md:rounded-2xl group cursor-pointer"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{
                    duration: 0.6,
                    delay: index * 0.15,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                    src={video}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <p className="text-sm md:text-base font-medium" style={{ color: '#E1E0CC' }}>{title}</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="bg-[#212121] rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col justify-between group cursor-pointer"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{
                duration: 0.6,
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1],
            }}
        >
            <div>
                {icon && (
                    <img
                        src={icon}
                        alt={title}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded mb-4 md:mb-6 object-cover"
                    />
                )}
                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-primary text-xs sm:text-sm font-medium">{number}</span>
                    <h3 className="text-sm sm:text-base md:text-lg font-medium" style={{ color: '#E1E0CC' }}>{title}</h3>
                </div>
                {items && (
                    <ul className="space-y-2">
                        {items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span className="text-gray-400 text-xs sm:text-sm">{item}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="mt-4 md:mt-6 flex items-center gap-2 text-primary text-xs sm:text-sm font-medium group-hover:gap-3 transition-all">
                Learn more
                <ArrowRight className="w-4 h-4 -rotate-45" />
            </div>
        </motion.div>
    );
};

// ─── Features Section ─────────────────────────────────────────────
const FeaturesSection: React.FC = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    const features = [
        {
            number: '01',
            title: 'Project Storyboard.',
            video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4',
        },
        {
            number: '02',
            title: 'Smart Critiques.',
            icon: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=1280&q=85',
            items: [
                'AI-powered scene analysis',
                'Real-time creative notes',
                'Seamless tool integrations',
                'Version-aware feedback',
            ],
        },
        {
            number: '03',
            title: 'Immersion Capsule.',
            icon: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171741_ed9845ab-f5b2-4018-8ce7-07cc01823522.png&w=1280&q=85',
            items: [
                'Smart notification silencing',
                'Adaptive ambient soundscapes',
                'Calendar & schedule syncing',
                'Focus mode automation',
            ],
        },
        {
            number: '04',
            title: 'Creative Canvas.',
            icon: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171809_f56666dc-c099-4778-ad82-9ad4f209567b.png&w=1280&q=85',
            items: [
                'Multi-layer compositing',
                'Color grading presets',
                'Motion tracking tools',
                'Export to any format',
            ],
        },
    ];

    return (
        <section className="relative min-h-screen bg-black py-16 md:py-24 px-4 md:px-6">
            {/* Noise Background */}
            <div className="absolute inset-0 bg-noise opacity-[0.15] pointer-events-none" />

            <div ref={ref} className="relative z-10 max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <WordsPullUpMultiStyle
                        segments={[
                            { text: 'Studio-grade workflows for visionary creators.' },
                        ]}
                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal mb-2"
                        style={{ color: '#DEDBC8' }}
                    />
                    <WordsPullUpMultiStyle
                        segments={[
                            { text: 'Built for pure vision. Powered by art.' },
                        ]}
                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-gray-500"
                    />
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-2 md:gap-1 lg:h-[480px]">
                    {features.map((feature, i) => (
                        <FeatureCard
                            key={feature.number}
                            index={i}
                            number={feature.number}
                            title={feature.title}
                            icon={feature.icon}
                            video={feature.video}
                            items={feature.items}
                            isInView={isInView}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

// ─── Main Prisma Landing ──────────────────────────────────────────
const PrismaLanding: React.FC = () => {
    return (
        <div className="prisma-font bg-black min-h-screen overflow-x-hidden">
            <HeroSection />
            <AboutSection />
            <FeaturesSection />
        </div>
    );
};

export default PrismaLanding;
