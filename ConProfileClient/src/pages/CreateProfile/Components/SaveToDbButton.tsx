import { Button, Tooltip, tooltipClasses, Typography } from "@mui/material";
import React from "react";
import { basicButtonStyle, darkButtonStyle } from "../../../shared/styles";
import { ProjectDTO } from "../../../shared/types";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import config from "../../../../config";

interface SaveToDbButtonProps {
  loadedProjectId: string | undefined;
  projectData: ProjectDTO | null;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SaveToDbButton: React.FC<SaveToDbButtonProps> = ({
  loadedProjectId,
  projectData,
  setLoading,
}) => {
  const navigate = useNavigate();

  const saveToDbButtonClick = async () => {
    const token = localStorage.getItem("token");
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
      setLoading(true);
      try {
        console.log("ukladam");

        await axios
          .post(
            `${config.apiUrl}/Project/SaveNewProject`,
            JSON.stringify(projectData),
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                UserEmail: localStorage.getItem("useremail"),
              },
            }
          )
          .then((response) => {
            console.log(response);
            toast.success("Projekt bol úspešne uložený do databázy.");
            sessionStorage.removeItem("loadeddata");
            navigate("/uprava-profilu/" + response.data.projectId);
            setLoading(false);
          });
      } catch (error) {
        console.log("neulozwnw");

        toast.error("Nepodarilo sa uložiť projekt.");
        setLoading(false);
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
              sx={{
                ...basicButtonStyle,
                ...darkButtonStyle,
                border: "none",
                borderRadius: "10px",
              }}
            >
              <Typography fontWeight={550} fontSize="14px">
                Uložiť projekt do databázy
              </Typography>
            </Button>{" "}
          </span>
        </Tooltip>
      ) : (
        <Button
          variant="contained"
          onClick={saveToDbButtonClick}
          role="button"
          sx={{
            ...basicButtonStyle,
            ...darkButtonStyle,
            boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px;",
            borderRadius: "10px",
          }}
        >
          <Typography fontWeight={550} fontSize="14px">
            Uložiť projekt do databázy
          </Typography>
        </Button>
      )}
    </>
  );
};
