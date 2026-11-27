import { useEffect, useRef } from "react";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect, Link } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { hasClerkKey, SignedInGate } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/images/logo.png`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#00ffff",
    colorForeground: "#e2e8f0",
    colorMutedForeground: "#64748b",
    colorDanger: "#ef4444",
    colorBackground: "#0a0a16",
    colorInput: "#141428",
    colorInputForeground: "#e2e8f0",
    colorNeutral: "#1e1e3a",
    fontFamily: "'Space Grotesk', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-[0_0_40px_rgba(0,255,255,0.08)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-[#64748b]",
    socialButtonsBlockButtonText: "text-[#e2e8f0] font-medium",
    socialButtonsBlockButton: "border-[#1e1e3a] bg-[#141428] hover:bg-[#1a1a2e]",
    formFieldLabel: "text-[#94a3b8]",
    formFieldInput: "bg-[#141428] border-[#1e1e3a] text-[#e2e8f0]",
    formButtonPrimary: "bg-[#00ffff] text-[#0a0a16] hover:bg-white font-bold",
    footerActionLink: "text-[#00ffff] hover:text-white",
    footerActionText: "text-[#64748b]",
    dividerText: "text-[#64748b]",
    dividerLine: "bg-[#1e1e3a]",
    identityPreviewEditButton: "text-[#00ffff]",
    formFieldSuccessText: "text-green-400",
    alertText: "text-[#e2e8f0]",
    alert: "bg-[#141428] border-[#1e1e3a]",
    logoBox: "flex justify-center mb-2",
    logoImage: "w-12 h-12 object-contain",
    footerAction: "border-t border-[#1e1e3a]",
    otpCodeFieldInput: "bg-[#141428] border-[#1e1e3a] text-[#e2e8f0]",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

function SignInPage() {
  if (!hasClerkKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a16] px-4">
        <div className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl p-8 w-[440px] max-w-full text-center space-y-4">
          <h1 className="text-white font-bold text-xl">Y M S AI</h1>
          <p className="text-[#94a3b8] text-sm">Authentication is running in local preview mode (Clerk key not configured).</p>
          <Link href="/chat" className="inline-block bg-[#00ffff] text-[#0a0a16] px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white transition-colors">
            Open Chat
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a16] px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function SignUpPage() {
  if (!hasClerkKey) {
    return <Redirect to="/chat" />;
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a16] px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return <Home />;
}

function ChatRoute() {
  return (
    <SignedInGate fallback={<Redirect to="/sign-in" />}>
      <Chat />
    </SignedInGate>
  );
}

const queryClient = new QueryClient();

function AppRoutes({ withClerk }: { withClerk: boolean }) {
  return (
    <QueryClientProvider client={queryClient}>
      {withClerk && <ClerkQueryClientCacheInvalidator />}
      <TooltipProvider>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/chat" component={ChatRoute} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  if (!hasClerkKey || !clerkPubKey) {
    return <AppRoutes withClerk={false} />;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "مرحباً بك في Y M S AI", subtitle: "سجّل دخولك للوصول إلى مساعدك الذكي" } },
        signUp: { start: { title: "أنشئ حسابك", subtitle: "ابدأ رحلتك مع Y M S AI" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <AppRoutes withClerk={true} />
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
