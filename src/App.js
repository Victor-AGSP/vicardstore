import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Inicio from './components/inicio';
import Menu from './components/menu';
import ExcelViewer from './components/yugi';

function App() {
  return (
    <Router>
      <Menu />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/yugi" element={<ExcelViewer />} />
      </Routes>
    </Router>
  );
}

export default App;
