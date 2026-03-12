"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { animations } from "@/lib/theme";

interface ComingSoonProps {
  title: string;
  description: string;
  phaseLabel: string;
  actions?: Array<{ label: string; hint?: string }>;
}

export function ComingSoon({
  title,
  description,
  phaseLabel,
  actions,
}: ComingSoonProps) {
  return (
    <motion.div {...animations.fadeIn} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-blue-500 flex items-center justify-center text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            This feature is part of our upcoming roadmap.
          </p>
        </div>
      </div>

      <Card className="border-dashed border-primary/20 bg-white/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base md:text-lg">In Development</CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {description}
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] md:text-xs border-amber-300 bg-amber-50 text-amber-700"
          >
            {phaseLabel} · Coming soon
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {actions && actions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Planned capabilities
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {actions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>
                      {action.label}
                      {action.hint && (
                        <span className="block text-xs text-muted-foreground/80">
                          {action.hint}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
            <p className="text-xs text-muted-foreground max-w-xs">
              You can already explore Phase 1–2 features like authentication and
              AI classification while we build the rest.
            </p>
            <Button size="sm" variant="outline" asChild>
              <a href="/dashboard">Back to dashboard</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

