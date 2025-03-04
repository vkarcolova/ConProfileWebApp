import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { clientApi } from "../../shared/apis";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    if (!token) {
      toast.error("Neplatný overovací odkaz.");
      navigate("/");
      return;
    }

    clientApi
      .verifyEmail(token)
      .then(() => {
        toast.success("Účet bol vytvorený. Teraz sa môžete prihlásiť.");
        navigate("/auth/prihlasenie/");
      })
      .catch(() => {
        toast.error("Neplatný alebo expirovaný odkaz.");
        navigate("/");
      });
  }, [token, navigate]);

  return <h3>Overujeme váš e-mail...</h3>;
};

export default VerifyEmail;
