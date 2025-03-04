import { useEffect, useState } from "react";
import {
  Typography,
  IconButton,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import { AppBarLogin } from "../../shared/components/AppBarLogin";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../shared/context/useContext";
import { toast } from "react-toastify";
import GroupIcon from "@mui/icons-material/Group";
import { clientApi } from "../../shared/apis";
import { UserAllDTO } from "../../shared/types";
import SettingsDialog from "../Home/components/SettingsDialog";

export default function DataBank() {
  const [users, setUsers] = useState<UserAllDTO[]>([]);
  const navigate = useNavigate();
  const { user, logoutUser } = useUserContext();
  const [openAreYouSureDialog, setOpenAreYouSureDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string>("");
  const [userSettingsDialogOpen, setUserSettingsDialogOpen] =
    useState<boolean>(false);
  useEffect(() => {
    if (user === undefined) return;

    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await clientApi.getAllUsersForAdmin();
      let data = response.data;
      data = data.sort((a, b) => a.email.localeCompare(b.email));
      data = data.filter((x) => x.email !== user!.email);
      setUsers(data);
    } catch (error) {
      console.error("Chyba pri načítaní používateľov:", error);
      toast.error("Nepodarilo sa načítať používateľov.");
    }
  };

  const handleRoleChange = async (email: string, newRole: "user" | "admin") => {
    try {
      await clientApi.changeUsersRoleByAdmin({ email, role: newRole });
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.email === email ? { ...u, role: newRole } : u))
      );
      toast.success(`Rola používateľa ${email} bola zmenená na ${newRole}.`);
    } catch (error) {
      console.error("Chyba pri zmene role:", error);
      toast.error("Nepodarilo sa zmeniť rolu používateľa.");
    }
  };

  const handleDeleteUser = async (email: string) => {
    try {
      await clientApi.deleteUserByAdmin(email);
      setUsers((prevUsers) => prevUsers.filter((u) => u.email !== email));
      toast.success(`Používateľ ${email} bol odstránený.`);
    } catch (error) {
      console.error("Chyba pri odstraňovaní používateľa:", error);
      toast.error("Nepodarilo sa odstrániť používateľa.");
    }
  };

  useEffect(() => {
    if (userToDelete !== "") {
      setOpenAreYouSureDialog(true);
    } else {
      setOpenAreYouSureDialog(false);
    }
  }, [userToDelete]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100%",
        paddingInline: 20,
      }}
    >
      {user && (
        <>
          <SettingsDialog
            open={userSettingsDialogOpen}
            onClose={() => setUserSettingsDialogOpen(false)}
          />
          <AppBarLogin
            content={
              <Box sx={{ display: "flex" }}>
                <Typography
                  sx={{
                    color: "#454545",
                    fontWeight: "550",
                    marginRight: "10px",
                    marginTop: "10px",
                  }}
                >
                  Prihlásený {user.role === "admin" ? "admin " : "používateľ "}
                  <span style={{ color: "rgba(59, 49, 119, 0.87)" }}>
                    {user.email}
                  </span>
                </Typography>
                {user.role === "admin" && (
                  <IconButton
                    color="primary"
                    sx={{ color: "rgba(59, 49, 119, 0.87)" }}
                  >
                    <GroupIcon />
                  </IconButton>
                )}
                <IconButton
                  color="primary"
                  sx={{
                    marginLeft: "8px",
                    color: "rgba(59, 49, 119, 0.87)",
                  }}
                  onClick={() => setUserSettingsDialogOpen(true)}
                >
                  <SettingsIcon />
                </IconButton>
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
                  <Typography fontWeight={600}>Odhlásenie</Typography>
                </Button>
              </Box>
            }
          />

          <Typography
            sx={{
              fontFamily: "Poppins",
              color: "#514986",
              fontWeight: 600,
              textShadow:
                "1px 1px 0px white, -1px -1px 0px white, 1px -1px 0px white, -1px 1px 0px white",
              mt: 12,
            }}
            variant="h4"
          >
            Správa používateľov
          </Typography>
          <TableContainer
            component={Paper}
            sx={{
              mt: 2,
              width: "90%",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    Rola
                  </TableCell>
                  <TableCell sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    Nahrané súbory
                  </TableCell>
                  <TableCell sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    Projekty
                  </TableCell>
                  <TableCell sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    Akcie
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.email} sx={{ height: "50px" }}>
                    <TableCell sx={{ fontSize: "1rem" }}>{u.email}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(
                            u.email,
                            e.target.value as "user" | "admin"
                          )
                        }
                        sx={{
                          fontSize: "1rem",
                          height: "35px",
                          width: "150px",
                        }}
                      >
                        <MenuItem value="user">Používateľ</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: "200px",
                        overflowX: "auto",
                        fontSize: "0.9rem",
                      }}
                    >
                      {u.databankUploads.length > 0
                        ? u.databankUploads.join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: "200px",
                        overflowX: "auto",
                        fontSize: "0.9rem",
                      }}
                    >
                      {u.projects.length > 0 ? u.projects.join(", ") : "-"}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="error"
                        onClick={() => setUserToDelete(u.email)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Dialog
            open={openAreYouSureDialog}
            onClose={() => setOpenAreYouSureDialog(false)}
          >
            <DialogContent>
              <Typography>
                Ste si istý, že chcete zmazať užívateľa {userToDelete}, všetky
                jeho projekty a nahraté súbory v databanke?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setOpenAreYouSureDialog(false)}
                color="secondary"
              >
                Zrušiť
              </Button>
              <Button
                onClick={() => {
                  handleDeleteUser(userToDelete);
                  setUserToDelete("");
                  setOpenAreYouSureDialog(false);
                }}
                color="secondary"
                variant="contained"
              >
                Áno, vymazať užívateľa
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </div>
  );
}
