import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '@/src/store/authStore';

const renderWithRoutes = (allowedRoles?: ('admin' | 'employer' | 'student')[], initialPath = '/secure') => {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/secure"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>User Login</div>} />
        <Route path="/admin-login" element={<div>Admin Login</div>} />
        <Route path="/dashboard" element={<div>Student Dashboard</div>} />
        <Route path="/employer" element={<div>Employer Dashboard</div>} />
        <Route path="/admin" element={<div>Admin Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      hasBootstrappedAuth: true,
      isLoading: false,
      error: null,
    });
  });

  it('redirects unauthenticated admin route requests to admin login', () => {
    renderWithRoutes(['admin']);
    expect(screen.getByText('Admin Login')).toBeInTheDocument();
  });

  it('redirects unauthenticated user route requests to user login', () => {
    renderWithRoutes(['student']);
    expect(screen.getByText('User Login')).toBeInTheDocument();
  });

  it('redirects student away from employer-only route', () => {
    useAuthStore.setState({
      user: {
        id: 'stu-1',
        name: 'Student User',
        email: 'student@example.com',
        role: 'student',
        createdAt: new Date().toISOString(),
      },
      isAuthenticated: true,
    });

    renderWithRoutes(['employer']);
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
  });

  it('redirects admin away from non-admin routes', () => {
    useAuthStore.setState({
      user: {
        id: 'admin-1',
        name: 'Prime Admin',
        email: 'rkpk110011@gmail.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      isAuthenticated: true,
    });

    renderWithRoutes(['employer']);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('allows admin through admin-only routes', () => {
    useAuthStore.setState({
      user: {
        id: 'admin-1',
        name: 'Prime Admin',
        email: 'rkpk110011@gmail.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      isAuthenticated: true,
    });

    renderWithRoutes(['admin']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
