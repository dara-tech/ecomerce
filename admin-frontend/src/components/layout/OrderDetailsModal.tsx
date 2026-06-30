import { X, Package, MapPin, CreditCard, Calendar, User as UserIcon } from 'lucide-react';
import { createPortal } from 'react-dom';

interface OrderItem {
  name: string;
  image: string;
  qty: number;
  price: number;
}

interface Order {
  _id: string;
  user: { _id: string; name: string };
  createdAt: string;
  totalPrice: number;
  taxPrice?: number;
  shippingPrice?: number;
  isPaid: boolean;
  status: string;
  orderItems: OrderItem[];
  shippingAddress?: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod?: string;
  paidAt?: string;
  timeline?: { status: string; timestamp: string; note: string }[];
  trackingNumber?: string;
  customerNotes?: string;
  adminNotes?: string;
  invoiceUrl?: string;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="w-full max-w-2xl bg-card border border-border/60 rounded-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between bg-muted/20 shrink-0">
          <div>
            <h3 className="font-semibold text-[15px] tracking-tight">Order Details</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">ID: {order._id}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-none hover:bg-muted transition-colors"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-6">
          
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Info */}
            <div className="p-4 rounded-none border border-border/60 bg-muted/10 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-[13px]">
                <UserIcon className="size-4 text-primary" />
                Customer
              </div>
              <div className="text-[12px] text-muted-foreground space-y-1">
                <p><span className="font-medium text-foreground">Name:</span> {order.user ? order.user.name : 'Unknown User'}</p>
                <p><span className="font-medium text-foreground">Date:</span> {formatDate(order.createdAt)}</p>
              </div>
            </div>

            {/* Payment & Shipping Status */}
            <div className="p-4 rounded-none border border-border/60 bg-muted/10 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-[13px]">
                <CreditCard className="size-4 text-primary" />
                Payment & Delivery
              </div>
              <div className="text-[12px] text-muted-foreground space-y-2">
                <p>
                  <span className="font-medium text-foreground">Payment:</span>{' '}
                  <span className={order.isPaid ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
                    {order.isPaid ? `Paid (${formatDate(order.paidAt)})` : 'Not Paid'}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-foreground">Status:</span>{' '}
                  <span className="font-semibold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded-none bg-muted border border-border">
                    {order.status || 'pending'}
                  </span>
                </p>
                {order.trackingNumber && (
                  <p><span className="font-medium text-foreground">Tracking No:</span> {order.trackingNumber}</p>
                )}
                {order.paymentMethod && <p><span className="font-medium text-foreground">Method:</span> {order.paymentMethod}</p>}
              </div>
            </div>
          </div>

          {/* Timeline & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Timeline */}
            <div className="p-4 rounded-none border border-border/60 bg-muted/5 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-[13px]">
                <Calendar className="size-4 text-primary" />
                Order Timeline
              </div>
              <div className="text-[11px] relative pl-4 border-l-2 border-border/60 ml-2 space-y-4 mt-2">
                {order.timeline && order.timeline.length > 0 ? order.timeline.map((event, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-none border-2 border-primary bg-background shadow-sm" />
                    <div className="p-3 rounded-none border border-border/80 bg-card shadow-sm">
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-1 mb-1">
                        <h4 className="font-bold text-foreground capitalize text-[12px]">{event.status}</h4>
                        <time className="text-[10px] text-muted-foreground shrink-0">{new Date(event.timestamp).toLocaleString()}</time>
                      </div>
                      {event.note && <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{event.note}</p>}
                    </div>
                  </div>
                )) : (
                  <div className="text-muted-foreground text-center py-2">No timeline events yet.</div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              {order.customerNotes && (
                <div className="p-4 rounded-none border border-border/60 bg-amber-500/5 space-y-2">
                  <h4 className="font-semibold text-[12px] text-amber-600">Customer Note</h4>
                  <p className="text-[12px] text-muted-foreground italic">"{order.customerNotes}"</p>
                </div>
              )}
              {order.adminNotes && (
                <div className="p-4 rounded-none border border-border/60 bg-blue-500/5 space-y-2">
                  <h4 className="font-semibold text-[12px] text-blue-600">Admin Note</h4>
                  <p className="text-[12px] text-muted-foreground">"{order.adminNotes}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="p-4 rounded-none border border-border/60 bg-muted/10 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-[13px]">
                <MapPin className="size-4 text-primary" />
                Shipping Address
              </div>
              <div className="text-[12px] text-muted-foreground">
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-[13px]">
              <Package className="size-4 text-primary" />
              Order Items ({order.orderItems.length})
            </div>
            
            <div className="border border-border/60 rounded-none overflow-hidden divide-y divide-border/40">
              {order.orderItems.map((item, index) => (
                <div key={index} className="p-3 flex items-center gap-3 bg-card hover:bg-muted/30 transition-colors">
                  <div className="shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-12 h-12 rounded-none object-cover border border-border/50 bg-muted"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/100x100/1d1b1c/ffffff?text=No+Img';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {item.qty} x ${item.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="text-[13px] font-semibold text-foreground text-right shrink-0">
                    ${((item.qty || 0) * (item.price || 0)).toFixed(2)}
                  </div>
                </div>
              ))}
              
              {/* Totals */}
              <div className="p-4 bg-muted/10 flex flex-col items-end gap-1.5 text-[12px]">
                <div className="flex justify-between w-full sm:w-48 text-muted-foreground">
                  <span>Items:</span>
                  <span>${(order.totalPrice - (order.taxPrice || 0) - (order.shippingPrice || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full sm:w-48 text-muted-foreground">
                  <span>Shipping:</span>
                  <span>${(order.shippingPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full sm:w-48 text-muted-foreground">
                  <span>Tax:</span>
                  <span>${(order.taxPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full sm:w-48 text-foreground font-bold text-[14px] pt-2 border-t border-border/60 mt-1">
                  <span>Total:</span>
                  <span className="text-primary">${order.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/40 flex justify-end bg-muted/20 shrink-0">
          <button
            onClick={onClose}
            className="h-9 px-6 rounded-none bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
