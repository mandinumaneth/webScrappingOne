import { useState } from "react";

const RepoTable = ({ repos }) => {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [readmeContent, setReadmeContent] = useState("");
  const [loadingReadme, setLoadingReadme] = useState(false);

  if (!repos || repos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
        No repositories found
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRepoClick = async (repo) => {
    setSelectedRepo(repo);
    setLoadingReadme(true);
    setReadmeContent("");

    try {
      // Extract username and repo name from URL
      const urlParts = repo.url.split("/");
      const username = urlParts[3];
      const repoName = urlParts[4];

      const response = await fetch(
        `http://localhost:8000/readme/${username}/${repoName}`
      );
      const data = await response.json();

      setReadmeContent(data.content);
    } catch (err) {
      console.error("Error fetching README:", err);
      setReadmeContent("Failed to load README");
    } finally {
      setLoadingReadme(false);
    }
  };

  const closeModal = () => {
    setSelectedRepo(null);
    setReadmeContent("");
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            Top Repositories ({repos.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Repository
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Language
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {repos.map((repo, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleRepoClick(repo)}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left"
                    >
                      {repo.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {repo.language || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(repo.updated)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedRepo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-blue-50 px-6 py-4 border-b-2 border-blue-200">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedRepo.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Last updated: {formatDateTime(selectedRepo.updated)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedRepo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                    title="View on GitHub"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    <span className="text-sm">GitHub</span>
                  </a>
                  <button
                    onClick={closeModal}
                    className="text-gray-600 hover:bg-gray-200 rounded-full p-2 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
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
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
              {/* README Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  README Preview
                </h3>

                {loadingReadme ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading README...</p>
                  </div>
                ) : (
                  <div
                    className="bg-white rounded-lg p-6 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html:
                        readmeContent ||
                        "<p class='text-gray-500'>No README available</p>",
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RepoTable;
