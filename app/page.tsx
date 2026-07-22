import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Herd from "@/components/Herd";
import Soil from "@/components/Soil";
import Dashboard from "@/components/Dashboard";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Problem />
      <Herd />
      <Soil />
      <Dashboard />
      <Footer />
    </main>
  );
}
