import {
  Box,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
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
  const [isLoading, setIsLoading] = useState(true);
  const rowHeight = 20; // ✅ Presná výška jedného riadku
  const minRowCount = 10; // ✅ Počet placeholder riadkov, keď sa načítavajú dáta

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

    setTimeout(() => {
      setTableRows(rows);
      setIsLoading(false);
    }, 200);
  }, [profile]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: isLoading ? minRowCount : tableRows.length, // ✅ Fixný počet riadkov počas načítavania
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 40,
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
        sx={{
          maxHeight: "45vh",
          overflow: "auto",
          height: `45vh`, // ✅ Fixná výška tabuľky aj pri načítaní
          width: "100%",
        }}
        ref={parentRef}
      >
        <Table
          stickyHeader
          sx={{
            tableLayout: "fixed",
            width: "100%",
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  textAlign: "center",
                  fontWeight: "bold",
                  backgroundColor: "#bfc3d9",
                  color: "#333",
                  padding: "5px",
                  width: "50%",
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
                  padding: "5px",
                  width: "50%",
                }}
              >
                Intenzity
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody
            style={{
              position: "relative",
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = isLoading
                ? { excitation: 0, intensity: 0 } // ✅ Placeholder dáta
                : tableRows[virtualRow.index];

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
                    display: "flex",
                  }}
                  sx={{
                    "&:nth-of-type(odd)": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <TableCell
                    sx={{
                      textAlign: "center",
                      padding: "5px",
                      fontSize: "12px",
                      flex: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      border: "none",
                      color: isLoading ? "#aaa" : "inherit", // ✅ Sivý text počas načítavania
                    }}
                  >
                    {isLoading ? "  " : row.excitation.toFixed(5)}
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: "center",
                      padding: "5px",
                      fontSize: "12px",
                      flex: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      border: "none",
                      color: isLoading ? "#aaa" : "inherit",
                    }}
                  >
                    {isLoading ? "  " : row.intensity.toFixed(5)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
