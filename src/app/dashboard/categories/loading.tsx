export default function Loading() {
    return (
        <div className="container mx-auto py-6 max-w-3xl">
            <div className="h-10 w-56 bg-gray-200 rounded mb-6 animate-pulse" />
            <div className="h-16 bg-gray-100 rounded mb-6 animate-pulse" />
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
                ))}
            </div>
        </div>
    );
}
