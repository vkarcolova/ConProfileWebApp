import { ThemeProvider } from "@emotion/react";
import {
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
import "../../index.css";
import React from "react";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { clientApi } from "../../shared/apis";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUserContext } from "../../shared/context/useContext";
import { useNavigate } from "react-router-dom";
import config from "../../../config";
const defaultTheme = createTheme();

const RegisterPage: React.FC = () => {
  const [email, setEmail] = React.useState(
    config.apiUrl.includes("localhost") ? "admin@gmail.com" : ""
  );
  const [password, setPassword] = React.useState(
    config.apiUrl.includes("localhost") ? "admin" : ""
  );
  const [password2, setPassword2] = React.useState(
    config.apiUrl.includes("localhost") ? "admin" : ""
  );

  const { loginUser } = useUserContext();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    //TODO skontrolvoat ci su rovnake s form ak by usestate bol pomaly
    await clientApi
      .register(email, password, password2)
      .then((response) => {
        if (response.status === 200) {
          const token = response.data.token;
          localStorage.setItem("token", token);
          const useremail = response.data.email;
          localStorage.setItem("useremail", useremail);
          toast.success("Registrácia prebehla úspešne.");
          loginUser(token, useremail);
          navigate("/");
        }
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Nepodarilo sa registrovať.");
        }
      });
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
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 3 }}
          >
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
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  value={password2}
                  name="password"
                  label="Zopakujte heslo"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  onChange={(e) => setPassword2(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}></Grid>
            </Grid>
            <Button
              color="primary"
              variant="text"
              size="small"
              component="a"
              target="_blank"
              disabled={
                email == "" ||
                password == "" ||
                password2 == "" ||
                password != password2
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
