import posthog from "posthog-js";

const posthogKey = import.meta.env.POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

export function initPostHog() {
  if (!posthogKey) return;

  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: false,
    loaded: (client) => {
      if (import.meta.env.DEV) client.debug();
    },
  });
}

export { posthog };
