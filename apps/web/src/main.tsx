import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import './index.css'
import { Layout } from './components/layout/Layout'
import { Toasts } from './components/ui/Toasts'
import { useAuthStore } from './store/authStore'

const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })))
const Register = lazy(() => import('./pages/Register').then((module) => ({ default: module.Register })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })))
const Transactions = lazy(() => import('./pages/Transactions').then((module) => ({ default: module.Transactions })))
const Categories = lazy(() => import('./pages/Categories').then((module) => ({ default: module.Categories })))
const Budgets = lazy(() => import('./pages/Budgets').then((module) => ({ default: module.Budgets })))
const Goals = lazy(() => import('./pages/Goals').then((module) => ({ default: module.Goals })))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<div className="route-loading">Carregando...</div>}>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard"    element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="categories"   element={<Categories />} />
              <Route path="budgets"      element={<Budgets />} />
              <Route path="goals"        element={<Goals />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toasts />
    </QueryClientProvider>
  </React.StrictMode>
)
