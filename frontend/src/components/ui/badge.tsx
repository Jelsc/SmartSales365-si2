import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  X, 
  AlertTriangle, 
  Check, 
  Info, 
  Diamond,
  Circle
} from "lucide-react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        error: "border-red-500 bg-red-50 text-red-700",
        warning: "border-orange-500 bg-orange-50 text-orange-700", 
        success: "border-green-500 bg-green-50 text-green-700",
        information: "border-blue-500 bg-blue-50 text-blue-700",
        neutral: "border-gray-400 bg-gray-50 text-gray-700",
        brand: "border-purple-500 bg-purple-50 text-purple-700",
        // Mantener variantes existentes para compatibilidad
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
      size: {
        sm: "px-2 py-0.5 text-xs gap-1",
        md: "px-2.5 py-0.5 text-xs gap-1.5",
      },
      badgeType: {
        icon: "pl-1",
        "no-icon": "",
        dot: "pl-1",
      }
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
      badgeType: "no-icon",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode
}

const iconMap = {
  error: X,
  warning: AlertTriangle,
  success: Check,
  information: Info,
  neutral: Diamond,
  brand: Diamond,
}

function Badge({ className, variant = "neutral", size = "md", badgeType = "no-icon", children, ...props }: BadgeProps) {
  const IconComponent = variant && iconMap[variant as keyof typeof iconMap]
  
  return (
    <div className={cn(badgeVariants({ variant, size, badgeType }), className)} {...props}>
      {badgeType === "icon" && IconComponent && (
        <IconComponent className={cn(
          "h-3 w-3 flex-shrink-0",
          variant === "error" && "text-red-600",
          variant === "warning" && "text-orange-600", 
          variant === "success" && "text-green-600",
          variant === "information" && "text-blue-600",
          variant === "neutral" && "text-gray-600",
          variant === "brand" && "text-purple-600"
        )} />
      )}
      {badgeType === "dot" && (
        <Circle className={cn(
          "h-2 w-2 fill-current flex-shrink-0",
          variant === "error" && "text-red-600",
          variant === "warning" && "text-orange-600", 
          variant === "success" && "text-green-600",
          variant === "information" && "text-blue-600",
          variant === "neutral" && "text-gray-600",
          variant === "brand" && "text-purple-600"
        )} />
      )}
      <span>{children}</span>
    </div>
  )
}

export { Badge, badgeVariants }
