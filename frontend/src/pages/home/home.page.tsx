
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { CategorySection } from "./components/CategorySection";
import { OffersSection } from "./components/OffersSection";
import { SupportSection } from "./components/SupportSection";
import { ContactSection } from "./components/ContactSection";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesSection />
      <CategorySection />
      <OffersSection />
      <SupportSection />
      <ContactSection />
    </div>
  );
};

export default HomePage;
