import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  IconButton,
  Checkbox,
  Button,
  TextField,
  MenuItem,
  Box,
  Paper,
  Divider,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import InfoIcon from "@mui/icons-material/Info";
import UploadFileIcon from "@mui/icons-material/Upload";
import { AppBarLogin } from "../../shared/components/AppBarLogin";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../shared/context/useContext";
import { toast } from "react-toastify";
//import SearchIcon from "@mui/icons-material/Search";
import { clientApi } from "../../shared/apis";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  DatabankExcelContentDTO,
  DataBankFileDTO,
  DataBankFolderDTO,
  ExcelContent,
} from "../../shared/types";
import DatabankExcelUploader from "./components/DatabankExcelDialog";
import ObjectDrawer from "./components/ObjectDrawer";

export interface DatabankObject {
  id: string;
  name: string;
  type: string;
  size: number;
  date: string;
  uploadedBy: string;
  subfiles?: string[];
  shares: string[];
  public: boolean;
}

export default function DataBank() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedFile, setSelectedFile] = useState<DatabankObject | null>();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [objects, setObjects] = useState<DatabankObject[]>([]);
  const [selectedExcelContents, setSelectedExcelContents] = useState<
    DatabankExcelContentDTO[]
  >([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logoutUser } = useUserContext();
  const inputRefFolder = useRef<HTMLInputElement>(null);

  const shortenFileName = (fileName: string, maxLength: number) => {
    if (fileName.length <= maxLength) return fileName;

    const extensionIndex = fileName.lastIndexOf(".");
    const extension =
      extensionIndex !== -1 ? fileName.slice(extensionIndex) : "";
    const namePart = fileName.slice(0, maxLength - extension.length - 3);

    return `${namePart}...${extension}`;
  };

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      navigate("/auth/prihlasenie/");
    }
    refreshData();
  }, [user]);

  const refreshData = async () => {
    clientApi.getAllDatabankData().then((res) => {
      let data: DatabankObject[] = [];
      const folders: DataBankFolderDTO[] = res.data;
      folders.forEach((element) => {
        if (element.folderName == "Dummy") {
          element.files.forEach((file) => {
            data.push({
              id: "file" + file.id!,
              name: file.fileName,
              type: "file",
              size: file.size,
              date: file.uploadedAt,
              uploadedBy: file.uploadedBy,
              shares: file.shares,
              public: file.public,
            });
          });
        } else {
          data.push({
            id: "folder" + element.id!,
            name: element.folderName,
            type: "folder",
            size: element.files
              .map((file) => file.size)
              .reduce((a, b) => a + b),
            date: element.createdAt,
            subfiles: element.files.map((file) => file.fileName),
            uploadedBy: element.files[0].uploadedBy,
            shares: element.shares,
            public: element.public,
          });
        }
      });
      data = data.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setObjects(data);
      console.log(data);
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleExcelFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await fileToBase64(file);

      const data: DataBankFileDTO = {
        folderId: null,
        fileName: file.name,
        type: "Excel",
        size: file.size,
        content: fileContent,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.email || "unknown",
        public: false,
        shares: [],
      };

      await clientApi.uploadExcelToDatabank(data).then((res) => {
        if (res.status === 200) {
          toast.success("Súbor bol úspešne nahraný.");
          refreshData();
        } else {
          toast.error("Nepodarilo sa nahrať súbor.");
        }
      });
    } catch (error) {
      console.error("Chyba pri nahrávaní súboru:", error);
      throw error;
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    const filesArray: File[] = Array.from(selectedFiles).filter((file) => {
      const pathParts = file.webkitRelativePath.split("/");
      return file.name.endsWith(".sp") && pathParts.length === 2;
    });
    const folderName = filesArray[0].webkitRelativePath.split("/")[0];
    const loadedFiles: DataBankFileDTO[] = [];

    for (const file of filesArray) {
      try {
        const fileContent = await fileToBase64(file);
        console.log("Base64 obsah súboru:", fileContent);

        const loadedFile: DataBankFileDTO = {
          folderId: null,
          fileName: file.name,
          type: "SP",
          size: file.size,
          content: fileContent,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.email || "unknown",
          public: false,
          shares: [],
        };

        loadedFiles.push(loadedFile);
      } catch (error) {
        console.error(error);
      }
    }

    try {
      const folder: DataBankFolderDTO = {
        folderName: folderName,
        createdAt: new Date().toISOString(),
        files: loadedFiles,
        public: false,
        shares: [],
        uploadedBy: user?.email || "unknown",
      };

      await clientApi.uploadFolderToDatabank(folder).then((res) => {
        if (res.status === 200) {
          toast.success("Súbor bol úspešne nahraný.");
          refreshData();
        } else {
          toast.error("Nepodarilo sa nahrať súbor.");
        }
      });
    } catch (error) {
      console.error("Chyba pri nahrávaní súboru:", error);
      throw error;
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // 📌
      reader.onload = () =>
        resolve(reader.result?.toString().split(",")[1] || ""); // 📌 Odstránenie prefixu
      reader.onerror = (error) => reject(error);
    });
  };

  const filteredFiles = Array.from(
    new Map(
      [...objects]
        .filter((file) => {
          const matchesSearch = file.name
            .toLowerCase()
            .includes(search.toLowerCase());
          if (filter === "all") return matchesSearch;
          if (filter === "file" || filter === "folder")
            return matchesSearch && file.type === filter;
          if (filter === "mine")
            return matchesSearch && file.uploadedBy === user?.email;
          return matchesSearch;
        })
        .map((file) => [file.id, file])
    ).values()
  );

  const buttonStyle = {
    backgroundColor: "#bfc3d9",
    color: "black",
    "&:hover": {
      backgroundColor: "#a6abc9",
    },
  };

  const handleCreateProject = async () => {
    if (selectedFiles.length === 0) return;
    const containsFile = selectedFiles.some((id) => id.startsWith("file"));
    if (!containsFile) {
      try {
        await clientApi
          .createProjectFromDatabank({ excelContents: [], ids: selectedFiles })
          .then((response) => {
            const token = response.data.token;
            localStorage.setItem("token", token);
            const objString = JSON.stringify(response.data.project);
            sessionStorage.setItem("loadeddata", objString);
            navigate("/uprava-profilu/");
          });
      } catch (error) {
        console.error("Chyba pri načítavaní dát:", error);
      }
    } else {
      await clientApi.getExcelContents(selectedFiles).then((response) => {
        const excelContents = response.data;
        setSelectedExcelContents(excelContents);
        setDialogOpen(true);
      });
    }
  };

  const sendDataWithExcels = async (excels: ExcelContent[]) => {
    if (selectedFiles.length === 0) return;

    await clientApi
      .createProjectFromDatabank({ excelContents: excels, ids: selectedFiles })
      .then((response) => {
        const token = response.data.token;
        localStorage.setItem("token", token);
        const objString = JSON.stringify(response.data.project);
        sessionStorage.setItem("loadeddata", objString);
        navigate("/uprava-profilu/");
      });
  };

  const handleDeleteFile = async (id: string) => {
    await clientApi.deleteDatabankObject(id).then((res) => {
      if (res && res.status === 200) {
        toast.success("Súbor bol úspešne vymazaný.");
        refreshData();
      } else {
        toast.error("Nepodarilo sa vymazať súbor.");
      }
    });
  };

  return (
    <div
      style={{
        display: "flex",
        height: "80%",
        paddingTop: 100,
        gap: 20,
        paddingInline: 20,
      }}
    >
      {user && (
        <>
          <AppBarLogin
            content={
              <>
                <Box sx={{ display: "flex" }}>
                  <Typography
                    sx={{
                      color: "#454545",
                      fontWeight: "550",
                      marginRight: "10px",
                      marginTop: "10px",
                    }}
                  >
                    Prihlásený používateľ{" "}
                    <span style={{ color: "rgba(59, 49, 119, 0.87)" }}>
                      {user.email}
                    </span>
                  </Typography>
                  <Button
                    onClick={() => {
                      logoutUser();
                      toast.success("Boli ste úspešne odhlásený.");
                    }}
                    color="primary"
                    variant="text"
                    size="small"
                    sx={{
                      backgroundColor: "#BFC2D2",
                      width: "80px",
                      borderRadius: 100,
                      color: "rgba(59, 49, 119, 0.87)",
                      padding: "10px",

                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "#E2E3E8",
                      },
                    }}
                  >
                    {" "}
                    <Typography fontWeight={600}>Odhlásenie</Typography>
                  </Button>
                </Box>
              </>
            }
          />
          <Paper
            sx={{
              width: 280,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              p: 2,
              backgroundColor: "#f5f5f5",
              height: "100%",
            }}
          >
            <Typography variant="h6"> Vyhľadávanie</Typography>
            <TextField
              label="Názov súboru"
              variant="outlined"
              size="small"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Typography variant="h6"> Filtrovanie</Typography>
            <TextField
              select
              label="Typ súboru"
              variant="outlined"
              size="small"
              fullWidth
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">Všetko</MenuItem>
              <MenuItem value="file">Súbory</MenuItem>
              <MenuItem value="folder">Zložky</MenuItem>
              <MenuItem value="mine">Moje súbory</MenuItem>
            </TextField>

            <Divider sx={{ my: 2 }} />

            {/* Upload Section */}
            <Typography variant="h6"> Nahrať súbor</Typography>
            <div style={{ display: "flex", gap: "10px", paddingInline: 15 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
                sx={buttonStyle}
              >
                Vybrať priečinok
                <input
                  ref={inputRefFolder}
                  type="file"
                  directory=""
                  webkitdirectory=""
                  onChange={handleFolderUpload}
                  multiple
                  style={{ display: "none" }}
                />
              </Button>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
                sx={buttonStyle}
              >
                Vybrať XLSX súbor
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelFileUpload}
                  hidden
                />
              </Button>
            </div>
          </Paper>

          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              paddingRight: 4,
              height: "100%",
            }}
          >
            <Typography
              sx={{
                fontFamily: "Poppins",
                color: "#514986",
                fontWeight: 600,
                textShadow:
                  "1px 1px 0px white, -1px -1px 0px white, 1px -1px 0px white, -1px 1px 0px white",
              }}
              variant="h4"
            >
              Databanka súborov
            </Typography>

            <Grid
              container
              spacing={2}
              sx={{ mt: 2, maxHeight: "90%", overflowY: "auto" }}
            >
              {filteredFiles.map((file: DatabankObject) => (
                <Grid item xs={12} sm={6} md={4} lg={2.4} key={file.id}>
                  <Card
                    sx={{
                      textAlign: "center",
                      padding: 1,
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    {file.type === "folder" ? (
                      <FolderIcon sx={{ fontSize: 40, color: "orange" }} />
                    ) : (
                      <InsertDriveFileIcon
                        sx={{ fontSize: 40, color: "green" }}
                      />
                    )}
                    <CardContent>
                      <Typography variant="body1">
                        {shortenFileName(file.name, 20)}{" "}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: "center" }}>
                      <Checkbox
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => toggleSelection(file.id)}
                      />
                      <IconButton onClick={() => setSelectedFile(file)}>
                        <InfoIcon />
                      </IconButton>
                      <IconButton>
                        <DownloadIcon />
                      </IconButton>
                      {file.uploadedBy === user?.email && (
                        <IconButton onClick={() => handleDeleteFile(file.id)}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Button
              variant="contained"
              color="primary"
              disabled={selectedFiles.length === 0}
              onClick={handleCreateProject}
              sx={{
                mt: 2,
                backgroundColor: "rgba(59, 49, 119, 0.87)",
                color: "white",
                "&:hover": {
                  backgroundColor: "#625b92",
                },

                fontWeight: 600,
              }}
            >
              Použiť vybrané súbory v novom projekte ({selectedFiles.length})
            </Button>
          </Box>

          <ObjectDrawer
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            refreshData={refreshData}
          />

          {selectedExcelContents.length > 0 && (
            <DatabankExcelUploader
              excelContentsFromDb={selectedExcelContents}
              dialogOpen={dialogOpen}
              setDialogOpen={setDialogOpen}
              sendExcels={sendDataWithExcels}
            />
          )}
        </>
      )}
    </div>
  );
}

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}
