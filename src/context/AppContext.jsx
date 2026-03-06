import { createContext, useContext, useReducer, useEffect, useState } from "react";
import { supabase, supabaseConfigured, getProfile } from "../lib/supabase";
import { withTimeout } from "../lib/async";

const AppContext = createContext(null);
const AUTH_BOOTSTRAP_TIMEOUT_MS = 5000;
const PROFILE_LOOKUP_TIMEOUT_MS = 3500;

const initialState = {
  user: null,
  searchParams: {
    zona: "",
    fecha: "",
    personas: 2,
  },
  cart: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "LOGOUT":
      return { ...state, user: null };
    case "SET_SEARCH":
      return { ...state, searchParams: { ...state.searchParams, ...action.payload } };
    case "SET_CART":
      return { ...state, cart: action.payload };
    case "CLEAR_CART":
      return { ...state, cart: null };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [authLoading, setAuthLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) {
      return undefined;
    }

    let active = true;

    async function bootstrapAuth() {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_BOOTSTRAP_TIMEOUT_MS,
          "La sesion tardo demasiado en responder.",
        );

        if (!active) return;

        if (session?.user) {
          await loadUserProfile(session.user, dispatch);
        } else {
          dispatch({ type: "LOGOUT" });
        }
      } catch {
        if (!active) return;
        dispatch({ type: "LOGOUT" });
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    void bootstrapAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      window.setTimeout(() => {
        if (!active) return;

        if (event === "SIGNED_OUT") {
          dispatch({ type: "LOGOUT" });
          return;
        }

        if (
          session?.user &&
          ["INITIAL_SESSION", "SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)
        ) {
          void loadUserProfile(session.user, dispatch);
        }
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, authLoading }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}

async function loadUserProfile(authUser, dispatch) {
  try {
    const profile = await withTimeout(
      getProfile(authUser.id),
      PROFILE_LOOKUP_TIMEOUT_MS,
      "El perfil tardo demasiado en responder.",
    );

    dispatch({
      type: "SET_USER",
      payload: {
        id: authUser.id,
        name: profile?.full_name ?? authUser.user_metadata?.full_name ?? authUser.email?.split("@")[0] ?? "Usuario",
        email: authUser.email,
        avatar: profile?.avatar_url ?? authUser.user_metadata?.avatar_url ?? null,
        isHost: profile?.is_host ?? false,
        phone: profile?.phone ?? null,
      },
    });
  } catch {
    dispatch({
      type: "SET_USER",
      payload: {
        id: authUser.id,
        name: authUser.user_metadata?.full_name ?? authUser.email?.split("@")[0] ?? "Usuario",
        email: authUser.email,
        avatar: authUser.user_metadata?.avatar_url ?? null,
        isHost: false,
      },
    });
  }
}
