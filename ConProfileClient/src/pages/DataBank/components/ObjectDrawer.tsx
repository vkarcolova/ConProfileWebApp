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
import React, { useEffect, useState } from "react";
import { DatabankObject } from "../DataBank";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";
import { clientApi } from "../../../shared/apis";

interface ObjectDrawerProps {
  selectedFile: DatabankObject | null | undefined;
  setSelectedFile: (file: DatabankObject | null) => void;
  refreshData: () => void;
}

const ObjectDrawer: React.FC<ObjectDrawerProps> = ({
  selectedFile,
  setSelectedFile,
  refreshData,
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
  const [previousSharedUsers, setPreviousSharedUsers] = useState<string[]>([]);
  const [previousShareType, setPreviousShareType] = useState<
    "private" | "public"
  >("private");
  const [allUsers, setAllUsers] = useState<string[]>([]);

  useEffect(() => {
    if (selectedFile) {
      console.log(selectedFile);
      setShareType(selectedFile.public ? "public" : "private");
      setSharedUsers(selectedFile.shares);
      setPreviousSharedUsers(selectedFile.shares);
      setPreviousShareType(selectedFile.public ? "public" : "private");
      clientApi.getAllUserNames().then((res) => {
        setAllUsers(res.data);
      });
    }
  }, [selectedFile]);

  const handleAddUser = () => {
    if (usernameToShare.trim() === "") return;
    console.log(allUsers);
    if (!allUsers.includes(usernameToShare.trim())) {
      toast.info("Používateľ neexistuje");
      return;
    }
    if (usernameToShare.trim() === localStorage.getItem("useremail")) {
      toast.info("Nemôžete zdieľať sami so sebou");
      return;
    }
    if (!sharedUsers.includes(usernameToShare.trim())) {
      setSharedUsers([...sharedUsers, usernameToShare.trim()]);
      setUsernameToShare("");
    }
  };

  const handleRemoveUser = (username: string) => {
    setSharedUsers(sharedUsers.filter((u) => u !== username));
  };

  const handleShare = () => {
    if (
      shareType === previousShareType &&
      arraysEqualSorted(sharedUsers, previousSharedUsers)
    ) {
      toast.info("Zdieľanie nebolo zmenené");
      return;
    }
    if (selectedFile === undefined) return;

    clientApi
      .changeDatabankShareSettings({
        id: selectedFile!.id,
        public: shareType === "public",
        users: sharedUsers,
      })
      .then((res) => {
        console.log(res);
        if (res.status === 200) {
          setPreviousShareType(shareType);
          setPreviousSharedUsers(sharedUsers);
          toast.success("Zdieľanie bolo úspešne zmenené");
          refreshData();
        } else {
          toast.error("Nastala chyba pri zdieľaní");
        }
      });
  };

  function arraysEqualSorted(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;

    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();

    return sorted1.every((value, index) => value === sorted2[index]);
  }

  return (
    <Drawer
      anchor="right"
      open={!!selectedFile}
      onClose={() => {
        setSelectedFile(null);
      }}
    >
      {selectedFile && (
        <Box sx={{ width: 280, p: 2 }}>
          <Typography variant="h6">ℹ️ Info o súbore</Typography>
          <Typography variant="body1">
            <strong>Názov:</strong> {selectedFile.name}
          </Typography>
          <Typography variant="body2">
            <strong>Nahratý používateľom:</strong> {selectedFile.uploadedBy}
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
          {selectedFile.uploadedBy === localStorage.getItem("useremail") && (
            <>
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
                  disabled={
                    shareType === previousShareType &&
                    arraysEqualSorted(sharedUsers, previousSharedUsers)
                  }
                >
                  Uložiť zdieľanie
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default ObjectDrawer;
