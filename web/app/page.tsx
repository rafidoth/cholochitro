import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Film, Ticket, Calendar } from "lucide-react";

// Hoisted static feature data - avoids re-creation on each render
const features = [
    {
        icon: Film,
        title: "Latest Movies",
        description: "Access the newest releases and upcoming blockbusters. Never miss a premiere.",
    },
    {
        icon: Ticket,
        title: "Easy Booking",
        description: "Select your seats, confirm your booking, and get your tickets instantly.",
    },
    {
        icon: Calendar,
        title: "Flexible Showtimes",
        description: "Choose from multiple showtimes that fit your schedule perfectly.",
    },
] as const;

const heroSection = (
    <section className="py-20 lg:py-32">
        <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-8">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                    Book Your Perfect
                    <span className="text-primary"> Movie Experience</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
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
                        <Link href="/auth/register">Get Started</Link>
                    </Button>
                </div>
            </div>
        </div>
    </section>
);

function FeatureCard({ icon: Icon, title, description }: typeof features[number]) {
    return (
        <div className="flex flex-col items-center text-center p-6 rounded-lg">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
    );
}

const ctaSection = (
    <section className="py-20">
        <div className="container">
            <div className="max-w-2xl mx-auto text-center space-y-6">
                <h2 className="text-3xl font-bold">Ready for Your Next Movie Night?</h2>
                <p className="text-muted-foreground">
                    Join thousands of movie lovers who trust Cholochitro for their cinema experience.
                </p>
                <Button asChild size="lg">
                    <Link href="/movies">Start Booking Now</Link>
                </Button>
            </div>
        </div>
    </section>
);

const footer = (
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
);

export default function Home() {
    return (
        <div className="flex flex-col">
            {heroSection}

            {/* Features Section */}
            <section className="py-16 bg-muted/50">
                <div className="container">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Why Choose Cholochitro?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {features.map((feature) => (
                            <FeatureCard key={feature.title} {...feature} />
                        ))}
                    </div>
                </div>
            </section>

            {ctaSection}
            {footer}
        </div>
    );
}
