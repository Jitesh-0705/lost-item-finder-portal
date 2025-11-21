// pages/Reports.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/client";
import { matchingService } from "../lib/matchingService";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Report {
  id: number;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
  type: "lost" | "found";
  user_id?: string;
  location: string;
  user?: User;
}

interface MatchResult {
  lostReport: Report;
  foundReport: Report;
  similarity: {
    score: number;
    textScore: number;
    imageScore: number;
  };
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<"all" | "lost" | "found">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [isMatching, setIsMatching] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [
          { data: lostItems },
          { data: foundItems },
          { data: users }
        ] = await Promise.all([
          supabase.from("lost_items").select("*"),
          supabase.from("found_items").select("*"),
          supabase.from("users").select("id, name, email")
        ]);

        const usersMap = new Map();
        users?.forEach(user => {
          usersMap.set(user.id, user);
        });

        const allReports: Report[] = [
          ...(lostItems?.map((item) => ({ 
            ...item, 
            type: "lost" as const,
            user: item.user_id ? usersMap.get(item.user_id) : undefined
          })) || []),
          ...(foundItems?.map((item) => ({ 
            ...item, 
            type: "found" as const,
            user: item.user_id ? usersMap.get(item.user_id) : undefined
          })) || []),
        ];

        setReports(allReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();
  }, []);

  const saveMatchesToDatabase = async (matches: MatchResult[]) => {
    try {
      const matchesToInsert = matches.map(match => ({
        lost_item_id: match.lostReport.id,
        found_item_id: match.foundReport.id,
        confidence: match.similarity.score,
        status: 'pending'
      }));

      const { data, error } = await supabase
        .from('matches')
        .insert(matchesToInsert)
        .select();

      if (error) {
        console.error('Error saving matches to database:', error);
        throw error;
      }

      console.log('Matches saved to database:', data);
      return data;
    } catch (error) {
      console.error('Failed to save matches:', error);
      throw error;
    }
  };

  const findMatches = async () => {
    setIsMatching(true);
    try {
      await matchingService.initialize();

      const lostReports = reports.filter(r => r.type === "lost");
      const foundReports = reports.filter(r => r.type === "found");

      const matchesFound: MatchResult[] = [];

      for (const lostReport of lostReports) {
        for (const foundReport of foundReports) {
          const similarity = await matchingService.calculateOverallSimilarity(
            lostReport,
            foundReport
          );

          if (similarity.score > 0.3) {
            matchesFound.push({
              lostReport,
              foundReport,
              similarity
            });
          }
        }
      }

      matchesFound.sort((a, b) => b.similarity.score - a.similarity.score);

      if (matchesFound.length > 0) {
        await saveMatchesToDatabase(matchesFound);
      }

      setMatches(matchesFound);
      setShowMatches(true);

    } catch (error) {
      console.error("Error finding matches:", error);
      alert("Error finding matches. Please try again.");
    } finally {
      setIsMatching(false);
    }
  };

  const filteredReports = reports
    .filter((report) =>
      filter === "all" ? true : report.type === filter
    )
    .filter((report) => {
      const query = searchTerm.toLowerCase();
      return (
        report.title?.toLowerCase().includes(query) ||
        report.description?.toLowerCase().includes(query) ||
        report.location?.toLowerCase().includes(query) ||
        report.user?.name?.toLowerCase().includes(query) ||
        report.user?.email?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports Overview</h1>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/matches'}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
          >
            View Saved Matches
          </button>
          <button
            onClick={findMatches}
            disabled={isMatching}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMatching ? "Finding Matches..." : "Find New Matches"}
          </button>
        </div>
      </div>

      {showMatches && (
        <div className="mb-8 bg-blue-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              New Potential Matches Found ({matches.length})
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/matches'}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                View All in Matches Page
              </button>
              <button
                onClick={() => setShowMatches(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          {matches.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {matches.slice(0, 3).map((match, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow border">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">
                      Match #{index + 1} - {Math.round(match.similarity.score * 100)}% Confidence
                    </h3>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      Score: {match.similarity.score.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-r pr-4">
                      <h4 className="font-medium text-red-600 mb-2">LOST ITEM</h4>
                      <div className="flex gap-3">
                        <img
                          src={match.lostReport.image_url}
                          alt={match.lostReport.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{match.lostReport.title}</p>
                          <p className="text-sm text-gray-600">{match.lostReport.description}</p>
                          {match.lostReport.user && (
                            <p className="text-xs text-gray-500 mt-1">
                              Reported by: {match.lostReport.user.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-green-600 mb-2">FOUND ITEM</h4>
                      <div className="flex gap-3">
                        <img
                          src={match.foundReport.image_url}
                          alt={match.foundReport.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{match.foundReport.title}</p>
                          <p className="text-sm text-gray-600">{match.foundReport.description}</p>
                          {match.foundReport.user && (
                            <p className="text-xs text-gray-500 mt-1">
                              Reported by: {match.foundReport.user.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-500">
                    Text Similarity: {Math.round(match.similarity.textScore * 100)}% •
                    Image Similarity: {Math.round(match.similarity.imageScore * 100)}%
                  </div>
                </div>
              ))}
              {matches.length > 3 && (
                <div className="text-center text-blue-600 font-medium">
                  + {matches.length - 3} more matches found. Check the Matches page to see all.
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No matches found above the confidence threshold.</p>
          )}
        </div>
      )}

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
        </div>;
        <input
          type="text"
          placeholder="Search by title, description, location, or reporter..."
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3 focus:ring-2 focus:ring-indigo-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />;
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>;
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl shadow p-4 flex flex-col hover:shadow-lg transition-shadow"
          >
            <img
              src={report.image_url || "/placeholder-image.jpg"}
              alt={report.title}
              className="w-full h-48 object-cover rounded-md mb-3"
            />
            
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {report.title || "Untitled"}
            </h2>
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {report.description || "No description available"}
            </p>

            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-gray-700">
                {report.location || "Location not specified"}
              </span>
            </div>

            {report.user && (
              <div className="mt-auto p-3 bg-gray-50 rounded-lg mb-3">
                <p className="text-sm font-medium text-gray-800">
                  Reported by: {report.user.name}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {report.user.email}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center mt-auto">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  report.type === "lost"
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {report.type.toUpperCase()}
              </span>
              <p className="text-xs text-gray-400">
                {new Date(report.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>;
      {filteredReports.length === 0 && (
        <p className="text-gray-500 mt-10 text-center">
          No {filter === "all" ? "" : filter} reports found.
        </p>
      )}
    </div>
  );
};