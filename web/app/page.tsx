import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Film, Ticket, Calendar, ArrowRight, Armchair, Sparkles, Star, Users, Clapperboard } from "lucide-react";
import { NowShowing } from "@/components/now-showing";

const features = [
    {
        icon: Clapperboard,
        title: "Curated Selection",
        description: "Hand-picked movies from Bangladeshi cinema and international releases, updated regularly.",
    },
    {
        icon: Armchair,
        title: "Choose Your Seat",
        description: "Interactive seat map lets you pick the perfect spot. See availability in real-time.",
    },
    {
        icon: Ticket,
        title: "Instant Booking",
        description: "Book in seconds. No queues, no hassle. Your tickets are confirmed immediately.",
    },
] as const;

const steps = [
    {
        number: "01",
        title: "Browse",
        description: "Explore what's showing and find your next watch.",
    },
    {
        number: "02",
        title: "Select",
        description: "Pick a showtime and choose your favorite seats.",
    },
    {
        number: "03",
        title: "Enjoy",
        description: "Confirm your booking and head to the cinema.",
    },
] as const;

const stats = [
    { value: "4.9", label: "User Rating", icon: Star },
    { value: "10K+", label: "Tickets Booked", icon: Ticket },
    { value: "50+", label: "Showtimes Weekly", icon: Calendar },
    { value: "5K+", label: "Happy Viewers", icon: Users },
] as const;

function FeatureCard({ icon: Icon, title, description }: typeof features[number]) {
    return (
        <div className="group relative glass rounded-2xl p-6 md:p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
    );
}

function StepCard({ number, title, description, isLast }: typeof steps[number] & { isLast: boolean }) {
    return (
        <div className="relative flex flex-col items-center text-center">
            <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <span className="text-xl font-bold text-primary">{number}</span>
                </div>
                {!isLast ? (
                    <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-primary/40 to-transparent" style={{ width: 'calc(100% + 4rem)' }} />
                ) : null}
            </div>
            <h3 className="text-lg font-semibold mb-1.5">{title}</h3>
            <p className="text-muted-foreground text-sm max-w-[200px]">{description}</p>
        </div>
    );
}

function StatCard({ value, label, icon: Icon }: typeof stats[number]) {
    return (
        <div className="flex flex-col items-center text-center p-4">
            <Icon className="h-5 w-5 text-primary mb-2" />
            <span className="text-2xl md:text-3xl font-bold gradient-text">{value}</span>
            <span className="text-sm text-muted-foreground mt-1">{label}</span>
        </div>
    );
}

export default function Home() {
    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px] animate-pulse-glow" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/6 blur-[80px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-[40%] left-[60%] w-[200px] h-[200px] rounded-full bg-accent/10 blur-[60px] animate-float" />
                </div>

                <div className="container py-24 lg:py-10">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-muted-foreground animate-fade-in-up">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span>Your cinema experience, reimagined</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] animate-fade-in-up animation-delay-200">
                            Book Your Next
                            <br />
                            <span className="gradient-text-shimmer">Movie Night</span>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
                            Discover what&apos;s showing, pick the perfect seats, and get your
                            tickets instantly. The simplest way to enjoy cinema in Bangladesh.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-600">
                            <Button asChild size="lg" className="text-base px-8 h-12 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                                <Link href="/movies">
                                    Browse Movies
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="text-base px-8 h-12">
                                <Link href="/auth/register">Create Account</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats bar */}
            <section className="border-y border-border/50 bg-card/30">
                <div className="container">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/50 py-6 md:py-8">
                        {stats.map((stat) => (
                            <StatCard key={stat.label} {...stat} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Now Showing */}
            <section className="py-20 lg:py-28">
                <div className="container">
                    <div className="text-center mb-12">
                        <span className="text-sm font-medium text-primary uppercase tracking-wider">In Cinemas</span>
                        <h2 className="text-3xl md:text-4xl font-bold mt-2">Now Showing</h2>
                        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                            Grab your tickets for the latest movies before they sell out.
                        </p>
                    </div>
                    <NowShowing />
                </div>
            </section>

            {/* Features */}
            <section className="py-20 lg:py-28 relative">
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
                <div className="container">
                    <div className="text-center mb-14">
                        <span className="text-sm font-medium text-primary uppercase tracking-wider">Why Cholochitro</span>
                        <h2 className="text-3xl md:text-4xl font-bold mt-2">A Better Way to Book</h2>
                        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                            Everything you need for a seamless cinema experience, all in one place.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {features.map((feature) => (
                            <FeatureCard key={feature.title} {...feature} />
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 lg:py-28">
                <div className="container">
                    <div className="text-center mb-14">
                        <span className="text-sm font-medium text-primary uppercase tracking-wider">Simple Process</span>
                        <h2 className="text-3xl md:text-4xl font-bold mt-2">Three Steps to Your Seat</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12 md:gap-8 max-w-3xl mx-auto">
                        {steps.map((step, i) => (
                            <StepCard key={step.number} {...step} isLast={i === steps.length - 1} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 lg:py-28">
                <div className="container">
                    <div className="relative overflow-hidden rounded-3xl glass px-8 py-16 md:px-16 md:py-20 text-center">
                        <div className="absolute inset-0 -z-10">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/10 blur-[100px]" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                            Ready for Your
                            <br />
                            <span className="gradient-text">Next Movie Night?</span>
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
                            Join Cholochitro and never miss a screening again.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg" className="text-base px-8 h-12 shadow-lg shadow-primary/20">
                                <Link href="/movies">
                                    Start Booking
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="text-base px-8 h-12">
                                <Link href="/auth/register">Sign Up Free</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/50 pt-16 pb-8">
                <div className="container">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
                                <Film className="h-5 w-5 text-primary" />
                                <span>Cholochitro</span>
                            </Link>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                The simplest way to book movie tickets online in Bangladesh.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-4">Browse</h4>
                            <ul className="space-y-2.5">
                                <li><Link href="/movies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">All Movies</Link></li>
                                <li><Link href="/movies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Now Showing</Link></li>
                                <li><Link href="/movies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Coming Soon</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-4">Account</h4>
                            <ul className="space-y-2.5">
                                <li><Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link></li>
                                <li><Link href="/auth/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Create Account</Link></li>
                                <li><Link href="/bookings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Bookings</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-4">Project</h4>
                            <ul className="space-y-2.5">
                                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">GitHub</a></li>
                                <li><span className="text-sm text-muted-foreground">Built with Next.js</span></li>
                                <li><span className="text-sm text-muted-foreground">Node.js + PostgreSQL</span></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-muted-foreground">
                            &copy; {new Date().getFullYear()} Cholochitro. A full-stack cinema booking platform.
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Crafted with</span>
                            <span className="text-primary">&hearts;</span>
                            <span>in Bangladesh</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
