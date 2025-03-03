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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { AppBarLogin } from "../../shared/components/AppBarLogin";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../shared/context/useContext";
import { toast } from "react-toastify";
import GroupIcon from "@mui/icons-material/Group";
import { clientApi } from "../../shared/apis"; // API pre získanie userov
import { UserDTO } from "../../shared/types";

export default function DataBank() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const navigate = useNavigate();
  const { user, logoutUser } = useUserContext();

  useEffect(() => {
    if (user === undefined) return;

    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    // Načítať všetkých používateľov z API
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await clientApi.getAllUsersForAdmin(); // Predpokladám, že API existuje
      setUsers(response.data);
    } catch (error) {
      console.error("Chyba pri načítaní používateľov:", error);
      toast.error("Nepodarilo sa načítať používateľov.");
    }
  };

  const handleRoleChange = async (email: string, newRole: "user" | "admin") => {
    try {
      await clientApi.changeUsersRoleByAdmin({ email: email, role: newRole }); // API request na zmenu role
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
    if (!window.confirm(`Naozaj chceš odstrániť používateľa ${email}?`)) return;

    try {
      await clientApi.deleteUserByAdmin(email); // API request na odstránenie usera
      setUsers((prevUsers) => prevUsers.filter((u) => u.email !== email));
      toast.success(`Používateľ ${email} bol odstránený.`);
    } catch (error) {
      console.error("Chyba pri odstraňovaní používateľa:", error);
      toast.error("Nepodarilo sa odstrániť používateľa.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100%",
        paddingTop: 100,
        paddingInline: 20,
      }}
    >
      {user && (
        <>
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

          <Typography variant="h5" sx={{ mt: 3 }}>
            👥 Správa používateľov
          </Typography>

          <TableContainer component={Paper} sx={{ mt: 2, width: "80%" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Email</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Rola</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Akcie</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.email}>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(
                            u.email,
                            e.target.value as "user" | "admin"
                          )
                        }
                      >
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteUser(u.email)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </div>
  );
}
