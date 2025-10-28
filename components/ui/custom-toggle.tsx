"use client";

import { useEffect, useRef } from "react";

interface CustomToggleProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-label"?: string;
}

export function CustomToggle({
  id,
  checked,
  onCheckedChange,
  "aria-label": ariaLabel,
}: CustomToggleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current || !knobRef.current || !labelRef.current) return;

    const container = containerRef.current;
    const knob = knobRef.current;
    const label = labelRef.current;

    // Apply styles based on checked state
    container.style.backgroundColor = checked ? "#7C6569" : "#e8e8e8";
    knob.style.left = checked ? "1.5625em" : ".0625em";
    label.textContent = checked ? "On" : "Off";
    label.className = `text-xs w-7 text-right select-none ${
      checked ? "text-neutral-700" : "text-neutral-500"
    }`;
  }, [checked]);

  return (
    <div
      className="relative inline-flex items-center gap-2"
      role="switch"
      aria-checked={checked}
    >
      <span ref={labelRef} className="text-xs text-neutral-500 w-7 text-right select-none">
        {checked ? "On" : "Off"}
      </span>
      <div
        className="rounded-md"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          borderRadius: ".5em",
          padding: ".125em",
          backgroundImage: "linear-gradient(to bottom, #d5d5d5, #e8e8e8)",
          boxShadow: "0 1px 1px rgb(255 255 255 / .6)",
          fontSize: "1.5em",
        }}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          aria-label={ariaLabel}
          style={{
            appearance: "none",
            position: "absolute",
            zIndex: 1,
            borderRadius: ".5em",
            width: "100%",
            height: "100%",
            font: "inherit",
            opacity: 0,
            cursor: "pointer",
          }}
        />
        <div
          ref={containerRef}
          className="rounded"
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
            borderRadius: ".375em",
            width: "3em",
            height: "1.5em",
            backgroundColor: checked ? "#7C6569" : "#e8e8e8",
            boxShadow:
              "inset 0 0 .0625em .125em rgb(255 255 255 / .2), inset 0 .0625em .125em rgb(0 0 0 / .4)",
            transition: "background-color .4s linear",
          }}
        >
          <div
            ref={knobRef}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
              left: checked ? "1.5625em" : ".0625em",
              borderRadius: ".3125em",
              width: "1.375em",
              height: "1.375em",
              backgroundColor: "#e8e8e8",
              boxShadow:
                "inset 0 -.0625em .0625em .125em rgb(0 0 0 / .1), inset 0 -.125em .0625em rgb(0 0 0 / .2), inset 0 .1875em .0625em rgb(255 255 255 / .3), 0 .125em .125em rgb(0 0 0 / .5)",
              transition: "left .4s",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, min-content)",
                gap: ".125em",
                position: "absolute",
                margin: "0 auto",
              }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: "50%",
                    width: ".125em",
                    height: ".125em",
                    backgroundImage:
                      "radial-gradient(circle at 50% 0, #f5f5f5, #c4c4c4)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
