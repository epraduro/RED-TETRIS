import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  BrowserRouter,
} from "react-router-dom";
import Home from "./Home";
import Game from "./game/Game";
import Login from "./users/LoginForm";
import Register from "./users/Register";
import { ToastContainer } from "react-toastify";
import Grid from "./game/Grid";
import Profile from "./game/Profile";

function App() {
  return (
    <>
      <BrowserRouter>
        <Router>
          <Routes>
            <Route path='/' element={<Navigate to="/login" replace />}/>
            <Route path='/home' element={<Home/>}/>
            <Route path='/register' element={<Register/>} />
            <Route path='/login' element={<Login/>} />
            <Route path='/:gameName/:playerName' element={<Game/>} />
            <Route path="/grid" element={<Grid/>} />
            <Route path="/profile/:playerName" element={<Profile/>}/>
          </Routes>
        </Router>
        <ToastContainer />
      </BrowserRouter>
    </>
  );
}

export default App;
