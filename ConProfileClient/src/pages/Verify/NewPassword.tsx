import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { clientApi } from "../../shared/apis";
import { Container, TextField, Button, Typography, Box } from "@mui/material";

const ResetPassword = () => {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Neplatný overovací odkaz.");
      navigate("/");
      return;
    }
  }, []);

  // Validácia hesla (aspoň 8 znakov a aspoň jedno číslo)
  const isValidPassword = (password: string) =>
    /^(?=.*\d).{8,}$/.test(password);

  const handleSubmit = async () => {
    if (!isValidPassword(newPassword)) {
      setPasswordError(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Heslá sa nezhodujú.");
      return;
    }

    await clientApi
      .resetPassword(token, newPassword, confirmPassword)
      .then(() => {
        toast.success("Heslo bolo úspešne zmenené.");
        navigate("/auth/prihlasenie/");
      })
      .catch((error) =>
        toast.error(error.response?.data || "Chyba pri zmene hesla.")
      );
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Obnova hesla
        </Typography>

        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            label="Nové heslo"
            type="password"
            fullWidth
            variant="outlined"
            margin="dense"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordError(!isValidPassword(e.target.value));
            }}
            error={passwordError}
            helperText={
              passwordError
                ? "Heslo musí mať aspoň 8 znakov a obsahovať číslo."
                : ""
            }
          />

          <TextField
            label="Potvrďte heslo"
            type="password"
            fullWidth
            variant="outlined"
            margin="dense"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={newPassword !== confirmPassword}
            helperText={
              newPassword !== confirmPassword ? "Heslá sa nezhodujú." : ""
            }
          />

          <Button
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              backgroundColor: "rgba(59, 49, 119, 0.87)",
              ":hover": { backgroundColor: "#66648b" },
            }}
            onClick={handleSubmit}
            disabled={
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword ||
              passwordError
            }
          >
            Nastaviť nové heslo
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ResetPassword;
