import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import VanillaTilt from 'vanilla-tilt';
import {
    Terminal, Menu, X, Layers, Play, Check,
    Code2, Search, GitBranch, Bug, ArrowRight, Wand2, Rocket, Lock
} from 'lucide-react';

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const cursorDotRef = useRef<HTMLDivElement>(null);
    const cursorOutlineRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const startBtnRef = useRef<HTMLButtonElement>(null);

    // --- Custom Cursor Effect ---
    useEffect(() => {
        const cursorDot = cursorDotRef.current;
        const cursorOutline = cursorOutlineRef.current;

        if (!cursorDot || !cursorOutline) return;

        const moveCursor = (e: MouseEvent) => {
            const posX = e.clientX;
            const posY = e.clientY;

            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        };

        window.addEventListener('mousemove', moveCursor);

        // Hover effects
        const addHover = () => {
            cursorOutline.classList.add('hovered');
            cursorDot.style.transform = 'translate(-50%, -50%) scale(0.5)';
        };
        const removeHover = () => {
            cursorOutline.classList.remove('hovered');
            cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
        };

        const hoverElements = document.querySelectorAll('a, button, .hover-trigger');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', addHover);
            el.addEventListener('mouseleave', removeHover);
        });

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            hoverElements.forEach(el => {
                el.removeEventListener('mouseenter', addHover);
                el.removeEventListener('mouseleave', removeHover);
            });
        };
    }, []);

    // --- Three.js Background ---
    useEffect(() => {
        if (!canvasRef.current) return;

        // Cleanup any previous instance is handled in cleanup function below

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.002);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 20;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Neural Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 700;
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 60;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const material = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.8,
        });

        const particlesMesh = new THREE.Points(particlesGeometry, material);
        scene.add(particlesMesh);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Animation Loop
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const handleMouseMove = (event: MouseEvent) => {
            mouseX = event.clientX - window.innerWidth / 2;
            mouseY = event.clientY - window.innerHeight / 2;
        };
        document.addEventListener('mousemove', handleMouseMove);

        const clock = new THREE.Clock();
        let animationId: number;

        const animate = () => {
            // Keep clock running for consistent animation
            clock.getElapsedTime();

            targetX = mouseX * 0.001;
            targetY = mouseY * 0.001;

            particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
            particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);
            particlesMesh.rotation.z += 0.0005;

            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            document.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            // Cleanup Three.js resources
            particlesGeometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    // --- GSAP Animations ---
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero Elements
            const tl = gsap.timeline();
            tl.to('.gsap-hero', {
                y: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.1,
                ease: "power3.out"
            });
            tl.to('.gsap-hero-img', {
                y: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power2.out"
            }, "-=0.5");

            // Scroll Triggers
            gsap.utils.toArray('.tilt-card').forEach((card: any, i) => {
                gsap.from(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                    },
                    y: 50,
                    opacity: 0,
                    duration: 0.8,
                    delay: i * 0.1,
                    ease: "power3.out"
                });
            });
        }, heroRef);

        return () => ctx.revert();
    }, []);

    // --- Vanilla Tilt ---
    useEffect(() => {
        const cards = document.querySelectorAll<HTMLElement>(".tilt-card");
        VanillaTilt.init(Array.from(cards) as HTMLElement[], {
            max: 10,
            speed: 400,
            glare: true,
            "max-glare": 0.1,
            scale: 1.02
        });

        return () => {
            // Safe cleanup
            cards.forEach(card => {
                if ((card as any).vanillaTilt) {
                    (card as any).vanillaTilt.destroy();
                }
            });
        };
    }, []);

    // --- Typewriter Effect ---
    useEffect(() => {
        const codeContainer = document.getElementById('typewriter');
        if (!codeContainer) return;

        // Reset check
        if (codeContainer.innerHTML !== "") return;

        const codeLines = [
            "<span class='text-purple-400'>const</span> <span class='text-yellow-300'>SaasApp</span> = () => {",
            "  <span class='text-purple-400'>return</span> (",
            "    <span class='text-blue-400'>&lt;div</span> <span class='text-sky-300'>className</span>=<span class='text-green-300'>'hero-section'</span><span class='text-blue-400'>&gt;</span>",
            "      <span class='text-blue-400'>&lt;h1&gt;</span>Ship Faster<span class='text-blue-400'>&lt;/h1&gt;</span>",
            "      <span class='text-blue-400'>&lt;Button</span> <span class='text-sky-300'>variant</span>=<span class='text-green-300'>'primary'</span><span class='text-blue-400'>&gt;</span>",
            "        Get Started",
            "      <span class='text-blue-400'>&lt;/Button&gt;</span>",
            "    <span class='text-blue-400'>&lt;/div&gt;</span>",
            "  );",
            "};"
        ];

        let lineIndex = 0;
        let isTyping = true;

        const typeChar = () => {
            if (!isTyping) return;
            if (lineIndex < codeLines.length) {
                const currentLine = codeLines[lineIndex];
                const div = document.createElement('div');
                div.innerHTML = currentLine;
                if (codeContainer) codeContainer.appendChild(div);
                lineIndex++;
                setTimeout(typeChar, Math.random() * 200 + 50);
            } else {
                const toast = document.getElementById('success-toast');
                if (toast) {
                    toast.classList.remove('opacity-0', 'translate-y-20');
                }
            }
        };

        const timer = setTimeout(typeChar, 2000);
        return () => {
            isTyping = false;
            clearTimeout(timer);
        };
    }, []);

    // --- Magnetic Buttons ---
    useEffect(() => {
        const btns = document.querySelectorAll('.magnetic-btn');
        const handleMouseMove = (e: any) => {
            const btn = e.currentTarget;
            const position = btn.getBoundingClientRect();
            const x = e.pageX - position.left - position.width / 2;
            const y = e.pageY - position.top - position.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        };
        const handleMouseLeave = (e: any) => {
            e.currentTarget.style.transform = 'translate(0px, 0px)';
        };

        btns.forEach(btn => {
            btn.addEventListener('mousemove', handleMouseMove);
            btn.addEventListener('mouseleave', handleMouseLeave);
        });

        return () => {
            btns.forEach(btn => {
                btn.removeEventListener('mousemove', handleMouseMove);
                btn.removeEventListener('mouseleave', handleMouseLeave);
            });
        };
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div ref={heroRef} className="bg-transparent text-white min-h-screen font-sans selection:bg-[#0ea5e9]/30 selection:text-white relative overflow-x-hidden cursor-none-custom">

            {/* Custom Styles Injection */}
            <style>{`
                .cursor-dot, .cursor-outline {
                    position: fixed; top: 0; left: 0; transform: translate(-50%, -50%);
                    border-radius: 50%; z-index: 9999; pointer-events: none;
                }
                .cursor-dot { width: 8px; height: 8px; background-color: white; }
                .cursor-outline {
                    width: 40px; height: 40px; border: 1px solid rgba(255, 255, 255, 0.5);
                    transition: width 0.2s, height 0.2s, background-color 0.2s;
                }
                body:hover .cursor-outline.hovered {
                    width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.1);
                    border-color: transparent; backdrop-filter: blur(2px);
                }
                .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
                .glass-card {
                    background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
                    backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                }
                .gradient-text { background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .gradient-text-brand { background: linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .code-glow { box-shadow: 0 0 100px -20px rgba(14, 165, 233, 0.3); }
                .magnetic-btn { position: relative; overflow: hidden; }
                .magnetic-btn::after {
                    content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%);
                    opacity: 0; transition: opacity 0.3s;
                }
                .magnetic-btn:hover::after { opacity: 1; }
                
                /* Hide default cursor on desktop */
                @media (min-width: 768px) {
                    body { cursor: none; }
                    a, button { cursor: none; }
                }

                /* Mobile Optimization */
                @media (max-width: 768px) {
                    .cursor-none-custom { cursor: auto !important; }
                    .cursor-dot, .cursor-outline { display: none !important; }
                }
            `}</style>

            {/* Custom Cursor Elements */}
            <div ref={cursorDotRef} className="cursor-dot hidden md:block"></div>
            <div ref={cursorOutlineRef} className="cursor-outline hidden md:block"></div>

            {/* Three.js Background */}
            <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 opacity-70" />

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 transition-all duration-300 border-b border-white/5 bg-black/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center h-24">
                        <div className="flex items-center gap-3 group cursor-pointer hover-trigger">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] rounded-xl flex items-center justify-center shadow-lg shadow-[#0ea5e9]/20 group-hover:shadow-[#0ea5e9]/40 transition-all duration-500 group-hover:rotate-12">
                                <Terminal className="text-white w-5 h-5" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">AI Coder</span>
                        </div>

                        <div className="hidden md:flex items-center space-x-10">
                            <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hover-trigger">Features</a>
                            <a href="#how-it-works" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hover-trigger">Workflow</a>
                            <a href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hover-trigger">Pricing</a>
                            <button onClick={onGetStarted} className="magnetic-btn group relative px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover-trigger overflow-hidden">
                                <span className="relative z-10 text-sm font-semibold">Sign In</span>
                            </button>
                            <button ref={startBtnRef} onClick={onGetStarted} className="magnetic-btn group relative px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover-trigger">
                                Get Started
                            </button>
                        </div>

                        <div className="md:hidden">
                            <button onClick={toggleMenu} className="text-white p-2 hover-trigger">
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div className={`fixed inset-0 bg-black z-40 flex flex-col items-center justify-center space-y-8 transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <a href="#features" onClick={toggleMenu} className="text-2xl font-bold hover:text-[#0ea5e9]">Features</a>
                <a href="#how-it-works" onClick={toggleMenu} className="text-2xl font-bold hover:text-[#0ea5e9]">Workflow</a>
                <a href="#pricing" onClick={toggleMenu} className="text-2xl font-bold hover:text-[#0ea5e9]">Pricing</a>
                <button onClick={onGetStarted} className="px-8 py-3 bg-[#0ea5e9] text-white rounded-full text-xl font-bold">Launch App</button>
            </div>

            <main>
                {/* Hero Section */}
                <section className="min-h-screen relative flex items-center justify-center pt-28 pb-20 overflow-hidden">
                    {/* Background Gradients */}
                    <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-[#0ea5e9]/20 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-[#8b5cf6]/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
                        <div className="flex flex-col items-center text-center">

                            {/* Badge */}
                            <div className="gsap-hero opacity-0 translate-y-8 mb-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-[#0ea5e9]/20 hover:border-[#0ea5e9]/40 transition-colors cursor-default">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38bdf8] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0ea5e9]"></span>
                                    </span>
                                    <span className="text-xs font-semibold tracking-wide text-[#bae6fd]">AI MODEL V3.0 RELEASED</span>
                                </div>
                            </div>

                            {/* Main Heading */}
                            <h1 className="gsap-hero opacity-0 translate-y-8 text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8">
                                Code at the <br />
                                <span className="gradient-text-brand">Speed of Thought</span>
                            </h1>

                            {/* Subheading */}
                            <p className="gsap-hero opacity-0 translate-y-8 text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed">
                                Transform plain English into production-ready full-stack applications.
                                No boilerplate. No setup. Just ship.
                            </p>

                            {/* CTA Buttons */}
                            <div className="gsap-hero opacity-0 translate-y-8 flex flex-col sm:flex-row gap-4 w-full justify-center mb-20">
                                <button onClick={onGetStarted} className="magnetic-btn relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover-trigger min-w-[180px] flex items-center justify-center gap-2 group">
                                    Start Building
                                    <ArrowRight className="w-4 h-4 transform -rotate-45 group-hover:rotate-0 transition-transform" />
                                </button>
                                <button className="magnetic-btn relative px-8 py-4 glass text-white rounded-full font-bold text-lg hover:bg-white/10 transition-colors border-white/10 hover-trigger min-w-[180px] flex items-center justify-center gap-3">
                                    <div className="border border-white/30 rounded-full p-1.5 w-8 h-8 flex items-center justify-center">
                                        <Play className="w-3 h-3 fill-white" />
                                    </div>
                                    Watch Demo
                                </button>
                            </div>

                            {/* Editor Mockup */}
                            <div className="gsap-hero-img opacity-0 translate-y-12 w-full max-w-5xl relative perspective-1000">
                                <div className="glass-card rounded-2xl overflow-hidden border border-white/10 code-glow transform transition-transform duration-700 hover:scale-[1.01]">
                                    {/* Mockup Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40">
                                        <div className="flex space-x-2">
                                            <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                                            <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 text-[10px] font-mono text-gray-400 border border-white/5">
                                            <Lock size={10} />
                                            ai-coder-app
                                        </div>
                                        <div className="w-12"></div>
                                    </div>

                                    {/* Mockup Body */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 h-[500px] bg-black/80">
                                        {/* Sidebar */}
                                        <div className="hidden md:block col-span-1 border-r border-white/5 p-4 flex flex-col items-center gap-6 text-gray-500">
                                            <Code2 className="text-white w-5 h-5 hover-trigger" />
                                            <Search className="w-5 h-5 hover:text-white transition-colors cursor-pointer hover-trigger" />
                                            <GitBranch className="w-5 h-5 hover:text-white transition-colors cursor-pointer hover-trigger" />
                                            <Bug className="w-5 h-5 hover:text-white transition-colors cursor-pointer hover-trigger" />
                                        </div>

                                        {/* Code Area */}
                                        <div className="col-span-1 md:col-span-7 p-6 font-mono text-sm leading-relaxed text-gray-300 relative overflow-hidden text-left">
                                            {/* Typing Animation */}
                                            <div id="typewriter" className="whitespace-pre-wrap"></div>
                                            <span className="animate-pulse inline-block w-2 h-5 bg-[#0ea5e9] ml-1 align-middle"></span>

                                            {/* Floating Success Toast */}
                                            <div id="success-toast" className="absolute bottom-8 right-8 glass px-4 py-3 rounded-xl flex items-center gap-3 border-l-4 border-green-500 transform translate-y-20 opacity-0 transition-all duration-500">
                                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                                    <Check size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-white">Build Complete</div>
                                                    <div className="text-[10px] text-gray-400">Deployed to production in 1.2s</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preview Area */}
                                        <div className="col-span-1 md:col-span-4 border-l border-white/5 bg-[#050505] p-6 flex flex-col">
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Live Preview</div>
                                            {/* Interactive Preview Elements */}
                                            <div className="flex-1 flex flex-col gap-4">
                                                {/* Chart */}
                                                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                                                    <div className="flex justify-between items-end h-24 gap-2">
                                                        <div className="w-full bg-[#0ea5e9]/20 rounded-t h-[40%] animate-pulse"></div>
                                                        <div className="w-full bg-[#0ea5e9]/40 rounded-t h-[70%] animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                                                        <div className="w-full bg-[#0ea5e9]/80 rounded-t h-[50%] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                                        <div className="w-full bg-[#0ea5e9] rounded-t h-[90%] animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                                                    </div>
                                                </div>
                                                {/* Stats */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                                        <div className="text-[10px] text-gray-500">Revenue</div>
                                                        <div className="text-lg font-bold text-white">$24,500</div>
                                                    </div>
                                                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                                        <div className="text-[10px] text-gray-500">Users</div>
                                                        <div className="text-lg font-bold text-white">+12%</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="mt-4 w-full py-2 bg-[#0284c7] hover:bg-[#0ea5e9] text-white rounded-lg text-xs font-bold transition-colors hover-trigger">
                                                Deploy App
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-32 relative">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-20">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">
                                Built for <span className="gradient-text-brand">Builders.</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Card 1 */}
                            <div className="tilt-card glass-card p-8 rounded-3xl group hover-trigger cursor-pointer h-full border border-white/5">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#0ea5e9]/20 to-[#0ea5e9]/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 border border-[#0ea5e9]/10">
                                    <Layers className="text-[#38bdf8] w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 group-hover:text-[#38bdf8] transition-colors">Component Library</h3>
                                <p className="text-gray-400 leading-relaxed mb-8">
                                    Access thousands of pre-built, accessible components. From complex data tables to animated charts.
                                </p>
                                <div className="mt-auto flex items-center gap-2 text-sm font-bold text-[#38bdf8] opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all">
                                    Explore Components <ArrowRight size={14} />
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="tilt-card glass-card p-8 rounded-3xl group hover-trigger cursor-pointer h-full border border-white/5">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#8b5cf6]/20 to-[#8b5cf6]/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 border border-[#8b5cf6]/10">
                                    <Wand2 className="text-[#a78bfa] w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 group-hover:text-[#a78bfa] transition-colors">Smart Refactoring</h3>
                                <p className="text-gray-400 leading-relaxed mb-8">
                                    "Make the header sticky and change the font to Inter." Context-aware updates that understand your codebase.
                                </p>
                                <div className="mt-auto flex items-center gap-2 text-sm font-bold text-[#a78bfa] opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all">
                                    See Magic <ArrowRight size={14} />
                                </div>
                            </div>

                            {/* Card 3 */}
                            <div className="tilt-card glass-card p-8 rounded-3xl group hover-trigger cursor-pointer h-full border border-white/5">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 border border-emerald-500/10">
                                    <Rocket className="text-emerald-400 w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 group-hover:text-emerald-400 transition-colors">One-Click Deploy</h3>
                                <p className="text-gray-400 leading-relaxed mb-8">
                                    Push to Vercel, Netlify, or AWS with a single command. CI/CD pipelines configured automatically.
                                </p>
                                <div className="mt-auto flex items-center gap-2 text-sm font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all">
                                    Start Shipping <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-white/10 py-12 bg-black">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] rounded flex items-center justify-center">
                                    <Terminal className="text-white w-4 h-4" />
                                </div>
                                <span className="text-xl font-bold">AI Coder</span>
                            </div>
                            <div className="flex space-x-8 text-sm text-gray-500 font-medium">
                                <a href="#" className="hover:text-white transition-colors hover-trigger">Privacy</a>
                                <a href="#" className="hover:text-white transition-colors hover-trigger">Terms</a>
                                <a href="#" className="hover:text-white transition-colors hover-trigger">GitHub</a>
                                <a href="#" className="hover:text-white transition-colors hover-trigger">Twitter</a>
                            </div>
                            <p className="text-sm text-gray-600">
                                Made with ❤️ by Goutham Sai
                            </p>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default LandingPage;
