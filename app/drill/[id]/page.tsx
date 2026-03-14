'use client';
import { useParams } from 'next/navigation';
import ActiveDrill from '@views/ActiveDrill';
import ProtectedRoute from '@components/ProtectedRoute';

export default function DrillPage() {
  return (
    <ProtectedRoute allowedRoles={['trainee']}>
      <ActiveDrill />
    </ProtectedRoute>
  );
}
