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
import { DatabankExcelContentDTO } from "../../../shared/types";
import ExcelUploader from "./TabUploader";

interface DatabankExcelDialogProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  excelContentsFromDb?: DatabankExcelContentDTO[];
}

interface ChosenInput {
  sheet: string | null;
  headerRow: number | null;
  startRow: number | null;
  selectedColumns: number[] | null;
}

const DatabankExcelDialog: React.FC<DatabankExcelDialogProps> = ({
  dialogOpen,
  setDialogOpen,
  excelContentsFromDb = [],
}) => {
  const [tabs, setTabs] = useState<{ [key: string]: any }>({});
  const [tabKeys, setTabKeys] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [fileMap, setFileMap] = useState<Map<string, DatabankExcelContentDTO>>(
    new Map()
  );
  const [chosenInputs, setChosenInputs] = useState<{
    [key: string]: ChosenInput;
  }>({});

  useEffect(() => {
    const newTabs: { [key: string]: any } = {};
    const keys: string[] = [];
    const tempFileMap = new Map<string, DatabankExcelContentDTO>();
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
      tempFileMap.set(uniqueName, content);

      tempChosenInputs[uniqueName] = {
        sheet: Object.keys(wb.Sheets)[0],
        headerRow: null,
        selectedColumns: null,
        startRow: null,
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
      <DialogTitle>Spracovať Excel</DialogTitle>
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
            <ExcelUploader
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
        <Button sx={{ backgroundColor: "#e0e4ff" }} color="secondary">
          Spracovať dáta
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DatabankExcelDialog;
