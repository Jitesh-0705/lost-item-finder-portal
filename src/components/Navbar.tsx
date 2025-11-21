import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/reports", label: "Reports" },
    { to: "/matches", label: "Matches" },
    { to: "/users", label: "Users" },
    { to: "/about", label: "About" },
  ];

  return (
    <nav className="bg-indigo-600 text-white flex justify-between px-8 py-3 shadow">
      <h1 className="font-bold">Lost Item Finder</h1>
      <div className="flex gap-6">
        {links.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className={`hover:underline ${
              location.pathname === l.to ? "font-semibold underline" : ""
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
