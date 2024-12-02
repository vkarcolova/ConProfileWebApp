// Comparison.tsx
import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import CloseIcon from "@mui/icons-material/Close";
import "./index.css";
import { FolderDTO } from "../../shared/types";
import { ScatterChart } from "@mui/x-charts/ScatterChart";
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

  // useEffect(() => {
  //   console.log('folders, statdata,chartdata,cheked');
  // console.log(folders);
  // console.log(statData);
  // console.log(chartData);
  // console.log( checked);}
  // ), [statData, chartData, checked];
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    name: string
  ) => {
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
    } else {
      setChartData([]);
      setStatData([]);
    }
  };

  return (
    <Dialog
      onClose={() => {
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
        onClick={onClose}
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
                  <ScatterChart
                    series={chartData.map((data) => ({
                      label: data.label,
                      data: data.data.map((v, index) => ({
                        x: folders[0].excitation[index],
                        y: v,
                        id: v,
                      })),
                    }))}
                    yAxis={[{ min: 0 }]}
                    xAxis={[{ min: 250 }]}
                  />
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
