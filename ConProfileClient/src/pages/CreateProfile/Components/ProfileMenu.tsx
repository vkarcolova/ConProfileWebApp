import { Box, Divider, Link, Typography } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import React from "react";

export const ProfileMenu: React.FC = () => {
  return (
    <Box
      sx={{
        position: "absolute",
        bottom: "10px",
        width: "200px",
      }}
    >
      <Divider sx={{ width: "200px", backgroundColor: "grey" }} />

      <Box
        sx={{
          display: "flex",
        }}
      >
        <AccountCircleIcon sx={{ fontSize: "40px", marginTop: "10px" }} />
        <Typography
          sx={{ textAlign: "center", marginTop: "10px", fontSize: "13px" }}
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
      </Box>
    </Box>
  );
};
