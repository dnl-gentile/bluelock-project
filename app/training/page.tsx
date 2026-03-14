'use client';
import TrainingRoom from '@views/TrainingRoom';
import ProtectedRoute from '@components/ProtectedRoute';

export default function TrainingPage() {
  return (
    <ProtectedRoute allowedRoles={['trainee']}>
      <TrainingRoom />
    </ProtectedRoute>
  );
}
