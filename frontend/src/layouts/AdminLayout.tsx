import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";

export const AdminLayout = () => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Navbar />
                <div className="content-body">
                    <div className="content-container">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};