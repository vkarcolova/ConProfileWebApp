import React, { useState } from "react";
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

const mockFiles = [
  {
    id: 1,
    name: "Projekt A",
    type: "folder",
    size: "5 MB",
    date: "2024-02-01",
  },
  {
    id: 2,
    name: "Vysledky.xlsx",
    type: "file",
    size: "50 KB",
    date: "2024-01-20",
  },
  { id: 3, name: "Dáta.csv", type: "file", size: "120 KB", date: "2024-01-25" },
  { id: 4, name: "Reporty", type: "folder", size: "10 MB", date: "2024-02-02" },
  {
    id: 5,
    name: "Analyza.docx",
    type: "file",
    size: "80 KB",
    date: "2024-01-10",
  },
];

export default function DataBank() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const navigate = useNavigate();

  const toggleSelection = (id: number) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files).map((file) => ({
        id: mockFiles.length + uploadedFiles.length + 1,
        name: file.name,
        type: "file",
        size: `${(file.size / 1024).toFixed(2)} KB`,
        date: new Date().toISOString().split("T")[0],
      }));
      setUploadedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const filteredFiles = [...mockFiles, ...uploadedFiles].filter(
    (file) =>
      file.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || file.type === filter)
  );

  return (
    <div style={{ display: "flex", height: "100vh", marginTop: 100, gap: 20, paddingInline: 20 }}>
      <AppBarLogin
        content={
          <>
                  <Typography variant="h5">📁 Databanka súborov</Typography>

            <Button
              color="primary"
              variant="text"
              size="small"
              component="a"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                width: "80px",
                borderRadius: 100,
                color: "rgba(59, 49, 119, 0.87)",
                padding: "10px",
                marginRight: "10px",

                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#E2E3E8",
                },
              }}
              onClick={() => {
                navigate("/auth/prihlasenie/");
              }}
            >
              <Typography fontWeight={600}>Prihlásenie</Typography>
            </Button>
            <Button
              color="primary"
              variant="text"
              size="small"
              component="a"
              onClick={() => {
                navigate("/auth/registracia/");
              }}
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
              <Typography fontWeight={600}>Registrácia</Typography>
            </Button>
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
        }}
      >
        <Typography variant="h6">🔍 Vyhľadávanie</Typography>
        <TextField
          label="Názov súboru"
          variant="outlined"
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Typography variant="h6">🛠️ Filtrovanie</Typography>
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
        <Typography variant="h6">📤 Nahrať súbor</Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadFileIcon />}
        >
          Vybrať súbor
          <input type="file" hidden multiple onChange={handleFileUpload} />
        </Button>
      </Paper>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", paddingRight: 4 }}>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {filteredFiles.map((file) => (
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
                  <InsertDriveFileIcon sx={{ fontSize: 40, color: "blue" }} />
                )}
                <CardContent>
                  <Typography variant="body1">{file.name}</Typography>
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
          sx={{ mt: 2 }}
        >
          Použiť vybrané súbory ({selectedFiles.length})
        </Button>
      </Box>

      {/* Right Sidebar - File Info */}
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
              <strong>Veľkosť:</strong> {selectedFile.size}
            </Typography>
            <Typography variant="body2">
              <strong>Dátum:</strong> {selectedFile.date}
            </Typography>
            <Button variant="contained" fullWidth sx={{ mt: 2 }}>
              Stiahnuť
            </Button>
          </Box>
        )}
      </Drawer>
    </div>
  );
}
