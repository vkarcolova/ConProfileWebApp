/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  ThemeProvider,
  createTheme,
  Container,
  CssBaseline,
  Box,
  Avatar,
  Typography,
  Grid,
  TextField,
  Button,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { clientApi } from "../../shared/apis";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import React from "react";
import config from "../../../config";

const defaultTheme = createTheme();

const isValidPassword = (password: string) => {
  return password.length >= 8 && /\d/.test(password);
};

const RegisterPage: React.FC = () => {
  const [email, setEmail] = React.useState(
    config.apiUrl.includes("localhost") ? "admin@gmail.com" : ""
  );
  const [password, setPassword] = React.useState(
    config.apiUrl.includes("localhost") ? "admin123" : ""
  );
  const [password2, setPassword2] = React.useState(
    config.apiUrl.includes("localhost") ? "admin123" : ""
  );
  const [passwordError, setPasswordError] = useState(false);

  const navigate = useNavigate();
  const handleSubmit = async () => {
    console.log("🟢 Odosielam formulár:", { email, password, password2 });

    if (!isValidPassword(password)) {
      setPasswordError(true);
      console.log("🔴 Heslo nevyhovuje podmienkam.");
      return;
    }

    setPasswordError(false);

    try {
      console.log("uz posielam");
      const response = await clientApi.register(email, password, password2);
      console.log("✅ Odpoveď z API:", response);

      toast.success(
        "Registrácia prebehla úspešne. Skontrolujte svoj e-mail a kliknite na overovací odkaz."
      );
      navigate("/");
    } catch (error) {
      console.error("❌ Chyba pri registrácii:", error as any);
      toast.error(
        (error as any).response?.data?.message || "Nepodarilo sa registrovať."
      );
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Registrácia
          </Typography>
          <Box component="form" noValidate sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Emailová adresa"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  value={password}
                  name="password"
                  label="Heslo"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  onChange={(e) => {
                    if (!isValidPassword(e.target.value))
                      setPasswordError(true);
                    else setPasswordError(false);
                    setPassword(e.target.value);
                  }}
                  error={passwordError}
                  helperText={
                    passwordError
                      ? "Heslo musí mať aspoň 8 znakov a obsahovať číslo."
                      : ""
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  value={password2}
                  name="password2"
                  label="Zopakujte heslo"
                  type="password"
                  id="password2"
                  autoComplete="new-password"
                  onChange={(e) => setPassword2(e.target.value)}
                  error={password !== password2}
                  helperText={
                    password !== password2 ? "Heslá sa nezhodujú." : ""
                  }
                />
              </Grid>
            </Grid>
            <Button
              color="primary"
              variant="text"
              size="small"
              component="a"
              target="_blank"
              disabled={
                !email ||
                !password ||
                !password2 ||
                password !== password2 ||
                !isValidPassword(password)
              }
              sx={{
                backgroundColor: "rgba(59, 49, 119, 0.87)",
                width: "100%",
                borderRadius: 100,
                color: "white",
                padding: "10px",
                marginTop: "10px",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#9997c3",
                  color: "white",
                },
              }}
            >
              <Typography
                onClick={handleSubmit}
                variant="button"
                fontWeight={500}
                fontSize={"14px"}
              >
                Registrovať sa
              </Typography>
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default RegisterPage;
