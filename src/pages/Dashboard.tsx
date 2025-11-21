import { useEffect, useState } from "react";
import { supabase } from "../lib/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface ReportStats {
  lostCount: number;
  foundCount: number;
  matchCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<ReportStats>({
    lostCount: 0,
    foundCount: 0,
    matchCount: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const { count: lostCount } = await supabase
        .from("lost_items")
        .select("*", { count: "exact", head: true });

      const { count: foundCount } = await supabase
        .from("found_items")
        .select("*", { count: "exact", head: true });

      const { count: matchCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true });

      setStats({
        lostCount: lostCount || 0,
        foundCount: foundCount || 0,
        matchCount: matchCount || 0,
      });

      setChartData([
        { name: "Lost Items", count: lostCount || 0 },
        { name: "Found Items", count: foundCount || 0 },
        { name: "Matches", count: matchCount || 0 },
      ]);
    };

    fetchStats();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-600">Total Lost Items</h2>
          <p className="text-3xl font-bold text-blue-600">{stats.lostCount}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-600">Total Found Items</h2>
          <p className="text-3xl font-bold text-green-600">{stats.foundCount}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-600">Total Matches</h2>
          <p className="text-3xl font-bold text-purple-600">{stats.matchCount}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Lost vs Found Items
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
