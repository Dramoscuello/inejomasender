
import { Routes, Route } from 'react-router-dom';
import StudentPin from './pages/StudentPin';
import StudentWaitingRoom from './pages/StudentWaitingRoom';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './layouts/AdminLayout';
import AdminHome from './pages/AdminHome';
import AdminGrades from './pages/AdminGrades';
import AdminSubjects from './pages/AdminSubjects';
import AdminSession from './pages/AdminSession';
import AdminSessions from './pages/AdminSessions';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentPin />} />
      <Route path="/session/:pin" element={<StudentWaitingRoom />} />
      <Route path="/login" element={<AdminLogin />} />
      
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="grades" element={<AdminGrades />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="sessions" element={<AdminSessions />} />
        <Route path="session/:id" element={<AdminSession />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
