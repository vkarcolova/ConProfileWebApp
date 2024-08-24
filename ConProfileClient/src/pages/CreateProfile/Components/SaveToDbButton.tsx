import { Button, Tooltip, tooltipClasses } from "@mui/material";
import React from "react";
import { basicButtonStyle, darkButtonStyle } from "../../../shared/styles";
import { ProjectDTO } from "../../../shared/types";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface SaveToDbButtonProps {
  loadedProjectId: string | undefined;
  projectData: ProjectDTO | null;
}

export const SaveToDbButton: React.FC<SaveToDbButtonProps> = ({
  loadedProjectId,
  projectData,
}) => {
  const navigate = useNavigate();

  const saveToDbButtonClick = async () => {
    const token = localStorage.getItem("token");
    console.log(token);
    let customHeaders:
      | { "Content-Type": string }
      | { "Content-Type": string; Authorization: string } = {
      "Content-Type": "application/json",
    };

    if (token != undefined || token != null) {
      customHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };
    }
    if (!loadedProjectId) {
      try {
        await axios
          .post(
            "https://localhost:44300/Project/SaveNewProject",
            JSON.stringify(projectData),
            {
              headers: customHeaders,
            }
          )
          .then((response) => {
            alert("Projekt bol uložený.");
            console.log(response);
            sessionStorage.removeItem("loadeddata");
            navigate("/create-profile/" + response.data.projectId);
          });
      } catch (error) {
        alert("Chyba pri uložení dát:");
      }
    }
  };
  return (
    <>
      {" "}
      {loadedProjectId ? (
        <Tooltip
          enterDelay={500}
          disableInteractive
          slotProps={{
            popper: {
              sx: {
                [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]:
                  {
                    marginTop: "0px",
                    fontSize: "13px",
                  },
              },
            },
          }}
          title="Projekt je uložený v databáze a všetky zmeny sa ukladajú automaticky."
        >
          <span>
            <Button
              variant="contained"
              onClick={saveToDbButtonClick}
              role="button"
              disabled={true}
              sx={{ ...basicButtonStyle, ...darkButtonStyle, border: "none" }}
            >
              Uložiť projekt do databázy
            </Button>
          </span>
        </Tooltip>
      ) : (
        <Button
          variant="contained"
          onClick={saveToDbButtonClick}
          role="button"
          sx={{ ...basicButtonStyle, ...darkButtonStyle }}
        >
          Uložiť projekt do databázy
        </Button>
      )}
    </>
  );
};
