import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  Tab,
  Tabs,
  IconButton,
  DialogTitle,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { ChartData, ColumnDTO } from "../../shared/types";
import { CalculatedTable } from "./CalculatedTable";
import { ScatterChart } from "@mui/x-charts/ScatterChart";
import CloseIcon from "@mui/icons-material/Close";

interface CalculateDataProps {
  columns: ColumnDTO[];
}

const CalculateData: React.FC<CalculateDataProps> = ({ columns }) => {
  const [open, setOpen] = useState(false); // Stav pre modálne okno
  const [selectedTab, setSelectedTab] = useState(0); // Stav pre aktuálne vybraný tab
  const [calculatedIntensities, setCalculatedIntensities] = useState<number[]>(
    []
  );
  const [chartData, setChartData] = useState<ChartData[] | undefined>([]);

  useEffect(() => {
    const chartData: ChartData[] = [];
    chartData.push({
      data: columns[selectedTab].intensities,
      label: columns[selectedTab].name,
    });
    setChartData(chartData);
  }, []);

  useEffect(() => {
    console.log(chartData);
    if (chartData) console.log("existuje");
  }, [chartData]);

  const onClick = async () => {
    // await clientApi.calculateEmptyData(columns);
    setOpen(true); // Otvorenie modálneho okna po kliknutí
  };

  const handleClose = () => {
    setOpen(false); // Zatvorenie modálneho okna
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue); // Zmena aktívneho tabu
    const chartData: ChartData[] = [];
    chartData.push({
      data: columns[newValue].intensities,
      label: columns[newValue].name,
    });
    setChartData(chartData);
  };

  return (
    <>
      <Box
        sx={{
          borderRadius: "40px",
          bgcolor: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(24px)",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: `0 0 1px rgba(85, 166, 246, 0.1), 1px 1.5px 2px -1px rgba(85, 166, 246, 0.15), 4px 4px 12px -2.5px rgba(85, 166, 246, 0.15)`,
          alignItems: "center",
          display: "flex",
          width: "60%",
          marginTop: "10px",
          marginLeft: "10px",
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "white", // Efekt pri hover
          },
          transition: "transform 0.3s ease, background-color 0.3s ease",
        }}
        onClick={() => {
          onClick();
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: "black",
            fontSize: "12px",
            lineHeight: "1",
            padding: "10px",
          }}
        >
          Priečinok obsahuje súbory s prázdnymi hodnotami.
          <br />
          Kliknite sem, pre ich dopočítanie
        </Typography>
      </Box>

      {/* Modálne okno */}
      <Dialog
        onClose={() => {
          handleClose();
        }}
        aria-labelledby="customized-dialog-title"
        open={open}
        fullWidth={true}
        maxWidth="lg"
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Porovnanie profilov
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            aria-label="columns tabs"
          >
            {columns.map((column, index) => (
              <Tab key={index} label={column.name} />
            ))}
          </Tabs>

          {/* Obsah pre každý tab */}
          <Box
            sx={{
              display: "flex", // Flexbox na umiestnenie komponentov vedľa seba
              height: "500px", // Nastavíme výšku na 50% výšky obrazovky
              width: "500px", // Celá šírka kontajnera
              backgroundColor: "white", // Biele pozadie
              flexDirection: "row", // Komponenty budú pod sebou
            }}
          >
            {" "}
            <Box>
              {chartData && (
                <ScatterChart
                  key={selectedTab} // Ak vyberieš nový tab, vynúti sa nový render
                  series={chartData?.map((data) => ({
                    label: data.label,
                    data: data.data
                      .map((v, idx) =>
                        v !== undefined
                          ? {
                              x: columns[selectedTab].excitations[idx],
                              y: v,
                              id: idx,
                            }
                          : null
                      )
                      .filter((point) => point !== null),
                  }))}
                  yAxis={[{ min: 0 }]}
                  xAxis={[{ min: 250 }]}
                  sx={{
                    backgroundColor: "white",
                    height: "200px",
                    width: "200px",
                  }}
                />
              )}
              <CalculatedTable
                excitacion={columns[selectedTab].excitations}
                intensities={columns[selectedTab].intensities}
                calculatedIntensities={calculatedIntensities}
              />
              fsdfd dsfsdf
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CalculateData;
