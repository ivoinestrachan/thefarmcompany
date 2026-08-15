import Navbar from "@/components/Navbar";
import SmoothScroll from "@/components/SmoothScroll";
import Intro from "@/components/Intro";
import HeroScroll from "@/components/HeroScroll";
import OldWay from "@/components/OldWay";
import Reach from "@/components/Reach";
import Footer from "@/components/Footer";
import FooterBar from "@/components/FooterBar";
import StackPanel from "@/components/StackPanel";

export default function Home() {
  return (
    <main>
      <SmoothScroll />
      <Navbar />
      <Intro />
      <HeroScroll />
      {/* stacked-panel transition: each pins as the next rises over it.
          The wrapper scopes the sticky context so panels release before the
          footer bar (no receding card peeking behind it). */}
      <div className="relative">
        <StackPanel>
          <OldWay />
        </StackPanel>
        <StackPanel>
          <Reach />
        </StackPanel>
        <StackPanel>
          <Footer />
        </StackPanel>
      </div>
      <FooterBar />
    </main>
  );
}
