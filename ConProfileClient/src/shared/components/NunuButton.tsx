import { Button, SxProps, Typography } from "@mui/material";
import React from "react";

interface NunuButtonProps {
  onClick: () => void;
  bgColour: string;
  hoverBgColour: string;
  textColour: string;
  hoverTextColour: string;
  label: string;
  sx?: SxProps;
  fontSize: string;
  disabled?: boolean;
}
export const NunuButton: React.FC<NunuButtonProps> = ({
  onClick,
  bgColour,
  hoverBgColour,
  textColour,
  hoverTextColour,
  label,
  sx,
  fontSize,
  disabled,
}) => {
  return (
    <Button
      onClick={onClick}
      sx={{
        backgroundColor: bgColour,
        borderRadius: "30px",
        color: textColour,
        textTransform: "none",
        "&:hover": {
          backgroundColor: hoverBgColour,
          color: hoverTextColour,
        },
        boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px;",
        ...sx,
      }}
      disabled={disabled}
    >
      <Typography fontWeight={600} fontSize={fontSize}>
        {" "}
        {label}
      </Typography>
    </Button>
  );
};
