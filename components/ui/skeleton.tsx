import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skeletonVariants = cva("rounded-md bg-muted/50 animate-pulse", {
  variants: {
    size: {
      default: "h-4 w-full",
      sm: "h-3 w-16",
      lg: "h-8 w-full",
      xl: "h-12 w-full",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, size, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ size, className }))}
      {...props}
    />
  );
}

export { Skeleton, skeletonVariants };