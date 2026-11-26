import axios from "axios";


const API_URL =

  import.meta.env.VITE_API_URL ||

  "http://127.0.0.1:8000/api/";


const api = axios.create({

  baseURL: API_URL,

  headers: {

    "Content-Type": "application/json",

  },

  timeout: 15000,

});


// ==========================================
// ADD AUTHENTICATION TOKEN
// ==========================================

api.interceptors.request.use(

  (config) => {

    const token = sessionStorage.getItem(
      "fgpc_token"
    );

    if (token) {

      config.headers.Authorization =
        `Token ${token}`;

    }

    return config;

  },

  (error) => {

    return Promise.reject(error);

  }

);


// ==========================================
// HANDLE EXPIRED OR INVALID LOGIN
// ==========================================

api.interceptors.response.use(

  (response) => response,

  (error) => {

    if (error.response?.status === 401) {

      sessionStorage.removeItem("fgpc_token");

      sessionStorage.removeItem("fgpc_user");

      if (window.location.pathname !== "/login") {

        window.location.href = "/login";

      }

    }

    return Promise.reject(error);

  }

);


export default api;