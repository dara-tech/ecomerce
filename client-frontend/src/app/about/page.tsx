import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">About Us</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          We believe in the power of minimalist design and uncompromising quality. 
          Our mission is to bring you premium tech, apparel, and home essentials that 
          elevate your everyday life without the unnecessary clutter.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
          <Image 
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800"
            alt="Our Workspace"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Craftsmanship First</h2>
          <p className="text-muted-foreground leading-relaxed">
            Every product in our collection is carefully selected or designed in-house 
            to meet strict standards of durability, aesthetics, and functionality. We don't 
            just sell items; we curate an ecosystem of premium goods.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            From the tactile feel of our mechanical keyboards to the precise stitching 
            on our apparel, we obsess over the details so you don't have to.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center border-t border-b py-16 mb-24">
        <div className="space-y-3">
          <h3 className="text-2xl font-bold">10k+</h3>
          <p className="text-muted-foreground">Happy Customers</p>
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-bold">50+</h3>
          <p className="text-muted-foreground">Premium Brands</p>
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-bold">24/7</h3>
          <p className="text-muted-foreground">Customer Support</p>
        </div>
      </div>
    </div>
  );
}
