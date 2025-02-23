import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { clientApi } from "../../../shared/apis";
import {
  Factors,
  FolderDTO,
  IntensityDTO,
  TableDataColumn,
} from "../../../shared/types";
import MultiFolderUploader from "./MultiFolderUploader";
import { NunuButton } from "../../../shared/components/NunuButton";
import CustomInputAutocomplete from "../../../shared/components/CustomAutocomplete";
import { toast } from "react-toastify";

interface BatchDataLoadModalProps {
  openModal: boolean;
  setOpenModal: (value: boolean) => void;
}

const BatchDataLoadModal: React.FC<BatchDataLoadModalProps> = ({
  openModal,
  setOpenModal,
}) => {
  const [step, setStep] = useState<number>(1);
  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [spectrums, setSpectrums] = useState<string[]>([]);
  const [allFactors, setAllFactors] = React.useState<Factors[]>([]);
  const [inputFactors, setInputFactors] = React.useState<(number | null)[]>([]);

  useEffect(() => {
    if (openModal) return;

    const timeout = setTimeout(() => {
      setFolders([]);
      setSpectrums([]);
      setInputFactors([]);
      setStep(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [openModal]);

  useEffect(() => {
    console.log(folders);
    console.log(spectrums);
  }, [folders, spectrums]);

  useEffect(() => {
    if (folders.length > 0 && step === 2) {
      const uniqueSpectrums = new Set<string>();

      folders.forEach((folder) => {
        folder.data.forEach((file) => {
          if (file.spectrum === -1) {
            uniqueSpectrums.add(file.filename);
          } else {
            uniqueSpectrums.add(file.spectrum.toString());
          }
        });
      });

      setSpectrums(Array.from(uniqueSpectrums));
      const fetchFactors = async () => {
        const factorsdata = localStorage.getItem("factorsdata");
        const localFactors: Factors[] = factorsdata
          ? JSON.parse(factorsdata)
          : [];
        const updatedFactors = await clientApi.getFactors(localFactors);
        setAllFactors(updatedFactors);
      };
      fetchFactors();
    }
  }, [folders, step]);

  const changeFactorsValue = (id: number, value: number | null) => {
    const factors: (number | null)[] = [];
    spectrums.forEach((_, index) => {
      const autocompleteInput = document.getElementById(
        `autocomplete-${index}`
      ) as HTMLInputElement | null;

      const inputFactor =
        autocompleteInput &&
        (autocompleteInput.value !== null || autocompleteInput?.value !== "")
          ? parseFloat(autocompleteInput.value)
          : null;

      factors.push(inputFactor);
    });

    const updatedFactors = [...factors];
    updatedFactors[id] = value;
    setInputFactors(updatedFactors);
  };

  const extractAndSortExcitations = (folders: FolderDTO[]): number[] => {
    const excitationSet: Set<number> = new Set(); // Používame Set na unikátne hodnoty
    folders.forEach((folder) => {
      folder.data.forEach((file) => {
        file.intensity.forEach((intensityObj) => {
          if (intensityObj.excitation !== null) {
            excitationSet.add(intensityObj.excitation);
          }
        });
      });
    });

    const sortedExcitations = Array.from(excitationSet).sort((a, b) => a - b);
    return sortedExcitations;
  };

  const replaceDotWithComma = (value: string | number) => {
    if (typeof value === "number") {
      if (isNaN(value)) return "0";
      return value.toString().replace(".", ",");
    }
    if (typeof value === "string" && value !== "") {
      return value.replace(".", ",");
    }
    return "0";
  };
  const createCSV = () => {
    if (
      inputFactors.filter((factor) => factor == null).length > 0 ||
      inputFactors == null
    ) {
      toast.error("Neboli vyplnené všetky faktory.");
      return;
    }

    const excitationValues = extractAndSortExcitations(folders);

    const masterMatrix = [];
    const header = [];
    header.push("Excitacie");
    masterMatrix.push(excitationValues);
    folders.forEach((folderData) => {
      const folderIntensitiesColums: TableDataColumn[] = [];

      folderData.data.forEach((file) => {
        let intensities: (IntensityDTO | null)[] = [];

        intensities = excitationValues.map((value) => {
          const singleIntensity = file.intensity.find(
            (x) => x.excitation === value
          );
          return singleIntensity ? singleIntensity : null;
        });
        const index = spectrums.indexOf(file.spectrum.toString());
        const column: TableDataColumn = {
          name: file.filename,
          intensities: intensities.map((x) =>
            x?.intensity != null && inputFactors[index] != null
              ? x.intensity * inputFactors[index]
              : 0
          ),
          spectrum: file.spectrum,
        };

        folderIntensitiesColums.push(column);
      });
      const profile = [];
      for (let i = 0; i < excitationValues.length; i++) {
        let maxIntensity: number | undefined = undefined;

        folderIntensitiesColums.forEach((column) => {
          const intensity = column.intensities[i];
          if (
            intensity !== undefined &&
            (maxIntensity === undefined || intensity > maxIntensity)
          ) {
            maxIntensity = intensity;
          }
        });

        profile.push(maxIntensity ?? "");
      }

      masterMatrix.push(profile);
      header.push(folderData.foldername);
    });

    const rows = [];
    rows.push(header.join(";"));

    const rowCount = masterMatrix[0].length;

    for (let i = 0; i < rowCount; i++) {
      const row = masterMatrix.map((column) =>
        column[i] !== undefined ? replaceDotWithComma(column[i]) : ""
      ); // Pridaj hodnoty z každého stĺpca
      rows.push(row.join(";"));
    }

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "profily.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <Box textAlign="center">
          <Typography variant="caption"></Typography>
          <Box mt={2}>
            <MultiFolderUploader setStep={setStep} setFolders={setFolders} />
          </Box>
        </Box>
      );
    }

    if (step === 2) {
      return (
        <Box>
          <Box
            sx={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <Typography
              variant="body1"
              sx={{
                fontFamily: "Poppins",
                textAlign: "center",
                maxWidth: "80%",
              }}
            >
              Dáta zo súborov boli úspešne načítané. Nižšie vyberte faktory pre
              jednotlivé spektrá v súboroch. Ak sa nepodarilo spektrum získať z
              názvu súboru, je pre tieto prípady pripravené samostatné pole pre
              daný súbor.
            </Typography>
          </Box>

          <Box
            mt={2}
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", // Maximálne 4 v riadku
              gap: "16px", // Priestor medzi položkami
              maxHeight: "300px", // Maximálna výška
              overflowY: "auto", // Posuvník
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          >
            {spectrums.map((spectrum, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: "0px",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ padding: 0, marginBottom: "8px" }}
                >
                  Spektrum: {spectrum}
                </Typography>
                <CustomInputAutocomplete
                  columnSpectrum={Number(spectrum)}
                  id={index}
                  allFactors={allFactors}
                  changeFactorValue={changeFactorsValue}
                />
              </Box>
            ))}
          </Box>

          <Box mt={2} display="flex" justifyContent="center">
            <NunuButton
              onClick={() => createCSV()}
              bgColour="#BFC2D2"
              textColour="rgba(59, 49, 119, 0.87)"
              hoverTextColour="white"
              hoverBgColour="#E2E3E8"
              label="Vytvoriť CSV"
              sx={{
                maxWidth: "150px",
                height: "30px",
                borderRadius: "30px",
                width: "100%",
                boxShadow: "none",
              }}
              fontSize="13px"
              disabled={
                inputFactors.filter((factor) => factor === null).length > 0
              }
            />
          </Box>
        </Box>
      );
    }

    return null;
  };

  return (
    <>
      <Dialog
        aria-labelledby="customized-dialog-title"
        open={openModal}
        fullWidth={true}
        maxWidth="md"
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Spracovanie dát
        </DialogTitle>

        <IconButton
          aria-label="close"
          onClick={() => {
            setOpenModal(false);
          }}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>{renderStepContent()}</DialogContent>
      </Dialog>
    </>
  );
};

export default BatchDataLoadModal;

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}
