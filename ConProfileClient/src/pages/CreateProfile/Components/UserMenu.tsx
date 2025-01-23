import { Box, Divider, Link, Typography } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import React from "react";
import { useUserContext } from "../../../shared/context/useContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const UserMenu: React.FC = () => {
  const navigate = useNavigate();

  const { user, logoutUser } = useUserContext();
  return (
    <Box
      sx={{
        bottom: "10px",
        width: "95%",
      }}
    >
      <Divider sx={{ width: "100%", backgroundColor: "grey" }} />

      <Box
        sx={{
          display: "flex",
          alighItems: "center",
          justifyContent: "center",
        }}
      >
        <AccountCircleIcon sx={{ fontSize: "40px", marginTop: "10px" }} />
        <Box sx={{ padding: "0", marginRight: "-10px", width: "70%" }}>
          {user == null ? (
            <>
              <Typography
                sx={{
                  textAlign: "center",
                  marginTop: "10px",
                  fontSize: "13px",
                }}
              >
                Používateľ neprihlásený
                <Link
                  sx={{
                    color: "#bfc1e6",
                    textDecoration: "none",
                    "&:hover": {
                      color: "#ffffff",
                      textDecoration: "none",
                    },
                  }}
                  href="/auth/prihlasenie/"
                >
                  {" "}
                  Prihlásiť sa
                </Link>
              </Typography>
            </>
          ) : (
            <>
              <Typography
                sx={{
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#bfc1e6",
                }}
              >
                Prihlásený používateľ{" "}
                <span style={{ color: "white" }}>{user.email}</span>
                <br />
                <Link
                  onClick={() => {
                    logoutUser();
                    toast.success("Boli ste úspešne odhlásený.");
                    navigate("/");
                  }}
                  sx={{
                    color: "#bfc1e6",
                    textDecoration: "none",
                    "&:hover": {
                      color: "#ffffff",
                      textDecoration: "none",
                    },
                  }}
                >
                  {" "}
                  Odhlásiť sa
                </Link>
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};
