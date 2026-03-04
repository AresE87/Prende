import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AppProvider } from "./context/AppContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LoadingScreen from "./components/shared/LoadingScreen";
import ProtectedRoute from "./components/shared/ProtectedRoute";

gsap.registerPlugin(ScrollTrigger);

// Landing page (carga directa, no lazy — es la primera impresión)
import LandingNavbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProblemSolution from "./components/ProblemSolution";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import SocialProof from "./components/SocialProof";
import Manifesto from "./components/Manifesto";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";

// Guest flows (lazy)
const SearchResults = lazy(() => import("./pages/SearchResults"));
const SpaceDetail = lazy(() => import("./pages/SpaceDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const ReviewFlow = lazy(() => import("./pages/ReviewFlow"));

// Host flows (lazy)
const HostOnboarding = lazy(() => import("./pages/host/HostOnboarding"));
const HostDashboard = lazy(() => import("./pages/host/HostDashboard"));
const CalendarManagement = lazy(() => import("./pages/host/CalendarManagement"));
const BookingManagement = lazy(() => import("./pages/host/BookingManagement"));
const Earnings = lazy(() => import("./pages/host/Earnings"));

// Auth (lazy)
const Login = lazy(() => import("./pages/auth/Login"));
const AuthCallback = lazy(() => import("./pages/auth/AuthCallback"));
const Profile = lazy(() => import("./pages/auth/Profile"));

// App Navbar (lazy, fuera del componente para evitar re-imports)
const AppNavbar = lazy(() => import("./components/shared/Navbar"));

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
        <ProblemSolution />
        <HowItWorks />
        <Features />
        <SocialProof />
        <Manifesto />
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
    <div className="min-h-screen bg-[#FAF7F2]">
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Landing page original */}
            <Route path="/" element={<LandingPage />} />

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
