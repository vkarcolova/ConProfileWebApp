import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { clientApi } from "../../../shared/apis";
import { toast } from "react-toastify";
import { useUserContext } from "../../../shared/context/useContext";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState(""); // ✨ Nové pole na heslo pri zmene hesla
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [deletePassword, setDeletePassword] = useState(""); //

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showProjectDeleteDialog, setShowProjectDeleteDialog] = useState(false);
  const { logoutUser } = useUserContext();

  const handlePasswordChange = async () => {
    if (password !== confirmPassword) {
      alert("Heslá sa nezhodujú!");
      return;
    }

    await clientApi
      .changePassword(currentPassword, password, confirmPassword)
      .then((response) => {
        if (response.status === 200) {
          toast.success("Heslo bolo úspešne zmenené.");
        }
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Nepodarilo sa zmeniť heslo.");
        }
      });
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleDeleteConfirm = () => {
    if (!deletePassword) {
      alert("Prosím, zadajte heslo na potvrdenie.");
      return;
    }
    // TODO: Odoslať deletePassword na backend
    setConfirmDelete(false);
    setShowProjectDeleteDialog(true);
  };

  const handleFinalDelete = async (delProjects: boolean) => {
    await clientApi
      .deleteUser(deletePassword, delProjects)
      .then((response) => {
        if (response.status === 200) {
          toast.success("Účet bol úspešne zmazaný.");
          logoutUser();
        }
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Nepodarilo sa zmazať účet.");
        }
      });
    setShowProjectDeleteDialog(false);
    onClose();
  };

  return (
    <>
      {/* Hlavný dialóg - Nastavenia účtu */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          Nastavenia účtu
          <IconButton
            onClick={onClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Zmena hesla
          </Typography>

          <TextField
            label="Aktuálne heslo" // ✨ Nové pole na potvrdenie hesla
            type="password"
            fullWidth
            variant="outlined"
            margin="dense"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            label="Nové heslo"
            type="password"
            fullWidth
            variant="outlined"
            margin="dense"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            label="Potvrďte heslo"
            type="password"
            fullWidth
            variant="outlined"
            margin="dense"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            variant="contained"
            sx={{
              mt: 2,
              backgroundColor: "rgba(59, 49, 119, 0.87)",
              ":hover": { backgroundColor: "#66648b" },
            }}
            fullWidth
            onClick={handlePasswordChange}
            disabled={!currentPassword || !password || !confirmPassword}
          >
            Zmeniť heslo
          </Button>

          <Typography variant="h6" sx={{ mt: 3, color: "red" }}>
            Zmazanie účtu
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Ak zmažete účet, všetky vaše projekty budú zmazané. Táto akcia je
            nevratná.
          </Typography>
          <Button
            variant="contained"
            color="error"
            fullWidth
            startIcon={<DeleteIcon />}
            onClick={() => setConfirmDelete(true)}
          >
            Zmazať účet
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Zavrieť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialóg na potvrdenie zmazania účtu */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Potvrdenie zmazania účtu</DialogTitle>
        <DialogContent>
          <Typography>
            Ste si istý, že chcete zmazať svoj účet? Táto akcia je nevratná.
          </Typography>
          <TextField
            label="Zadajte heslo na potvrdenie" // ✨ Užívateľ musí potvrdiť heslom
            type="password"
            fullWidth
            variant="outlined"
            margin="dense"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} color="secondary">
            Zrušiť
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Áno, zmazať účet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialóg na potvrdenie zmazania projektov */}
      <Dialog
        open={showProjectDeleteDialog}
        onClose={() => setShowProjectDeleteDialog(false)}
      >
        <DialogTitle>Vymazať aj uložené projekty?</DialogTitle>
        <DialogContent>
          <Typography>
            Chcete odstrániť aj všetky vaše nahraté súbory a priečinky v
            databanke?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleFinalDelete(false)} color="secondary">
            Nie, ponechať dáta v databanke
          </Button>
          <Button
            onClick={() => handleFinalDelete(true)}
            color="error"
            variant="contained"
          >
            Áno, zmazať všetko
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SettingsDialog;
