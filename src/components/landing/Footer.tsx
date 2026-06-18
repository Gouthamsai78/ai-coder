import { useState } from 'react';
import { Terminal, Flame, Play, MessageCircle, Mail, ScrollText } from 'lucide-react';
import MagneticButton from './shared/MagneticButton';
import ContactModal from './ContactModal';
import { analytics } from '../../utils/analytics';

const YOUTUBE_VIDEO_URL = 'https://youtu.be/oLGHMdPOyzg?si=2SZbezYZ8nRJiKaG';
const WHATSAPP_URL = 'https://chat.whatsapp.com/KywQwl2CXFmBSDHIau12Cb';

const Footer: React.FC = () => {
    const [showContact, setShowContact] = useState(false);

    return (
        <>
            <footer className="border-t border-white/10 bg-black pt-12 md:pt-16 pb-8 md:pb-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
                        {/* Brand */}
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

                        {/* Product */}
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <h4 className="text-white font-bold mb-4 md:mb-6">Product</h4>
                            <ul className="space-y-3 md:space-y-4 text-gray-400 text-sm md:text-base">
                                <li>
                                    <MagneticButton
                                        onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="hover:text-white transition-colors"
                                    >
                                        Features
                                    </MagneticButton>
                                </li>
                                <li>
                                    <MagneticButton
                                        onClick={() => {
                                            analytics.track('see_how_it_works_clicked', { source: 'footer' });
                                            window.open(YOUTUBE_VIDEO_URL, '_blank', 'noopener,noreferrer');
                                        }}
                                        className="hover:text-white transition-colors inline-flex items-center gap-2"
                                    >
                                        <Play className="w-3 h-3 text-red-500" />
                                        See How It Works
                                    </MagneticButton>
                                </li>
                                <li>
                                    <MagneticButton
                                        onClick={() => {
                                            analytics.track('changelog_clicked', { source: 'footer' });
                                            document.getElementById('changelog')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="hover:text-white transition-colors inline-flex items-center gap-2"
                                    >
                                        <ScrollText className="w-3 h-3 text-purple-400" />
                                        Changelog
                                    </MagneticButton>
                                </li>
                                <li>
                                    <span className="text-white font-medium">Free</span>
                                    {' '}— No credit card required
                                </li>
                            </ul>
                        </div>

                        {/* Connect */}
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <h4 className="text-white font-bold mb-4 md:mb-6">Connect</h4>
                            <ul className="space-y-3 md:space-y-4 text-gray-400 text-sm md:text-base">
                                <li>
                                    <MagneticButton
                                        onClick={() => {
                                            analytics.track('feedback_widget_opened', { source: 'footer' });
                                            document.querySelector<HTMLButtonElement>('[aria-label="Give feedback"]')?.click();
                                        }}
                                        className="hover:text-orange-400 transition-colors inline-flex items-center gap-2"
                                    >
                                        <Flame className="w-3 h-3 text-orange-400" />
                                        Roast Us
                                    </MagneticButton>
                                </li>
                                <li>
                                    <MagneticButton
                                        onClick={() => {
                                            analytics.track('whatsapp_clicked', { source: 'footer' });
                                            window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
                                        }}
                                        className="hover:text-green-400 transition-colors inline-flex items-center gap-2"
                                    >
                                        <MessageCircle className="w-3 h-3 text-green-400" />
                                        Join Community
                                    </MagneticButton>
                                </li>
                                <li>
                                    <MagneticButton
                                        onClick={() => {
                                            analytics.track('contact_opened', { source: 'footer' });
                                            setShowContact(true);
                                        }}
                                        className="hover:text-white transition-colors inline-flex items-center gap-2"
                                    >
                                        <Mail className="w-3 h-3 text-blue-400" />
                                        Contact Us
                                    </MagneticButton>
                                </li>
                                <li>
                                    <MagneticButton
                                        onClick={() => window.open('https://github.com/Gouthamsai78', '_blank')}
                                        className="hover:text-white transition-colors"
                                    >
                                        GitHub
                                    </MagneticButton>
                                </li>
                                <li>
                                    <MagneticButton
                                        onClick={() => window.open('https://www.linkedin.com/in/gouthamsai78/', '_blank')}
                                        className="hover:text-white transition-colors"
                                    >
                                        LinkedIn
                                    </MagneticButton>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-xs md:text-sm text-gray-600 gap-4 md:gap-0">
                        <p>&copy; 2026 AI Coder by Goutham Sai. All rights reserved.</p>
                        <div className="flex gap-8">
                            <MagneticButton
                                onClick={() => window.open('https://github.com/Gouthamsai78', '_blank')}
                                className="hover:text-gray-400"
                            >
                                GitHub
                            </MagneticButton>
                        </div>
                    </div>
                </div>
            </footer>

            <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />
        </>
    );
};

export default Footer;
