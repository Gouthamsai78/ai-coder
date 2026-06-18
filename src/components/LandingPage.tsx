import HeroSection from './landing/HeroSection';
import FeaturesSection from './landing/FeaturesSection';
import HowItWorksSection from './landing/HowItWorksSection';
import SocialProofSection from './landing/SocialProofSection';
import ChangelogSection from './landing/ChangelogSection';
import CTASection from './landing/CTASection';
import Footer from './landing/Footer';

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    return (
        <div className="relative bg-black min-h-screen selection:bg-orange-500/30 overflow-x-hidden">
            <HeroSection onGetStarted={onGetStarted} />
            <FeaturesSection />
            <HowItWorksSection />
            <SocialProofSection />
            <div id="changelog">
                <ChangelogSection />
            </div>
            <CTASection onGetStarted={onGetStarted} />
            <Footer />
        </div>
    );
};

export default LandingPage;
