"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { timezoneList } from "@/lib/validation";

export function TimezoneSelect({
  defaultValue,
  preferDevice = false,
  id = "timezone",
}: {
  defaultValue: string;
  preferDevice?: boolean;
  id?: string;
}) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const [applied, setApplied] = useState(false);

  const zones = useMemo(() => {
    const values = new Set(timezoneList);
    if (defaultValue) values.add(defaultValue);
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [defaultValue]);

  useEffect(() => {
    if (!preferDevice || applied || !selectRef.current) return;

    const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (deviceZone && zones.includes(deviceZone)) {
      selectRef.current.value = deviceZone;
    }

    setApplied(true);
  }, [applied, preferDevice, zones]);

  return (
    <select
      ref={selectRef}
      id={id}
      name="timezone"
      defaultValue={defaultValue}
      className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
    >
      {zones.map((zone) => (
        <option key={zone} value={zone}>
          {zone.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}
