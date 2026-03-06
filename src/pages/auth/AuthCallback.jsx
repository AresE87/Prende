import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, supabase, supabaseConfigured } from "../../lib/supabase";
import { getSignedInHome } from "../../lib/navigation";
import LoadingScreen from "../../components/shared/LoadingScreen";

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
        const { data: { session } } = await supabase.auth.getSession();

        if (!active) return;

        if (!session?.user) {
          navigate("/login", { replace: true });
          return;
        }

        try {
          const profile = await getProfile(session.user.id);

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
