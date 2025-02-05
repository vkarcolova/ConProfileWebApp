import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  Tab,
  Tabs,
  IconButton,
  DialogTitle,
  Button,
  Alert,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { ChartData, ColumnDTO } from "../../shared/types";
import { CalculatedTable } from "./CalculatedTable";
import CloseIcon from "@mui/icons-material/Close";
import { clientApi } from "../../shared/apis";
import ReactECharts from 'echarts-for-react';
import { toast } from "react-toastify";

interface CalculateDataProps {
  columns: ColumnDTO[];
  setColumns: (columns: ColumnDTO[]) => void;
  saveColumn: (
    column: ColumnDTO,
    calculatedIntensities: number[],
    excitations: number[]
  ) => Promise<boolean>;
}

const CalculateData: React.FC<CalculateDataProps> = ({
  columns,
  setColumns,
  saveColumn,
}) => {
  const [open, setOpen] = useState(false); // Stav pre modálne okno
  const [selectedTab, setSelectedTab] = useState(0); // Stav pre aktuálne vybraný tab
  const [calculatedIntensities, setCalculatedIntensities] = useState<number[]>(
    []
  );
  const [chartData, setChartData] = useState<ChartData[] | undefined>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [options, setOptions] = useState<any>(null);

  useEffect(() => {
    if (columns.length === 0 || open === false) return;

    const chartData: ChartData[] = [];
    chartData.push({
      data: columns[selectedTab].intensities,
      label: columns[selectedTab].name,
    });
    setOptions({
      xAxis: { type: "category", data: columns[0].excitations },
      yAxis: {
        type: "value",
        min: Math.min(...chartData.flatMap(obj => obj.data.filter((value): value is number => value !== undefined))),
        max: Math.max(...chartData.flatMap(obj => obj.data.filter((value): value is number => value !== undefined))),
          axisLabel: {
            formatter: (value: number) => value.toFixed(2), 
          },
      },
      series: chartData.map(({ data, label }) => ({
        name: label,
        type: "line",
        data: data.map((value) => value ?? null),
        smooth: true,
        connectNulls: false,
      })),
      tooltip: { trigger: "axis" },
      legend: { show: true },

    });
    setChartData(chartData);
  }, [open, columns]);

  const findgapStartValues = (numbers: (number | undefined)[]): number[] => {
    if (columns.length === 0 || open === false) return [];

    const gapLastIndices = new Set<number>();
    if (numbers[0] === undefined) {
      gapLastIndices.add(0);
    }

    numbers.forEach((value, index) => {
      if (value === undefined) {
        for (let i = index - 1; i >= 0; i--) {
          if (numbers[i] !== undefined) {
            gapLastIndices.add(i); 
            break;
          }
        }
      }
    });
    const lastExcitations: number[] = [];
    gapLastIndices.forEach((index) => {
      lastExcitations.push(columns[selectedTab].excitations[index]);
    });
    return lastExcitations;
  };
  const gapStartValues =
    columns.length > 0
      ? findgapStartValues(columns[selectedTab].intensities)
      : [];

  const onClick = async () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false); 
    setCalculatedIntensities([]);
    setChartData(undefined);
    setSelectedTab(0);
    setOptions(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    changeTab(newValue);
    const chartData: ChartData[] = [];
    chartData.push({
      data: columns[newValue].intensities,
      label: columns[newValue].name,
    });

    
    setOptions({
      xAxis: { type: "category", data: columns[newValue].excitations },
      yAxis: {
        type: "value",
        min: Math.min(...chartData.flatMap(obj => obj.data.filter((value): value is number => value !== undefined))),
        max: Math.max(...chartData.flatMap(obj => obj.data.filter((value): value is number => value !== undefined))),
          axisLabel: {
            formatter: (value: number) => value.toFixed(2),
          },
      },
      series: chartData.map(({ data, label }) => ({
        name: label,
        type: "line",
        data: data.map((value) => value ?? null),
        smooth: true,
        connectNulls: false,
      })),
      tooltip: { trigger: "axis" },
      legend: { show: true },

    });
    setChartData(chartData);
  };

  const changeTab = (newValue: number) => {
    setSelectedTab(newValue); // Zmena aktívneho tabu
    setCalculatedIntensities([]);
  };

  const handleCalculateData = async () => {
    await clientApi
      .calculateEmptyData(columns[selectedTab])
      .then(async (response) => {
        setCalculatedIntensities(response.data.onlyValues);
        const newChartData = chartData!;
        newChartData.push({
          data: response.data.onlyValues,
          label: "Dopočítané",
        });
        setChartData(newChartData);
        const newSeries = {
          name: "Dopočítané", 
          type: "line",      
          data: response.data.onlyValues,
          smooth: true,       
          connectNulls: false,
          color: "#ff0000",
        };  
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setOptions((prevOptions: any) => ({
          ...prevOptions, // zachovávame všetky predchádzajúce vlastnosti options
          series: [...prevOptions?.series || [], newSeries], // pridáme novú sériu
        }));
      })
  };

  const handleApplyData = async () => { 
    const intensities = calculatedIntensities.filter(
      (x) => x !== null
    );
    const onlyExcitations = [];
    for (
      let i = 0;
      i < columns[selectedTab].excitations.length;
      i++
    ) {
      if (
        columns[selectedTab].intensities[i] === undefined
      ) {
        onlyExcitations.push(
          columns[selectedTab].excitations[i]
        );
      }
    }
    const result = await saveColumn(
      columns[selectedTab],
      intensities,
      onlyExcitations
    );
    if (result === true) {
      const columnName = columns[selectedTab].name;
      const filteredColumns = columns.filter(
        (column) => column.name !== columnName
      );
      setSelectedTab(0);
      setColumns(filteredColumns);
      if (filteredColumns.length === 0) {
        handleClose();
      }
      changeTab(0);
      toast.success(
        "Stĺpec " + columnName + " bol úspešne uložený"
      );
    } else {
      toast.error("Nepodarilo sa uložiť stĺpec");
    }
  };

  return (
    <>
      {" "}
      {columns.length > 0 ? (
        <>
          <Alert
            onClick={() => {
              onClick();
            }}
            severity="warning"
            sx={{
              margin: "10px",
              borderRadius: "40px",
              padding: "3px",
              bgcolor: "#fff4e5",
              backdropFilter: "blur(24px)",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: `0 0 1px rgba(85, 166, 246, 0.1), 1px 1.5px 2px -1px rgba(85, 166, 246, 0.15), 4px 4px 12px -2.5px rgba(85, 166, 246, 0.15)`,
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "white", // Efekt pri hover
              },
              transition: "transform 0.3s ease, background-color 0.3s ease",
            }}
          >
            {" "}
            Priečinok obsahuje súbory s prázdnymi hodnotami.
            <br />
            <span style={{ fontWeight: "bold" }}>
              Kliknite sem, pre ich dopočítanie
            </span>
          </Alert>

          <Dialog
            onClose={() => {
              handleClose();
            }}
            aria-labelledby="customized-dialog-title"
            open={open}
            fullWidth={true}
            maxWidth="xl"
            
            sx={{height: "100%"}}
          >
            <DialogTitle
              sx={{ m: 0, paddingBottom: 0 }}
              id="customized-dialog-title"
            >
              Dopočítanie hodnôt pre súbor:
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

            <DialogContent sx={{ marginTop: "none", paddingTop: "0px" , maxHeight: "90vh"}}>
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
                  width: "100%", // Celá šírka kontajnera
                  backgroundColor: "white", // Biele pozadie
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    flexDirection: "row", // Komponenty budú pod sebou
                    display: "flex", // Flexbox na umiestnenie komponentov vedľa seba
                  }}
                >
                  {" "}
                  <Box sx={{ width: "50%", height: "45vh" }}>
                    {chartData && options && (<>
                         <ReactECharts
                                              option={options}
                                              style={{
                                                width: "100%",
                                                height: "100%",
                                                margin: "none",
                                                paddingTop: "20px",
                                              }}
                                              notMerge={true}
                                            />
                                         
                    </>
                    )}
                    <Typography variant="body1" sx={{ textAlign: "center" }}>
                      Medzery hodnôt začínajú po excitáciach:{" "}
                      {gapStartValues.join(", ")}
                    </Typography>
                  </Box>
                  <Box sx={{ width: "50%", paddingLeft: "20px" }}>
                    <CalculatedTable
                      excitacion={columns[selectedTab].excitations}
                      intensities={columns[selectedTab].intensities}
                      calculatedIntensities={calculatedIntensities}
                    />
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between", // Rozdeľuje na dve časti
                    width: "100%",
                    marginTop: "50px",
                  }}
                >
                  <Box
                    sx={{
                      width: "45%", // Odhadovaná šírka pre okrúhly box
                      backgroundColor: "#f0f0f0", // Svetlá farba pozadia pre okrúhly box
                      borderRadius: "20px",
                      padding: "20px",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Poppins",
                        fontWeight: 500,
                        fontSize: "13px",
                        color: "#333",
                        textAlign: "justify",
                      }}
                    >
                      Medzery v údajoch budú doplnené nasledujúcim spôsobom:
                      <br />
                      Na začiatku a na konci rozsahu dát budú hodnoty dopočítané
                      <b> lineárnou extrapoláciou</b> na základe trendu v
                      najbližších dostupných bodoch.
                      <br />V strede rozsahu dát hodnoty budú dopočítané pomocou
                      kubickej <b>spline interpolácie</b>, ktorá prepája susedné
                      body.
                      <br />
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: "45%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Button
                      variant="outlined"
                      sx={{
                        borderRadius: "30px",
                        border: "2px solid #514986",
                        "&:hover": {
                          border: "2px solid #dcdbe7",
                        },
                        backgroundColor:
                          calculatedIntensities.length > 0
                            ? "#f6fafd"
                            : "#d5e1fb",

                        width: "60%",
                        marginBottom: "10px",
                      }}
                      disabled={calculatedIntensities.length > 0}
                      onClick={() => handleCalculateData()}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Poppins",
                          fontWeight: 500,
                          fontSize: "15px",
                          padding: "2px",
                          color:
                            calculatedIntensities.length > 0
                              ? "#84809c"
                              : "#514986",
                        }}
                        textTransform={"none"}
                      >
                        Dopočítať chýbajúce hodnoty
                      </Typography>
                    </Button>

                    {/* Druhé tlačidlo */}
                    <Button
                      variant="outlined"
                      sx={{
                        borderRadius: "30px",
                        border: "2px solid #514986",
                        "&:hover": {
                          border: "2px solid #dcdbe7",
                        },
                        backgroundColor: "#d5e1fb",
                        width: "60%",
                        visibility:
                          calculatedIntensities.length > 0
                            ? "visible"
                            : "hidden",
                      }}
                      onClick={async () => {
                        handleApplyData();
                      }}
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
                        Nahradiť pôvodné hodnoty
                      </Typography>
                    </Button>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Alert
          severity="warning"
          sx={{
            visibility: "hidden",
            margin: "10px",
            borderRadius: "40px",
            padding: "3px",
            border: "1px solid",
            boxShadow: `0 0 1px rgba(85, 166, 246, 0.1), 1px 1.5px 2px -1px rgba(85, 166, 246, 0.15), 4px 4px 12px -2.5px rgba(85, 166, 246, 0.15)`,
            cursor: "pointer",
          }}
        >
          {" "}
          Priečinok obsahuje súbory s prázdnymi hodnotami.
          <br />
          <span style={{ fontWeight: "bold" }}>
            Kliknite sem, pre ich dopočítanie
          </span>
        </Alert>
      )}
    </>
  );
};

export default CalculateData;
