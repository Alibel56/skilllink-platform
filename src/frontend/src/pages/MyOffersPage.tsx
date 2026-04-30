import { Card, Button, Badge } from '../components/ui';
import { SectionHeader } from '../components/layout';
import type { Page, ServiceOffer } from '../types';

type Props = {
  setPage: (p: Page) => void;
  offers: ServiceOffer[];
  userName: string;
};

export default function MyOffersPage({ setPage, offers, userName }: Props) {
  const myOffers = offers.filter(o => o.specialistName === userName);

  return (
    <Card>
      <SectionHeader title="My Offers"
        action={<Button onClick={() => setPage('createOffer')}>+ Create Offer</Button>} />
      {myOffers.length === 0 ? (
        <div className="empty-state">
          <h3>No Offers Yet</h3>
          <p className="muted">Create your first service offer to start getting clients.</p>
          <Button onClick={() => setPage('createOffer')}>Create Offer</Button>
        </div>
      ) : (
        <div className="stack gap-12">
          {myOffers.map(offer => (
            <div key={offer.id} className="job-row">
              <div>
                <strong>{offer.title}</strong>
                <p className="muted small-text">{offer.description}</p>
                <p className="muted small-text">Category: {offer.category}</p>
                {offer.tags.length > 0 && (
                  <div className="tag-row mt-12">
                    {offer.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
                  </div>
                )}
              </div>
              <Badge tone="soft">${offer.price}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}