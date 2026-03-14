'use client';
import CoachDashboard from '@views/CoachDashboard';
import ProtectedRoute from '@components/ProtectedRoute';

export default function CoachPage() {
  return (
    <ProtectedRoute allowedRoles={['coach']}>
      <CoachDashboard />
    </ProtectedRoute>
  );
}
