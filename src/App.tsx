import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import JobDetail, { JobIdRedirect } from "./pages/JobDetail";
import Opportunities from "./pages/Opportunities";
import Newsletter from "./pages/Newsletter";
import NotFound from "./pages/NotFound";
import { WhatsAppBanner } from "./components/WhatsAppBanner";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/job/:slug" element={<JobDetail />} />
            <Route path="/job/id/:id" element={<JobIdRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <WhatsAppBanner />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
