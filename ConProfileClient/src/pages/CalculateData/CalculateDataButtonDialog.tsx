/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { AllFolderData, ChartData, ColumnDTO } from "../../shared/types";
import { CalculatedTable } from "./CalculatedTable";
import CloseIcon from "@mui/icons-material/Close";
import { clientApi } from "../../shared/apis";
import ReactECharts from "echarts-for-react";
import { toast } from "react-toastify";

interface CalculateDataProps {
  columns: ColumnDTO[];
  setColumns: (columns: ColumnDTO[]) => void;
  saveColumnWithEmptyData: (
    column: ColumnDTO,
    calculatedIntensities: number[],
    excitations: number[]
  ) => Promise<boolean>;
  saveColumnWithSameData: (
    column: ColumnDTO,
    calculatedIntensities: number[],
    excitations: number[]
  ) => Promise<boolean>;
  projectFolder: AllFolderData;
  treshold: number;
}

const CalculateData: React.FC<CalculateDataProps> = ({
  columns,
  setColumns,
  saveColumnWithEmptyData,
  saveColumnWithSameData,
  projectFolder,
  treshold,
}) => {
  const [open, setOpen] = useState(false); // Stav pre modálne okno
  const [selectedTab, setSelectedTab] = useState(0); // Stav pre aktuálne vybraný tab
  const [calculatedEmptyIntensities, setCalculatedEmptyIntensities] = useState<
    (number | undefined)[]
  >([]);
  const [calculatedSameIntensities, setCalculatedSameIntensities] = useState<
    (number | undefined)[]
  >([]);
  const [chartData, setChartData] = useState<ChartData[] | undefined>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [options, setOptions] = useState<any>(null);
  const [isSameValues, setIsSameValues] = useState(false);
  const [isEmptyValues, setIsEmptyValues] = useState(false);
  const [columnSpectrum, setColumnSpectrum] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    if (columns.length === 0 || open === false) return;
    const issamevalues = hasTooManyRepeats(columns[selectedTab].intensities);

    if (columns[selectedTab].spectrum !== undefined) {
      setColumnSpectrum(columns[selectedTab].spectrum);
    }
    setIsSameValues(issamevalues);
    setIsEmptyValues(columns[selectedTab].intensities.includes(undefined));
    const chartData: ChartData[] = [];
    chartData.push({
      data: columns[selectedTab].intensities,
      label: columns[selectedTab].name,
    });
    const newOptions = {
      xAxis: { type: "category", data: columns[0].excitations },
      yAxis: {
        type: "value",
        min: Math.min(
          ...chartData.flatMap((obj) =>
            obj.data.filter((value): value is number => value !== undefined)
          )
        ),
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
        symbol: "none",
      })),
      tooltip: { trigger: "axis" },
      legend: { show: true },
    };

    const newSeries = [];

    if (isSameValues && calculatedSameIntensities.length > 0) {
      chartData.push({
        data: calculatedSameIntensities,
        label: "Dopočítané z rovnakých dát",
      });
      newSeries.push({
        name: "Dopočítané z rovnakých dát",
        type: "line",
        data: calculatedSameIntensities.map((value) => value ?? null), // Konverzia undefined -> null
        smooth: true,
        connectNulls: false,
        color: "#ff0000",
        symbol: "none",
      });
    }
    if (isEmptyValues && calculatedEmptyIntensities.length > 0) {
      chartData.push({
        data: calculatedEmptyIntensities,
        label: "Dopočítané z prázdnych dát",
      });
      newSeries.push({
        name: "Dopočítané z prázdnych dát",
        type: "line",
        data: calculatedEmptyIntensities.map((value) => value ?? null), // Konverzia undefined -> null
        smooth: true,
        connectNulls: false,
        color: "green",
        symbol: "none",
      });
    }
    newOptions.series = [...newOptions.series, ...newSeries];

    setOptions(newOptions);
    setChartData(chartData);
  }, [open, columns]);

  const hasTooManyRepeats = (numbers: (number | undefined)[]): boolean => {
    const threshold = numbers.length * (treshold / 100);
    let count = 1;
    let lastValue = numbers[0];
    let hasTooManyRepeats = false;

    numbers.forEach((value, index) => {
      if (index === 0) return;

      // Ak je hodnota undefined alebo 0, neberieme ju ako opakujúcu sa
      if (
        value === lastValue ||
        (lastValue !== undefined && lastValue !== 0 && value === lastValue)
      ) {
        count++;
      } else {
        count = 1;
        lastValue = value;
      }

      if (count > threshold && lastValue !== undefined && lastValue !== 0) {
        hasTooManyRepeats = true;
      }
    });

    return hasTooManyRepeats;
  };

  //pri dopocitani tam dat toto
  //vysledok porovnat s povodnymi hodnotami
  //ak su nejake na rovnakom indexe dat do osobitneho pola ostatne do osobitneho
  //jedny pojdu do povodnej funkcie druhe do nahradzovacej

  function replaceLongRepeatingNumbers(
    numbers: (number | undefined)[]
  ): (number | undefined)[] {
    if (!numbers || numbers.length === 0) return numbers;
    const minRepeatCount = numbers.length * (treshold / 100);
    const result: (number | undefined)[] = [...numbers]; // Kópia pôvodného poľa
    let count = 1;
    let lastValue = numbers[0];
    let startIndex = 0;

    for (let i = 1; i < numbers.length; i++) {
      const currentValue = numbers[i];

      if (
        currentValue === lastValue &&
        currentValue !== 0 &&
        currentValue !== undefined
      ) {
        count++;
      } else {
        if (
          count >= minRepeatCount &&
          lastValue !== 0 &&
          lastValue !== undefined
        ) {
          for (let j = startIndex; j < i; j++) {
            result[j] = undefined; // Nastavíme na undefined len v kópii
          }
        }
        count = 1;
        lastValue = currentValue;
        startIndex = i;
      }
    }

    if (count >= minRepeatCount && lastValue !== 0 && lastValue !== undefined) {
      for (let j = startIndex; j < numbers.length; j++) {
        result[j] = undefined;
      }
    }

    return result; // Vrátime kópiu, nemeníme originál
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // const gapStartValues =
  //   columns.length > 0
  //     ? findgapStartValues(columns[selectedTab].intensities)
  //     : [];

  const onClick = async () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCalculatedEmptyIntensities([]);
    setCalculatedSameIntensities([]);
    setChartData(undefined);
    setSelectedTab(0);
    setOptions(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    changeTab(newValue);
    const chartData: ChartData[] = [];
    const issamevalues = hasTooManyRepeats(columns[newValue].intensities);

    chartData.push({
      data: columns[newValue].intensities,
      label: columns[newValue].name,
    });
    setIsSameValues(issamevalues);
    setIsEmptyValues(columns[newValue].intensities.includes(undefined));
    setOptions({
      symbol: "none",

      xAxis: { type: "category", data: columns[newValue].excitations },
      yAxis: {
        type: "value",
        min: Math.min(
          ...chartData.flatMap((obj) =>
            obj.data.filter((value): value is number => value !== undefined)
          )
        ),

        axisLabel: {
          formatter: (value: number) => value.toFixed(2),
        },
      },
      series: chartData.map(({ data, label }) => ({
        symbol: "none",

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
    if (columns[newValue].spectrum !== undefined) {
      setColumnSpectrum(columns[newValue].spectrum);
    }
  };

  const changeTab = (newValue: number) => {
    setSelectedTab(newValue); // Zmena aktívneho tabu
    setCalculatedEmptyIntensities([]);
    setCalculatedSameIntensities([]);
  };

  const handleCalculateDataHermit = async () => {
    let valuesToCalculate = [...columns[selectedTab].intensities];
    if (isSameValues) {
      valuesToCalculate = replaceLongRepeatingNumbers(valuesToCalculate);
    }

    const columnToSend = {
      ...columns[selectedTab], // Plytká kópia objektu
      intensities: [...valuesToCalculate], // Hlboká kópia intenzít
    };

    await clientApi.calculateEmptyData(columnToSend).then(async (response) => {
      const all: (number | undefined)[] = response.data.onlyValues;

      const onlyEmpty = [];
      const onlySame = [];
      if (isEmptyValues) {
        for (let i = 0; i < all.length; i++) {
          if (columns[selectedTab].intensities[i] == undefined) {
            onlyEmpty[i] = all[i];
          } else {
            onlyEmpty[i] = undefined;
          }
        }
        setCalculatedEmptyIntensities(onlyEmpty);
      }

      if (isSameValues) {
        for (let i = 0; i < all.length; i++) {
          if (
            columns[selectedTab].intensities[i] != undefined &&
            all[i] != null
          ) {
            onlySame[i] = all[i];
          } else {
            onlySame[i] = undefined;
          }
        }
        setCalculatedSameIntensities(onlySame);
      }

      const newChartData = chartData!.filter(
        (item) =>
          item.label !== "Dopočítané z rovnakých dát" &&
          item.label !== "Dopočítané z prázdnych dát" &&
          item.label !== "Referenčný stĺpec"
      );

      const newSeries: any[] = [];
      const filteredSeries = (options?.series || []).filter(
        (item: any) =>
          item.name !== "Dopočítané z rovnakých dát" &&
          item.name !== "Dopočítané z prázdnych dát" &&
          item.name !== "Referenčný stĺpec"
      );

      if (isSameValues) {
        newChartData.push({
          data: onlySame,
          label: "Dopočítané z rovnakých dát",
        });
        newSeries.push({
          name: "Dopočítané z rovnakých dát",
          type: "line",
          data: onlySame,
          smooth: true,
          connectNulls: false,
          color: "#ff0000",
          symbol: "none",
        });
      }

      if (isEmptyValues) {
        newChartData.push({
          data: onlyEmpty,
          label: "Dopočítané z prázdnych dát",
        });
        newSeries.push({
          name: "Dopočítané z prázdnych dát",
          type: "line",
          data: onlyEmpty,
          smooth: true,
          connectNulls: false,
          color: "green",
          symbol: "none",
        });
      }

      setChartData(newChartData);
      setOptions((prevOptions: any) => ({
        ...prevOptions,
        series: [...filteredSeries, ...newSeries], // Odstránené staré série, pridané nové
      }));
    });
  };
  const spectres = [0, 2, 8, 32, 128, 512];
  const currentIndex = spectres.indexOf(columnSpectrum!);

  const handleCalculateAdjustData = async (spectreBefore: boolean) => {
    //spectre before ci sa vybera spektrum pred alebo po current, ak pred nemoze byt napr spektrum 0 a ak po nemoze byt 512
    let valuesToCalculate = [...columns[selectedTab].intensities];
    if (isSameValues) {
      valuesToCalculate = replaceLongRepeatingNumbers(valuesToCalculate);
    }

    const columnToSend = {
      ...columns[selectedTab], // Plytká kópia objektu
      intensities: [...valuesToCalculate], // Hlboká kópia intenzít
    };

    if (
      columnSpectrum === undefined ||
      (columnSpectrum === 0 && spectreBefore) ||
      (columnSpectrum === 512 && !spectreBefore) ||
      !spectres.includes(columnSpectrum)
    ) {
      toast.error("Nepodarilo sa získať spektrum stĺpca");
      return;
    }
    let exampleColumnSpectre = columnSpectrum;
    if (spectreBefore) {
      exampleColumnSpectre =
        currentIndex > 0 ? spectres[currentIndex - 1] : columnSpectrum;
    } else {
      exampleColumnSpectre =
        currentIndex < 512 ? spectres[currentIndex + 1] : columnSpectrum;
    }

    const foundColumn = projectFolder.folderData.data.find(
      (col) => col.spectrum === exampleColumnSpectre
    );

    const exampleData: number[] | undefined = foundColumn?.intensity.map(
      (value) => value.intensity
    );

    const exampleColumnName = foundColumn?.filename;

    if (columns.find((col) => col.name === exampleColumnName) !== undefined) {
      toast.error(
        "Referenčný stĺpec sa nachádza v zozname stĺpcov na dopočítanie dát, a teda nie je možné podľa neho dopočítať dáta pre tieto hodnoty. Buď najprv dopočítajte dáta pre referečný stĺpec " +
          exampleColumnName +
          " alebo použite na dopočítanie prvú metódu.",
        { autoClose: 10000 }
      );
      return;
    }

    if (columnSpectrum === exampleColumnSpectre || exampleData === undefined) {
      toast.error("Nepodarilo sa získať stlpec na porovnanie");
      return;
    }

    await clientApi
      .calculateAjustedData(columnToSend, exampleData)
      .then(async (response) => {
        const all: (number | undefined)[] = response.data.adjustedValues;

        const onlyEmpty = [];
        const onlySame = [];
        if (isEmptyValues) {
          for (let i = 0; i < all.length; i++) {
            if (columns[selectedTab].intensities[i] == undefined) {
              onlyEmpty[i] = all[i];
            } else {
              onlyEmpty[i] = undefined;
            }
          }
          setCalculatedEmptyIntensities(onlyEmpty);
        }

        if (isSameValues) {
          for (let i = 0; i < all.length; i++) {
            if (
              columns[selectedTab].intensities[i] != undefined &&
              all[i] != null
            ) {
              onlySame[i] = all[i];
            } else {
              onlySame[i] = undefined;
            }
          }
          setCalculatedSameIntensities(onlySame);
        }

        const newChartData = chartData!.filter(
          (item) =>
            item.label !== "Dopočítané z rovnakých dát" &&
            item.label !== "Dopočítané z prázdnych dát" &&
            item.label !== "Referenčný stĺpec"
        );

        const newSeries: any[] = [];
        const filteredSeries = (options?.series || []).filter(
          (item: any) =>
            item.name !== "Dopočítané z rovnakých dát" &&
            item.name !== "Dopočítané z prázdnych dát" &&
            item.name !== "Referenčný stĺpec"
        );

        if (isSameValues) {
          newChartData.push({
            data: onlySame,
            label: "Dopočítané z rovnakých dát",
          });
          newSeries.push({
            name: "Dopočítané z rovnakých dát",
            type: "line",
            data: onlySame,
            smooth: true,
            connectNulls: false,
            color: "#ff0000",
            symbol: "none",
          });
        }

        if (isEmptyValues) {
          newChartData.push({
            data: onlyEmpty,
            label: "Dopočítané z prázdnych dát",
          });
          newSeries.push({
            name: "Dopočítané z prázdnych dát",
            type: "line",
            data: onlyEmpty,
            smooth: true,
            connectNulls: false,
            color: "green",
            symbol: "none",
          });
        }

        newChartData.push({
          data: onlyEmpty,
          label: "Referenčný stĺpec",
        });
        newSeries.push({
          name: "Referenčný stĺpec",
          type: "line",
          data: exampleData,
          smooth: true,
          connectNulls: false,
          color: "yellow",
          symbol: "none",
        });

        setChartData(newChartData);
        setOptions((prevOptions: any) => ({
          ...prevOptions,
          series: [...filteredSeries, ...newSeries], // Odstránené staré série, pridané nové
        }));
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Nepodarilo sa dopočítať hodnoty");
        }
      });
  };

  const handleApplyDataWithEmptyData = async () => {
    if (!isEmptyValues) return;
    const intensities = calculatedEmptyIntensities.filter(
      (x) => x !== undefined
    );
    const onlyExcitations = [];
    for (let i = 0; i < columns[selectedTab].excitations.length; i++) {
      if (columns[selectedTab].intensities[i] === undefined) {
        onlyExcitations.push(columns[selectedTab].excitations[i]);
      }
    }
    const result = await saveColumnWithEmptyData(
      columns[selectedTab],
      intensities,
      onlyExcitations
    );
    if (result === true && !isSameValues) {
      //ak este nie su rovnake hodnoty
      const columnName = columns[selectedTab].name;
      let filteredColumns = [...columns];

      filteredColumns = filteredColumns.filter(
        (column) => column.name !== columnName
      );
      console.log(filteredColumns);
      setSelectedTab(0);
      setColumns(filteredColumns);
      if (filteredColumns.length === 0) {
        handleClose();
      }
      changeTab(0);
      toast.success("Stĺpec " + columnName + " bol úspešne uložený");
    } else if (result === true && isSameValues) {
      const previousIntensities = [...columns[selectedTab].intensities];
      calculatedEmptyIntensities.forEach((value, index) => {
        if (value !== undefined) {
          previousIntensities[index] = value;
        }
      });
      const updatedColumns = [...columns];
      updatedColumns[selectedTab].intensities = previousIntensities;

      setColumns(updatedColumns);
      setIsEmptyValues(false);
    } else {
      toast.error("Nepodarilo sa uložiť stĺpec");
    }
  };

  const handleApplyDataWithSameValues = async () => {
    if (!isSameValues) return;
    const intensities = calculatedSameIntensities.filter(
      (x) => x !== undefined
    );
    const onlyExcitations = [];
    for (let i = 0; i < columns[selectedTab].excitations.length; i++) {
      if (calculatedSameIntensities[i] !== undefined) {
        onlyExcitations.push(columns[selectedTab].excitations[i]);
      }
    }
    const result = await saveColumnWithSameData(
      columns[selectedTab],
      intensities,
      onlyExcitations
    );
    if (result === true && !isEmptyValues) {
      //ak este nie su rovnake hodnoty
      const columnName = columns[selectedTab].name;
      let filteredColumns = [...columns];
      console.log(filteredColumns);

      filteredColumns = filteredColumns.filter(
        (column) => column.name !== columnName
      );
      setSelectedTab(0);
      setColumns(filteredColumns);
      if (filteredColumns.length === 0) {
        handleClose();
      }
      changeTab(0);
      toast.success("Stĺpec " + columnName + " bol úspešne uložený");
    } else if (result === true && isEmptyValues) {
      const previousIntensities = [...columns[selectedTab].intensities];
      calculatedSameIntensities.forEach((value, index) => {
        if (value !== undefined) {
          previousIntensities[index] = value;
        }
      });
      const updatedColumns = [...columns];
      updatedColumns[selectedTab].intensities = previousIntensities;

      setColumns(updatedColumns);
      setIsSameValues(false);
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
              marginTop: "10px",
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
            sx={{ height: "100%" }}
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

            <DialogContent
              sx={{ marginTop: "none", paddingBlock: "0px", maxHeight: "90vh" }}
            >
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
                    {chartData && options && (
                      <>
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
                    {/* <Typography variant="body1" sx={{ textAlign: "center" }}>
                      Medzery hodnôt začínajú po excitáciach:{" "}
                      {gapStartValues.join(", ")}
                    </Typography> */}
                  </Box>
                  <Box sx={{ width: "50%", paddingLeft: "20px" }}>
                    <CalculatedTable
                      excitacion={columns[selectedTab].excitations}
                      intensities={columns[selectedTab].intensities}
                      emptyCalculatedIntensities={calculatedEmptyIntensities}
                      sameCalculatedIntensities={calculatedSameIntensities}
                    />
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between", // Rozdeľuje na dve časti
                    width: "100%",
                    marginTop: "2px",
                  }}
                >
                  <Box
                    sx={{
                      width: "45%", // Odhadovaná šírka pre okrúhly box
                      backgroundColor: "#f0f0f0", // Svetlá farba pozadia pre okrúhly box
                      borderRadius: "20px",
                      padding: "10px",
                      marginBottom: "50px",
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
                      <br />V strede rozsahu dát budú hodnoty dopočítané pomocou
                      <b> Hermite spline interpolácie</b>, ktorá využíva nielen
                      hodnoty okrajových bodov, ale aj ich sklony, čím vytvára
                      hladký a prirodzene zakrivený prechod.
                      <br />
                      {columnSpectrum !== undefined && columnSpectrum !== 0 && (
                        <>
                          Druhá metóda pre výpočet dát je{" "}
                          <b>podľa referenčného stĺpca</b>. Môže to byť stĺpec s
                          predchádzajúcim alebo nasledujúcim spektrom, ak je
                          dostupné a má kompletné dáta.
                        </>
                      )}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: "45%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px",
                    }}
                  >
                    {/* Dopočítať tlačidlá vľavo */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        width: "45%",
                      }}
                    >
                      <Button
                        variant="outlined"
                        sx={{
                          borderRadius: "30px",
                          border: "2px solid #514986",
                          "&:hover": { border: "2px solid #dcdbe7" },
                          backgroundColor:
                            calculatedEmptyIntensities.length > 0
                              ? "#f6fafd"
                              : "#d5e1fb",
                          width: "100%",
                          marginBottom: "10px",
                        }}
                        onClick={handleCalculateDataHermit}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Poppins",
                            fontWeight: 500,
                            fontSize: "15px",
                            padding: "2px",
                            color:
                              calculatedEmptyIntensities.length > 0
                                ? "#84809c"
                                : "#514986",
                          }}
                          textTransform={"none"}
                        >
                          Dopočítať chýbajúce hodnoty
                        </Typography>
                      </Button>

                      {columnSpectrum !== undefined && columnSpectrum !== 0 && (
                        <Button
                          variant="outlined"
                          sx={{
                            borderRadius: "30px",
                            border: "2px solid #514986",
                            "&:hover": { border: "2px solid #dcdbe7" },
                            backgroundColor:
                              calculatedEmptyIntensities.length > 0
                                ? "#f6fafd"
                                : "#d5e1fb",
                            width: "100%",
                            marginBottom: "10px",
                          }}
                          onClick={() => handleCalculateAdjustData(true)}
                        >
                          <Typography
                            sx={{
                              fontFamily: "Poppins",
                              fontWeight: 500,
                              fontSize: "15px",
                              padding: "2px",
                              color:
                                calculatedEmptyIntensities.length > 0
                                  ? "#84809c"
                                  : "#514986",
                            }}
                            textTransform={"none"}
                          >
                            Dopočítať hodnoty podľa predchádzajúceho spektra
                            (spektrum {spectres[currentIndex - 1]})
                          </Typography>
                        </Button>
                      )}
                      {columnSpectrum !== undefined &&
                        columnSpectrum !== spectres[spectres.length - 1] && (
                          <Button
                            variant="outlined"
                            sx={{
                              borderRadius: "30px",
                              border: "2px solid #514986",
                              "&:hover": { border: "2px solid #dcdbe7" },
                              backgroundColor:
                                calculatedEmptyIntensities.length > 0
                                  ? "#f6fafd"
                                  : "#d5e1fb",
                              width: "100%",
                              marginBottom: "10px",
                            }}
                            onClick={() => handleCalculateAdjustData(false)}
                          >
                            <Typography
                              sx={{
                                fontFamily: "Poppins",
                                fontWeight: 500,
                                fontSize: "15px",
                                padding: "2px",
                                color:
                                  calculatedEmptyIntensities.length > 0
                                    ? "#84809c"
                                    : "#514986",
                              }}
                              textTransform={"none"}
                            >
                              Dopočítať hodnoty podľa nasledujúceho spektra
                              (spektrum {spectres[currentIndex + 1]})
                            </Typography>
                          </Button>
                        )}
                    </Box>

                    {/* Oddelovacia čiara */}
                    <Box
                      sx={{
                        width: "1px",
                        height: "100%",
                        backgroundColor: "#bfc3d9",
                        margin: "0 20px",
                      }}
                    />

                    {/* Pridať/Nahradiť tlačidlá vpravo */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        width: "45%",
                      }}
                    >
                      {isEmptyValues && (
                        <Button
                          variant="outlined"
                          sx={{
                            borderRadius: "30px",
                            border: "2px solid #2e7d32",
                            "&:hover": { border: "2px solid #1b5e20" },
                            backgroundColor: "#d5f5e3",
                            width: "100%",
                            marginBottom: "10px",
                          }}
                          disabled={calculatedEmptyIntensities.length == 0}
                          onClick={handleApplyDataWithEmptyData}
                        >
                          <Typography
                            sx={{
                              fontFamily: "Poppins",
                              fontWeight: 500,
                              fontSize: "15px",
                              color: "#2e7d32",
                            }}
                            textTransform={"none"}
                          >
                            Pridať dopočítané hodnoty na prázdne miesta
                          </Typography>
                        </Button>
                      )}

                      {isSameValues && (
                        <Button
                          variant="outlined"
                          sx={{
                            borderRadius: "30px",
                            border: "2px solid #2e7d32",
                            "&:hover": { border: "2px solid #1b5e20" },
                            backgroundColor: "#d5f5e3",
                            width: "100%",
                          }}
                          onClick={handleApplyDataWithSameValues}
                          disabled={calculatedSameIntensities.length == 0}
                        >
                          <Typography
                            sx={{
                              fontFamily: "Poppins",
                              fontWeight: 500,
                              fontSize: "15px",
                              color: "#2e7d32",
                            }}
                            textTransform={"none"}
                          >
                            Nahradiť dopočítané hodnoty na miesto s rovnakými
                            hodnotami
                          </Typography>
                        </Button>
                      )}
                    </Box>
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
