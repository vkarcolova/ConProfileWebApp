import "./App.css";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import CreateProfile from "./pages/CreateProfile/CreateProfile";
import "react-widgets/styles.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import TabsLoginRegister from "./pages/RegisterLogin/TabsLoginRegister";
import { ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DataBank from "./pages/DataBank/DataBank";
import MobileWarning from "./pages/MobileWarning/MobileWarning";
declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    xs: true; // removes the `xs` breakpoint
    sm: true;
    md: true;
    lg: true;
    xl: true;
    xxl: true;
  }
}

const theme = createTheme({
  palette: {
    mode: "light",
  },
  typography: {
    fontFamily: "Poppins, Arial, sans-serif",
  },
  breakpoints: {
    values: {
      xs: 0, // Mobile
      sm: 600, // Small
      md: 900, // Medium
      lg: 1200, // Large
      xl: 1536, // Extra Large
      xxl: 1600, // Tvoj nový breakpoint
    },
  },
});
function App() {
  return (
    <>
      <ThemeProvider theme={theme}>
        <ToastContainer transition={Bounce} />

        <div
          style={{
            backgroundColor: "#E6E5E5",
            height: "100vh",
            padding: "0px",
          }}
        >
          {" "}
          <MobileWarning />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/uprava-profilu/" element={<CreateProfile />} />
            <Route path="/uprava-profilu/:id" element={<CreateProfile />} />
            <Route path="/auth/:type" element={<TabsLoginRegister />} />
            <Route path="/databanka" element={<DataBank />} />
          </Routes>
        </div>
      </ThemeProvider>
    </>
  );
}

export default App;
