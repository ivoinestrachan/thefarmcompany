import Navbar from "@/components/Navbar";
import SmoothScroll from "@/components/SmoothScroll";
import Intro from "@/components/Intro";
import HeroScroll from "@/components/HeroScroll";
import OldWay from "@/components/OldWay";
import Reach from "@/components/Reach";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <SmoothScroll />
      <Navbar />
      <Intro />
      <HeroScroll />
      <OldWay />
      <Reach />
      <Footer />
    </main>
  );
}
