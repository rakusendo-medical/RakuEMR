import React from 'react';
import { Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PatientCarePlan from './pages/PatientCarePlan';
import CarePlanCreate from './pages/CarePlanCreate';
import MonthlyEvaluation from './pages/MonthlyEvaluation';

export const CARE_PLAN_ROUTES = (
  <>
    <Route path="/care-plan" element={<Dashboard />} />
    <Route path="/care-plan/patients/:patientId" element={<PatientCarePlan />} />
    <Route path="/care-plan/patients/:patientId/create" element={<CarePlanCreate />} />
    <Route path="/care-plan/patients/:patientId/evaluate" element={<MonthlyEvaluation />} />
  </>
);
