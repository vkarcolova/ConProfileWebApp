/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dialog, DialogContent, IconButton } from "@mui/material";
import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import "echarts-gl";
import Plot from "react-plotly.js";

interface ContourMapDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  zMatrix: number[][];
  excitation: number[];
  spectres: number[];
}

const ContourMapDialog: React.FC<ContourMapDialogProps> = ({
  open,
  setOpen,
  zMatrix,
  excitation,
  spectres,
}) => {
  return (
    <Dialog
      onClose={() => setOpen(false)}
      aria-labelledby="customized-dialog-title"
      open={open}
      fullWidth={true}
      maxWidth="lg"
      sx={{ height: "100vh" }}
    >
      <IconButton
        aria-label="close"
        onClick={() => setOpen(false)}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent
        sx={{
          marginTop: "32px",
          paddingBlock: "0px",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Plot
          data={[
            {
              z: zMatrix,
              x: excitation,
              y: spectres.map((_, i) => i),
              type: "contour",
              colorscale: "YlOrRd",
              contours: {
                coloring: "heatmap",
                showlabels: true,
                labelfont: {
                  size: 12,
                  color: "black",
                },
              },
            },
          ]}
          layout={{
            title: "Kontúrová mapa intenzít",
            xaxis: { title: "Excitácia (nm)" },
            yaxis: {
              title: "Spektrum",
              tickvals: spectres.map((_, i) => i), // pozície tickov (rovnomerné)
              ticktext: spectres.map((val) => val.toString()), // zobrazované hodnoty
            },
            autosize: true,
            margin: { t: 50 },
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ContourMapDialog;
