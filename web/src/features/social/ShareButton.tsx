import { TwitterShareButton, XIcon } from 'react-share';

interface ShareButtonProps {
  marketQuestion: string;
  prediction: 'YES' | 'NO';
  explanation?: string;
  marketUrl: string;
}

/**
 * Share prediction to Twitter/X
 */
export function ShareButton({ marketQuestion, prediction, explanation, marketUrl }: ShareButtonProps) {
  // Compose tweet text
  let tweetText = `My prediction: ${prediction} on "${marketQuestion}"`;

  // Add explanation if provided (truncate if too long)
  if (explanation) {
    const maxExplanationLength = 180 - tweetText.length - 50; // Leave room for URL and hashtags
    const truncatedExplanation = explanation.length > maxExplanationLength
      ? explanation.slice(0, maxExplanationLength - 3) + '...'
      : explanation;
    tweetText += `\n\n"${truncatedExplanation}"`;
  }

  const hashtags = ['WeatherMan', 'PredictionMarkets'];

  return (
    <TwitterShareButton
      url={marketUrl}
      title={tweetText}
      hashtags={hashtags}
      className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
    >
      <XIcon size={16} round />
      <span>Share on X</span>
    </TwitterShareButton>
  );
}

export default ShareButton;
