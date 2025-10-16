import { useEffect, useState } from "react";

interface StatsCounterProps {
  end: number;
  duration?: number;
  label: string;
}

export const StatsCounter = ({ end, duration = 2000, label }: StatsCounterProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      setCount(Math.floor(progress * (end - startValue) + startValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
        {count.toLocaleString()}+
      </div>
      <div className="text-sm sm:text-base text-muted-foreground">{label}</div>
    </div>
  );
};
