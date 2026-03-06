import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, supabase, supabaseConfigured } from "../../lib/supabase";
import { getSignedInHome } from "../../lib/navigation";
import LoadingScreen from "../../components/shared/LoadingScreen";
import { withTimeout } from "../../lib/async";

const CALLBACK_SESSION_TIMEOUT_MS = 5000;
const CALLBACK_PROFILE_TIMEOUT_MS = 3500;

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabaseConfigured) {
      navigate("/login", { replace: true });
      return undefined;
    }

    let active = true;

    const timeout = setTimeout(async () => {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          CALLBACK_SESSION_TIMEOUT_MS,
          "La sesion de acceso tardo demasiado en responder.",
        );

        if (!active) return;

        if (!session?.user) {
          navigate("/login", { replace: true });
          return;
        }

        try {
          const profile = await withTimeout(
            getProfile(session.user.id),
            CALLBACK_PROFILE_TIMEOUT_MS,
            "El perfil tardo demasiado en responder.",
          );

          if (!active) return;

          navigate(getSignedInHome({ isHost: Boolean(profile?.is_host) }), { replace: true });
        } catch {
          if (!active) return;
          navigate("/", { replace: true });
        }
      } catch {
        if (!active) return;
        navigate("/login", { replace: true });
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [navigate]);

  return <LoadingScreen />;
}
