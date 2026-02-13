import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Film, Ticket, Calendar, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Book Your Perfect
              <span className="text-primary"> Movie Experience</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover the latest movies, choose your favorite seats, and enjoy the show. 
              Your cinema adventure starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link href="/movies">
                  <Film className="mr-2 h-5 w-5" />
                  Browse Movies
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg">
                <Link href="/auth/register">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Cholochitro?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Film className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Latest Movies</h3>
              <p className="text-muted-foreground">
                Access the newest releases and upcoming blockbusters. Never miss a premiere.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Ticket className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
              <p className="text-muted-foreground">
                Select your seats, confirm your booking, and get your tickets instantly.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Showtimes</h3>
              <p className="text-muted-foreground">
                Choose from multiple showtimes that fit your schedule perfectly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready for Your Next Movie Night?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of movie lovers who trust Cholochitro for their cinema experience.
            </p>
            <Button asChild size="lg">
              <Link href="/movies">
                Start Booking Now
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            <span className="font-semibold">Cholochitro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            2024 Cholochitro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
