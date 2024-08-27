import { Box } from "@mui/material";
import React from "react";
import { StatData } from "../../../shared/types";

interface StatsBoxProps {
  statsData: StatData;
  multipliedStatsData?: StatData;
}
export const StatsBox: React.FC<StatsBoxProps> = ({
  statsData,
  multipliedStatsData,
}) => {
  return (
    <Box className="statsContainer">
      <Box className="stats">
        <Box className="statsHead">
          <h3>Štatistiky</h3>
        </Box>
        <Box
          style={{
            flexDirection: "row",
            display: "flex",
            marginTop: "10px",
          }}
        >
          <Box className="statsColumn">
            <h4>Originálne</h4>
            <Box
              className="center-items"
              style={{
                marginTop: "20px",
                flexDirection: "row",
                display: "flex",
                textAlign: "center",
              }}
            >
              <Box>
                <h4>Max</h4>
                <h4>Min</h4>
                <h4>Std</h4>
              </Box>
              <Box sx={{minWidth: '72px', minHeight: '80px'}}>
                <h5>{statsData.max.toFixed(5)}</h5>
                <h5>{statsData.min.toFixed(5)}</h5>
                <h5>{statsData.std.toFixed(5)}</h5>
              </Box>
            </Box>
          </Box>
          <Box className="statsColumn">
            <h4>Prenásobené</h4>
            <Box
              className="center-items"
              style={{
                marginTop: "20px",
                flexDirection: "row",
                display: "flex",
                textAlign: "center",
              }}
            >
              <Box >
              <h4>Max</h4>
                <h4>Min</h4>
                <h4>Std</h4>
              </Box>
              <Box sx={{minWidth: '72px', minHeight: '80px', backgroundColor: 'white'}}>
                <h5>
                  {multipliedStatsData
                    ? multipliedStatsData.max.toFixed(5)
                    : "     "}
                </h5>
                <h5>
                  {multipliedStatsData
                    ? multipliedStatsData.min.toFixed(5)
                    : ""}
                </h5>
                <h5>
                  {multipliedStatsData
                    ? multipliedStatsData.std.toFixed(5)
                    : ""}
                </h5>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
