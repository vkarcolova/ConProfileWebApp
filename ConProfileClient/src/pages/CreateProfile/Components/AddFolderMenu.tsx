import {
  alpha,
  Box,
  Dialog,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  MenuProps,
  styled,
  Tooltip,
  tooltipClasses,
  
} from "@mui/material";
import React, { ChangeEvent, useRef } from "react";
import DatasetIcon from "@mui/icons-material/Dataset";
import GetAppIcon from "@mui/icons-material/GetApp";
import CloseIcon from "@mui/icons-material/Close";

import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import ExcelUploader from "../../Home/components/XlsxUploader";
import { ExcelContent } from "../../../shared/types";

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

interface AddFolderMenuProps {
  loadNewFolder: (e: ChangeEvent<HTMLInputElement>) => void;
  loadNewExcelFolder: (excelContent: ExcelContent) => void;
}

export const AddFolderMenu: React.FC<AddFolderMenuProps> = ({
  loadNewFolder,
  loadNewExcelFolder,
}) => {
    const [openModal, setOpenModal] = React.useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSelectFolder = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const closeMenuModal = () => { setOpenModal(false); handleClose(); }

  return (
    <>
      <Tooltip
        slotProps={{
          popper: {
            sx: {
              [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]:
                {
                  marginTop: "0px",
                  fontSize: "12px",
                },
            },
          },
        }}
        title="Pridať ďalší priečinok"
      >
        <IconButton
          sx={{
            width: "35px",
            height: "35px",
            color: "white",
          }}
          onClick={handleClick}
          aria-controls={open ? "demo-customized-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
        >
          <AddCircleOutlineRoundedIcon />
        </IconButton>
      </Tooltip>
      <input
        ref={inputRef}
        type="file"
        directory=""
        webkitdirectory=""
        onChange={loadNewFolder}
        multiple
        style={{ display: "none" }}
      />
    
      <StyledMenu
        id="demo-customized-menu"
        MenuListProps={{
          "aria-labelledby": "demo-customized-button",
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => {handleSelectFolder(); handleClose();}} disableRipple>
          <GetAppIcon />
          Načítať dáta z priečinku
        </MenuItem>
        <MenuItem
        onClick={() => {setOpenModal(true); handleClose();}} disableRipple
        >
          <DatasetIcon />
          Načítať dáta zo súboru Excel
        </MenuItem>
      </StyledMenu>

      <Dialog
        aria-labelledby="customized-dialog-title"
        open={openModal}
        fullWidth={true}
        maxWidth="md"
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Načítanie dát
        </DialogTitle>

        <IconButton
          aria-label="close"
          onClick={() => {
            setOpenModal(false);

          }}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box textAlign="center" sx={{ height: "70vh", padding: 2 }}>
          <ExcelUploader newProject={false} loadNewExcelFolder={loadNewExcelFolder} closeMenuModal={closeMenuModal}/>
        </Box>
      </Dialog>
    </>
  );
};
