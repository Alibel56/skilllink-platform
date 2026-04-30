import { Bell } from 'lucide-react';
import { Card, IconBadge } from '../components/ui';
import { SectionHeader } from '../components/layout';

type Props = {
  notifications: { id: number; text: string }[];
};

export default function NotificationsPage({ notifications }: Props) {
  return (
    <Card>
      <SectionHeader title="Notifications" />
      <div className="stack gap-12">
        {notifications.map(item => (
          <div key={item.id} className="notice-row">
            <IconBadge><Bell size={18} /></IconBadge>
            <div>
              <strong>Notification</strong>
              <p className="muted mt-8">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}