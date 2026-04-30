import { Star } from 'lucide-react';
import { Card, Button, TextArea } from '../components/ui';
import { specialistsSeed } from '../data';
import type { Page } from '../types';

type Props = {
  setPage: (p: Page) => void;
  selectedSpecialistId: number;
  reviewRating: number;
  setReviewRating: (v: number) => void;
  reviewComment: string;
  setReviewComment: (v: string) => void;
  submitReview: () => void;
};

export default function FeedbackPage({
  selectedSpecialistId, reviewRating, setReviewRating,
  reviewComment, setReviewComment, submitReview,
}: Props) {
  const sp = specialistsSeed.find(s => s.id === selectedSpecialistId) ?? specialistsSeed[0];

  return (
    <div className="centered-page wide">
      <Card className="auth-card wide-card">
        <h2>Leave a Review</h2>
        <div className="soft-box mt-16">
          <strong>{sp.name}</strong>
          <p className="muted small-text">{sp.title}</p>
        </div>

        <div className="mt-16">
          <label className="field-label">Rate Your Experience</label>
          <div className="star-picker">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} className="star-btn" onClick={() => setReviewRating(i + 1)}>
                <Star size={30} className={i < reviewRating ? 'star active' : 'star'} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <label className="field-label">Comment</label>
          <TextArea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share your feedback about the service" />
        </div>

        <Button className="full-width mt-16" onClick={submitReview}>Submit Review</Button>
      </Card>
    </div>
  );
}