/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ReactECharts from "echarts-for-react";
import "echarts-gl";

interface GraphDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  options: any;
  selectedFolder: number;
  projectName: string;
}

const GraphDialog: React.FC<GraphDialogProps> = ({
  open,
  setOpen,
  options,
  selectedFolder,
  projectName,
}) => {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (open && chartRef.current) {
      chartRef.current?.getEchartsInstance().resize(); // Ak sa otvorí dialóg, prispôsobíme veľkosť grafu
    }
  }, [open, options]);
  const exportChart = () => {
    if (chartRef.current) {
      const chartInstance = chartRef.current.getEchartsInstance();

      const dataURL = chartInstance.getDataURL({
        type: "png",
        backgroundColor: "#fff",
        pixelRatio: 2,
        width: 2000,
        height: 1000,
      });

      const link = document.createElement("a");
      link.href = dataURL;
      link.download = projectName + "_chart.png";
      link.click();
    }
  };
  return (
    <Dialog
      onClose={() => {
        setOpen(false);
      }}
      aria-labelledby="customized-dialog-title"
      open={open}
      fullWidth={true}
      maxWidth="lg"
      sx={{ height: "100vh" }}
    >
      <IconButton
        aria-label="close"
        onClick={() => {
          setOpen(false);
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

      <DialogContent
        sx={{
          marginTop: "32px",
          paddingBlock: "0px",
          height: "80vh", // Nastavíme výšku grafu
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ReactECharts
          option={{
            ...options, // Prenesené možnosti
            toolbox: {
              feature: {
                dataZoom: {
                  // Povolenie priblíženia a posúvania
                  yAxisIndex: "none",
                },
                saveAsImage: {},
              },
            },
            dataZoom: [
              {
                type: "inside", // Povolenie priblíženia myšou
                xAxisIndex: [0], // Povolenie priblíženia na ose X
                filterMode: "none",
              },
              {
                type: "slider", // Povolenie slidera na priblíženie
                showDataShadow: false,
                xAxisIndex: [0], // Povolenie priblíženia na ose X
              },
            ],
          }}
          style={{
            width: "100%",
            height: "90%", // Graf vyplní dostupný priestor v rámci DialogContent
            margin: "none",
          }}
          key={selectedFolder}
          notMerge={true}
          ref={chartRef}
        />
        <Button
          variant="outlined"
          sx={{
            borderRadius: "30px",
            border: "2px solid #514986",
            "&:hover": {
              border: "2px solid #dcdbe7",
            },
            backgroundColor: "#d5e1fb",
            width: "30%", // Širší button, ale s malou šírkou
            margin: "0 auto", // Umiestnenie na stred
          }}
          onClick={exportChart}
        >
          <Typography
            sx={{
              fontFamily: "Poppins",
              fontWeight: 500,
              fontSize: "15px",
              padding: "2px",
              color: "#514986",
            }}
            textTransform={"none"}
          >
            Exportovať graf
          </Typography>
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default GraphDialog;
