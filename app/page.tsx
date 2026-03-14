'use client';
import Home from '@views/Home';
import ProtectedRoute from '@components/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['trainee']}>
      <Home />
    </ProtectedRoute>
  );
}
