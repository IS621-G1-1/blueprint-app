import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Timetable() {
  return (
    <Card className="border-blue-400/35 bg-card/90">
      <CardHeader>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md border border-accent/40 bg-accent/10 text-accent">
          <CalendarDays className="h-5 w-5" />
        </div>
        <CardTitle>Timetable</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Timetable view coming soon.</p>
      </CardContent>
    </Card>
  );
}
