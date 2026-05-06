import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../components/login/LoginPage';
import WardMap from '../components/wardMap/WardMap';
import PatientList from '../components/patientList/PatientList';
import PatientMain from '../components/patientMain/PatientMain';
import AdmissionDischarge from '../components/admission/AdmissionDischarge';
import OutpatientList from '../components/outpatient/OutpatientList';
import PatientBasicPage from '../components/outpatient/PatientBasicPage';
import PatientSearch from '../components/patientSearch/PatientSearch';
import NursingRecordView from '../components/nursing/NursingRecord';
import FlowsheetView from '../components/flowsheet/Flowsheet';
import IsolationRestraint from '../components/isolation/IsolationRestraint';
import BehaviorRange from '../components/behaviorRange/BehaviorRange';
import OutingManagement from '../components/outing/OutingManagement';
import OrderManagement from '../components/orders/OrderManagement';
import NursingCarePlan from '../components/nursingCare/NursingCarePlan';
import DocumentManagement from '../components/documents/DocumentManagement';
import WardManagement from '../components/wardManagement/WardManagement';
import KarteAlphaPage from '../components/karteAlpha/KarteAlphaPage';
import OutpatientKartePage from '../components/karteOutpatient/OutpatientKartePage';
import KartePage from '../components/karte/KartePage';
import DesignGuide from '../components/designGuide/DesignGuide';
import { CARE_PLAN_ROUTES } from '../features/carePlan/routes';
import { FLOWSHEET_ROUTES } from '../features/flowsheet/routes';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<MainLayout />}>
      <Route path="/" element={<WardMap />} />
      <Route path="/patients" element={<PatientList />} />
      <Route path="/patients/:patientId" element={<PatientMain />} />
      <Route path="/karte-alpha/:patientId" element={<KarteAlphaPage />} />
      <Route path="/karte-outpatient/:patientId" element={<OutpatientKartePage />} />
      <Route path="/karte/:patientId" element={<KartePage />} />
      <Route path="/outpatient" element={<OutpatientList />} />
      <Route path="/outpatient/:patientId/basic" element={<PatientBasicPage />} />
      <Route path="/patient-search" element={<PatientSearch />} />
      <Route path="/admission" element={<AdmissionDischarge />} />
      <Route path="/nursing" element={<NursingRecordView />} />
      <Route path="/flowsheet" element={<FlowsheetView />} />
      <Route path="/isolation" element={<IsolationRestraint />} />
      <Route path="/behavior" element={<BehaviorRange />} />
      <Route path="/outing" element={<OutingManagement />} />
      <Route path="/orders" element={<OrderManagement />} />
      <Route path="/nursing-care" element={<NursingCarePlan />} />
      <Route path="/documents" element={<DocumentManagement />} />
      <Route path="/ward-management" element={<WardManagement />} />
      <Route path="/design-guide" element={<DesignGuide />} />
      {CARE_PLAN_ROUTES}
      {FLOWSHEET_ROUTES}
    </Route>
  </Routes>
);

export default AppRoutes;
