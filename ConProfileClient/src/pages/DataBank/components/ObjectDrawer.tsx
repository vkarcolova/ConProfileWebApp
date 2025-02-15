import {
  Drawer,
  Box,
  Typography,
  Button,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import React, { useState } from "react";
import { DatabankObject } from "../DataBank";
import DeleteIcon from "@mui/icons-material/Delete";

interface ObjectDrawerProps {
  selectedFile: DatabankObject | null | undefined;
  setSelectedFile: (file: DatabankObject | null) => void;
}

const ObjectDrawer: React.FC<ObjectDrawerProps> = ({
  selectedFile,
  setSelectedFile,
}) => {
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    const kb = sizeInBytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };
  const [shareType, setShareType] = useState<"private" | "public">("private");
  const [usernameToShare, setUsernameToShare] = useState("");
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);

  const handleAddUser = () => {
    if (usernameToShare.trim() === "") return;
    if (!sharedUsers.includes(usernameToShare.trim())) {
      setSharedUsers([...sharedUsers, usernameToShare.trim()]);
      setUsernameToShare("");
    }
  };

  const handleRemoveUser = (username: string) => {
    setSharedUsers(sharedUsers.filter((u) => u !== username));
  };

  const handleShare = () => {
    if (shareType === "private" && sharedUsers.length === 0) {
      alert("Zadajte aspoň jedného používateľa.");
      return;
    }
    // Tu zavolajte API, ktoré uloží nastavenia zdieľania.
    // Ak je shareType === "public", nemusíte posielať zoznam používateľov.
    console.log("Zdieľanie uložené:", {
      shareType,
      sharedUsers,
      fileId: selectedFile?.id,
    });
    alert("Zdieľanie bolo uložené!");
  };

  return (
    <Drawer anchor="right" open={!!selectedFile} onClose={() => {}}>
      {selectedFile && (
        <Box sx={{ width: 280, p: 2 }}>
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
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Obsahuje súbory:</strong>
              </Typography>
              {selectedFile.subfiles?.map((subfile, index) => (
                <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                  {subfile}
                </Typography>
              ))}
            </>
          )}

          <Button variant="contained" fullWidth sx={{ mt: 2 }}>
            Stiahnuť
          </Button>

          {/* Sekcia pre zdieľanie */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Zdieľanie</Typography>

            <RadioGroup
              value={shareType}
              onChange={(e) =>
                setShareType(e.target.value as "private" | "public")
              }
            >
              <FormControlLabel
                value="private"
                control={<Radio />}
                label="Súkromné zdieľanie (konkrétny používateľ)"
              />
              <FormControlLabel
                value="public"
                control={<Radio />}
                label="Verejné zdieľanie (všetkým)"
              />
            </RadioGroup>

            {shareType === "private" && (
              <Box sx={{ mt: 1 }}>
                <TextField
                  label="Používateľské meno"
                  fullWidth
                  value={usernameToShare}
                  onChange={(e) => setUsernameToShare(e.target.value)}
                />
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 1 }}
                  onClick={handleAddUser}
                >
                  Pridať používateľa
                </Button>
                {sharedUsers.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2">Zdieľané s:</Typography>
                    <List dense>
                      {sharedUsers.map((user, index) => (
                        <ListItem
                          key={index}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveUser(user)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText primary={user} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}

            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleShare}
            >
              Uložiť zdieľanie
            </Button>
          </Box>
        </Box>
      )}
    </Drawer>
  );
};

export default ObjectDrawer;
