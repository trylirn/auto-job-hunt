import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import JobDetail, { JobIdRedirect } from "./pages/JobDetail";
import Opportunities from "./pages/Opportunities";
import Newsletter from "./pages/Newsletter";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Submit from "./pages/Submit";
import NotFound from "./pages/NotFound";
import LocationPage, { LegacyCityRedirect } from "./pages/Location";
import JobsIndex from "./pages/JobsIndex";
import UnCareersGuide from "./pages/UnCareersGuide";
import { WhatsAppBanner } from "./components/WhatsAppBanner";
import { PostHogPageview } from "./components/PostHogPageview";

const queryClient = new QueryClient();

// /jobs/in/:slug — render the country hub if slug matches a country, otherwise
// fall through to the legacy /jobs/in/:city redirect for old backlinks.
import { getCountryHubBySlug } from "./data/countryHubs";
const CountryOrLegacyRoute = () => {
  const { country = "" } = useParams<{ country: string }>();
  if (getCountryHubBySlug(country)) return <LocationPage mode="country" />;
  return <LegacyCityRedirect />;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PostHogPageview />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/job/:slug" element={<JobDetail />} />
            <Route path="/job/id/:id" element={<JobIdRedirect />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/jobs/in" element={<JobsIndex />} />
            <Route path="/jobs/in/cities/:city" element={<LocationPage mode="city" />} />
            <Route path="/jobs/in/:country" element={<CountryOrLegacyRoute />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <WhatsAppBanner />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
