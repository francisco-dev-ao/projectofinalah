
import { Suspense, lazy } from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import TabsPlansSection from "../components/TabsPlansSection";
import TrustpilotSection from "../components/TrustpilotSection";
import PartnersSection from "../components/PartnersSection";
import CallToActionSection from "../components/CallToActionSection";
import Footer from "../components/Footer";

// Lazy load components that might cause suspense
const FeaturesSection = lazy(() => import("../components/FeaturesSection"));

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <TrustpilotSection />
        <TabsPlansSection />
        <PartnersSection />
        
        <Suspense fallback={<div className="py-10 flex justify-center items-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>}>
          <FeaturesSection />
        </Suspense>
    
        <CallToActionSection />
       
      </main>
      <Footer />
    </div>
  );
};

export default Index;
