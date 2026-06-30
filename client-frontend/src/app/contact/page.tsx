import type { Metadata } from 'next';
import { Mail, MapPin, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with our team for any inquiries or support.',
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl min-h-[60vh]">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">Contact Us</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">We'd love to hear from you. Please fill out the form below or reach out using our contact details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Contact Info */}
        <div className="space-y-8 bg-card p-8 rounded-2xl border border-border/60">
          <div>
            <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <MapPin className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Our Location</h3>
                  <p className="text-muted-foreground mt-1">123 E-Commerce St.<br/>Phnom Penh, Cambodia</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Mail className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Email Us</h3>
                  <p className="text-muted-foreground mt-1">support@ecommerce.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Phone className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Call Us</h3>
                  <p className="text-muted-foreground mt-1">+855 12 345 678</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-card p-8 rounded-2xl border border-border/60 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                <input type="text" id="firstName" className="w-full h-10 px-3 rounded-md border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="John" />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                <input type="text" id="lastName" className="w-full h-10 px-3 rounded-md border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email Address</label>
              <input type="email" id="email" className="w-full h-10 px-3 rounded-md border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <textarea id="message" rows={5} className="w-full py-3 px-3 rounded-md border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" placeholder="How can we help you?"></textarea>
            </div>
            <button type="button" className="w-full h-10 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors mt-2">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
