import React from "react";
import { GripVertical } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({
  className,
  direction = "horizontal",
  style,
  ...props
}: React.ComponentProps<typeof Group>) => (
  <Group
    direction={direction}
    style={{
      display: "flex",
      flexDirection: direction === "vertical" ? "column" : "row",
      height: "100%",
      width: "100%",
      ...style,
    }}
    className={cn(
      "flex h-full w-full",
      direction === "vertical" ? "flex-col" : "flex-row",
      className
    )}
    {...props}
  />
);

const ResizablePanel = Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
}) => (
  <Separator
    className={cn(
      "relative flex items-center justify-center bg-[var(--iv-border)] transition-colors focus-visible:outline-none",
      "data-[panel-group-direction=horizontal]:w-1 data-[panel-group-direction=horizontal]:cursor-col-resize",
      "data-[panel-group-direction=vertical]:h-1 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:cursor-row-resize",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-[var(--iv-surface-elevated)] border-[var(--iv-border)] [&[data-panel-group-direction=vertical]>svg]:rotate-90">
        <GripVertical className="h-2.5 w-2.5 text-white/40" />
      </div>
    )}
  </Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
