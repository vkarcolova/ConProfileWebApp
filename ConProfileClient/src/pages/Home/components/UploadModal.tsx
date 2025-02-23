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
import { FileContent } from "../../../shared/types";
import { useNavigate } from "react-router-dom";
import ExcelUploader from "./XlsxUploader";

interface UploadModalProps {
  openModal: boolean;
  setOpenModal: (value: boolean) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({
  openModal,
  setOpenModal,
}) => {
  const inputRefFolder = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    if (openModal) return;

    const timeout = setTimeout(() => {
      setStep(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [openModal]);

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
            <b>
              Vytvorenie projektu pomocou priečinka alebo dát priamo zo súboru
              .xlsx :
            </b>{" "}
            <br />
            • Pri tejto možnosti bude vytvorený jeden projekt, ktorý sa uloží do
            databázy. <br />
            • Do tohto projektu je možné následne pridávať ďalšie priečinky,
            odoberať ich, meniť faktory, porovnávať koncentračné profily a
            exportovať výsledky. <br />
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
                backgroundColor: "#f6fafd",
                borderRadius: "30px",
                border: "2px solid #514986",
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
                Načítať dáta z .xlsx
              </Typography>
            </Button>

            <Button
              variant="outlined"
              sx={{
                borderRadius: "30px",
                backgroundColor: "#f6fafd",

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
          </Box>
        </Box>
      );
    }

    if (step === 2) {
      return (
        <Box textAlign="center" sx={{ height: "70vh" }}>
          <ExcelUploader newProject={true} />
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

export default UploadModal;

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}
