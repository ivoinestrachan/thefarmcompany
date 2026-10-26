import Navbar from "@/components/Navbar";
import SmoothScroll from "@/components/SmoothScroll";
import FarmSimulation from "@/components/FarmSimulation";
import OldWay from "@/components/OldWay";
import ScaleStats from "@/components/ScaleStats";
import WhyWiggler from "@/components/WhyWiggler";
import HydroTesting from "@/components/HydroTesting";
import OperationsMap from "@/components/OperationsMap";
import Backers from "@/components/Backers";
import Footer from "@/components/Footer";
import FooterBar from "@/components/FooterBar";

export default function Home() {
  return (
    <main>
      <SmoothScroll />
      <Navbar />
      <FarmSimulation />
      <ScaleStats />
      <OldWay />
      <Backers />
      <WhyWiggler />
      <HydroTesting />
      <OperationsMap />
      <Footer />
      <FooterBar />
    </main>
  );
}
