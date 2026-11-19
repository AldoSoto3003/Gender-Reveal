import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Invitacion } from './pages/Invitacion';
import { TarjetaEstatica } from './pages/TarjetaEstatica';
import { SvgDefs } from './ui/SvgDefs';

// El panel y el guardián solo los usan unas pocas personas: se cargan aparte.
const Panel = lazy(() => import('./pages/Panel').then((m) => ({ default: m.Panel })));
const Guardian = lazy(() => import('./pages/Guardian').then((m) => ({ default: m.Guardian })));

export function App() {
  return (
    <BrowserRouter>
      <SvgDefs />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Invitacion />} />
          <Route path="/tarjeta" element={<TarjetaEstatica />} />
          <Route path="/panel" element={<Panel />} />
          <Route path="/guardian/:token" element={<Guardian />} />
          <Route path="*" element={<Invitacion />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
