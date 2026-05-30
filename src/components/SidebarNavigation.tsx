import React from "react";
import { Compass, BarChart2, GitMerge, MessageSquare, Menu } from "lucide-react";

export type ViewState = "explore" | "hero" | "analysis" | "comparison" | "sentiment";

interface SidebarNavigationProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isEventSelected: boolean;
  hasComparison: boolean;
}

export function SidebarNavigation({
  currentView,
  onNavigate,
  isEventSelected,
  hasComparison,
}: SidebarNavigationProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const navItems = [
    { id: "explore" as ViewState, label: "Explore", icon: Compass, disabled: false },
    {
      id: "analysis" as ViewState,
      label: "Analyze",
      icon: BarChart2,
      disabled: !isEventSelected,
    },
    {
      id: "comparison" as ViewState,
      label: "Compare Views",
      icon: GitMerge,
      disabled: !hasComparison,
    },
    {
      id: "sentiment" as ViewState,
      label: "Sentiment",
      icon: MessageSquare,
      disabled: !isEventSelected,
    },
  ];

  return (
    <div
      className={`fixed left-4 top-1/2 -translate-y-1/2 z-[100] transition-all duration-500 ease-out ${
        isExpanded ? "w-64" : "w-16"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Glassmorphic Container */}
      <div className="relative flex flex-col gap-2 p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-2xl" />

        {/* Header / Menu Icon */}
        <div className="flex items-center h-10 px-1 mb-2 text-white/50">
          <Menu className="w-6 h-6 shrink-0" />
          <span
            className={`ml-4 font-semibold tracking-wider text-xs uppercase transition-opacity duration-300 ${
              isExpanded ? "opacity-100" : "opacity-0"
            }`}
          >
            Terrain Command
          </span>
        </div>

        {/* Nav Items */}
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              disabled={item.disabled}
              onClick={() => onNavigate(item.id)}
              className={`group relative flex items-center h-12 px-1 rounded-xl transition-all duration-300 ${
                item.disabled
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-white/10 cursor-pointer"
              } ${isActive ? "bg-white/15" : ""}`}
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <div className="absolute left-0 w-1 h-8 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              )}

              <div
                className={`flex items-center justify-center w-10 h-10 shrink-0 ${
                  isActive ? "text-cyan-400" : "text-white/70"
                } ${!item.disabled && !isActive ? "group-hover:text-white" : ""}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <span
                className={`ml-2 text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isExpanded
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-4"
                } ${isActive ? "text-white" : "text-white/70"}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
