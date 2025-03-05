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
import React, { useEffect, useState, useRef } from "react";
import { Profile } from "../../../shared/types";
import { useVirtualizer } from "@tanstack/react-virtual";

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

  const [tableRows, setTableRows] = useState<RowData[]>([]);
  const [isLoading, setIsLoading] = useState(true); // **Riešenie prázdnej tabuľky pri načítaní**

  useEffect(() => {
    setIsLoading(true);
    const rowCount = profile.profile.length;
    const rows: RowData[] = [];

    for (let i = 0; i < rowCount; i++) {
      rows.push({
        excitation: profile.excitation[i],
        intensity: profile.profile[i],
      });
    }

    setTableRows(rows);
    setTimeout(() => setIsLoading(false), 200); // **Krátky delay na lepšie zobrazenie**
  }, [profile]);

  // Ref pre virtuálnu tabuľku
  const parentRef = useRef<HTMLDivElement>(null);

  // Použitie `react-virtual` na optimalizované vykreslenie
  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35, // **Fixná výška riadku**
    overscan: 5, // **Počet extra riadkov pre plynulé scrollovanie**
  });

  return (
    <Box
      className="table-container"
      sx={{
        boxShadow: "rgba(0, 0, 0, 0.2) 0px 4px 12px",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <TableContainer
        component={Paper}
        sx={{ maxHeight: "45vh", overflow: "auto", minHeight: "200px" }} // **Fixná výška pri načítaní**
        ref={parentRef}
      >
        <Table stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  textAlign: "center",
                  fontWeight: "bold",
                  backgroundColor: "#bfc3d9",
                  color: "#333",
                  padding: "10px",
                  borderBottom: "2px solid #aaa",
                  width: "50%", // **Fixná šírka**
                }}
              >
                Excitácie
              </TableCell>
              <TableCell
                sx={{
                  textAlign: "center",
                  fontWeight: "bold",
                  backgroundColor: "#bfc3d9",
                  color: "#333",
                  padding: "10px",
                  borderBottom: "2px solid #aaa",
                  width: "50%", // **Fixná šírka**
                }}
              >
                Intenzity
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody
            style={{
              position: "relative",
              height: isLoading
                ? "200px"
                : `${rowVirtualizer.getTotalSize()}px`, // **Fixná výška pred načítaním**
            }}
          >
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  <Typography variant="body2">Načítavam dáta...</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = tableRows[virtualRow.index];

                return (
                  <TableRow
                    key={virtualRow.index}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      transform: `translateY(${virtualRow.start}px)`,
                      height: `${virtualRow.size}px`,
                      width: "100%",
                    }}
                    sx={{
                      "&:nth-of-type(odd)": { backgroundColor: "#f5f5f5" },
                    }}
                  >
                    <TableCell
                      sx={{
                        textAlign: "center",
                        padding: "8px",
                        fontSize: "12px",
                        borderBottom: "1px solid #ddd",
                        width: "50%", // **Fixná šírka bunky**
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {row.excitation.toFixed(5)}
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "center",
                        padding: "8px",
                        fontSize: "12px",
                        borderBottom: "1px solid #ddd",
                        width: "50%", // **Fixná šírka bunky**
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {row.intensity.toFixed(5)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
