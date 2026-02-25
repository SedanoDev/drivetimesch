import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Instructor } from '../../types';

interface InstructorCardProps {
  instructor: Instructor;
  isSelected: boolean;
  isAvailable: boolean;
  onSelect: () => void;
  selectedTime: string;
}

export function InstructorCard({ instructor, isSelected, isAvailable, onSelect, selectedTime }: InstructorCardProps) {
  return (
    <div 
      onClick={() => isAvailable && onSelect()}
      className={cn(
        "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 bg-white w-full",
        isAvailable ? "cursor-pointer hover:border-blue-300 hover:shadow-md hover:bg-slate-50" : "opacity-60 cursor-not-allowed bg-slate-50",
        isSelected ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600 shadow-md" : "border-slate-100"
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <img 
          src={instructor.image_url} 
          alt={instructor.name} 
          className={cn(
            "w-14 h-14 rounded-full object-cover border-2 bg-slate-200",
            isSelected ? "border-blue-200" : "border-slate-100"
          )}
        />
        <div className={cn(
          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm",
          instructor.vehicle_type === 'Manual' ? "bg-blue-500" : "bg-purple-500"
        )}>
          {instructor.vehicle_type === 'Manual' ? 'M' : 'A'}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <h4 className={cn("font-bold text-base truncate", isSelected ? "text-blue-700" : "text-slate-800")}>
          {instructor.name}
        </h4>
        
        <p className="text-xs text-slate-500 truncate">{instructor.bio}</p>
        
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={cn("w-3 h-3 fill-current", star <= Math.round(instructor.rating) ? "text-yellow-400" : "text-slate-200")} 
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-400">({instructor.reviews_count} valoraciones)</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={cn(
          "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border",
          isAvailable ? "bg-green-100 text-green-700 border-green-200" : "bg-red-50 text-red-500 border-red-100"
        )}>
          {isAvailable ? "Disponible" : "No disponible"}
        </span>
        {isAvailable && (
          <span className="text-[10px] font-medium text-slate-400">Hora {selectedTime}</span>
        )}
      </div>
    </div>
  );
}
