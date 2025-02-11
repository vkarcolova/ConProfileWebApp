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
  Drawer,
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
import SearchIcon from "@mui/icons-material/Search";
import { clientApi } from "../../shared/apis";
import { DataBankFileDTO, DataBankFolderDTO } from "../../shared/types";

interface DatabankObject {
  id: string;
  name: string;
  type: string;
  size: number;
  date: string;
  subfiles?: string[];
}

export default function DataBank() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedFile, setSelectedFile] = useState<DatabankObject | null>();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [objects, setObjects] = useState<DatabankObject[]>([]);
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
      console.log(res);
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
          });
        }
      });
      data = data.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      console.log(data);
      setObjects(data);
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
      };

      await clientApi.uploadExcelToDatabank(data).then((res) => {
        console.log(res);
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

        const loadedFile: DataBankFileDTO = {
          folderId: null,
          fileName: file.name,
          type: "SP",
          size: file.size,
          content: fileContent,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.email || "unknown",
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
      };

      await clientApi.uploadFolderToDatabank(folder).then((res) => {
        console.log(res);
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
      reader.readAsDataURL(file);
      reader.onload = () =>
        resolve(reader.result?.toString().split(",")[1] || "");
      reader.onerror = (error) => reject(error);
    });
  };
  const filteredFiles = Array.from(
    new Map(
      [...objects]
        .filter(
          (file) =>
            file.name.toLowerCase().includes(search.toLowerCase()) &&
            (filter === "all" || file.type === filter)
        )
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

  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    const kb = sizeInBytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
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

            <Grid container spacing={2} sx={{ mt: 2 }}>
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
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Button
              variant="contained"
              color="primary"
              disabled={selectedFiles.length === 0}
              onClick={async () => {
                try {
                  await clientApi
                    .createProjectFromDatabank(selectedFiles)
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
              }}
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
              Použiť vybrané súbory ({selectedFiles.length})
            </Button>
          </Box>

          <Drawer
            anchor="right"
            open={!!selectedFile}
            onClose={() => setSelectedFile(null)}
          >
            {selectedFile && (
              <Box sx={{ width: 280, padding: 2 }}>
                <Typography variant="h6">ℹ️ Info o súbore</Typography>
                <Typography variant="body1">
                  <strong>Názov:</strong> {selectedFile.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Typ:</strong>{" "}
                  {selectedFile.type === "folder" ? "Zložka" : "Súbor"}
                </Typography>
                <Typography variant="body2">
                  <strong>Veľkosť:</strong> {formatFileSize(selectedFile.size)}
                </Typography>
                <Typography variant="body2">
                  <strong>Dátum:</strong> {selectedFile.date}
                </Typography>
                {selectedFile.type === "folder" && (
                  <>
                    <Typography variant="body2">
                      <strong>Obsahuje súbory:</strong>
                    </Typography>
                    {selectedFile.subfiles?.map((subfile, index) => (
                      <Typography
                        sx={{ marginLeft: 2 }}
                        key={index}
                        variant="body2"
                      >
                        {subfile}
                      </Typography>
                    ))}
                  </>
                )}

                <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                  Stiahnuť
                </Button>
              </Box>
            )}
          </Drawer>
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
