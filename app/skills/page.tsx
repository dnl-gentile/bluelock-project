'use client';
import SkillsRoom from '@views/SkillsRoom';
import ProtectedRoute from '@components/ProtectedRoute';

export default function SkillsPage() {
  return (
    <ProtectedRoute allowedRoles={['trainee']}>
      <SkillsRoom />
    </ProtectedRoute>
  );
}
