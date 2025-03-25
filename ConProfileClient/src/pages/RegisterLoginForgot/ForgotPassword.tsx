import { ThemeProvider } from "@emotion/react";
import {
  Container,
  CssBaseline,
  Box,
  Avatar,
  Typography,
  TextField,
  Button,
  createTheme,
} from "@mui/material";
import "../../index.css";
import React from "react";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { toast } from "react-toastify";
import { clientApi } from "../../shared/apis";
import config from "../../../config";
import { useNavigate } from "react-router-dom";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = React.useState(
    config.apiUrl.includes("localhost") ? "ver.karcolova@gmail.com" : ""
  );
  const navigate = useNavigate();
  const handleSubmit = async () => {
    console.log(email);
    await clientApi
      .forgotPassword(email)
      .then(() => {
        toast.success(
          "Skontrolujte svoj e-mail a kliknite na overovací odkaz pre zmenu hesla."
        );
        navigate("/auth/prihlasenie");
      })
      .catch((error) =>
        toast.error(
          error.response?.data || "Chyba pri odoslaní overovacieho e-mailu."
        )
      );
  };
  const defaultTheme = createTheme();

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
            Prihlásenie
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Emailová adresa"
              name="email"
              autoComplete="email"
              autoFocus
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
            <Button
              color="primary"
              variant="text"
              size="small"
              component="a"
              target="_blank"
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
              onClick={handleSubmit}
            >
              <Typography variant="button" fontWeight={500} fontSize={"14px"}>
                Odoslať overovací e-mail
              </Typography>
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default ForgotPassword;
