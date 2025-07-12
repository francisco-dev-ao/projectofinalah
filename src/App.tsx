
import React from 'react';
import AppProviders from './components/AppProviders';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}

export default App;
