import { createContext, useContext, useReducer } from "react";

const AppContext = createContext(null);

const initialState = {
  user: null,          // { id, name, email, avatar, isHost }
  searchParams: {
    zona: "",
    fecha: "",
    personas: 2,
  },
  cart: null,          // reserva en progreso
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

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
