import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Athens timezone
const ATHENS_TIMEZONE = 'Europe/Athens';

export default function CalendarGrid({ currentDate, onDateChange, trips, onDayClick, selectedDate }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = monthStart.getDay();
  const daysFromPrevMonth = Array(startDayOfWeek).fill(null);

  const allDays = [...daysFromPrevMonth, ...daysInMonth];

  const getTripsForDay = (day) => {
    if (!day) return [];
    return trips.filter(trip => {
      if (!trip.start_date) return false;

      const start = toZonedTime(new Date(trip.start_date), ATHENS_TIMEZONE);
      if (isNaN(start.getTime())) return false;

      // Only show trips on their start_date (Athens timezone)
      return isSameDay(day, start);
    });
  };

  const previousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            className="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            className="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {allDays.map((day, index) => {
          const dayTrips = day ? getTripsForDay(day) : [];
          const hasTrips = dayTrips.length > 0;
          const isSelected = day && selectedDate && isSameDay(day, selectedDate);

          return (
            <button
              key={index}
              onClick={() => day && onDayClick(day, dayTrips)}
              disabled={!day}
              className={`
                aspect-square p-2 rounded-xl transition-all duration-200 relative
                ${!day ? "invisible" : ""}
                ${isSelected ? "bg-orange-200 border-2 border-orange-500" : ""}
                ${isToday(day || new Date()) && !isSelected ? "bg-emerald-100 border-2 border-emerald-500" : ""}
                ${!isSelected && !isToday(day || new Date()) ? "hover:bg-muted" : ""}
                ${!isSameMonth(day || new Date(), currentDate) ? "opacity-40" : ""}
                ${hasTrips ? "cursor-pointer" : "cursor-default"}
              `}
            >
              {day && (
                <>
                  <div className={`text-sm font-medium ${isSelected ? "text-orange-700" : isToday(day) ? "text-emerald-700" : "text-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  {hasTrips && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayTrips.slice(0, 3).map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-orange-500" : "bg-emerald-500"}`} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}