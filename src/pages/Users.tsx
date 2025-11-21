import { useEffect, useState } from "react";
import { supabase } from "../lib/client";

interface User {
  id: string;
  email: string;
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const { data } = await supabase.from("users").select("id, email, created_at");
      setUsers(data || []);
    };
    loadUsers();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Registered Users</h1>

      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Registered On</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className="border-t">
                <td className="py-3 px-4">{i + 1}</td>
                <td className="py-3 px-4">{u.email}</td>
                <td className="py-3 px-4 text-gray-500">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <p className="text-gray-500 text-center py-10">No users yet.</p>
        )}
      </div>
    </div>
  );
}
