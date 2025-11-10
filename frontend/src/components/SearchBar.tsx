import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export function SearchBar({ className = "", placeholder = "Buscar productos, marcas y más..." }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Aquí iría la lógica de búsqueda/navegación
      console.log("Buscando:", searchQuery);
      // window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <form onSubmit={handleSearch} className={`flex items-center ${className}`}>
      <div className="relative flex-1 flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-12 text-gray-700 bg-white border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-0 h-full px-4 bg-white hover:bg-gray-50 text-gray-500 hover:text-blue-600 border-l border-gray-300 rounded-l-none rounded-r-md transition-colors"
          variant="ghost"
        >
          <Search className="w-5 h-5" />
        </Button>
      </div>
    </form>
  );
}
