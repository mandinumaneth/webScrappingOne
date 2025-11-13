import { useState } from "react";
import SearchBar from "./components/SearchBar";
import ProfileCard from "./components/ProfileCard";
import RepoTable from "./components/RepoTable";
import "./App.css";

function App() {
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchKey, setSearchKey] = useState(0);

  const API_URL = "http://localhost:8000";

  const handleSearch = async (username) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("GitHub user not found");
        }
        throw new Error("Failed to fetch profile data");
      }

      const data = await response.json();
      setProfile(data.profile);
      setRepos(data.repos);
    } catch (err) {
      setError(err.message);
      setProfile(null);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setProfile(null);
    setRepos([]);
    setError(null);
    setSearchKey((prev) => prev + 1); // Increment key to reset SearchBar
  };

  const handleDownloadPDF = async () => {
    if (!profile) return;

    try {
      const response = await fetch(`${API_URL}/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: profile.username,
          profile: profile,
          repos: repos,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${profile.username}_github_profile.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download PDF: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            GitHub Profile Scraper
          </h1>
          <p className="text-gray-600 text-lg">
            Search for any GitHub user and explore their profile & repositories
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar key={searchKey} onSearch={handleSearch} loading={loading} />

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {profile && (
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear Results
            </button>
          </div>
        )}

        {/* Two Column Layout: Profile Card (Left) and Repository Table (Right) */}
        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Profile Card */}
            <div className="lg:col-span-1">
              <ProfileCard profile={profile} />
            </div>

            {/* Right Side - Repository Table */}
            <div className="lg:col-span-2">
              {repos.length > 0 && <RepoTable repos={repos} />}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Fetching GitHub profile...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
