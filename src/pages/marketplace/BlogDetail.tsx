import { useParams, useNavigate, Navigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowLeft } from "lucide-react";

const posts = [
  {
    id: 1,
    title: "The Art of Traditional Kente Weaving",
    excerpt: "Discover the rich history and intricate process behind Ghana's iconic Kente cloth, worn by royalty for centuries.",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=1200",
    category: "Culture",
    author: "Amara Okonkwo",
    date: "Jan 2, 2026",
    content: `Kente cloth is one of Africa's most celebrated textile traditions, originating from the Ashanti Kingdom in present-day Ghana. The word "Kente" is derived from the word "kenten," meaning basket, referencing the cloth's intricate interlocking patterns that resemble a woven basket.

Each Kente pattern has a unique name and symbolic meaning, often reflecting proverbs, historical events, or social values. Traditionally, Kente was reserved for royalty and worn only during sacred ceremonies and important occasions.

Today, Kente has become a global symbol of African identity and pride. Modern artisans continue to weave Kente using traditional looms, preserving centuries-old techniques while incorporating contemporary colour palettes and designs.

The weaving process is labour-intensive and can take weeks or even months to complete a single cloth. Skilled weavers use a narrow-strip loom, producing strips about four inches wide that are later sewn together to create the full cloth.

At MOE, we celebrate artisans who keep this tradition alive, connecting them with customers who appreciate the artistry and cultural significance behind every thread.`,
  },
  {
    id: 2,
    title: "How to Care for Handcrafted Leather Goods",
    excerpt: "Essential tips for maintaining and preserving your handmade leather items to ensure they last a lifetime.",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200",
    category: "Tips",
    author: "David Mensah",
    date: "Dec 28, 2025",
    content: `Handcrafted leather goods are an investment that, with proper care, can last for decades. Here are essential tips to keep your leather items looking their best.

**1. Regular Cleaning**
Wipe your leather items with a soft, damp cloth regularly to remove dust and surface dirt. Avoid using harsh chemicals or household cleaners, as these can strip the leather's natural oils.

**2. Conditioning**
Leather, like skin, needs moisture to stay supple. Apply a quality leather conditioner every 3-6 months, or more frequently if the leather is exposed to dry conditions.

**3. Storage**
Store leather goods in a cool, dry place away from direct sunlight. Use dust bags or pillowcases to protect them from scratches and dust. Stuff bags with tissue paper to help them maintain their shape.

**4. Water Protection**
While many leathers have some natural water resistance, it's wise to apply a waterproofing spray, especially for items exposed to the elements. If your leather gets wet, let it dry naturally — never use a hairdryer or heater.

**5. Handling Stains**
For light stains, a mixture of water and mild soap can work wonders. For oil-based stains, sprinkle cornstarch on the area and let it sit overnight to absorb the oil.

Your handcrafted leather piece was made with care and skill — treat it well, and it will age beautifully.`,
  },
  {
    id: 3,
    title: "Meet the Artisan: Ade Tailors of Lagos",
    excerpt: "An exclusive interview with one of Nigeria's most sought-after bespoke tailors and their journey in fashion.",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200",
    category: "Artisan Spotlight",
    author: "Fatima Ibrahim",
    date: "Dec 20, 2025",
    content: `Ade Olu started his tailoring journey over 15 years ago in a small workshop in Ikeja, Lagos. What began as an apprenticeship under his uncle has grown into one of the most respected bespoke tailoring studios in Nigeria.

"I fell in love with fabric at a young age," Ade recalls. "Watching my uncle transform a simple piece of cloth into something beautiful — that was magic to me."

Today, Ade Tailors specialises in custom-made Ankara suits, traditional Agbada sets, and modern African-inspired fashion. Every piece is crafted from premium fabrics sourced both locally and internationally.

"What sets us apart is our attention to detail," Ade explains. "We don't just make clothes; we create pieces that tell a story. Every stitch, every pattern choice has meaning."

His clientele ranges from young professionals seeking modern African fashion to dignitaries ordering traditional regalia for state occasions. Despite the growth, Ade remains committed to the personal touch.

"When a customer walks in, I want to understand not just their measurements, but their personality, the occasion, the statement they want to make. That's what bespoke really means."

Through MOE, Ade hopes to reach customers across Nigeria and beyond, sharing the artistry of Nigerian tailoring with the world.`,
  },
  {
    id: 4,
    title: "Trending African Fashion Styles for 2026",
    excerpt: "Explore the latest trends in African fashion, from modern Afrocentric designs to traditional reinventions.",
    image: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=1200",
    category: "Fashion",
    author: "Ngozi Eze",
    date: "Dec 15, 2025",
    content: `2026 is shaping up to be a landmark year for African fashion. Here are the trends dominating the scene:

**1. Neo-Traditional Fusion**
Designers are blending traditional African textiles with contemporary Western silhouettes. Think Ankara blazers paired with tailored trousers, or Kente-accented minimalist dresses.

**2. Sustainable & Ethical Fashion**
Consumers are increasingly demanding transparency in sourcing and production. Artisans who use locally sourced materials and employ fair-trade practices are seeing a surge in demand.

**3. Bold Colour Blocking**
Move over muted tones — 2026 is all about vibrant, unapologetic colour. Expect to see bold combinations of royal blue with mustard, emerald green with coral, and deep purple with gold.

**4. Gender-Fluid Designs**
African fashion is embracing fluidity with unisex kaftans, oversized shirts, and relaxed tailoring that transcends traditional gender norms.

**5. Handcrafted Accessories**
Beaded jewellery, hand-woven bags, and artisan leather goods are becoming statement pieces. The emphasis is on craftsmanship and uniqueness over mass production.

**6. Digital Customisation**
Platforms like MOE are making it easier than ever for customers to co-create their fashion, choosing fabrics, fits, and finishes through intuitive digital interfaces.

The future of African fashion is bright, bold, and deeply rooted in heritage — while looking firmly towards the future.`,
  },
];

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const post = posts.find((p) => p.id === Number(id));

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <Badge className="mb-4">{post.category}</Badge>

          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {post.date}
            </span>
          </div>

          <div className="rounded-xl overflow-hidden mb-8">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>

          <article className="prose prose-lg max-w-none text-foreground leading-relaxed space-y-4">
            {post.content.split("\n\n").map((paragraph, i) => {
              if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                return (
                  <h3 key={i} className="text-lg font-display font-bold mt-6 mb-2">
                    {paragraph.replace(/\*\*/g, "")}
                  </h3>
                );
              }
              if (paragraph.startsWith("**")) {
                const parts = paragraph.split("**");
                return (
                  <p key={i}>
                    <strong>{parts[1]}</strong>
                    {parts[2]}
                  </p>
                );
              }
              return <p key={i}>{paragraph}</p>;
            })}
          </article>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default BlogDetail;
