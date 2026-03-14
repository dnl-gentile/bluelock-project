'use client';
import AICoachChat from '@views/AICoachChat';
import ProtectedRoute from '@components/ProtectedRoute';

export default function ChatPage() {
  return (
    <ProtectedRoute allowedRoles={['trainee']}>
      <AICoachChat />
    </ProtectedRoute>
  );
}
