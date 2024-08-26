import React, { useState } from "react";
import { FolderDTO, Factors, TableData, TableDataColumn } from "../types";
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
  // const [selectedOptions, setSelectedOptions] = useState<number[]>(
  //   Array(folderData.data.length).fill(0)
  // );

  // const handleComboBoxChange = (index: number, value: number | null) => {
  //   const newSelectedOptions = [...selectedOptions];
  //   newSelectedOptions[index] = value ?? 0;
  //   setSelectedOptions(newSelectedOptions);
  // };

  const processDataForTable = () => {
    // podla excitacii dat do intexov
    const tableData : TableData = {
      excitacion: folderData.excitation,
      intensities: [],
      multipliedintensities: [],
      profileintensities: {name: "profile", intensities: []},
    };

    const intensitiesColumns : TableDataColumn[] = [];
    folderData.data.forEach((file) => {

      var intensities : (number | null)[] = [];
      intensities = folderData.excitation.map(value => {
        const singleIntenzity = file.intensity.find(x => x.excitacion === value);
        return singleIntenzity ? singleIntenzity.intensity : null;
      });
      //TODO tuto returnut DTO intenzity a teda podla toho vytiahnem aj multiplied 
            const column : TableDataColumn = {name: file.filename, intensities: intensities};
      intensitiesColumns.push(column);
     }


    
  }

  const calculateColumnWidth = () => {
    const totalColumns = folderData.data.length;
    return `${100 / totalColumns}%`;
  };

  return (
    <TableContainer component={Paper} sx={{ maxHeight: "45vh" }}>
      <Table stickyHeader size="small" aria-label="sticky table">
        <TableHead>
          <TableRow>
            {folderData.data.map((tableData) => (
              <React.Fragment key={tableData.filename}>
                <TableCell style={{ width: calculateColumnWidth() }}>
                  <Box sx={{ fontWeight: "bold" }} className="TableRowName">
                    {tableData.filename}
                  </Box>
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
