import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from './Home';
import Login from './users/LoginForm';
import Register from './users/Register';
import { ToastContainer } from 'react-toastify';
import Grid from "./game/Grid";

function App() {
  return (
    <>
      <Router>
          <Routes>
            <Route path='/' element={<Navigate to="/login" replace />}/>
            <Route path='/home' element={<Home/>}/>
            <Route path='/register' element={<Register/>} />
            <Route path='/login' element={<Login/>} />
            <Route path="/grid" element={<Grid/>} />
          </Routes>
      </Router>
      <ToastContainer/>
    </>
  );
}

export default App;
