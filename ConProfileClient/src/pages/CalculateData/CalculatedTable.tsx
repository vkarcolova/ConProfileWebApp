import {
  Box,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import { TableComponents, TableVirtuoso } from "react-virtuoso";

interface CalculatedTableProps {
  excitacion: number[];
  intensities: (number | undefined)[];
  calculatedIntensities?: number[];
}
export const CalculatedTable: React.FC<CalculatedTableProps> = ({
  excitacion,
  intensities,
  calculatedIntensities,
}) => {
  interface RowData {
    excitation: number;
    intensity: number | undefined;
    calculatedIntensity: number | undefined;
  }

  useEffect(() => {
    const rowCount = excitacion.length;
    const rows: RowData[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row: RowData = {
        excitation: excitacion[i],
        intensity: intensities[i],
        calculatedIntensity: calculatedIntensities
          ? calculatedIntensities[i]
          : undefined,
      };
      rows.push(row);
    }

    setTableRows(rows);
  }, [calculatedIntensities, excitacion, intensities]);

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
          <TableCell
            style={{
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
              Excitácie
            </Box>
          </TableCell>
          <TableCell
            style={{
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
              Intenzity
            </Box>
          </TableCell>
          <TableCell
            style={{
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
              Vypočítané intenzity
            </Box>
          </TableCell>
        </TableRow>
      </>
    );
  }

  function rowContent(_index: number, rows: RowData) {
    return (
      <>
        <React.Fragment>
          <TableCell
            style={{
              padding: "1px",
              textAlign: "center",
              borderBlock: "none",
            }}
          >
            <Typography fontSize={"12px"}>
              {rows.excitation.toFixed(5)}
            </Typography>
          </TableCell>
          <TableCell
            style={{
              padding: "1px",
              textAlign: "center",
              borderBlock: "none",
            }}
          >
            <Typography fontSize={"12px"}>
              {rows.intensity !== undefined ? rows.intensity.toFixed(5) : ""}
            </Typography>
          </TableCell>
          <TableCell
            style={{
              padding: "1px",
              textAlign: "center",
              borderBlock: "none",
            }}
          >
            <Typography
              fontSize={"12px"}
              sx={{
                color: rows.intensity === undefined ? "red" : "black",
                fontWeight: rows.intensity === undefined ? "bold" : "normal",
              }}
            >
              {rows.calculatedIntensity !== null && rows.calculatedIntensity !== undefined
                ? rows.calculatedIntensity.toFixed(5)
                : rows.intensity?.toFixed(5)}
            </Typography>
          </TableCell>
        </React.Fragment>
      </>
    );
  }

  const [tableRows, setTableRows] = React.useState<RowData[]>([]);

  return (
    <TableContainer
      component={Paper}
      sx={{ maxHeight: "45vh", boxShadow: "rgba(0, 0, 0, 0.2) 0px 4px 12px" }}
    >
      <TableVirtuoso
        style={{ height: "45vh", width: "100%" }}
        data={tableRows}
        components={VirtuosoTableComponents}
        itemContent={rowContent}
        fixedHeaderContent={fixedHeaderContent}
      />
    </TableContainer>
  );
};
