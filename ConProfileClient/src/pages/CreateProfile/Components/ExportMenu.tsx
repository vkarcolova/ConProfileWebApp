import {
  alpha,
  Button,
  Menu,
  MenuItem,
  MenuProps,
  styled,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import React from "react";
import SsidChartIcon from "@mui/icons-material/SsidChart";
import DatasetIcon from "@mui/icons-material/Dataset";
import GetAppIcon from "@mui/icons-material/GetApp";
import { Profile, ProjectDTO, TableData } from "../../../shared/types";
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
  multiplied: boolean;
  tableData: TableData;
  profile: Profile | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartRef: React.RefObject<any>;
}
export const ExportMenu: React.FC<ExportMenuProps> = ({
  projectData,
  multiplied,
  tableData,
  profile,
  chartRef
}) => {
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

  const handleExportDataAsCSV = () => {
    const masterMatrix = [];
    const header = [];
    header.push("Excitacie");
    masterMatrix.push(tableData.excitation);
    tableData.intensities.forEach((intensity) => {
      header.push(intensity.name);
      masterMatrix.push(intensity.intensities);
    });

    if (tableData.multipliedintensities && profile) {
      masterMatrix.push([]);
      header.push("", "Excitacie");
      masterMatrix.push(tableData.excitation);
      tableData.multipliedintensities.forEach((intensity) => {
        header.push(intensity.name);
        masterMatrix.push(intensity.intensities);
      });

      header.push(" ", "Excitácie", "Profil");
      masterMatrix.push([]);
      masterMatrix.push(tableData.excitation);
      masterMatrix.push(profile.profile);
    }

    const rows = [];
    rows.push(header.join(";"));

    const rowCount = masterMatrix[0].length;

    for (let i = 0; i < rowCount; i++) {
      const row = masterMatrix.map((column) =>
        column[i] !== undefined ? column[i] : ""
      );
      rows.push(row.join(";"));
    }

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportChart = () => {
    if (chartRef.current) {
      const chartInstance = chartRef.current.getEchartsInstance();
      
      
      const dataURL = chartInstance.getDataURL({
        type: 'png',  
        backgroundColor: '#fff',
        pixelRatio: 2,  
        width: 2000,  
        height: 1000,  
      });

      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'chart.png';  
      link.click();
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant="contained"
        role="button"
        sx={{
          backgroundColor: "white",
          color: "rgba(59, 49, 119, 0.87)",
          textTransform: "none",
          "&:hover": {
            backgroundColor: "#E2E3E8",
            color: "rgba(59, 49, 119, 0.87)",
          },
          boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px;",
          marginBottom: "10px",
          width: "70%",
          height: "40px",
          borderRadius: "10px",
        }}
        aria-controls={open ? "demo-customized-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        disableElevation
        endIcon={<KeyboardArrowDownIcon />}
      >
        <Typography fontSize={"15px"} fontWeight={550}>
          Exportovať
        </Typography>
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
        <MenuItem
          onClick={handleExportDataAsCSV}
          disableRipple
          disabled={multiplied}
        >
          <DatasetIcon />
          Exportovať dáta ako CSV
        </MenuItem>
        <MenuItem onClick={exportChart} disableRipple>
          <SsidChartIcon />
          Exportovať graf ako .png
        </MenuItem>
      </StyledMenu>
    </>
  );
};
