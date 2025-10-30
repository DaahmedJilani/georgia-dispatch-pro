import { CheckCircle, Clock, Eye, Send } from 'lucide-react';
import { format } from 'date-fns';

interface EnvelopeTimelineProps {
  envelope: {
    created_at: string;
    sent_at?: string;
    viewed_at?: string;
    signed_at?: string;
    declined_at?: string;
    expires_at?: string;
  };
}

export const EnvelopeTimeline = ({ envelope }: EnvelopeTimelineProps) => {
  const events = [
    { 
      label: 'Created', 
      date: envelope.created_at, 
      icon: Clock, 
      completed: true,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
    },
    { 
      label: 'Sent', 
      date: envelope.sent_at, 
      icon: Send, 
      completed: !!envelope.sent_at,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
    },
    { 
      label: 'Viewed', 
      date: envelope.viewed_at, 
      icon: Eye, 
      completed: !!envelope.viewed_at,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
    },
    { 
      label: 'Signed', 
      date: envelope.signed_at, 
      icon: CheckCircle, 
      completed: !!envelope.signed_at,
      color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
    },
  ];

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.label} className="flex items-start gap-3">
          <div className={`mt-1 rounded-full p-2 ${
            event.completed ? event.color : 'bg-muted'
          }`}>
            <event.icon className={`h-4 w-4 ${
              event.completed ? '' : 'text-muted-foreground'
            }`} />
          </div>
          <div className="flex-1">
            <p className={`font-medium ${
              event.completed ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {event.label}
            </p>
            {event.date && (
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.date), 'MMM dd, yyyy hh:mm a')}
              </p>
            )}
            {!event.date && event.label === 'Signed' && envelope.expires_at && (
              <p className="text-xs text-muted-foreground">
                Expires: {format(new Date(envelope.expires_at), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
