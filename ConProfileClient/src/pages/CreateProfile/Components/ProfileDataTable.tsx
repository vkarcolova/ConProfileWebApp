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
import { Profile } from "../../../shared/types";
import { TableComponents, TableVirtuoso } from "react-virtuoso";

interface ProfileDataTableProps {
  profile: Profile;
}
export const ProfileDataTable: React.FC<ProfileDataTableProps> = ({
  profile,
}) => {
  interface RowData {
    excitation: number;
    intensity: number;
  }

  useEffect(() => {
    const rowCount = profile.profile.length;
    const rows: RowData[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row: RowData = {
        excitation: profile.excitation[i],
        intensity: profile.profile[i],
      };
      rows.push(row);
    }

    setTableRows(rows);
  }, []);

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
              {rows.intensity.toFixed(5)}
            </Typography>
          </TableCell>
        </React.Fragment>
      </>
    );
  }

  const [tableRows, setTableRows] = React.useState<RowData[]>([]);

  return (
    <Box className="table-container">
      <TableContainer component={Paper} sx={{ height: "97%" }}>
        <TableVirtuoso
          style={{ height: "100%", width: "100%" }}
          data={tableRows}
          components={VirtuosoTableComponents}
          itemContent={rowContent}
          fixedHeaderContent={fixedHeaderContent}
        />
      </TableContainer>
    </Box>
  );
};
