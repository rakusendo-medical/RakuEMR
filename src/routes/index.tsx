import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../components/login/LoginPage';
import WardMap from '../components/wardMap/WardMap';
import PatientList from '../components/patientList/PatientList';
import PatientMain from '../components/patientMain/PatientMain';
import AdmissionDischarge from '../components/admission/AdmissionDischarge';
import BatchInput from '../components/batchInput/BatchInput';
import OutpatientList from '../components/outpatient/OutpatientList';
import PatientSearch from '../components/patientSearch/PatientSearch';
import NursingRecordView from '../components/nursing/NursingRecord';
import FlowsheetView from '../components/flowsheet/Flowsheet';
import IsolationRestraint from '../components/isolation/IsolationRestraint';
import BehaviorRange from '../components/behaviorRange/BehaviorRange';
import OutingManagement from '../components/outing/OutingManagement';
import PatientSchedule from '../components/schedule/PatientSchedule';
import OrderManagement from '../components/orders/OrderManagement';
import Rehabilitation from '../components/rehab/Rehabilitation';
import NursingCarePlan from '../components/nursingCare/NursingCarePlan';
import NursingPlanPage from '../components/nursingPlan/NursingPlanPage';
import PeriodicEvaluationPage from '../components/periodicEvaluation/PeriodicEvaluationPage';
import DocumentManagement from '../components/documents/DocumentManagement';
import WardManagement from '../components/wardManagement/WardManagement';
import PatientRegistration from '../components/patientRegistration/PatientRegistration';
import KarteAlphaPage from '../components/karteAlpha/KarteAlphaPage';
import OutpatientKartePage from '../components/karteOutpatient/OutpatientKartePage';
import { CARE_PLAN_ROUTES } from '../features/carePlan/routes';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<MainLayout />}>
      <Route path="/" element={<WardMap />} />
      <Route path="/patients" element={<PatientList />} />
      <Route path="/patients/:patientId" element={<PatientMain />} />
      <Route path="/karte-alpha/:patientId" element={<KarteAlphaPage />} />
      <Route path="/karte-outpatient/:patientId" element={<OutpatientKartePage />} />
      <Route path="/outpatient" element={<OutpatientList />} />
      <Route path="/patient-search" element={<PatientSearch />} />
      <Route path="/batch-input" element={<BatchInput />} />
      <Route path="/admission" element={<AdmissionDischarge />} />
      <Route path="/nursing" element={<NursingRecordView />} />
      <Route path="/flowsheet" element={<FlowsheetView />} />
      <Route path="/isolation" element={<IsolationRestraint />} />
      <Route path="/behavior" element={<BehaviorRange />} />
      <Route path="/outing" element={<OutingManagement />} />
      <Route path="/schedule" element={<PatientSchedule />} />
      <Route path="/orders" element={<OrderManagement />} />
      <Route path="/rehab" element={<Rehabilitation />} />
      <Route path="/nursing-care" element={<NursingCarePlan />} />
      <Route path="/nursing-plan" element={<NursingPlanPage />} />
      <Route path="/periodic-evaluation" element={<PeriodicEvaluationPage />} />
      <Route path="/documents" element={<DocumentManagement />} />
      <Route path="/ward-management" element={<WardManagement />} />
      <Route path="/patient-registration" element={<PatientRegistration />} />
      {CARE_PLAN_ROUTES}
    </Route>
  </Routes>
);

export default AppRoutes;
