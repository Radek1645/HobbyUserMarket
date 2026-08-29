"use client";

import {
  resolveTurnstileSiteKey,
  TURNSTILE_UNAVAILABLE_ERROR,
  type TurnstileAction,
} from "@/config/turnstile";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          action?: TurnstileAction;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export type TurnstileWidgetHandle = {
  /** Po spotřebování jednorázového tokenu — nový token. */
  reset: () => void;
};

type TurnstileWidgetProps = {
  onToken: (token: string | null) => void;
  onError?: (message: string | null) => void;
  action?: TurnstileAction;
  className?: string;
};

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }
  turnstileScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      if (window.turnstile) {
        resolve();
        return;
      }
      script.remove();
      turnstileScriptPromise = null;
      reject(new Error("Turnstile API unavailable"));
    };
    script.onerror = () => {
      script.remove();
      turnstileScriptPromise = null;
      reject(new Error("Turnstile script failed"));
    };
    document.head.appendChild(script);
  });
  return turnstileScriptPromise;
}

/** Cloudflare Turnstile — zobrazí se jen když je nastavený site key. */
export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  TurnstileWidgetProps
>(function TurnstileWidget({ onToken, onError, action, className }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  const siteKey = resolveTurnstileSiteKey();

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      onTokenRef.current(null);
      onErrorRef.current?.(null);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          /* ignore */
        }
      }
    },
  }));

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      onTokenRef.current(null);
      return;
    }

    let cancelled = false;

    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current) {
          return;
        }
        if (!window.turnstile) {
          onTokenRef.current(null);
          onErrorRef.current?.(TURNSTILE_UNAVAILABLE_ERROR);
          return;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            onErrorRef.current?.(null);
            onTokenRef.current(token);
          },
          "expired-callback": () => {
            onTokenRef.current(null);
            if (widgetIdRef.current && window.turnstile) {
              try {
                window.turnstile.reset(widgetIdRef.current);
              } catch {
                onErrorRef.current?.(TURNSTILE_UNAVAILABLE_ERROR);
              }
            }
          },
          "error-callback": () => {
            onTokenRef.current(null);
            onErrorRef.current?.(TURNSTILE_UNAVAILABLE_ERROR);
          },
          action,
          theme: "light",
        });
      })
      .catch(() => {
        onTokenRef.current(null);
        onErrorRef.current?.(TURNSTILE_UNAVAILABLE_ERROR);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
  }, [action, siteKey]);

  if (!siteKey) {
    return null;
  }

  return <div ref={containerRef} className={className} />;
});

type TurnstileChallengeProps = {
  widgetRef: Ref<TurnstileWidgetHandle>;
  onToken: (token: string | null) => void;
  action: TurnstileAction;
  className?: string;
};

/** Viditelný widget + copy; bez site key hláška místo tichého selhání. */
export function TurnstileChallenge({
  widgetRef,
  onToken,
  action,
  className,
}: TurnstileChallengeProps) {
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [widgetAttempt, setWidgetAttempt] = useState(0);

  if (!resolveTurnstileSiteKey()) {
    return (
      <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {TURNSTILE_UNAVAILABLE_ERROR}
      </p>
    );
  }

  return (
    <div
      className={
        className ?? "rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
      }
    >
      <p className="mb-2 text-xs text-gray-600">
        Ochrana proti spamu — potvrďte, že nejste robot.
      </p>
      <TurnstileWidget
        key={widgetAttempt}
        ref={widgetRef}
        action={action}
        onToken={onToken}
        onError={setWidgetError}
      />
      {widgetError ? (
        <div className="mt-2">
          <p role="alert" className="text-sm text-red-700">
            {widgetError}
          </p>
          <button
            type="button"
            onClick={() => {
              onToken(null);
              setWidgetError(null);
              setWidgetAttempt((attempt) => attempt + 1);
            }}
            className="mt-2 text-sm font-medium text-gray-700 underline-offset-2 hover:underline"
          >
            Zkusit ověření znovu
          </button>
        </div>
      ) : null}
    </div>
  );
}
