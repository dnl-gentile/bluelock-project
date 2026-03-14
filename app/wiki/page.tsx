'use client';
import Wiki from '@views/Wiki';
import ProtectedRoute from '@components/ProtectedRoute';

export default function WikiPage() {
  return (
    <ProtectedRoute allowedRoles={['trainee']}>
      <Wiki />
    </ProtectedRoute>
  );
}
