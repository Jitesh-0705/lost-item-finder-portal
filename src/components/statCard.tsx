export function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="bg-white shadow rounded-xl p-6 text-center">
      <h2 className="text-gray-600">{title}</h2>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
