import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="mt-2 text-sm text-grey-600">
        That synthetic patient or page does not exist in this demonstration.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block border border-grey-900 bg-grey-900 px-3 py-2 text-sm font-semibold text-white"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
