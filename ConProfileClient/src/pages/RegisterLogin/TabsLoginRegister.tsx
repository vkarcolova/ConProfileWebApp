import "../../index.css";
import React, { useEffect } from "react";
import { AppBarLogin } from "../../shared/components/AppBarLogin";
import Tab from "@mui/material/Tab/Tab";
import { Box, Container, Tabs, Toolbar, Typography } from "@mui/material";
import LoginPage from "./LoginPage";
import { useNavigate, useParams } from "react-router-dom";
import RegisterPage from "./RegisterPage";
import Info from "@mui/icons-material/InfoOutlined";
import { useUserContext } from "../../shared/context/useContext";
interface TabPanelProps {
  children?: React.ReactNode;
  tabValue: string;
  givenValue: string;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, tabValue, givenValue, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={givenValue !== tabValue}
      id={`simple-tabpanel-${tabValue}`}
      aria-labelledby={`simple-tab-${tabValue}`}
      {...other}
    >
      {tabValue === givenValue && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: string) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}
const TabsLoginRegister: React.FC = () => {

  const { user } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    console.log(user);
    if (user) {
     navigate("/");
    }
  }, [user]);

  
  const { type: authType } = useParams<{ type: string }>();

  const [value, setValue] = React.useState(authType ? authType : "prihlasenie");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    console.log("newValue", newValue);
  };

  return (
    <>{user == undefined && (  <>    <AppBarLogin
      content={
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={value}
            onChange={handleChange}
            indicatorColor="secondary"
            textColor="inherit"
          >
            <Tab
              label="Prihlásenie"
              value="prihlasenie"
              {...a11yProps("prihlasenie")}
              color="primary"
              sx={{
                color: "rgba(59, 49, 119, 0.87)",

                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#E2E3E8",
                },
                fontWeight: 600,
              }}
            ></Tab>
            <Tab
              label="Registrácia"
              value="registracia"
              sx={{
                color: "rgba(59, 49, 119, 0.87)",

                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#E2E3E8",
                },
                fontWeight: 600,
              }}
              {...a11yProps("registracia")}
            />
          </Tabs>
        </Box>
      }
    ></AppBarLogin>
    <CustomTabPanel tabValue={"prihlasenie"} givenValue={value}>
      <LoginPage />
    </CustomTabPanel>
    <CustomTabPanel tabValue={"registracia"} givenValue={value}>
      <RegisterPage />
    </CustomTabPanel>

    <Container
      sx={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Toolbar
        variant="regular"
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          borderRadius: "40px",
          bgcolor:
            theme.palette.mode === "light"
              ? "rgba(255, 255, 255, 0.4)"
              : "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(24px)",
          border: "1px solid",
          borderColor: "divider",
          marginTop: "10px",
          padding: "10px",
          maxWidth: "50%",

          boxShadow:
            theme.palette.mode === "light"
              ? `0 0 1px rgba(85, 166, 246, 0.1), 1px 1.5px 2px -1px rgba(85, 166, 246, 0.15), 4px 4px 12px -2.5px rgba(85, 166, 246, 0.15)`
              : "0 0 1px rgba(2, 31, 59, 0.7), 1px 1.5px 2px -1px rgba(2, 31, 59, 0.65), 4px 4px 12px -2.5px rgba(2, 31, 59, 0.65)",
        })}
      >
        <Info sx={{ fontSize: "25px" }}></Info>

        <Typography
          variant="body1"
          sx={{
            ml: 1,
            color: "black",
            fontSize: "13px",
            textAlign: "justify",
          }}
        >
          Odporúčame si vytvoriť užívateľský účet, aby ste mohli svoje dáta
          ukladať priamo do databázy. Ak sa neprihlásite, vaše dáta sa budú
          viazať na session token vo vašom prehliadači. To znamená, že k nim
          nebudete mať prístup z iného prehliadača, pokiaľ si projekt najskôr
          nestiahnete a následne neimportujete.
        </Typography>
      </Toolbar>
    </Container>
  </>)} 
   </>

  );
};

export default TabsLoginRegister;
