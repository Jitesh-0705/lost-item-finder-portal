import { useEffect, useState } from "react";
import { supabase } from "../lib/client";
import { ConfirmDialog } from "../components/confirmdialog";

interface Match {
  id: number;
  confidence: number;
  status: string;
  created_at: string;
  lost_items?: { title: string };
  found_items?: { title: string };
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [dialogAction, setDialogAction] = useState<"confirm" | "reject" | null>(null);

  const loadMatches = async () => {
    const { data } = await supabase
      .from("matches")
      .select("id, confidence, status, created_at, lost_items(title), found_items(title)")
      .order("created_at", { ascending: false });
    setMatches(data || []);
  };

  const updateStatus = async (id: number, status: string) => {
    await supabase.from("matches").update({ status }).eq("id", id);
    await loadMatches();
  };

  useEffect(() => {
    loadMatches();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">AI Matches</h1>

      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Lost Item</th>
              <th className="py-3 px-4">Found Item</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="py-3 px-4">{m.id}</td>
                <td className="py-3 px-4">{m.lost_items?.title}</td>
                <td className="py-3 px-4">{m.found_items?.title}</td>
                <td className="py-3 px-4 text-indigo-600 font-semibold">
                  {(m.confidence * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-4">{m.status}</td>
                <td className="py-3 px-4 text-center">
                  {m.status === "pending" && (
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => {
                          setSelected(m.id);
                          setDialogAction("confirm");
                        }}
                        className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setSelected(m.id);
                          setDialogAction("reject");
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {matches.length === 0 && (
          <p className="text-gray-500 text-center py-10">No matches yet.</p>
        )}
      </div>

      <ConfirmDialog
        open={selected !== null}
        title={`${dialogAction === "confirm" ? "Confirm" : "Reject"} Match`}
        message={`Are you sure you want to ${dialogAction} this match?`}
        onClose={() => setSelected(null)}
        onConfirm={() => {
          if (selected) {
            updateStatus(selected, dialogAction === "confirm" ? "confirmed" : "rejected");
            setSelected(null);
          }
        }}
      />
    </div>
  );
}
