import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
      <p className="text-sm font-semibold text-gray-900">Page not found</p>
      <p className="mt-1 text-sm text-gray-500">
        There is nothing at this address.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
      >
        Back to the route planner
      </Link>
    </div>
  );
}
