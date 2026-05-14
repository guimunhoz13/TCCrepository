import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import DashboardCard from "@/components/dashboard/DashboardCard";

export default function Dashboard() {
  return (
    <div
      className="d-flex"
      style={{
        background: "#F8FAFC",
        minHeight: "100vh",
      }}
    >

      <Sidebar />

      <div className="flex-grow-1 p-4">

        <Topbar />

        <div className="row g-4">

          <div className="col-md-3">
            <DashboardCard
              titulo="Clientes"
              valor="24"
            />
          </div>

          <div className="col-md-3">
            <DashboardCard
              titulo="Processos"
              valor="12"
            />
          </div>

          <div className="col-md-3">
            <DashboardCard
              titulo="Audiências"
              valor="5"
            />
          </div>

          <div className="col-md-3">
            <DashboardCard
              titulo="Documentos"
              valor="38"
            />
          </div>

        </div>

        <div
          className="mt-5 p-4 rounded-4 shadow-sm"
          style={{
            background: "white",
          }}
        >
          <h4
            className="fw-bold mb-4"
            style={{
              color: "var(--color-primary)",
            }}
          >
            Processos Recentes
          </h4>

          <table className="table">

            <thead>
              <tr>
                <th>Processo</th>
                <th>Cliente</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>0001234-56</td>
                <td>João Silva</td>
                <td>Em andamento</td>
              </tr>

              <tr>
                <td>0009876-12</td>
                <td>Maria Souza</td>
                <td>Concluído</td>
              </tr>
            </tbody>

          </table>
        </div>

      </div>
    </div>
  );
}