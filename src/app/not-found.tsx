import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-n-200 bg-n-0 px-6 py-10 text-center shadow-sm">
      <p className="text-sm font-semibold text-n-900">Page not found</p>
      <p className="mt-1 text-sm text-n-500">
        There is nothing at this address.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
      >
        Back to the route planner
      </Link>
    </div>
  );
}
