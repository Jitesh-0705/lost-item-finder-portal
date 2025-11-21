export default function About() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        About Lost Item Finder
      </h1>
      <p className="text-gray-600 mb-4">
        The <strong>Lost Item Finder</strong> system helps users in a college or
        office environment to report and locate lost or found items efficiently.
        The system combines a mobile app for users and a web portal for the
        administrator.
      </p>

      <p className="text-gray-600 mb-4">
        Using AI-based image and text analysis, the system automatically matches
        lost and found reports to reduce manual searching and improve recovery
        rates.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2 text-gray-800">
        Key Features
      </h2>
      <ul className="list-disc list-inside text-gray-600 space-y-2">
        <li>Upload and manage lost or found reports.</li>
        <li>AI-powered object detection and similarity matching.</li>
        <li>Centralized admin dashboard for monitoring and reports.</li>
        <li>Cross-platform support via mobile and web applications.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2 text-gray-800">
        Project Team
      </h2>
      <p className="text-gray-600">
        Developed by <strong>Jitesh T , Bhagavathi Lingam A</strong> as a Final Year
        Project.
      </p>
    </div>
  );
}
