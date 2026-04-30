import { Card, Button } from '../components/ui';
import { Badge } from '../components/ui';
import type { Booking, ChatMessage, Page, Role } from '../types';

type Props = {
  setPage: (p: Page) => void;
  selectedBooking: Booking | null;
  canOpenOrderChat: boolean;
  currentChatMessages: ChatMessage[];
  chatPartnerName: string;
  chatMessage: string;
  setChatMessage: (v: string) => void;
  sendOrderMessage: () => void;
  userEmail: string;
  userRole: Role;
};

export default function ContactPage({
  setPage, selectedBooking, canOpenOrderChat,
  currentChatMessages, chatPartnerName,
  chatMessage, setChatMessage, sendOrderMessage,
  userEmail, userRole,
}: Props) {
  return (
    <Card>
      {!selectedBooking || !canOpenOrderChat ? (
        <div className="empty-state">
          <h3>No Chat Available</h3>
          <p className="muted">Open chat from a real order between client and specialist.</p>
          <Button variant="secondary" onClick={() => setPage(userRole === 'specialist' ? 'jobs' : 'bookings')}>
            Go Back
          </Button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <h2 style={{ marginBottom: '6px' }}>Chat with {chatPartnerName}</h2>
              <p className="muted small-text">Order ID: {selectedBooking.id} • {selectedBooking.service}</p>
            </div>
            <Badge tone="soft">{selectedBooking.status}</Badge>
          </div>

          <div className="chat-box">
            {currentChatMessages.length === 0 ? (
              <div className="soft-box">No messages yet. Start the conversation.</div>
            ) : (
              currentChatMessages.map(msg => (
                <div key={msg.id} className={`message ${msg.senderEmail === userEmail ? 'user' : 'specialist'}`}>
                  <div>{msg.text}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '6px' }}>{msg.senderName}</div>
                </div>
              ))
            )}
          </div>

          <div className="chat-input">
            <input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendOrderMessage(); }}
              placeholder="Type message..." />
            <Button onClick={sendOrderMessage}>Send</Button>
          </div>
        </>
      )}
    </Card>
  );
}