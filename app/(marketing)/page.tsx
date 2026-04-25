import IntroParallax from "@/components/sections/IntroParallax";
import SocialProof from "@/components/sections/SocialProof";
import Problem from "@/components/sections/Problem";
import HowItWorks from "@/components/sections/HowItWorks";
import Pipeline from "@/components/sections/Pipeline";
import ProductPreview from "@/components/sections/ProductPreview";
import Features from "@/components/sections/Features";
import SafetyEthics from "@/components/sections/SafetyEthics";
import Testimonials from "@/components/sections/Testimonials";
import CTA from "@/components/sections/CTA";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="relative">
      <IntroParallax />
      <SocialProof />
      <Problem />
      <HowItWorks />
      <Pipeline />
      <ProductPreview />
      <Features />
      <SafetyEthics />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
