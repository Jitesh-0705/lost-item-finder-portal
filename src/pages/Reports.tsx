import { useEffect, useState } from "react";
import { supabase } from "../lib/client";

interface Report {
  id: number;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
  type: "lost" | "found";
  user_id?: string;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<"all" | "lost" | "found">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    const fetchReports = async () => {
      // Fetch lost and found reports
      const { data: lostItems } = await supabase.from("lost_items").select("*");
      const { data: foundItems } = await supabase
        .from("found_items")
        .select("*");

      // Add 'type' field for each
      const allReports = [
        ...(lostItems?.map((item) => ({ ...item, type: "lost" })) || []),
        ...(foundItems?.map((item) => ({ ...item, type: "found" })) || []),
      ];

      setReports(allReports);
    };

    fetchReports();
  }, []);

  // ✅ Filtering logic
  const filteredReports = reports
    .filter((report) =>
      filter === "all" ? true : report.type === filter
    )
    .filter((report) => {
      const query = searchTerm.toLowerCase();
      return (
        report.title?.toLowerCase().includes(query) ||
        report.description?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Reports Overview</h1>

      {/* 🔍 Search & Filters Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex gap-3">
          {["all", "lost", "found"].map((type) => (
            <button
              key={type}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === type
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setFilter(type as "all" | "lost" | "found")}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <input
          type="text"
          placeholder="Search reports..."
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3 focus:ring-2 focus:ring-indigo-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Sort Dropdown */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* 🗂️ Reports Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl shadow p-4 flex flex-col"
          >
            <img
              src={report.image_url}
              alt={report.title}
              className="w-full h-48 object-cover rounded-md mb-3"
            />
            <h2 className="text-lg font-semibold text-gray-800">
              {report.title || "Untitled"}
            </h2>
            <p className="text-sm text-gray-600 mb-2 line-clamp-3">
              {report.description || "No description available"}
            </p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-auto ${
                report.type === "lost"
                  ? "bg-red-100 text-red-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {report.type.toUpperCase()}
            </span>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(report.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* 🕳️ Empty State */}
      {filteredReports.length === 0 && (
        <p className="text-gray-500 mt-10 text-center">
          No {filter === "all" ? "" : filter} reports found.
        </p>
      )}
    </div>
  );
}
