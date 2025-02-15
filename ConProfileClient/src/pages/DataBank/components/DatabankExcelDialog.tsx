/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
} from "@mui/material";
import { DatabankExcelContentDTO, ExcelContent } from "../../../shared/types";
import TabExcelUploader from "./TabUploader";

interface DatabankExcelDialogProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  excelContentsFromDb?: DatabankExcelContentDTO[];
  sendExcels: (excels: ExcelContent[]) => void;
}

export interface ChosenInput {
  sheet: string | null;
  headerRow: number | null;
  startRow: number | null;
  selectedColumns: number[] | null;
  tableData: string[][] | null;
}

const DatabankExcelDialog: React.FC<DatabankExcelDialogProps> = ({
  dialogOpen,
  setDialogOpen,
  excelContentsFromDb = [],
  sendExcels,
}) => {
  const [tabs, setTabs] = useState<{ [key: string]: any }>({});
  const [tabKeys, setTabKeys] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [fileMap, setFileMap] = useState<Map<string, XLSX.WorkBook>>(new Map());
  const [chosenInputs, setChosenInputs] = useState<{
    [key: string]: ChosenInput;
  }>({});

  useEffect(() => {
    const newTabs: { [key: string]: any } = {};
    const keys: string[] = [];
    const tempFileMap = new Map<string, XLSX.WorkBook>();
    const nameCounts: { [key: string]: number } = {};
    const tempChosenInputs: { [key: string]: ChosenInput } = {};

    excelContentsFromDb.forEach((content) => {
      const arrayBuffer = base64ToArrayBuffer(content.contentBase64);
      const wb = XLSX.read(arrayBuffer, { type: "array" });

      let uniqueName = content.fileName;
      if (nameCounts[content.fileName] !== undefined) {
        nameCounts[content.fileName] += 1;
        uniqueName = `${content.fileName} (${nameCounts[content.fileName]})`;
      } else {
        nameCounts[content.fileName] = 0;
      }

      newTabs[uniqueName] = {
        workbook: wb,
        sheets: Object.keys(wb.Sheets),
      };
      keys.push(uniqueName);
      tempFileMap.set(uniqueName, wb);

      tempChosenInputs[uniqueName] = {
        sheet: Object.keys(wb.Sheets)[0],
        headerRow: null,
        selectedColumns: null,
        startRow: null,
        tableData: null,
      };
    });

    setTabs(newTabs);
    setTabKeys(keys);
    setFileMap(tempFileMap);
    setChosenInputs(tempChosenInputs);

    if (keys.length > 0) {
      setSelectedTab(keys[0]);
    }
  }, [excelContentsFromDb]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(tabKeys[newValue]);
  };

  const updateChosenInput = (tabKey: string, newInput: ChosenInput) => {
    setChosenInputs((prev) => ({
      ...prev,
      [tabKey]: newInput,
    }));
  };

  const handleSubmit = async () => {
    const hasNullValue = Object.values(chosenInputs).some((input) =>
      Object.values(input).some((value) => value === null)
    );

    if (hasNullValue) {
      alert("Vyplňte všetky požadované hodnoty pred spracovaním dát!");
      return;
    }
    const allChosenInputs = Object.entries(chosenInputs);
    const results: ExcelContent[] = [];

    allChosenInputs.forEach(([filename, input]) => {
      if (
        input.tableData !== null &&
        input.headerRow !== null &&
        input.selectedColumns !== null &&
        input.startRow !== null &&
        input.sheet !== null
      ) {
        const header = input.tableData[input.headerRow].map((col, i) =>
          input.selectedColumns!.includes(i) ? col : null
        );

        const headers = header.filter((col) => col !== null);
        const filteredData = input.tableData
          .slice(input.startRow)
          .map((row) =>
            input.selectedColumns!.map((colIndex) => row[colIndex])
          );
        const columns: string[][] = [];
        for (let i = 0; i < input.selectedColumns.length; i++) {
          const column: string[] = [];
          for (let j = 0; j < filteredData.length; j++) {
            column.push(filteredData[j][i]);
          }
          columns.push(column);
        }

        results.push({ data: columns, header: headers, name: filename });
      }
    });

    sendExcels(results);
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  return (
    <Dialog
      fullWidth={true}
      maxWidth="md"
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      sx={{ height: "100%" }}
    >
      <DialogTitle>Nastavte vstupné hodnoty pre Excel súbory: </DialogTitle>
      <DialogContent sx={{ height: "90vh" }}>
        <Tabs
          value={tabKeys.indexOf(selectedTab!)}
          onChange={handleTabChange}
          aria-label="Excel Tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabKeys.map((fileName, index) => (
            <Tab key={index} label={fileName} value={index} />
          ))}
        </Tabs>
        <div style={{ marginTop: 20, height: "80%" }}>
          {selectedTab && tabs[selectedTab] && fileMap.has(selectedTab) && (
            <TabExcelUploader
              ExcelData={fileMap.get(selectedTab)!}
              chosenInput={chosenInputs[selectedTab]}
              updateChosenInput={(newInput) =>
                updateChosenInput(selectedTab, newInput)
              }
            />
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogOpen(false)} color="secondary">
          Zrušiť
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={Object.values(chosenInputs).some((input) =>
            Object.values(input).some((value) => value === null)
          )}
          sx={{ backgroundColor: "#e0e4ff" }}
          color="secondary"
        >
          Spracovať dáta
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DatabankExcelDialog;
