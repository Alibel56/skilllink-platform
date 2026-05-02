import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { queryClient } from '@/lib/query';
import { useAuth } from '@/lib/auth-store';

import { AuthLayout } from '@/components/layout/auth-layout';
import { AppShell } from '@/components/layout/app-shell';
import { ProtectedRoute } from '@/components/protected-route';
import { ErrorBoundary } from '@/components/error-boundary';

import LoginPage from '@/routes/auth/login';
import SignupPage from '@/routes/auth/signup';
import EmailPendingPage from '@/routes/auth/email-pending';
import ConfirmEmailPage from '@/routes/auth/confirm-email';
import ResetPasswordPage from '@/routes/auth/reset-password';
import HomePage from '@/routes/home';
import SearchPage from '@/routes/search';
import SpecialistProfilePage from '@/routes/specialists/specialist-profile';
import OrdersListPage from '@/routes/orders/orders-list';
import NewOrderPage from '@/routes/orders/new-order';
import OrderDetailPage from '@/routes/orders/order-detail';
import JobsPage from '@/routes/jobs';
import MyJobsPage from '@/routes/my-jobs';
import CatalogPage from '@/routes/catalog';
import RequestsPage from '@/routes/requests';
import ProfilePage from '@/routes/profile/profile';
import EditProfilePage from '@/routes/profile/edit-profile';
import AddressPage from '@/routes/profile/address';
import BecomeSpecialistPage from '@/routes/profile/become-specialist';
import AccreditationPage from '@/routes/profile/accreditation';
import AdminPage from '@/routes/admin/admin';
import NotFoundPage from '@/routes/not-found';

function RootRedirect() {
  const { token } = useAuth();
  return <Navigate to={token ? '/home' : '/login'} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            {/* Public auth flow */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/email-pending" element={<EmailPendingPage />} />
              <Route path="/confirm-email" element={<ConfirmEmailPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Protected app shell */}
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/specialists/:id" element={<SpecialistProfilePage />} />

              <Route path="/orders" element={<OrdersListPage />} />
              <Route path="/orders/new" element={<NewOrderPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />

              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/mine" element={<MyJobsPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/requests" element={<RequestsPage />} />

              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route path="/profile/address" element={<AddressPage />} />
              <Route path="/profile/become-specialist" element={<BecomeSpecialistPage />} />
              <Route path="/profile/accreditation" element={<AccreditationPage />} />

              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminPage />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <Toaster richColors closeButton position="top-right" />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
