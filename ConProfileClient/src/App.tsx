import './App.css'
import New from './components/New'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import CreateProfile from './pages/CreateProfile/CreateProfile'
import Comparison from './pages/Comparison/Comparison'
import "react-widgets/styles.css";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
const theme = createTheme({
  palette: {
    mode: 'light', 
  },

});
function App() {
  return (
    <>
    <ThemeProvider theme={theme}>

    <div style={{ backgroundColor: '#E6E5E5', height: '100vh', padding: '0px' }}>
            <Routes>
          <Route path="/" element={<Home />} /> 
          <Route path="/create-profile/:id" element={<CreateProfile />} />
          <Route path="/compare-profiles" element={<Comparison />} />
      </Routes>
      </div>

    </ThemeProvider>
    </>

  )
}

export default App
