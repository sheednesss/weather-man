import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAddComment } from '@/hooks/useComments';

interface CommentFormProps {
  marketId: string;
}

/**
 * Form for adding comments to a market
 */
export function CommentForm({ marketId }: CommentFormProps) {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const { mutate: addComment, isPending, error } = useAddComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !isAuthenticated) return;

    addComment(
      { marketId, content: content.trim() },
      {
        onSuccess: () => {
          setContent('');
        },
      }
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-500 text-sm">Sign in to comment</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts..."
        maxLength={1000}
        rows={3}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {content.length}/1000
        </span>
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isPending || !content.trim()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isPending ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
      {error && (
        <p className="text-red-600 text-sm">{error.message || 'Failed to post comment'}</p>
      )}
    </form>
  );
}

export default CommentForm;
