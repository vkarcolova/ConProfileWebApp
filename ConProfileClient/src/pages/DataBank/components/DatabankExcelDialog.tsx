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
import ExcelUploader from "./TabUploader"; // Importujeme komponentu ExcelUploader

interface DatabankExcelDialogProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  excelContentsFromDb?: DatabankExcelContentDTO[];
}

const DatabankExcelDialog: React.FC<DatabankExcelDialogProps> = ({
  dialogOpen,
  setDialogOpen,
  excelContentsFromDb = [],
}) => {
  const [tabs, setTabs] = useState<{ [key: string]: any }>({});
  const [selectedTab, setSelectedTab] = useState<string | number>(0);

  useEffect(() => {
    // Uložíme každý Excel do "tabu"
    const newTabs: { [key: string]: any } = {};
    excelContentsFromDb.forEach((content) => {
      const arrayBuffer = base64ToArrayBuffer(content.contentBase64);
      const wb = XLSX.read(arrayBuffer, { type: "array" });
      newTabs[content.fileName] = {
        workbook: wb,
        sheets: Object.keys(wb.Sheets),
      };
      if (selectedTab === "") {
        setSelectedTab(content.fileName); // Nastaviť prvú kartu ako aktívnu, ak nie je nastavená
      }
    });

    setTabs(newTabs);
  }, [excelContentsFromDb]);

  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: string | number
  ) => {
    setSelectedTab(newValue);
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
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
      <DialogTitle>Spracovať Excel</DialogTitle>
      <DialogContent>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          aria-label="Excel Tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          {Object.keys(tabs).map((fileName, index) => (
            <Tab key={index} label={fileName} value={fileName} />
          ))}
        </Tabs>
        <div style={{ marginTop: 20 }}>
          {/* Pre každý tab zobrazíme príslušný ExcelUploader */}
          {tabs[selectedTab] && (
            <ExcelUploader
              ExcelData={excelContentsFromDb.find(
                (content) => content.fileName === selectedTab
              )}
            />
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogOpen(false)} color="primary">
          Zrušiť
        </Button>
        <Button color="primary">Spracovať dáta</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DatabankExcelDialog;
