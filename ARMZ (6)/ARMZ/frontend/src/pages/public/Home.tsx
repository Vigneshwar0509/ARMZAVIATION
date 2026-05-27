import Hero from "@/src/sections/Hero";
import Stats from "@/src/sections/Stats";
import FeaturedEmployers from "@/src/sections/FeaturedEmployers";
import TrustSection from "@/src/sections/TrustSection";
import VoicesFromFlightDeck from "@/src/sections/VoicesFromFlightDeck";

export default function Home() {
  return (
    <div className="space-y-8 pb-8">
      <div id="hero">
        <Hero />
      </div>
      <div id="stats">
        <Stats />
      </div>
      <div id="featured-employers">
        <FeaturedEmployers />
      </div>
      <div id="trust">
        <TrustSection />
      </div>
      <div id="voices">
        <VoicesFromFlightDeck />
      </div>
    </div>
  );
}
