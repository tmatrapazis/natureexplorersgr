import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

      const start = new Date(trip.start_date);
      if (isNaN(start.getTime())) return false;

      // Only show trips on their start_date
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
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-stone-900">
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
          <div key={day} className="text-center text-sm font-semibold text-stone-500 py-2">
            {day}
          </div>
        ))}

        {allDays.map((day, index) => {
          const dayTrips = day ? getTripsForDay(day) : [];
          const hasTrips = dayTrips.length > 0;

          return (
            <button
              key={index}
              onClick={() => day && onDayClick(day, dayTrips)}
              disabled={!day}
              className={`
                aspect-square p-2 rounded-xl transition-all duration-200 relative
                ${!day ? "invisible" : ""}
                ${isToday(day || new Date()) ? "bg-emerald-100 border-2 border-emerald-500" : "hover:bg-stone-100"}
                ${!isSameMonth(day || new Date(), currentDate) ? "opacity-40" : ""}
                ${hasTrips ? "cursor-pointer" : "cursor-default"}
              `}
            >
              {day && (
                <>
                  <div className={`text-sm font-medium ${isToday(day) ? "text-emerald-700" : "text-stone-700"}`}>
                    {format(day, "d")}
                  </div>
                  {hasTrips && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayTrips.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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