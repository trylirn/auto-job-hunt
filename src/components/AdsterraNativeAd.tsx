import { useEffect, useRef } from "react";

const AD_KEY = "73fe361683f8d7e9cebdfe096c2ade98";

export default function AdsterraNativeAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = adRef.current;
    if (!host) return;

    // Adsterra's native loader looks for its container in the DOM, so the
    // container must exist BEFORE the invoke script runs.
    const container = document.createElement("div");
    container.id = `container-${AD_KEY}`;
    host.appendChild(container);

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = `https://pl30810432.effectivecpmnetwork.com/${AD_KEY}/invoke.js`;
    host.appendChild(script);

    return () => {
      host.innerHTML = "";
    };
  }, []);

  return <div ref={adRef} className="w-full min-h-[90px]" />;
}
