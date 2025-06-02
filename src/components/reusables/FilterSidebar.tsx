"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";

// Generic filter configuration
export interface FilterConfig {
  key: string;
  label: string;
  type: "search" | "select" | "multiselect";
  options?: Array<{ value: string; label: string; badge?: boolean }>;
  placeholder?: string;
}

// Filter state interface
export interface FilterState {
  [key: string]: string | string[];
}

// Summary stats interface
export interface SummaryStats {
  [key: string]: {
    label: string;
    value: number | string;
    format?: (value: number | string) => string;
  };
}

interface FilterSidebarProps {
  title: string;
  filters: FilterConfig[];
  filterState: FilterState;
  onFilterChange: (key: string, value: string | string[]) => void;
  summaryStats?: SummaryStats;
  className?: string;
}

export function FilterSidebar({
  title,
  filters,
  filterState,
  onFilterChange,
  summaryStats,
  className = "",
}: FilterSidebarProps) {
  const renderFilterInput = (filter: FilterConfig) => {
    const value = filterState[filter.key] || "";

    switch (filter.type) {
      case "search":
        return (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder={
                filter.placeholder || `Search ${filter.label.toLowerCase()}...`
              }
              value={value as string}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              className="pl-10 bg-background border-border text-foreground placeholder-muted-foreground focus:border-primary transition-colors duration-150"
            />
          </div>
        );

      case "select":
        return (
          <Select
            value={value as string}
            onValueChange={(newValue) => onFilterChange(filter.key, newValue)}
          >
            <SelectTrigger className="bg-background border-border text-foreground hover:bg-muted/50 transition-colors duration-150">
              <SelectValue
                placeholder={
                  filter.placeholder || `Select ${filter.label.toLowerCase()}`
                }
              />
            </SelectTrigger>
            <SelectContent className="bg-card border-border shadow-lg">
              {filter.options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-foreground hover:bg-muted/50 transition-colors duration-150"
                >
                  {option.badge ? (
                    <Badge variant="secondary" className="text-xs">
                      {option.label}
                    </Badge>
                  ) : (
                    option.label
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`w-80 flex-shrink-0 ${className}`}>
      <Card className="sticky top-6 bg-card border-border shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          </div>

          <div className="space-y-8">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  {filter.label}
                </label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>

          {/* Summary Stats Card */}
          {summaryStats && (
            <div className="mt-10 p-6 bg-background rounded-xl border border-border shadow-sm">
              <h4 className="font-semibold mb-4 text-foreground">Summary</h4>
              <div className="space-y-3">
                {Object.entries(summaryStats).map(([key, stat]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{stat.label}:</span>
                    <span className="font-bold text-foreground">
                      {stat.format ? stat.format(stat.value) : stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
