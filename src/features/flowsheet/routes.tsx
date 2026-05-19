import React from 'react';
import { Navigate, Route, useParams } from 'react-router-dom';
import NursingRecordsPage from './pages/NursingRecordsPage';
import BulkVitalsPage from './pages/BulkVitalsPage';
import SleepTablePage from './pages/SleepTablePage';
import BulkNursingRecordsPage from './pages/BulkNursingRecordsPage';

/**
 * /flowsheet/:patientId は廃止。カルテ画面のフローシートタブへ恒久リダイレクト。
 */
const FlowsheetPatientRedirect: React.FC = () => {
  const { patientId = '' } = useParams<{ patientId: string }>();
  return <Navigate to={`/karte/${patientId}#flowsheet`} replace />;
};

export const FLOWSHEET_ROUTES = (
  <>
    <Route path="/flowsheet/:patientId" element={<FlowsheetPatientRedirect />} />
    <Route path="/nursing/records" element={<NursingRecordsPage />} />
    <Route path="/nursing/bulk-vitals" element={<BulkVitalsPage />} />
    <Route path="/nursing/sleep-table" element={<SleepTablePage />} />
    <Route path="/nursing/bulk-records" element={<BulkNursingRecordsPage />} />
  </>
);
