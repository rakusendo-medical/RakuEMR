import React from 'react';
import { Route } from 'react-router-dom';
import FlowsheetPage from './pages/FlowsheetPage';
import NursingRecordsPage from './pages/NursingRecordsPage';
import BulkVitalsPage from './pages/BulkVitalsPage';
import SleepTablePage from './pages/SleepTablePage';
import BulkNursingRecordsPage from './pages/BulkNursingRecordsPage';

export const FLOWSHEET_ROUTES = (
  <>
    <Route path="/flowsheet/:patientId" element={<FlowsheetPage />} />
    <Route path="/nursing/records" element={<NursingRecordsPage />} />
    <Route path="/nursing/bulk-vitals" element={<BulkVitalsPage />} />
    <Route path="/nursing/sleep-table" element={<SleepTablePage />} />
    <Route path="/nursing/bulk-records" element={<BulkNursingRecordsPage />} />
  </>
);
