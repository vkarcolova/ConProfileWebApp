import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";
import "./MobileWarning.css";

const MobileWarning: React.FC = () => {
  return (
    <Box
      className="mobile-warning"
      sx={{
        position: "absolute", // Umiestni komponentu na vrch
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "white",
        color: "black",
        padding: 2,
        textAlign: "center",
        border: "2px solid #e5a900",
        borderRadius: "8px",
        margin: "0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <Typography
        variant="h6"
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <WarningIcon sx={{ marginRight: 1 }} /> {/* Ikona varovania */}
        Táto aplikácia nie je optimalizovaná pre mobilné zariadenia
      </Typography>
      <Divider sx={{ marginTop: 2 }} />
    </Box>
  );
};

export default MobileWarning;
