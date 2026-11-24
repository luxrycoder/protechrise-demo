import Link from "next/link";

export default function NotFound() {
  return (
    <section className="sec">
      <div className="container">
        <h1 className="sec-title">Page not found</h1>
        <p style={{ margin: "16px 0 24px", color: "var(--color-muted)" }}>
          That page does not exist on the dev build yet.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to home
        </Link>
      </div>
    </section>
  );
}
