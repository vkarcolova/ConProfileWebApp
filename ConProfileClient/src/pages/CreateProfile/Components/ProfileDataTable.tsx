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
import React from "react";
import { Profile } from "../../../shared/types";

interface ProfileDataTableProps {
  profile: Profile;
}
export const ProfileDataTable: React.FC<ProfileDataTableProps> = ({
  profile,
}) => {
  return (
    <Box className="table-container">
      <TableContainer component={Paper} sx={{ maxHeight: "45vh" }}>
        <Table
          stickyHeader
          size="small"
          aria-label="a dense table"
          sx={{ maxHeight: "45vh" }}
        >
          <TableHead>
            <TableRow>
              <TableCell>
                <Box sx={{ fontWeight: "bold" }} className="TableRowName">
                  Excitácie
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ fontWeight: "bold" }} className="TableRowName">
                  Intenzity
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                {profile.excitation.map((value: number, i) => (
                  <Box key={i}> {value.toFixed(1)}</Box>
                ))}
              </TableCell>
              <TableCell>
                {profile.profile.map((value: number, i) => (
                  <Box key={i}>{value ? value.toFixed(5) : ""}</Box>
                ))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
