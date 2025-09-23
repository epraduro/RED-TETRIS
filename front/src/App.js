import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from './Home';

function App() {
  return (
    <div className="App">
      <Router>
          <Routes>
            <Route path='/' element={<Navigate to="/home" replace />}/>
            <Route path='/home' element={<Home/>}/>
          </Routes>
      </Router>
    </div>
  );
}

export default App;
