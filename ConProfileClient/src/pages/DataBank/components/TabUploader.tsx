/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
} from "@mui/material";
import { ChosenInput } from "./DatabankExcelDialog";
interface TabExcelUploaderProps {
  ExcelData: XLSX.WorkBook;
  chosenInput: ChosenInput;
  updateChosenInput: (newInput: any) => void;
}

const TabExcelUploader: React.FC<TabExcelUploaderProps> = ({
  ExcelData,
  chosenInput,
  updateChosenInput,
}) => {
  const [sheets, setSheets] = useState<string[]>([]);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  useEffect(() => {
    setWorkbook(ExcelData);
    const sheetNames = Object.keys(ExcelData.Sheets);
    setSheets(sheetNames);

    if (!chosenInput.sheet) {
      const data = loadSheetData(ExcelData, sheetNames[0]);
      updateChosenInput({
        ...chosenInput,
        sheet: sheetNames[0],
        tableData: data,
      });
    } else {
      const data = loadSheetData(ExcelData, chosenInput.sheet);
      updateChosenInput({ ...chosenInput, tableData: data });
    }
  }, [ExcelData]);

  const loadSheetData = (wb: XLSX.WorkBook, sheetName: string): string[][] => {
    const sheet = wb.Sheets[sheetName];
    const jsonData: string[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
    });

    const maxColumns = Math.max(...jsonData.map((row) => row.length));
    const normalizedData = jsonData.map((row) =>
      Array.from({ length: maxColumns }, (_, i) => row[i] || "-")
    );
    return normalizedData;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSheetChange = (event: any) => {
    const newSheet = event.target.value;

    if (workbook) {
      const data = loadSheetData(workbook, newSheet);
      updateChosenInput({
        ...chosenInput,
        sheet: newSheet,
        headerRow: null,
        startRow: null,
        selectedColumns: [],
        tableData: data,
      });
    }
  };

  const handleRowClick = (index: number) => {
    if (chosenInput.headerRow === null) {
      updateChosenInput({ ...chosenInput, headerRow: index });
    } else if (
      chosenInput.startRow === null &&
      index !== chosenInput.headerRow
    ) {
      updateChosenInput({ ...chosenInput, startRow: index });
    }
  };
  const handleColumnToggle = (index: number) => {
    const updatedColumns = chosenInput.selectedColumns?.includes(index)
      ? chosenInput.selectedColumns.filter((i) => i !== index)
      : [...(chosenInput.selectedColumns || []), index];

    updateChosenInput({ ...chosenInput, selectedColumns: updatedColumns });
  };

  const handleReset = () => {
    updateChosenInput({ ...chosenInput, headerRow: null, startRow: null });
  };

  return (
    <Box sx={{ height: "100%" }}>
      {chosenInput.tableData !== null && chosenInput.tableData.length > 0 && (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <FormControl style={{ marginTop: 20 }}>
              <InputLabel>Vyberte hárok</InputLabel>
              <Select
                value={chosenInput.sheet || sheets[0]}
                onChange={handleSheetChange}
              >
                {sheets.map((sheet) => (
                  <MenuItem key={sheet} value={sheet}>
                    {sheet}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={handleReset}
              style={{ marginTop: 20, marginLeft: 10 }}
            >
              Resetovať riadky
            </Button>
            <Typography
              variant="body1"
              sx={{
                fontFamily: "Poppins",
                textAlign: "justify",
                maxWidth: "60%",
                marginTop: "20px",
              }}
            >
              Pre načítanie dát zvoľte stĺpce obsahujúce dáta (prvý stĺpec je
              načítaný ako excitácia). Taktiež zvoľte riadok s hlavičkou, kvôli
              získaniu spektier a prvý riadok obsahujúci dáta.
            </Typography>
          </Box>

          <TableContainer
            component={Paper}
            sx={{ height: "90%", marginTop: "20px" }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  {chosenInput.tableData[0].map((_, colIndex) => (
                    <TableCell
                      key={colIndex}
                      style={{
                        border: "1px solid #ccc",
                        textAlign: "center",
                        padding: "1px",
                      }}
                    >
                      <Checkbox
                        sx={{ padding: "1px" }}
                        checked={
                          chosenInput.selectedColumns?.includes(colIndex) ||
                          false
                        }
                        onChange={() => handleColumnToggle(colIndex)}
                      />
                      Stĺpec {colIndex + 1}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {chosenInput.tableData.slice(0, 20).map((row, rowIndex) => (
                  <TableRow
                    sx={{ padding: "0px", margin: "0px" }}
                    key={rowIndex}
                    hover
                    onClick={() => handleRowClick(rowIndex)}
                    selected={
                      rowIndex === chosenInput.headerRow ||
                      rowIndex === chosenInput.startRow
                    }
                    style={{
                      backgroundColor:
                        rowIndex === chosenInput.headerRow
                          ? "#ffeb3b"
                          : rowIndex === chosenInput.startRow
                            ? "#ddd"
                            : "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <TableCell
                      style={{ border: "1px solid #ccc" }}
                      sx={{ paddingBlock: "4px", margin: "0px" }}
                    >
                      {rowIndex + 1}
                    </TableCell>
                    {row.map((cell, colIndex) => (
                      <TableCell
                        key={colIndex}
                        sx={{
                          border: "1px solid #ccc",
                          minWidth: "80px",
                          maxHeight: "20px",
                          textAlign: "center",
                          padding: "2px !important",
                          margin: "0px",
                        }}
                      >
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default TabExcelUploader;
