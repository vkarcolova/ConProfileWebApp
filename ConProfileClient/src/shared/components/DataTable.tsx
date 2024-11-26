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
  Typography,
} from "@mui/material";
import { TableComponents, TableVirtuoso } from "react-virtuoso";

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
  interface RowData {
    excitation: number;
    intensities: (number | undefined)[];
    multipliedIntensities?: (number | undefined)[];
  }

  useEffect(() => {
    const rowCount = tableData.intensities[0].intensities.length;
    const rows: RowData[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row: RowData = {
        excitation: tableData.excitation[i],
        intensities: tableData.intensities.map((col) => col.intensities[i]),
        multipliedIntensities: tableData.multipliedintensities
          ? tableData.multipliedintensities.map((col) => col.intensities[i])
          : undefined,
      };
      rows.push(row);
    }

    setIntensityRows(rows);
  }, []);

  const [intensityRows, setIntensityRows] = React.useState<RowData[]>([]);
  const calculateColumnWidth = () => {
    const totalColumns = tableData.intensities.length;
    return `${100 / totalColumns}%`;
  };
  const VirtuosoTableComponents: TableComponents<RowData> = {
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
      <TableContainer component={Paper} {...props} ref={ref} />
    )),
    Table: (props) => (
      <Table
        {...props}
        sx={{ borderCollapse: "separate", tableLayout: "fixed" }}
      />
    ),
    TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
      <TableHead {...props} ref={ref} />
    )),
    TableRow,
    TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
      <TableBody {...props} ref={ref} />
    )),
  };

  function fixedHeaderContent() {
    return (
      <>
        <TableRow>
          {tableData.intensities.map((tableData) => (
            <React.Fragment key={tableData.name}>
              <TableCell
                style={{
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
            </React.Fragment>
          ))}
        </TableRow>
        {showAutocomplete && (
          <TableRow>
            {tableData.intensities.map((tableData) => (
              <React.Fragment key={tableData.name}>
                <TableCell
                  style={{
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
                      id={tableData.spectrum!}
                    />
                  </Box>
                </TableCell>
              </React.Fragment>
            ))}
          </TableRow>
        )}
      </>
    );
  }

  function rowContent(_index: number, row: RowData) {
    return (
      <>
        {showAutocomplete ? (
          <React.Fragment>
            {row.intensities.map((data) => (
              <TableCell
                style={{
                  width: calculateColumnWidth(),
                  padding: "1px",
                  textAlign: "center",
                  borderBlock: "none",
                }}
              >
                <Typography fontSize={"12px"}>{data?.toFixed(5)}</Typography>
              </TableCell>
            ))}
          </React.Fragment>
        ) : (
          <React.Fragment>
            {row.multipliedIntensities!.map((data) => (
              <TableCell
                style={{
                  width: calculateColumnWidth(),
                  padding: "1px",
                  textAlign: "center",
                  borderBlock: "none",
                }}
              >
                <Typography fontSize={"12px"}>{data?.toFixed(5)}</Typography>
              </TableCell>
            ))}
          </React.Fragment>
        )}
      </>
    );
  }
  return (
    <TableContainer
      component={Paper}
      sx={{ maxHeight: "45vh", textAlign: "center" }}
    >
      <TableVirtuoso
        style={{ height: "45vh", width: "100%" }}
        data={intensityRows}
        components={VirtuosoTableComponents}
        itemContent={rowContent}
        fixedHeaderContent={fixedHeaderContent}
      />
    </TableContainer>
  );
};

export default DataTable;
