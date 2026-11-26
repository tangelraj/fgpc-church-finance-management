import {

  createContext,

  useContext,

  useEffect,

  useState,

} from "react";

import api from "../services/api";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const checkLogin = async () => {

      const token = sessionStorage.getItem(
        "fgpc_token"
      );

      if (!token) {

        setLoading(false);

        return;

      }

      try {

        const response = await api.get(
          "auth/profile/"
        );

        setUser(response.data);

      } catch (error) {

        sessionStorage.removeItem("fgpc_token");

        sessionStorage.removeItem("fgpc_user");

        setUser(null);

      } finally {

        setLoading(false);

      }

    };

    checkLogin();

  }, []);


  const login = async (username, password) => {

    const response = await api.post(

      "auth/login/",

      {

        username,

        password,

      }

    );

    sessionStorage.setItem(

      "fgpc_token",

      response.data.token

    );

    sessionStorage.setItem(

      "fgpc_user",

      JSON.stringify(response.data.user)

    );

    setUser(response.data.user);

    return response.data;

  };


  const logout = async () => {

    try {

      await api.post("auth/logout/");

    } catch (error) {

      console.error("Server logout failed.");

    } finally {

      sessionStorage.removeItem("fgpc_token");

      sessionStorage.removeItem("fgpc_user");

      setUser(null);

    }

  };


  return (

    <AuthContext.Provider

      value={{

        user,

        loading,

        login,

        logout,

        isAuthenticated: Boolean(user),

      }}

    >

      {children}

    </AuthContext.Provider>

  );

}


export function useAuth() {

  return useContext(AuthContext);

}