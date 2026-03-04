import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import LoadingScreen from "../../components/shared/LoadingScreen";

// Esta página maneja el redirect de OAuth (Google).
// Supabase pone los tokens en la URL como hash fragments.
// El cliente de Supabase los detecta automáticamente con detectSessionInUrl: true.
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase ya procesa los tokens del hash automáticamente.
    // Solo esperamos a que se establezca la sesión y redirigimos.
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate("/", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return <LoadingScreen />;
}
