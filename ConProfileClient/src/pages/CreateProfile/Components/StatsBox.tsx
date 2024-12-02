import { Box, Card, Grid, Typography } from "@mui/material";
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
    <Box
      sx={{
        height: "100%",
        minWidth: "55%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card
        variant="outlined"
        className="stats"
        sx={{ maxHeight: "40%", borderRadius: "30px", marginLeft: "10px" }}
      >
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
          <Grid className="statsColumn" item xs={12} sm={6}>
            <Typography sx={{ fontSize: "15px" }}>Originálne</Typography>
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
                <h5 style={{ fontWeight: "550" }}>Max</h5>
                <h5 style={{ fontWeight: "550" }}>Min</h5>
                <h5 style={{ fontWeight: "550" }}>Std</h5>
              </Box>
              <Box sx={{ minWidth: "72px", minHeight: "80px" }}>
                <h5>{statsData.max.toFixed(5)}</h5>
                <h5>{statsData.min.toFixed(5)}</h5>
                <h5>{statsData.std.toFixed(5)}</h5>
              </Box>
            </Box>
          </Grid>
          <Grid className="statsColumn" item xs={12} sm={6}>
            <Typography sx={{ fontSize: "15px" }}>Prenásobené</Typography>
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
                <h5 style={{ fontWeight: "550" }}>Max</h5>
                <h5 style={{ fontWeight: "550" }}>Min</h5>
                <h5 style={{ fontWeight: "550" }}>Std</h5>
              </Box>
              <Box
                sx={{
                  minWidth: "72px",
                  minHeight: "80px",
                  backgroundColor: "white",
                }}
              >
                <h5>
                  {multipliedStatsData
                    ? multipliedStatsData.max.toFixed(5)
                    : ""}
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
          </Grid>
        </Box>
      </Card>
    </Box>
  );
};
