import Sidebar from "./Sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="d-flex min-vh-100 bg-light">
      <Sidebar />

      <main className="flex-grow-1 p-4">
        {children}
      </main>
    </div>
  );
}