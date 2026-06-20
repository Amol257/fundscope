import { cn } from "@/lib/utils";

interface GradeTagProps {
  grade: string;
  className?: string;
  showMeaning?: boolean;
}

export function GradeTag({ grade, className, showMeaning = true }: GradeTagProps) {
  // Extract just the letter grade if it includes meaning like "S - Excellent"
  const letter = grade ? grade.split(' ')[0] : 'N/A';
  
  let label = letter;
  if (showMeaning && grade && grade.includes(' - ')) {
    label = grade;
  } else if (showMeaning) {
    switch (letter) {
      case 'S': label = 'S: Excellent'; break;
      case 'A': label = 'A: Good'; break;
      case 'B': label = 'B: Average'; break;
      case 'C': label = 'C: Below Average'; break;
      case 'D': label = 'D: Avoid'; break;
    }
  }

  const getGradeStyle = (l: string) => {
    switch (l) {
      case 'S': return 'bg-amber-400/10 text-amber-400 border border-amber-400/20';
      case 'A': return 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20';
      case 'B': return 'bg-blue-400/10 text-blue-400 border border-blue-400/20';
      case 'C': return 'bg-purple-400/10 text-purple-400 border border-purple-400/20';
      case 'D': return 'bg-red-400/10 text-red-400 border border-red-400/20';
      default: return 'bg-gray-400/10 text-gray-400 border border-gray-400/20';
    }
  };

  return (
    <span className={cn("px-2 py-1 rounded text-xs font-bold tracking-wider", getGradeStyle(letter), className)}>
      {label}
    </span>
  );
}
