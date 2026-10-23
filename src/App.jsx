import { useState } from 'react';
import Login            from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard   from './components/AdminDashboard';
import './index.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored =
        localStorage.getItem('campus_fault_user') ||
        sessionStorage.getItem('campus_fault_user') ||
        localStorage.getItem('campus_fault_admin') ||
        sessionStorage.getItem('campus_fault_admin');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('campus_fault_user');
    sessionStorage.removeItem('campus_fault_user');
    localStorage.removeItem('campus_fault_admin');
    sessionStorage.removeItem('campus_fault_admin');
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  // ── Unauthenticated: Single unified login for all users ──
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // ── Authenticated: Route according to role in users table ──
  if (currentUser.role === 'ADMIN') {
    return (
      <AdminDashboard
        adminUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  // Default to Student Dashboard for STUDENTS
  return (
    <StudentDashboard
      studentUser={currentUser}
      onLogout={handleLogout}
    />
  );
}
