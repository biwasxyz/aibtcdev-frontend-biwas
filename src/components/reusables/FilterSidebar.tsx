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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder={
                filter.placeholder || `Search ${filter.label.toLowerCase()}...`
              }
              value={value as string}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              className="pl-9 bg-[#1A1A1A] border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
            />
          </div>
        );

      case "select":
        return (
          <Select
            value={value as string}
            onValueChange={(newValue) => onFilterChange(filter.key, newValue)}
          >
            <SelectTrigger className="bg-[#1A1A1A] border-gray-600 text-white">
              <SelectValue
                placeholder={
                  filter.placeholder || `Select ${filter.label.toLowerCase()}`
                }
              />
            </SelectTrigger>
            <SelectContent className="bg-[#2A2A2A] border-gray-600">
              {filter.options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-white hover:bg-[#1A1A1A]"
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
      <Card className="sticky top-4 bg-[#2A2A2A] border-gray-600">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>

          <div className="space-y-6">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  {filter.label}
                </label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>

          {/* Summary Stats Card */}
          {summaryStats && (
            <div className="mt-8 p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
              <h4 className="font-semibold mb-3 text-white">Summary</h4>
              <div className="space-y-2">
                {Object.entries(summaryStats).map(([key, stat]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-300">{stat.label}:</span>
                    <span className="font-bold text-white">
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
