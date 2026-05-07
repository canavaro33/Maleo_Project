import React from "react";
import { AlertCircle, Bell, Info } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NotificationItemProps {
  id: number;
  title: string;
  content: string;
  priority: "normal" | "important" | "urgent";
  createdAt: string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  title,
  content,
  priority,
  createdAt,
}) => {
  const getPriorityStyles = () => {
    switch (priority) {
      case "urgent":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
          badge: "bg-red-100 text-red-700 border-red-200",
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
        };
      case "important":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          badge: "bg-amber-100 text-amber-700 border-amber-200",
          icon: <Bell className="w-4 h-4 text-amber-500" />,
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          badge: "bg-blue-100 text-blue-700 border-blue-200",
          icon: <Info className="w-4 h-4 text-blue-500" />,
        };
    }
  };

  const styles = getPriorityStyles();

  return (
    <div className="group relative p-4 transition-all hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-default">
      <div className="flex gap-3">
        <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", styles.bg)}>
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-slate-900 truncate">
              {title}
            </h4>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium border uppercase tracking-wider", styles.badge)}>
              {priority}
            </span>
          </div>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
            {content}
          </p>
          <div className="flex items-center text-[10px] text-slate-400 font-medium">
            <span>
              {new Date(createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
