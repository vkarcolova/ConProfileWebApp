import axios from "axios";
import config from "../../config";
import { toast } from "react-toastify";

const axiosInstance = axios.create({
  baseURL: config.apiUrl,
});

// Globálny response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("useremail");
      window.location.href = "/auth/prihlasenie/";
      toast.error("Pre prístup k tejto stránke musíte byť prihlásený.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
