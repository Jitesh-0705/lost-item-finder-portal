import { useEffect, useState } from "react";
import { supabase } from "../lib/client";
import { ConfirmDialog } from "../components/confirmdialog";

interface LostItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  location: string;
  date_lost: string;
  created_at: string;
}

interface FoundItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  location: string;
  date_found: string;
  created_at: string;
}

interface Match {
  id: string;
  confidence: number;
  status: string;
  created_at: string;
  lost_item_id: string;
  found_item_id: string;
  lost_items: LostItem | null;
  found_items: FoundItem | null;
}

type SupabaseMatch = {
  id: string;
  confidence: number;
  status: string;
  created_at: string;
  lost_item_id: string;
  found_item_id: string;
  lost_items: LostItem[] | null;
  found_items: FoundItem[] | null;
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<"confirm" | "reject" | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingMatch, setProcessingMatch] = useState<string | null>(null);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id, 
          confidence, 
          status, 
          created_at,
          lost_item_id,
          found_item_id,
          lost_items (*),
          found_items (*)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching matches:", error);
        return;
      }

      const formattedMatches: Match[] = (data as SupabaseMatch[] || []).map(match => ({
        id: match.id,
        confidence: match.confidence,
        status: match.status,
        created_at: match.created_at,
        lost_item_id: match.lost_item_id,
        found_item_id: match.found_item_id,
        lost_items: match.lost_items && match.lost_items.length > 0 ? match.lost_items[0] : null,
        found_items: match.found_items && match.found_items.length > 0 ? match.found_items[0] : null,
      }));

      setMatches(formattedMatches);
    } catch (error) {
      console.error("Error loading matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmAndDeleteItems = async (matchId: string, lostItemId: string, foundItemId: string) => {
    setProcessingMatch(matchId);
    
    try {
      console.log("Starting to delete items...", { matchId, lostItemId, foundItemId });

      // Delete lost item
      const { error: lostError } = await supabase
        .from('lost_items')
        .delete()
        .eq('id', lostItemId);

      if (lostError) {
        console.error("Error deleting lost item:", lostError);
        throw new Error(`Failed to delete lost item: ${lostError.message}`);
      }
      console.log("Lost item deleted successfully");

      // Delete found item
      const { error: foundError } = await supabase
        .from('found_items')
        .delete()
        .eq('id', foundItemId);

      if (foundError) {
        console.error("Error deleting found item:", foundError);
        throw new Error(`Failed to delete found item: ${foundError.message}`);
      }
      console.log("Found item deleted successfully");

      // Update match status to confirmed
      const { error: matchError } = await supabase
        .from("matches")
        .update({ status: 'confirmed' })
        .eq('id', matchId);

      if (matchError) {
        console.error("Error updating match status:", matchError);
        throw new Error(`Failed to update match status: ${matchError.message}`);
      }
      console.log("Match status updated to confirmed");

      // Reload matches to reflect changes
      await loadMatches();
      console.log("Matches reloaded successfully");
      
    } catch (error) {
      console.error("Error in confirmAndDeleteItems:", error);
      alert(`Failed to confirm match and delete items: ${error}`);
    } finally {
      setProcessingMatch(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      setProcessingMatch(id);
      const { error } = await supabase
        .from("matches")
        .update({ status })
        .eq("id", id);

      if (error) {
        console.error("Error updating match status:", error);
        alert("Failed to update match status");
        return;
      }

      await loadMatches();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update match status");
    } finally {
      setProcessingMatch(null);
    }
  };

  const deleteMatch = async (id: string) => {
    try {
      const { error } = await supabase
        .from("matches")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting match:", error);
        alert("Failed to delete match");
        return;
      }

      await loadMatches();
    } catch (error) {
      console.error("Error deleting match:", error);
      alert("Failed to delete match");
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedMatch(expandedMatch === id ? null : id);
  };

  const handleConfirm = async () => {
    if (selected) {
      const match = matches.find(m => m.id === selected);
      if (match && dialogAction === "confirm") {
        if (match.lost_items && match.found_items) {
          await confirmAndDeleteItems(match.id, match.lost_items.id, match.found_items.id);
        } else {
          alert("Cannot confirm match: Missing item data");
        }
      } else if (dialogAction === "reject") {
        await updateStatus(selected, "rejected");
      }
      setSelected(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading matches...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">AI Matches</h1>
        <button
          onClick={() => window.location.href = '/reports'}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          Find New Matches
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{matches.length}</div>
          <div className="text-gray-600">Total Matches</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {matches.filter(m => m.status === 'pending').length}
          </div>
          <div className="text-gray-600">Pending Review</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {matches.filter(m => m.status === 'confirmed').length}
          </div>
          <div className="text-gray-600">Resolved</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">
            {matches.filter(m => m.status === 'rejected').length}
          </div>
          <div className="text-gray-600">Rejected</div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-green-800 font-medium">Match Resolution</h3>
            <p className="text-green-700 text-sm">
              When you confirm a match, both items will be removed from the system.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4">Match Details</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => [
                <tr key={match.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(match.id)}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-red-600">
                          Lost: {match.lost_items?.title || "—"}
                        </div>
                        <div className="font-medium text-green-600">
                          Found: {match.found_items?.title || "—"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(match.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {expandedMatch === match.id ? '▲' : '▼'}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                      match.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                      match.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(match.confidence * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      match.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      match.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {match.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {match.status === "pending" && (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(match.id);
                            setDialogAction("confirm");
                          }}
                          disabled={processingMatch === match.id}
                          className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingMatch === match.id ? "Processing..." : "Confirm & Resolve"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(match.id);
                            setDialogAction("reject");
                          }}
                          disabled={processingMatch === match.id}
                          className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {match.status !== "pending" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this match record?')) {
                            deleteMatch(match.id);
                          }
                        }}
                        className="bg-gray-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-600"
                      >
                        Delete Record
                      </button>
                    )}
                  </td>
                </tr>,
                expandedMatch === match.id && (
                  <tr key={`${match.id}-expand`} className="bg-gray-50 border-t">
                    <td colSpan={4} className="py-4 px-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-lg border">
                          <h4 className="font-bold text-red-600 mb-3">Lost Item Details</h4>
                          {match.lost_items?.image_url && (
                            <img
                              src={match.lost_items.image_url}
                              alt={match.lost_items.title}
                              className="w-full h-48 object-cover rounded mb-3"
                            />
                          )}
                          <p><strong>Title:</strong> {match.lost_items?.title || "—"}</p>
                          <p><strong>Description:</strong> {match.lost_items?.description || "—"}</p>
                          <p><strong>Location:</strong> {match.lost_items?.location || "—"}</p>
                          <p><strong>Date Lost:</strong> {match.lost_items?.date_lost || "—"}</p>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border">
                          <h4 className="font-bold text-green-600 mb-3">Found Item Details</h4>
                          {match.found_items?.image_url && (
                            <img
                              src={match.found_items.image_url}
                              alt={match.found_items.title}
                              className="w-full h-48 object-cover rounded mb-3"
                            />
                          )}
                          <p><strong>Title:</strong> {match.found_items?.title || "—"}</p>
                          <p><strong>Description:</strong> {match.found_items?.description || "—"}</p>
                          <p><strong>Location:</strong> {match.found_items?.location || "—"}</p>
                          <p><strong>Date Found:</strong> {match.found_items?.date_found || "—"}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              ])}
            </tbody>
          </table>
        </div>

        {matches.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">No matches found yet.</p>
            <button
              onClick={() => window.location.href = '/reports'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Find Matches in Reports Page
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={selected !== null}
        title={dialogAction === "confirm" ? "Confirm Match & Resolve Items" : "Reject Match"}
        message={
          dialogAction === "confirm" 
            ? "Are you sure you want to confirm this match? This will delete both the lost and found items from the system since the item has been returned to its owner. This action cannot be undone."
            : "Are you sure you want to reject this match? The items will remain in the system for potential future matches."
        }
        onClose={() => setSelected(null)}
        onConfirm={handleConfirm}
        confirmText={dialogAction === "confirm" ? "Confirm & Delete Items" : "Reject Match"}
        confirmColor={dialogAction === "confirm" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
      />
    </div>
  );
};