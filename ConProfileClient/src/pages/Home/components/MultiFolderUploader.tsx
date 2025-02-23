import { FileWithPath, useDropzone } from "react-dropzone";
import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Backdrop,
  IconButton,
} from "@mui/material";
import { NunuButton } from "../../../shared/components/NunuButton";
import { FileContent, FolderDTO } from "../../../shared/types";
import { clientApi } from "../../../shared/apis";
import { toast } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";

const baseStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "#eeeeee",
  borderStyle: "dashed",
  backgroundColor: "#fafafa",
  color: "#818181",
  outline: "none",
  transition: "border .24s ease-in-out",
};

const focusedStyle = {
  borderColor: "#2196f3",
};

const acceptStyle = {
  borderColor: "#00e676",
};

const rejectStyle = {
  borderColor: "#ff1744",
};

type FileMap = {
  [folder: string]: FileWithPath[];
};

interface MultiFolderUploaderProps {
  setStep: (step: number) => void;
  setFolders: (folders: FolderDTO[]) => void;
}

const MultiFolderUploader: React.FC<MultiFolderUploaderProps> = ({
  setStep,
  setFolders,
}) => {
  const [existingFolders, setExistingFolders] = useState<FileMap>({});
  const [loading, setLoading] = useState(false);

  const {
    getRootProps,
    getInputProps,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    acceptedFiles,
    isFocused,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    noClick: true,
    accept: { ".sp": [] },
    onDrop: (newFiles: FileWithPath[]) => {
      const newGroupedFiles = { ...existingFolders };

      newFiles.forEach((file) => {
        const folder = file.path
          ? file.path.split("/")[1]
          : "Neznámy priečinok";

        if (!newGroupedFiles[folder]) {
          newGroupedFiles[folder] = [];
        }

        if (!newGroupedFiles[folder].some((f) => f.name === file.name)) {
          newGroupedFiles[folder].push(file);
        }
      });

      setExistingFolders(newGroupedFiles);
    },
  });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject]
  );

  const uploadFolders = async () => {
    const filesArray = Object.values(existingFolders).flat();

    if (filesArray.length === 0) {
      toast.warn("Najskôr pridajte súbory!");
      return;
    }

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

    const loadedFiles: FileContent[] = [];

    for (const file of filesArray) {
      try {
        const result = await readFileAsync(file);
        const folderName = file.path ? file.path.split("/")[1] : "";
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

    setLoading(true);

    try {
      await clientApi.batchProcessFolders(loadedFiles).then((response) => {
        setLoading(false);
        setFolders(response.data.folders);
        console.log(response.data.folders);
        setStep(2);
      });
    } catch (error) {
      toast.error("Chyba pri načítavaní dát.");
      setLoading(false);
    }
  };

  const clearFolders = () => {
    setExistingFolders({});
    setFolders([]);
  };

  return (
    <section className="container">
      <Typography variant="body1">
        <b>Načítanie viacerých priečinkov naraz (zrýchlený režim):</b> <br />
        Priečinky sa automaticky načítajú a extrahujú sa z nich spektrá. Pre
        každé spektrum si užívateľ môže v ďalšom kroku vybrať vhodný faktor. Po
        spracovaní bude pripravený CSV súbor, ktorý si užívateľ môže okamžite
        stiahnuť.
      </Typography>
      <br />
      <Box {...getRootProps({ className: "dropzone", style: style })}>
        <input {...getInputProps()} />
        <Typography variant="body1" textAlign="center">
          Presuňte sem priečinky na načítanie
        </Typography>
      </Box>
      <Box
        mt={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography fontWeight="bold">Súbory na načítanie:</Typography>
        <IconButton
          onClick={clearFolders}
          sx={{ color: "red" }}
          title="Vymazať zoznam"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
      {loading && (
        <Backdrop
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            backdropFilter: "blur(5px)",
            borderRadius: "0px",
          }}
          open={true}
        >
          <CircularProgress color={"inherit"} sx={{ color: "white" }} />
        </Backdrop>
      )}
      <Box
        sx={{
          height: "100px",
          overflowY: "auto",
          border: "1px solid #ddd",
          padding: "10px",
          borderRadius: "5px",
          position: "relative", // Potrebné pre overlay
        }}
      >
        {Object.keys(existingFolders).length > 0 ? (
          Object.keys(existingFolders).map((folder) => (
            <Box key={folder} mb={2}>
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ fontSize: "11px", fontFamily: "Poppins" }}
              >
                Priečinok: {folder}
              </Typography>
              <Box>
                {existingFolders[folder].map((file) => (
                  <Typography
                    sx={{ fontSize: "12px" }}
                    key={file.name}
                    variant="subtitle2"
                  >
                    {file.name}
                  </Typography>
                ))}
              </Box>
            </Box>
          ))
        ) : (
          <Typography
            variant="body2"
            sx={{ fontSize: "12px", fontStyle: "italic", color: "gray" }}
          >
            Žiadne priečinky neboli pridané.
          </Typography>
        )}
      </Box>
      <Box mt={2} display="flex" justifyContent="center">
        <NunuButton
          onClick={uploadFolders}
          bgColour="#BFC2D2"
          textColour="rgba(59, 49, 119, 0.87)"
          hoverTextColour="white"
          hoverBgColour="#E2E3E8"
          label="Nahrať dáta"
          sx={{
            maxWidth: "150px",
            height: "30px",
            borderRadius: "30px",
            width: "100%",
            boxShadow: "none",
          }}
          fontSize="13px"
          disabled={Object.keys(existingFolders).length === 0}
        />
      </Box>
    </section>
  );
};

export default MultiFolderUploader;
