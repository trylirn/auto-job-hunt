import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface LayoutProps {
  children: React.ReactNode;
}

/** Shared page shell: skip link, header, main landmark, footer. */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
