import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="relative flex w-full flex-col gap-3 sm:flex-row">
      <div className="relative flex-1 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-400 transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input pl-11 shadow-inner bg-black/40"
          placeholder="Search by symbol or company name..."
        />
      </div>
      <button type="submit" className="btn-primary sm:w-36 flex items-center justify-center gap-2">
        <Search size={16} />
        <span>Search</span>
      </button>
    </form>
  );
}
