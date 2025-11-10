
import { HeroSection } from "./components/HeroSection";
import { CategorySection } from "./components/CategorySection";
import { FeaturedProducts } from "./components/FeaturedProducts";
import { OffersSection } from "./components/OffersSection";
import { ServicesSection } from "./components/ServicesSection";
import { NewsletterSection } from "./components/NewsletterSection";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <CategorySection />
      <FeaturedProducts />
      <OffersSection />
      <ServicesSection />
      <NewsletterSection />
    </div>
  );
};

export default HomePage;
