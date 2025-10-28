import { Hero } from "./components/Hero";
import { Servicios } from "./components/Servicios";
import { Choferes } from "./components/Choferes";

const HomePage: React.FC = () => {
  return (
    <div>
      <Hero />
      <Servicios />
      <Choferes />
    </div>
  );
};

export default HomePage;
