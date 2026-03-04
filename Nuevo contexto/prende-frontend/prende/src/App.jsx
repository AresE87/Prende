import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AppProvider } from "./context/AppContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "./components/shared/Navbar";
import LoadingScreen from "./components/shared/LoadingScreen";

// Guest flows
const Home = lazy(() => import("./pages/Home"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const SpaceDetail = lazy(() => import("./pages/SpaceDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const ReviewFlow = lazy(() => import("./pages/ReviewFlow"));

// Host flows
const HostOnboarding = lazy(() => import("./pages/host/HostOnboarding"));
const HostDashboard = lazy(() => import("./pages/host/HostDashboard"));
const CalendarManagement = lazy(() => import("./pages/host/CalendarManagement"));
const BookingManagement = lazy(() => import("./pages/host/BookingManagement"));
const Earnings = lazy(() => import("./pages/host/Earnings"));

// Auth
const Login = lazy(() => import("./pages/auth/Login"));
const Profile = lazy(() => import("./pages/auth/Profile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[#FAF7F2]">
            <Navbar />
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Guest */}
                <Route path="/" element={<Home />} />
                <Route path="/buscar" element={<SearchResults />} />
                <Route path="/espacio/:id" element={<SpaceDetail />} />
                <Route path="/reservar/:id" element={<Checkout />} />
                <Route path="/confirmacion/:bookingId" element={<BookingConfirmation />} />
                <Route path="/mis-reservas" element={<MyBookings />} />
                <Route path="/reseña/:bookingId" element={<ReviewFlow />} />

                {/* Host */}
                <Route path="/anfitrion/onboarding" element={<HostOnboarding />} />
                <Route path="/anfitrion/dashboard" element={<HostDashboard />} />
                <Route path="/anfitrion/calendario" element={<CalendarManagement />} />
                <Route path="/anfitrion/reservas" element={<BookingManagement />} />
                <Route path="/anfitrion/ganancias" element={<Earnings />} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/perfil" element={<Profile />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}
