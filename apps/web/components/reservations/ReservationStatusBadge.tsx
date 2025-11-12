import { Badge } from '@/components/ui/badge';
import type { ReservationStatus, PaymentStatus } from '@/types/booking';

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  size?: 'sm' | 'md' | 'lg';
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge component for reservation status
 * Color-coded based on status value
 */
export function ReservationStatusBadge({
  status,
  size = 'md',
}: ReservationStatusBadgeProps) {
  const config: Record<
    ReservationStatus,
    { variant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'; label: string }
  > = {
    pending: { variant: 'warning', label: 'Pending' },
    confirmed: { variant: 'success', label: 'Confirmed' },
    checked_in: { variant: 'info', label: 'Checked In' },
    checked_out: { variant: 'default', label: 'Checked Out' },
    cancelled: { variant: 'error', label: 'Cancelled' },
  };

  const { variant, label } = config[status];

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}

/**
 * Badge component for payment status
 * Color-coded based on payment status value
 */
export function PaymentStatusBadge({ status, size = 'md' }: PaymentStatusBadgeProps) {
  const config: Record<
    PaymentStatus,
    { variant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'; label: string }
  > = {
    pending: { variant: 'warning', label: 'Payment Pending' },
    paid: { variant: 'success', label: 'Paid' },
    refunded: { variant: 'default', label: 'Refunded' },
  };

  const { variant, label } = config[status];

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}
