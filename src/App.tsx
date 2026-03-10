import { BrowserRouter, Routes, Route } from 'react-router-dom';
import KartePage from './components/karte/KartePage';
import FlowsheetPage from './components/flowsheet/FlowsheetPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<KartePage />} />
        <Route path="/flowsheet" element={<FlowsheetPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
