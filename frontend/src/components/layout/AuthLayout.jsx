export default function AuthLayout({ children }) {
  return (
    <div className="container-fluid min-vh-100 p-0">
      <div className="row min-vh-100 g-0">

        <div
          className="col-md-6 d-flex align-items-center position-relative text-white p-5"
          style={{
            background: "linear-gradient(135deg, #0b0f19, #1f2937)",
            overflow: "hidden",
          }}
        >

          <div
            style={{
              position: "absolute",
              top: "12%",
              left: "8%",
              fontSize: "170px",
              opacity: 0.06,
              color: "#ffffff",
            }}
          >
            ⚖
          </div>

          <div
            style={{
              position: "absolute",
              top: "20%",
              right: "10%",
              fontSize: "190px",
              opacity: 0.05,
              color: "#ffffff",
            }}
          >
            ⚜
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "12%",
              right: "14%",
              fontSize: "160px",
              opacity: 0.05,
              color: "#ffffff",
            }}
          >
            §
          </div>

          <div
            style={{
              width: "120px",
              height: "120px",
              border: "2px solid #c9a227",
              borderRadius: "24px",
              position: "absolute",
              top: "34%",
              left: "13%",
              transform: "rotate(45deg)",
              opacity: 0.7,
            }}
          ></div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              maxWidth: "520px",
              marginLeft: "40px",
            }}
          >
            <div
              className="mb-4 d-flex align-items-center justify-content-center"
              style={{
                width: "86px",
                height: "86px",
                borderRadius: "22px",
                border: "2px solid #c9a227",
                color: "#c9a227",
                fontSize: "42px",
              }}
            >
              ⚖
            </div>

            <h1 className="display-3 fw-bold mb-3">
              <span style={{ color: "#c9a227" }}>TCC</span>{" "}
              Advocacia
            </h1>

            <div
              style={{
                width: "90px",
                height: "3px",
                backgroundColor: "#c9a227",
                marginBottom: "24px",
              }}
            ></div>

            <p
              className="fs-5"
              style={{
                lineHeight: "1.7",
                color: "#e5e7eb",
              }}
            >
              Plataforma jurídica inteligente para gerenciamento de processos,
              clientes e documentos.
            </p>
          </div>
        </div>

        <div
          className="col-md-6 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: "#f8f8f6",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "430px",
              padding: "40px",
            }}
          >
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}