import { createContext, useContext, useReducer, useEffect, useState } from "react";
import { supabase, supabaseConfigured, getProfile } from "../lib/supabase";

const AppContext = createContext(null);

const initialState = {
  user: null, // { id, name, email, avatar, isHost }
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
  const [authLoading, setAuthLoading] = useState(true);

  // Escuchar cambios de sesión de Supabase
  useEffect(() => {
    if (!supabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    // Obtener sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadUserProfile(session.user, dispatch);
      }
      setAuthLoading(false);
    }).catch(() => {
      setAuthLoading(false);
    });

    // Listener para cambios de auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await loadUserProfile(session.user, dispatch);
        } else if (event === "SIGNED_OUT") {
          dispatch({ type: "LOGOUT" });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, authLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}

// Helper: cargar perfil de Supabase y setear en estado
async function loadUserProfile(authUser, dispatch) {
  try {
    const profile = await getProfile(authUser.id);
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
  } catch (err) {
    // Si falla el perfil (tabla no existe aún, etc), usar datos del auth
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
