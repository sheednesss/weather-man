import { ProfilePage } from '@/features/social/ProfilePage';

/**
 * Profile page wrapper
 * Uses useParams to get address from route
 */
export function Profile() {
  return (
    <div className="max-w-2xl mx-auto">
      <ProfilePage />
    </div>
  );
}

export default Profile;
