import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { clientApi } from "../../../shared/apis";
import {
  Factors,
  FileContent,
  FolderDTO,
  IntensityDTO,
  TableDataColumn,
} from "../../../shared/types";
import { useNavigate } from "react-router-dom";
import MultiFolderUploader from "./MultiFolderUploader";
import { NunuButton } from "../../../shared/components/NunuButton";
import CustomInputAutocomplete from "../../../shared/components/CustomAutocomplete";
import { toast } from "react-toastify";
import ExcelUploader from "./XlsxUploader";

interface BatchDataLoadButtonModalProps {}

const BatchDataLoadButtonModal: React.FC<
  BatchDataLoadButtonModalProps
> = () => {
  const inputRefFolder = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [openModal, setOpenModal] = React.useState(false);
  const [step, setStep] = useState<number>(1);
  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [spectrums, setSpectrums] = useState<string[]>([]);
  const [allFactors, setAllFactors] = React.useState<Factors[]>([]);
  const [inputFactors, setInputFactors] = React.useState<(number | null)[]>([]);

  useEffect(() => {
    if(openModal) return;
    setFolders([]);
    setSpectrums([]);
    setInputFactors([]);
    setStep(1);
  }, [openModal]);

  useEffect(() => {
    if (folders.length > 0 && step === 3) {
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
        console.log(updatedFactors);
        setAllFactors(updatedFactors);
      };
      fetchFactors();
    }
  }, [folders, step]);

  const handleSelectFolder = () => {
    try {
      if (inputRefFolder.current) {
        inputRefFolder.current.click();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleUploadNewData = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      const selectedFiles = e.target.files;
      if (selectedFiles) {
        const filesArray: File[] = Array.from(selectedFiles).filter((file) => {
          const pathParts = file.webkitRelativePath.split("/");
          return file.name.endsWith(".sp") && pathParts.length === 2;
        });
        const folderName = filesArray[0].webkitRelativePath.split("/")[0];
        const loadedFiles: FileContent[] = [];

        const readFileAsync = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target) {
                resolve(event.target.result as string);
              } else {
                reject(new Error("Failed to read file."));
              }
            };
            reader.readAsText(file);
          });
        };

        for (const file of filesArray) {
          try {
            const result = await readFileAsync(file);
            const loadedFile: FileContent = {
              IDPROJECT: -1,
              FILENAME: file.name,
              FOLDERNAME: folderName,
              CONTENT: result,
            };

            loadedFiles.push(loadedFile);
          } catch (error) {
            console.error(error);
          }
        }
        try {
          await clientApi.createProject(loadedFiles).then((response) => {
            const token = response.data.token;
            localStorage.setItem("token", token);
            const objString = JSON.stringify(response.data.project);
            sessionStorage.setItem("loadeddata", objString);
            navigate("/uprava-profilu/");
          });
        } catch (error) {
          console.error("Chyba pri načítavaní dát:", error);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
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
      return value.toString().replace(".", ",");
    }
    if (typeof value === "string" && value !== "") {
      return value.replace(".", ",");
    }
    return value;
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
            x?.intensity ? x?.intensity * inputFactors[index]! : x?.intensity
          ),
          spectrum: file.spectrum,
        };
        folderIntensitiesColums.push(column);
      });
      const profile = [];
      for (let i = 0; i < excitationValues.length; i++) {
        let maxIntensity = folderIntensitiesColums[0].intensities[i];
        folderIntensitiesColums.forEach((column) => {
          if (
            column.intensities[i] != undefined &&
            (maxIntensity === undefined ||
              column.intensities[i]! > maxIntensity)
          ) {
            maxIntensity = column.intensities[i];
          }
        });
        profile.push(maxIntensity);
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
        <Box display="flex" alignItems="center" gap={4} sx={{ height: "100%" }}>
          <Typography
            variant="body1"
            sx={{
              fontFamily: "Poppins",
              textAlign: "justify",
              maxWidth: "50%",
            }}
          >
            Pri tvorbe koncentračného modelu sú dostupné dve možnosti: <br />
            <b>
              1. Načítanie jedného priečinka alebo dát priamo zo súboru .xlsx :
            </b>{" "}
            <br />
            • Pri tejto možnosti bude vytvorený jeden projekt, ktorý sa uloží do
            databázy. <br />
            • Do tohto projektu je možné následne pridávať ďalšie priečinky,
            odoberať ich, meniť faktory, porovnávať koncentračné profily a
            exportovať výsledky. <br />
            <b>
              2. Načítanie viacerých priečinkov naraz (zrýchlený režim):
            </b>{" "}
            <br />• Priečinky sa automaticky načítajú a extrahujú sa z nich
            spektrá. <br />
            • Pre každé spektrum si užívateľ môže vybrať vhodný faktor. <br />•
            Po spracovaní bude pripravený CSV súbor, ktorý si užívateľ môže
            okamžite stiahnuť.
          </Typography>

          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            gap={2}
            sx={{ width: "50%" }}
          >
            <Button
              variant="outlined"
              sx={{
                borderRadius: "30px",
                border: "2px solid #514986",
                "&:hover": {
                  border: "2px solid #dcdbe7",
                },
                width: "60%",
              }}
              onClick={() => setStep(4)}
            >
              <Typography
                sx={{
                  fontFamily: "Poppins",
                  fontWeight: 500,
                  fontSize: "15px",
                  padding: "2px",
                  color: "#514986",
                }}
                textTransform={"none"}
              >
                Načítať dáta z .xlsx
              </Typography>
            </Button>

            <Button
              variant="outlined"
              sx={{
                borderRadius: "30px",
                border: "2px solid #514986",
                "&:hover": {
                  border: "2px solid #dcdbe7",
                },
                width: "60%",
              }}
              onClick={() => handleSelectFolder()}
            >
              <Typography
                sx={{
                  fontFamily: "Poppins",
                  fontWeight: 500,
                  fontSize: "15px",
                  padding: "2px",
                  color: "#514986",
                }}
                textTransform={"none"}
              >
                Načítať jeden priečinok
              </Typography>
            </Button>

            <input
              ref={inputRefFolder}
              type="file"
              directory=""
              webkitdirectory=""
              onChange={handleUploadNewData}
              multiple
              style={{ display: "none" }}
            />
            <Button
              variant="outlined"
              sx={{
                borderRadius: "30px",
                border: "2px solid #dcdbe7",
                backgroundColor: "#d5e1fb",
                "&:hover": {
                  border: "2px solid #dcdbe7",
                },
                width: "60%",
              }}
              onClick={() => setStep(2)}
            >
              <Typography
                sx={{
                  fontFamily: "Poppins",
                  fontWeight: 500,
                  fontSize: "15px",
                  padding: "2px",
                  color: "#514986",
                }}
                textTransform={"none"}
              >
                Načítať viac priečinkov{" "}
              </Typography>
            </Button>
          </Box>
        </Box>
      );
    }

    if (step === 2) {
      return (
        <Box textAlign="center">
          <Typography variant="caption"></Typography>
          <Box mt={2}>
            <MultiFolderUploader setStep={setStep} setFolders={setFolders} />
          </Box>
        </Box>
      );
    }

    if (step === 4) {
      return (
        <Box textAlign="center" sx={{ height: "70vh" }}>
          <ExcelUploader newProject={true}/>
        </Box>
      );
    }

    if (step === 3) {
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
      <Button
        onClick={() => setOpenModal(true)}
        sx={{
          backgroundColor: "rgba(59, 49, 119, 0.87)",
          width: "300px",
          borderRadius: "30px",
          color: "white",
          padding: "10px",
          marginBlock: "5px",
          height: "70px",

          textTransform: "none",
          "&:hover": {
            backgroundColor: "#625b92",
            color: "white",
          },
          boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px;",
        }}
      >
        <Typography fontWeight={500} fontSize={"20px"}>
          Načítať dáta
        </Typography>
      </Button>
      <Dialog
        aria-labelledby="customized-dialog-title"
        open={openModal}
        fullWidth={true}
        maxWidth="md"
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Načítanie dát
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

export default BatchDataLoadButtonModal;

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}
