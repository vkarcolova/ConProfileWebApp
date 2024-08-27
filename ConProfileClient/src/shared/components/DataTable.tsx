import React, { useEffect } from "react";
import { Factors, TableData } from "../types";
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

interface DataTableProps {
  tableData: TableData;
  showAutocomplete: boolean;
  factors?: Factors[];
}

const DataTable: React.FC<DataTableProps> = ({
  tableData,
  showAutocomplete,
  factors,
}) => {
  const calculateColumnWidth = () => {
    const totalColumns = tableData.intensities.length;
    return `${100 / totalColumns}%`;
  };

 

  return (
    <TableContainer component={Paper} sx={{ maxHeight: "45vh" }}>
      <Table stickyHeader size="small" aria-label="sticky table">
        <TableHead>
          <TableRow>
            {tableData.intensities.map((tableData) => (
              <React.Fragment key={tableData.name}>
                <TableCell style={{ width: calculateColumnWidth() }}>
                  <Box sx={{ fontWeight: "bold" }} className="TableRowName">
                    {tableData.name}
                  </Box>
                </TableCell>
              </React.Fragment>
            ))}
          </TableRow>
          {showAutocomplete ? (
            <TableRow>
              {tableData.intensities.map((tableData) => (
                <React.Fragment key={tableData.name}>
                  <TableCell style={{ width: calculateColumnWidth() }}>
                    <Box className="autocomplete">
                      <CustomInputAutocomplete
                        columnSpectrum={tableData.spectrum!}
                        allFactors={factors!}
                        id={tableData.spectrum!}
                      />
                    </Box>
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          ) : null}
        </TableHead>
        <TableBody>
          <TableRow>
            {showAutocomplete ? (
              <>
                {tableData.intensities.map((tableData) => (
                  <React.Fragment key={tableData.name}>
                    <TableCell style={{ width: calculateColumnWidth() }}>
                      {tableData.intensities.map((intensity, i) => (
                        <Box key={i}>
                          {intensity != undefined ? intensity.toFixed(5) : "-"}
                        </Box>
                      ))}
                    </TableCell>
                  </React.Fragment>
                ))}
              </>
            ) : (
              <>
                {tableData.multipliedintensities!.map((tableData) => (
                  <React.Fragment key={tableData.name}>
                    <TableCell style={{ width: calculateColumnWidth() }}>
                      {tableData.intensities.map((intensity, i) => (
                        <Box key={i}>
                          {intensity != undefined ? intensity.toFixed(5) : "-"}
                        </Box>
                      ))}
                    </TableCell>
                  </React.Fragment>
                ))}
              </>
            )}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
