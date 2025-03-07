import React, { useEffect, useState, useRef } from "react";
import { Factors, FolderDTO, TableData } from "../types";
import "./components.css";
import CustomInputAutocomplete from "./CustomAutocomplete";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";

interface DataTableProps {
  tableData: TableData;
  showAutocomplete: boolean;
  factors?: Factors[];
  folderData?: FolderDTO;
}

const DataTable: React.FC<DataTableProps> = ({
  tableData,
  showAutocomplete,
  factors,
  folderData,
}) => {
  interface RowData {
    excitation: number;
    intensities: (number | undefined)[];
    multipliedIntensities?: (number | undefined)[];
  }

  const [intensityRows, setIntensityRows] = useState<RowData[]>([]);
  const [prevRows, setPrevRows] = useState<RowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const rowHeight = 20;
  const minRowCount = 10;

  useEffect(() => {
    setIsLoading(true);
    setPrevRows(intensityRows.length > 0 ? intensityRows : []);

    const rowCount = tableData.intensities[0]?.intensities.length || 0;
    const rows: RowData[] = [];

    for (let i = 0; i < rowCount; i++) {
      rows.push({
        excitation: tableData.excitation[i],
        intensities: tableData.intensities.map((col) => col.intensities[i]),
        multipliedIntensities: tableData.multipliedintensities
          ? tableData.multipliedintensities.map((col) => col.intensities[i])
          : undefined,
      });
    }

    setTimeout(() => {
      setIntensityRows(rows);
      setIsLoading(false);
    }, 200);
  }, [tableData]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: isLoading ? minRowCount : intensityRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 40,
  });

  const calculateColumnWidth = () => {
    const totalColumns = tableData.intensities.length;
    return totalColumns <= 10 ? `${100 / totalColumns}%` : "75px";
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        maxHeight: "45vh",
        overflow: "auto",
        height: `45vh`,
        textAlign: "center",
        boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 12px",
      }}
      ref={parentRef}
    >
      <Table stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
        <TableHead
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            backgroundColor: "white",
          }}
        >
          <TableRow>
            {tableData.intensities.map((tableData) => (
              <TableCell
                key={tableData.name}
                sx={{
                  width: calculateColumnWidth(),
                  backgroundColor: "#bfc3d9",
                  textAlign: "center",
                  border: "none",
                  padding: "0",
                }}
              >
                <Box
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#bfc3d9",
                    margin: 0,
                    paddingBlock: "5px",
                  }}
                  className="TableRowName"
                >
                  {tableData.name}
                </Box>
              </TableCell>
            ))}
          </TableRow>
          {showAutocomplete && folderData && (
            <TableRow
              sx={{
                position: "sticky",
                zIndex: 1,
                backgroundColor: "#eef",
              }}
            >
              {tableData.intensities.map((tableData, index) => (
                <TableCell
                  key={tableData.name}
                  sx={{
                    width: calculateColumnWidth(),
                    textAlign: "center",
                    border: "none",
                    padding: "0",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    className="autocomplete"
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: "#bfc3d9",
                      margin: 0,
                      display: "grid",
                      placeItems: "center",
                      paddingBlock: "5px",
                    }}
                  >
                    <CustomInputAutocomplete
                      columnSpectrum={tableData.spectrum!}
                      allFactors={factors!}
                      id={index}
                      inputedFactor={
                        folderData.data[index].factor
                          ? folderData.data[index].factor
                          : null
                      }
                    />
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          )}
        </TableHead>
        <TableBody
          style={{
            position: "relative",
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = isLoading
              ? prevRows[virtualRow.index] || {
                  excitation: 0,
                  intensities: Array(tableData.intensities.length).fill(0),
                }
              : intensityRows[virtualRow.index];

            return (
              <TableRow
                key={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                  height: `${virtualRow.size}px`,
                  width: "100%",
                  display: "flex",
                }}
              >
                {row.intensities.map((data, columnIndex) => (
                  <TableCell
                    key={columnIndex}
                    sx={{
                      textAlign: "center",
                      padding: "5px",
                      fontSize: "12px",
                      flex: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      borderInline: isLoading ? "none" : "1px solid #e0e0e0",

                      textOverflow: "ellipsis",
                      borderBlock: "none",
                      color: isLoading ? "#aaa" : "inherit",
                    }}
                  >
                    {isLoading ? " " : data?.toFixed(5)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
