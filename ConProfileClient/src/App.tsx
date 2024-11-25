import "./App.css";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import CreateProfile from "./pages/CreateProfile/CreateProfile";
import "react-widgets/styles.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import TabsLoginRegister from "./pages/RegisterLogin/TabsLoginRegister";

const theme = createTheme({
  palette: {
    mode: "light",
  },
});
function App() {
  return (
    <>
      <ThemeProvider theme={theme}>
        <div
          style={{
            backgroundColor: "#E6E5E5",
            height: "100vh",
            padding: "0px",
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/uprava-profilu/" element={<CreateProfile />} />
            <Route path="/uprava-profilu/:id" element={<CreateProfile />} />
            <Route path="/auth/:type" element={<TabsLoginRegister />} />
          </Routes>
        </div>
      </ThemeProvider>
    </>
  );
}

export default App;
