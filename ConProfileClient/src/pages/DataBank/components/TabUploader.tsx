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
import { DatabankExcelContentDTO } from "../../../shared/types";
interface ExcelUploaderProps {
  ExcelData: DatabankExcelContentDTO;
  chosenInput: {
    sheet: string | null;
    headerRow: number | null;
    startRow: number | null;
    selectedColumns: number[] | null;
  };
  updateChosenInput: (newInput: any) => void;
}

const ExcelUploader: React.FC<ExcelUploaderProps> = ({
  ExcelData,
  chosenInput,
  updateChosenInput,
}) => {
  const [sheets, setSheets] = useState<string[]>([]);
  const [tableData, setTableData] = useState<string[][]>([]);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  useEffect(() => {
    const arrayBuffer = base64ToArrayBuffer(ExcelData.contentBase64);
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    setWorkbook(wb);
    const sheetNames = Object.keys(wb.Sheets);
    setSheets(sheetNames);

    if (!chosenInput.sheet) {
      updateChosenInput({ ...chosenInput, sheet: sheetNames[0] });
      loadSheetData(wb, sheetNames[0]);
    } else {
      loadSheetData(wb, chosenInput.sheet);
    }
  }, [ExcelData]);

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const loadSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    const sheet = wb.Sheets[sheetName];
    const jsonData: string[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
    });

    const maxColumns = Math.max(...jsonData.map((row) => row.length));
    const normalizedData = jsonData.map((row) =>
      Array.from({ length: maxColumns }, (_, i) => row[i] || "-")
    );

    setTableData(normalizedData);
    // updateChosenInput({
    //   ...chosenInput,
    //   headerRow: null,
    //   startRow: null,
    //   selectedColumns: [],
    // });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSheetChange = (event: any) => {
    const newSheet = event.target.value;

    updateChosenInput({ ...chosenInput, sheet: newSheet });
    if (workbook) {
      loadSheetData(workbook, newSheet);
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

  const handleSubmit = async () => {
    // if (headerRow === null || startRow === null)
    //   return alert("Vyberte hlavičkový riadok a začiatok dát!");
    // if (selectedColumns.length === 0)
    //   return alert("Vyberte aspoň jeden stĺpec!");
    // const header = tableData[headerRow].map((col, i) =>
    //   selectedColumns.includes(i) ? col : null
    // );
    // const filteredData = tableData
    //   .slice(startRow)
    //   .map((row) => selectedColumns.map((colIndex) => row[colIndex]));
    // const columns: string[][] = [];
    // for (let i = 0; i < selectedColumns.length; i++) {
    //   const column: string[] = [];
    //   for (let j = 0; j < filteredData.length; j++) {
    //     column.push(filteredData[j][i]);
    //   }
    //   columns.push(column);
    // }
    // // Tu môžeš uložiť dáta alebo poslať na server
  };

  const handleReset = () => {
    updateChosenInput({ ...chosenInput, headerRow: null, startRow: null });
  };

  return (
    <Box sx={{ height: "100%" }}>
      {tableData.length > 0 && (
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

          <TableContainer component={Paper} sx={{ height: "94%" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  {tableData[0].map((_, colIndex) => (
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
                {tableData.slice(0, 20).map((row, rowIndex) => (
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

export default ExcelUploader;
