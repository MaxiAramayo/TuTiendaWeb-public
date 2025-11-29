export default function Loading() {
    return (
        <div className="container mx-auto py-6">
            <div className="h-10 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
            </div>
        </div>
    );
}
