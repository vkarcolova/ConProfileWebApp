import { ThemeProvider } from "@emotion/react";
import {
  Container,
  CssBaseline,
  Box,
  Avatar,
  Typography,
  TextField,
  Button,
  Grid,
  createTheme,
} from "@mui/material";
import "../../index.css";
import React from "react";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { toast } from "react-toastify";
import { clientApi } from "../../shared/apis";
import { useUserContext } from "../../shared/context/useContext";
import config from "../../../config";
import { jwtDecode } from "jwt-decode";

const LoginPage: React.FC = () => {
  const { loginUser } = useUserContext();
  const [email, setEmail] = React.useState(
    config.apiUrl.includes("localhost") ? "admin@gmail.com" : ""
  );
  const [password, setPassword] = React.useState(
    config.apiUrl.includes("localhost") ? "admin" : ""
  );

  const handleSubmit = async () => {
    await clientApi
      .login(email, password)
      .then((response) => {
        if (response.status === 200) {
          const token = response.data.token;
          localStorage.setItem("token", token);
          const useremail = response.data.email;
          localStorage.setItem("useremail", useremail);

          const decodedToken = jwtDecode<{ email: string; role: string }>(
            token
          );
          localStorage.setItem("role", decodedToken.role);
          toast.success("Užívateľ prihlásený");
          loginUser(token, useremail, decodedToken.role);
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
          toast.error("Chyba pri prihlásení");
        }
      });
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Heslo"
              type="password"
              id="password"
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
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
                Prihlásiť sa
              </Typography>
            </Button>
            <Grid container>
              {/* <Grid item xs>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid> */}
            </Grid>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default LoginPage;
