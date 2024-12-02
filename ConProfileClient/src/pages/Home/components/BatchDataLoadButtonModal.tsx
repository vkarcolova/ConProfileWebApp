import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import React from "react";
import CloseIcon from "@mui/icons-material/Close";

interface BatchDataLoadButtonModalProps {}

const BatchDataLoadButtonModal: React.FC<BatchDataLoadButtonModalProps> = (
  props
) => {
  const [openModal, setOpenModal] = React.useState(false);

  return (
    <>
      <Button
        onClick={() => setOpenModal(true)}
        sx={{
          backgroundColor: "rgba(59, 49, 119, 0.87)",
          width: "300px",
          borderRadius: "30px",
          color: "white",
          padding: "10px",
          marginBlock: "5px",
          height: "70px",

          textTransform: "none",
          "&:hover": {
            backgroundColor: "#625b92",
            color: "white",
          },
          boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px;",
        }}
      >
        <Typography fontWeight={500} fontSize={"20px"}>
          Načítať dáta dávkovo
        </Typography>
      </Button>
      <Dialog
        aria-labelledby="customized-dialog-title"
        open={openModal}
        fullWidth={true}
        maxWidth="lg"
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Porovnanie profilov
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
        <DialogContent dividers>Content</DialogContent>
      </Dialog>
    </>
  );
};

export default BatchDataLoadButtonModal;
