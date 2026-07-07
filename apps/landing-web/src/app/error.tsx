"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: "50px", color: "red", background: "#fee", minHeight: "100vh" }}>
      <h1>CRITICAL CLIENT ERROR</h1>
      <p>Pesan Error: <b>{error.message}</b></p>
      <pre style={{ background: "#fff", padding: "20px", overflow: "auto" }}>{error.stack}</pre>
      <button onClick={() => reset()} style={{ marginTop: "20px", padding: "10px 20px", background: "red", color: "white" }}>Coba Lagi</button>
    </div>
  );
}
