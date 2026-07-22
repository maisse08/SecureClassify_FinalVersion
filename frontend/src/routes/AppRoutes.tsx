import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ProtectedRoute } from "../components/ProtectedRoute/ProtectedRoute";
import { AdminLayout } from "../layouts/AdminLayout";
import { UserLayout } from "../layouts/UserLayout";
import { LoginPage } from "../pages/Login/LoginPage";
import { AdminDashboardPage } from "../pages/Dashboard/AdminDashboardPage";
import { UserDashboardPage } from "../pages/Dashboard/UserDashboardPage";
import { DataPage } from "../pages/Data/DataPage";
import { CIAAssessmentPage } from "../pages/CIAAssessment/CIAAssessmentPage";
import { TrashPage } from "../pages/Trash/TrashPage";
import { ProfilePage } from "../pages/Profile/ProfilePage";
import { UsersPage } from "../pages/Users/UsersPage";
import { CategoriesPage } from "../pages/Categories/CategoriesPage";
import { DepartmentsPage } from "../pages/Departments/DepartmentsPage";
import { DataTypesPage } from "../pages/DataTypes/DataTypesPage";
import { HistoryPage } from "../pages/History/HistoryPage";
import { NotFoundPage } from "../pages/NotFound/NotFoundPage";
import { SharingPage } from "../pages/Sharing";

export const AppRoutes = () => {
    const { isAdmin } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        {isAdmin ? <AdminLayout /> : <UserLayout />}
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={isAdmin ? <AdminDashboardPage /> : <UserDashboardPage />} />
                <Route path="data" element={<DataPage />} />
                <Route path="cia-assessment" element={<CIAAssessmentPage />} />
                <Route path="sharing" element={<SharingPage />} />
                <Route path="trash" element={<TrashPage />} />
                <Route path="users" element={<ProtectedRoute anyPermission={["users.create", "users.view.others", "users.update", "users.delete"]}><UsersPage /></ProtectedRoute>} />
                <Route path="departments" element={<ProtectedRoute anyPermission={["departments.create", "departments.update", "departments.archive", "departments.restore", "departments.delete"]}><DepartmentsPage /></ProtectedRoute>} />
                <Route path="categories" element={<ProtectedRoute anyPermission={["categories.create", "categories.update", "categories.archive", "categories.restore", "categories.delete"]}><CategoriesPage /></ProtectedRoute>} />
                <Route path="datatypes" element={<ProtectedRoute anyPermission={["datatypes.create", "datatypes.update", "datatypes.archive", "datatypes.restore", "datatypes.delete"]}><DataTypesPage /></ProtectedRoute>} />
                <Route path="history" element={isAdmin ? <HistoryPage /> : <NotFoundPage />} />
                <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};