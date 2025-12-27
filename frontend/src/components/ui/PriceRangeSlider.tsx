import { useState, useEffect, useRef } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  formatPrice?: (price: number) => string;
}

const PriceRangeSlider = ({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price),
}: PriceRangeSliderProps) => {
  const [minVal, setMinVal] = useState(
    valueMin && valueMin >= min ? valueMin : min,
  );
  const [maxVal, setMaxVal] = useState(
    valueMax && valueMax <= max ? valueMax : max,
  );
  const minValRef = useRef<HTMLInputElement>(null);
  const maxValRef = useRef<HTMLInputElement>(null);
  const range = useRef<HTMLDivElement>(null);

  // Convert to percentage
  const getPercent = (value: number) => Math.round(((value - min) / (max - min)) * 100);

  // Set width of the range to decrease from the left side
  useEffect(() => {
    if (maxValRef.current) {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(+maxValRef.current.value);

      if (range.current) {
        range.current.style.left = `${minPercent}%`;
        range.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [minVal, getPercent]);

  // Set width of the range to decrease from the right side
  useEffect(() => {
    if (minValRef.current) {
      const minPercent = getPercent(+minValRef.current.value);
      const maxPercent = getPercent(maxVal);

      if (range.current) {
        range.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [maxVal, getPercent]);

  // Sync with external values
  useEffect(() => {
    if (valueMin && valueMin >= min) {
      setMinVal(valueMin);
    } else {
      setMinVal(min);
    }
    if (valueMax && valueMax <= max) {
      setMaxVal(valueMax);
    } else {
      setMaxVal(max);
    }
  }, [valueMin, valueMax, min, max]);

  return (
    <div className="price-range-slider">
      <div className="relative h-2 w-full rounded-lg bg-slate-200">
        <div
          className="absolute h-2 rounded-lg bg-accent"
          ref={range}
        />
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={minVal}
          ref={minValRef}
          onChange={(event) => {
            const value = Math.min(Number(event.target.value), maxVal - 10000);
            setMinVal(value);
            onChange(value, maxVal);
          }}
          className="absolute h-2 w-full appearance-none bg-transparent pointer-events-none z-10"
          style={{ zIndex: minVal > max - 100 ? 5 : 10 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxVal}
          ref={maxValRef}
          onChange={(event) => {
            const value = Math.max(Number(event.target.value), minVal + 10000);
            setMaxVal(value);
            onChange(minVal, value);
          }}
          className="absolute h-2 w-full appearance-none bg-transparent pointer-events-none z-10"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <span className="text-slate-500">Từ:</span>{" "}
          <span className="font-semibold text-slate-900">
            {formatPrice(minVal)} đ
          </span>
        </div>
        <div className="text-slate-400">-</div>
        <div className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <span className="text-slate-500">Đến:</span>{" "}
          <span className="font-semibold text-slate-900">
            {formatPrice(maxVal)} đ
          </span>
        </div>
      </div>

      <style>{`
        .price-range-slider input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          pointer-events: all;
          width: 20px;
          height: 20px;
          cursor: pointer;
          background: #f97316;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        .price-range-slider input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.4);
        }

        .price-range-slider input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(1.2);
        }

        .price-range-slider input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          cursor: pointer;
          background: #f97316;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        .price-range-slider input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.4);
        }

        .price-range-slider input[type="range"]::-moz-range-thumb:active {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

export default PriceRangeSlider;

