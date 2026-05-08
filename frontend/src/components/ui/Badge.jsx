export default function Badge({ text, color = "dark" }) {
  return (
    <span className={`badge bg-${color} rounded-pill`}>
      {text}
    </span>
  );
}