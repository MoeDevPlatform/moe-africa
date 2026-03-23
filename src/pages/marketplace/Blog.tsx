import { useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowLeft } from "lucide-react";

const posts = [
  {
    id: 1,
    title: "The Art of Traditional Kente Weaving",
    excerpt: "Discover the rich history and intricate process behind Ghana's iconic Kente cloth, worn by royalty for centuries.",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=600",
    category: "Culture",
    author: "Amara Okonkwo",
    date: "Jan 2, 2026",
  },
  {
    id: 2,
    title: "How to Care for Handcrafted Leather Goods",
    excerpt: "Essential tips for maintaining and preserving your handmade leather items to ensure they last a lifetime.",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
    category: "Tips",
    author: "David Mensah",
    date: "Dec 28, 2025",
  },
  {
    id: 3,
    title: "Meet the Artisan: Ade Tailors of Lagos",
    excerpt: "An exclusive interview with one of Nigeria's most sought-after bespoke tailors and their journey in fashion.",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600",
    category: "Artisan Spotlight",
    author: "Fatima Ibrahim",
    date: "Dec 20, 2025",
  },
  {
    id: 4,
    title: "Trending African Fashion Styles for 2026",
    excerpt: "Explore the latest trends in African fashion, from modern Afrocentric designs to traditional reinventions.",
    image: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=600",
    category: "Fashion",
    author: "Ngozi Eze",
    date: "Dec 15, 2025",
  },
];

const Blog = () => {
  const navigate = useNavigate();

  const handlePostClick = (postId: number) => {
    navigate(`/blog/${postId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-center">
            MOE Blog
          </h1>
          
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Stories, tips, and inspiration from Africa's vibrant artisan community.
          </p>

          {/* Featured Post */}
          <Card
            className="mb-12 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handlePostClick(posts[0].id)}
          >
            <div className="grid md:grid-cols-2">
              <div className="h-64 md:h-auto">
                <img 
                  src={posts[0].image} 
                  alt={posts[0].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                <Badge className="w-fit mb-4">{posts[0].category}</Badge>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                  {posts[0].title}
                </h2>
                <p className="text-muted-foreground mb-6">{posts[0].excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {posts[0].author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {posts[0].date}
                  </span>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Blog Grid — all posts are clickable */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.slice(1).map((post) => (
              <Card
                key={post.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handlePostClick(post.id)}
              >
                <div className="h-48">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="mb-3">{post.category}</Badge>
                  <h3 className="font-display font-bold mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default Blog;
