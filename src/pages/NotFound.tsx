import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
      <p className="text-gray-600 mb-6">Oops! Page not found.</p>
      <Link
        to="/"
        className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
