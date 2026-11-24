import { unsubscribeAlert } from "@/lib/actions/enquiries";

export const metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return (
    <section className="section">
      <div className="wrap prose">
        <h1>Search alerts</h1>
        {query.done ? <p className="ok" role="status">Alerts for that search are off.</p> : (
          <form action={unsubscribeAlert}>
            <input type="hidden" name="token" value={query.token || ""} />
            <button type="submit">Turn off these alerts</button>
          </form>
        )}
      </div>
    </section>
  );
}
