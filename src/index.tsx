import React from 'react';
import { createRoot } from 'react-dom/client';
import BikeRacingGame from './components/FruitNinjaGame';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <BikeRacingGame />
    </React.StrictMode>
  );
}
