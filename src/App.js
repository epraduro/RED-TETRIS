import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
function App() {
  return (
    <div className="App">
      <header className="App-header">
        RED-TETRIS
      </header>
      <Router>
          <Routes>
            <Route path='/' element={<Navigate to="/home" replace />}/>
          </Routes>
      </Router>
    </div>
  );
}

export default App;
