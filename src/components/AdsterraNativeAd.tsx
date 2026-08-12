import { useEffect, useRef } from "react";

export default function AdsterraNativeAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adRef.current) return;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src =
      "https://pl30810432.effectivecpmnetwork.com/73fe361683f8d7e9cebdfe096c2ade98/invoke.js";

    adRef.current.appendChild(script);

    const container = document.createElement("div");
    container.id = "container-73fe361683f8d7e9cebdfe096c2ade98";
    adRef.current.appendChild(container);

    return () => {
      if (adRef.current) {
        adRef.current.innerHTML = "";
      }
    };
  }, []);
  return <div ref={adRef} className="w-full" />;
}
