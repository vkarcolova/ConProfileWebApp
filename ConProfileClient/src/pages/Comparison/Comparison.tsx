// Comparison.tsx
import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import CloseIcon from "@mui/icons-material/Close";
import "./index.css";
import { FolderDTO } from "../../shared/types";
import {
  Box,
  Checkbox,
  IconButton,
  ListItem,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import List from "@mui/material/List/List";
import ReactECharts from "echarts-for-react";

interface ComparisonProps {
  open: boolean;
  onClose: () => void;
  folders: FolderDTO[] | null;
}

interface ChartData {
  data: number[];
  label: string;
}

interface StatData {
  max: number;
  min: number;
  std: number;
  folderName: string;
}

const Comparison: React.FC<ComparisonProps> = ({ open, onClose, folders }) => {
  const [checked, setChecked] = useState<string[]>([]);
  const [chartData, setChartData] = useState<ChartData[] | null>(null);
  const [statData, setStatData] = useState<StatData[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [options, setOptions] = useState<any>(null);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    name: string
  ) => {
    setOptions(null);

    let list: string[] = [...checked];
    if (!list.includes(name)) {
      list.push(name);
    } else {
      list = list.filter((item) => item !== name);
    }
    setChecked(list);
    if (list.length >= 2) {
      const filteredFolders =
        folders
          ?.filter((data) => list.includes(data.foldername))
          .map((data) => ({
            data: data?.profile || [],
            label: data?.foldername || "Unknown",
          })) || [];
      setChartData(filteredFolders);

      const statList: StatData[] = [];
      filteredFolders.forEach((element) => {
        const multipliedMax: number = Math.max(...element.data);
        const multipliedMin: number = Math.min(...element.data);
        const mean =
          element.data.reduce((sum, number) => sum + number, 0) /
          element.data.length;
        const squaredDifferences = element.data.map((number) =>
          Math.pow(number - mean, 2)
        );
        const variance =
          squaredDifferences.reduce(
            (sum, squaredDifference) => sum + squaredDifference,
            0
          ) / element.data.length;
        const multipliedStandardDeviation = Math.sqrt(variance);
        const statistics: StatData = {
          max: multipliedMax,
          min: multipliedMin,
          std: multipliedStandardDeviation,
          folderName: element.label,
        };
        statList.push(statistics);
      });

      setStatData(statList);

      if (!folders) return;

      // Zjednotenie všetkých excitation hodnôt (unikátne a zoradené)
      const allExcitations = [
        ...new Set(folders.flatMap((folder) => folder.excitation)),
      ].sort((a, b) => a - b);

      // Generovanie dátových sérií s mapovaním podľa excitation
      const series = filteredFolders.map(({ data, label }, index) => {
        const folderExcitation = folders[index].excitation; // Zodpovedajúce excitation

        const mappedData = allExcitations.map((ex) => {
          const dataIndex = folderExcitation.indexOf(ex);
          return dataIndex !== -1 ? data[dataIndex] : null; // Ak excitation existuje, použijeme hodnotu, inak null
        });

        return {
          name: label,
          type: "line",
          data: mappedData,
          smooth: true, // Ak sa graf nezobrazuje plynulo, skús tento parameter na false
          connectNulls: true,
        };
      });

      setOptions({
        xAxis: { type: "category", data: allExcitations },
        yAxis: {
          type: "value",
          min: Math.min(...statList.map((obj) => obj.min)),
          max: Math.max(...statList.map((obj) => obj.max)),
          axisLabel: {
            formatter: (value: number) => value.toFixed(2), // Zaokrúhlenie na 2 desatinné miesta
          },
        },
        series,
        tooltip: { trigger: "axis" },
        legend: { show: true },
      });
    } else {
      setChartData([]);
      setStatData([]);
    }
  };

  return (
    <Dialog
      onClose={() => {
        setOptions(null);
        setChartData(null);
        setChecked([]);
        onClose();
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
        onClick={() => {
          setOptions(null);
          setChartData(null);
          setChecked([]);
          onClose();
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
      <DialogContent dividers>
        <Box className="dialog-content">
          <Box
            style={{ display: "flex", flexDirection: "row", minHeight: "100%" }}
          >
            <Box style={{ width: "40%" }}>
              <Box className="checkboxlitwindow">
                <List dense={true}>
                  {folders?.map((value) => (
                    <ListItem style={{ padding: "0px" }}>
                      <Checkbox
                        onChange={(event) =>
                          handleChange(event, value.foldername)
                        }
                        inputProps={{ name: `${value.foldername}` }}
                        style={{
                          paddingTop: "0px",
                          paddingBottom: "0px",
                          paddingLeft: "2px",
                          paddingRight: "2px",
                        }}
                      />
                      <ListItemText primary={value.foldername} />
                    </ListItem>
                  ))}
                </List>
              </Box>
              {chartData && statData && chartData.length >= 2 && (
                <Box style={{ width: "100%", height: "40%", overflow: "auto" }}>
                  {" "}
                  <TableContainer component={Paper}>
                    <Table
                      sx={{ width: "100%" }}
                      stickyHeader
                      size="small"
                      aria-label="a dense table"
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: "bolder",
                            }}
                          >
                            Priečinok
                          </TableCell>
                          <TableCell
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: "bolder",
                            }}
                          >
                            Max
                          </TableCell>
                          <TableCell
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: "bolder",
                            }}
                          >
                            Min
                          </TableCell>
                          <TableCell
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: "bolder",
                            }}
                          >
                            Std
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {statData.map((stat: StatData) => {
                          return (
                            <TableRow>
                              <TableCell> {stat.folderName} </TableCell>
                              <TableCell> {stat.max.toFixed(5)} </TableCell>
                              <TableCell> {stat.min.toFixed(5)} </TableCell>
                              <TableCell> {stat.std.toFixed(5)} </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
            <Box style={{ width: "60%" }}>
              {chartData && folders ? (
                <Box
                  style={{
                    height: "50vh",
                    margin: "10px",
                    backgroundColor: "white",
                  }}
                >
                  {options && (
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
                </Box>
              ) : (
                ""
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Comparison;
