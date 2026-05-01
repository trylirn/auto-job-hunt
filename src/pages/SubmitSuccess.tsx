import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const SubmitSuccess = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Submission received — Eplicant</title>
    </Helmet>
    <Header />
    <main className="container max-w-2xl py-16 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
      <h1 className="font-display text-3xl font-bold mt-4">Payment received!</h1>
      <p className="text-muted-foreground mt-2">
        Your listing is being published and will appear at the top of Eplicant within a few minutes.
        We've sent a receipt and edit link to your invoice email.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/"><Button>Browse jobs</Button></Link>
        <Link to="/opportunities"><Button variant="outline">Opportunities</Button></Link>
      </div>
    </main>
    <Footer />
  </div>
);

export default SubmitSuccess;
