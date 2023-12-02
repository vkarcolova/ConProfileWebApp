import './App.css'
import New from './components/New'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import CreateProfile from './pages/CreateProfile/CreateProfile'
import Comparison from './pages/Comparison/Comparison'
import Uploady from '@rpldy/uploady'

function App() {
  return (
    <>

    <Uploady>

      <div>
      <New/>  {/*Pre vyskusanie ci databaza funguje*/}
      <Routes>
          <Route path="/" element={<Home />} /> 
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/compare-profiles" element={<Comparison />} />
      </Routes>
      </div>

    </Uploady>
    </>

  )
}

export default App
