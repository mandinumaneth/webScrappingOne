const ProfileCard = ({ profile }) => {
  if (!profile) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="mb-4">
          <img
            src={profile.avatar || "https://github.com/github.png"}
            alt={profile.username}
            className="w-24 h-24 rounded-full border-4 border-gray-200 object-cover"
          />
        </div>

        {/* Name */}
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {profile.name || profile.username}
        </h2>

        {/* Username */}
        <a
          href={`https://github.com/${profile.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-lg mb-4"
        >
          @{profile.username}
        </a>

        {/* Bio */}
        {profile.bio && (
          <p className="text-gray-700 mb-6 max-w-md">{profile.bio}</p>
        )}

        {/* Additional Info */}
        <div className="w-full space-y-3 mt-4">
          {profile.location && (
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{profile.location}</span>
            </div>
          )}

          {profile.company && (
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{profile.company}</span>
            </div>
          )}

          {profile.email && (
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span>{profile.email}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
