import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Inicio from './components/inicio';
import Menu from './components/menu';
import ExcelViewer from './components/yugi';
import MylpbViewer from './components/mylpb';
import Magic from './components/magic';
import CartaDetalle from './components/cartadetalle';

function App() {
  return (
    <Router>
      <Menu />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/yugi" element={<ExcelViewer />} />
        <Route path="/mylpb" element={<MylpbViewer />} />
        <Route path="/magic" element={<Magic />} />
        <Route path="/detalle" element={<CartaDetalle />} />
      </Routes>
    </Router>
  );
}

export default App;
