import Navbar from "@/components/Navbar";
import SmoothScroll from "@/components/SmoothScroll";
import Intro from "@/components/Intro";
import HeroScroll from "@/components/HeroScroll";
import OldWay from "@/components/OldWay";
import Reach from "@/components/Reach";
import Backers from "@/components/Backers";
import Footer from "@/components/Footer";
import FooterBar from "@/components/FooterBar";

export default function Home() {
  return (
    <main>
      <SmoothScroll />
      <Navbar />
      <Intro />
      <HeroScroll />
      <OldWay />
      <Reach />
      <Backers />
      <Footer />
      <FooterBar />
    </main>
  );
}
