import React, { useEffect, useState } from "react";

export const LagDetector = React.memo(function LagDetector() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((v) => (v + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return <div>Lag detector: {value}</div>;
});
