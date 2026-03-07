import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LoadingScreen from "./components/shared/LoadingScreen";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import { lazyWithRetry } from "./lib/lazyWithRetry";

gsap.registerPlugin(ScrollTrigger);

// Landing page (carga directa, no lazy — es la primera impresión)
import LandingNavbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import SocialProof from "./components/SocialProof";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";

// Dashboard (lazy)
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));

// Guest flows (lazy)
const SearchResults = lazyWithRetry(() => import("./pages/SearchResults"));
const SpaceDetail = lazyWithRetry(() => import("./pages/SpaceDetail"));
const Checkout = lazyWithRetry(() => import("./pages/Checkout"));
const BookingConfirmation = lazyWithRetry(() => import("./pages/BookingConfirmation"));
const MyBookings = lazyWithRetry(() => import("./pages/MyBookings"));
const ReviewFlow = lazyWithRetry(() => import("./pages/ReviewFlow"));

// Host flows (lazy)
const HostOnboarding = lazyWithRetry(() => import("./pages/host/HostOnboarding"));
const HostDashboard = lazyWithRetry(() => import("./pages/host/HostDashboard"));
const CalendarManagement = lazyWithRetry(() => import("./pages/host/CalendarManagement"));
const BookingManagement = lazyWithRetry(() => import("./pages/host/BookingManagement"));
const Earnings = lazyWithRetry(() => import("./pages/host/Earnings"));

// Auth (lazy)
const Login = lazyWithRetry(() => import("./pages/auth/Login"));
const AuthCallback = lazyWithRetry(() => import("./pages/auth/AuthCallback"));
const Profile = lazyWithRetry(() => import("./pages/auth/Profile"));

// App Navbar (lazy, fuera del componente para evitar re-imports)
const AppNavbar = lazyWithRetry(() => import("./components/shared/Navbar"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

// Componente Landing Page original (preservada intacta)
function LandingPage() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <LandingNavbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <SocialProof />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

// Layout para las páginas de la app (con Navbar de la app)
function AppLayout({ children }) {
  return (
    <div className="page-ambient min-h-screen overflow-x-clip bg-transparent">
      <Suspense fallback={null}>
        <AppNavbar />
      </Suspense>
      <Suspense fallback={<LoadingScreen />}>
        {children}
      </Suspense>
    </div>
  );
}

// Scroll to top en cada navegación
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Ruta "/" condicional: Landing si no logueado, Dashboard si logueado
function HomeRoute() {
  const { state, authLoading } = useApp();

  if (authLoading) return <LoadingScreen />;

  if (state.user) {
    return (
      <AppLayout>
        <Suspense fallback={<LoadingScreen />}>
          <Dashboard />
        </Suspense>
      </AppLayout>
    );
  }

  return <LandingPage />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Landing o Dashboard según auth */}
            <Route path="/" element={<HomeRoute />} />
            {/* Landing page accesible siempre */}
            <Route path="/inicio" element={<LandingPage />} />

            {/* Auth */}
            <Route path="/login" element={<AppLayout><Login /></AppLayout>} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Guest flows - públicos */}
            <Route path="/buscar" element={<AppLayout><SearchResults /></AppLayout>} />
            <Route path="/espacio/:id" element={<AppLayout><SpaceDetail /></AppLayout>} />

            {/* Guest flows - requieren auth */}
            <Route path="/reservar/:id" element={<AppLayout><ProtectedRoute><Checkout /></ProtectedRoute></AppLayout>} />
            <Route path="/confirmacion/:bookingId" element={<AppLayout><ProtectedRoute><BookingConfirmation /></ProtectedRoute></AppLayout>} />
            <Route path="/mis-reservas" element={<AppLayout><ProtectedRoute><MyBookings /></ProtectedRoute></AppLayout>} />
            <Route path="/reseña/:bookingId" element={<AppLayout><ProtectedRoute><ReviewFlow /></ProtectedRoute></AppLayout>} />

            {/* Host flows - requieren auth */}
            <Route path="/anfitrion/onboarding" element={<AppLayout><ProtectedRoute><HostOnboarding /></ProtectedRoute></AppLayout>} />
            <Route path="/anfitrion/dashboard" element={<AppLayout><ProtectedRoute><HostDashboard /></ProtectedRoute></AppLayout>} />
            <Route path="/anfitrion/calendario" element={<AppLayout><ProtectedRoute><CalendarManagement /></ProtectedRoute></AppLayout>} />
            <Route path="/anfitrion/reservas" element={<AppLayout><ProtectedRoute><BookingManagement /></ProtectedRoute></AppLayout>} />
            <Route path="/anfitrion/ganancias" element={<AppLayout><ProtectedRoute><Earnings /></ProtectedRoute></AppLayout>} />

            {/* Perfil - requiere auth */}
            <Route path="/perfil" element={<AppLayout><ProtectedRoute><Profile /></ProtectedRoute></AppLayout>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}
