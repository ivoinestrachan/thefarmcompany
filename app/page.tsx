import Navbar from "@/components/Navbar";
import Intro from "@/components/Intro";
import HeroScroll from "@/components/HeroScroll";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Intro />
      <HeroScroll />
      <Footer />
    </main>
  );
}
