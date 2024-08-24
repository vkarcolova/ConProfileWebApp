import React, { useState } from "react";
import { FolderDTO, Factors } from "../types";
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
  folderData: FolderDTO;
  showAutocomplete: boolean;
  factors?: Factors[];
}

const DataTable: React.FC<DataTableProps> = ({
  folderData,
  showAutocomplete,
  factors,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(
    Array(folderData.data.length).fill(0)
  );

  const handleComboBoxChange = (index: number, value: number | null) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[index] = value ?? 0;
    setSelectedOptions(newSelectedOptions);
  };

  const calculateColumnWidth = () => {
    const totalColumns = folderData.data.length;
    return `${100 / totalColumns}%`;
  };

  return (
    <TableContainer component={Paper}>
      <Table stickyHeader size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            {folderData.data.map((tableData) => (
              <React.Fragment key={tableData.filename}>
                <TableCell style={{ width: calculateColumnWidth() }}>
                  <Box className="TableRowName">{tableData.filename}</Box>
                </TableCell>
              </React.Fragment>
            ))}
          </TableRow>
          {showAutocomplete ? (
            <TableRow>
              {folderData.data.map((tableData) => (
                <React.Fragment key={tableData.filename}>
                  <TableCell style={{ width: calculateColumnWidth() }}>
                    <Box className="autocomplete">
                      <CustomInputAutocomplete
                        columnSpectrum={tableData.spectrum}
                        allFactors={factors!}
                        id={tableData.id}
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
                {folderData.data.map((tableData) => (
                  <React.Fragment key={tableData.filename}>
                    <TableCell style={{ width: calculateColumnWidth() }}>
                      {tableData.intensity.map((intensity, i) => (
                        <Box key={i}>{intensity.intensity.toFixed(5)}</Box>
                      ))}
                    </TableCell>
                  </React.Fragment>
                ))}
              </>
            ) : (
              <>
                {folderData.data.map((tableData) => (
                  <React.Fragment key={tableData.filename}>
                    <TableCell style={{ width: calculateColumnWidth() }}>
                      {tableData.intensity.map((intensity, i) => (
                        <Box key={i}>
                          {intensity.multipliedintensity?.toFixed(5)}
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
