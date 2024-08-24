import {
  alpha,
  Button,
  Menu,
  MenuItem,
  MenuProps,
  styled,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import React from "react";
import SsidChartIcon from "@mui/icons-material/SsidChart";
import DatasetIcon from "@mui/icons-material/Dataset";
import GetAppIcon from "@mui/icons-material/GetApp";
import { basicButtonStyle, lightButtonStyle } from "../../../shared/styles";
import { ProjectDTO } from "../../../shared/types";
import { saveAs } from "file-saver";

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    {...props}
  />
))(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color:
      theme.palette.mode === "light"
        ? "rgb(55, 65, 81)"
        : theme.palette.grey[300],
    boxShadow:
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": {
      padding: "4px 0",
    },
    "& .MuiMenuItem-root": {
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      "&:active": {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity
        ),
      },
    },
  },
}));

interface ExportMenuProps {
  projectData: ProjectDTO | null;
}
export const ExportMenu: React.FC<ExportMenuProps> = ({ projectData }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportProjectData = () => {
    const jsonString = JSON.stringify(projectData);
    const blob = new Blob([jsonString], { type: "application/json" });
    saveAs(blob, `project.cprj`);
    handleClose();
  };
  return (
    <>
      <Button
        variant="contained"
        role="button"
        sx={{
          ...basicButtonStyle,
          ...lightButtonStyle,
          marginBottom: "10px",
        }}
        aria-controls={open ? "demo-customized-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        disableElevation
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
      >
        Exportovať
      </Button>
      <StyledMenu
        id="demo-customized-menu"
        MenuListProps={{
          "aria-labelledby": "demo-customized-button",
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={handleExportProjectData} disableRipple>
          <GetAppIcon />
          Exportovať projekt
        </MenuItem>
        <MenuItem onClick={handleClose} disableRipple>
          <DatasetIcon />
          Exportovať dáta ako CSV
        </MenuItem>
        <MenuItem onClick={handleClose} disableRipple>
          <SsidChartIcon />
          Exportovať graf ako .png
        </MenuItem>
      </StyledMenu>
    </>
  );
};
