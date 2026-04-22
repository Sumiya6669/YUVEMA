import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-0.5 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-[#DEC4A0] bg-[#F7EBDD] text-[#604A35] shadow-[0_14px_34px_rgba(156,123,102,0.12)] hover:border-[#CFA671] hover:bg-[#F2E2CE] hover:shadow-[0_18px_40px_rgba(156,123,102,0.16)]",
        destructive:
          "border border-red-200 bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
        outline:
          "border border-[#E5D8CA] bg-white/92 text-[#66513D] shadow-soft hover:border-[#D1B18A] hover:bg-[#FFFCF8] hover:text-[#5D4632]",
        secondary:
          "border border-[#F0DED8] bg-[#FBF0EE] text-[#6B5645] shadow-soft hover:bg-[#F9E8E3]",
        ghost: "text-[#7A6552] hover:bg-white/75 hover:text-[#584331]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7 text-[12px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
