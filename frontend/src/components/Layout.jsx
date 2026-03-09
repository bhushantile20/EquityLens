import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
    const { isAuthenticated } = useAuth();

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background text-slate-200">
            <Navbar />
            <div className="flex flex-1 overflow-hidden relative">
                {isAuthenticated && <Sidebar />}
                <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto w-full max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
