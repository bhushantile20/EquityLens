import { useEffect, useRef } from "react";

/**
 * CandlestickChart
 *
 * Props:
 *   data  — array of { date, open, high, low, close, volume }
 *   title — optional string shown in top-left
 *   height — number (px), default 420
 */
export default function CandlestickChart({ data = [], title = "", height = 420 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;

    let Plotly;

    import("plotly.js-dist-min")
      .then((mod) => {
        Plotly = mod.default;

        const dates  = data.map((d) => d.date);
        const opens  = data.map((d) => parseFloat(d.open));
        const highs  = data.map((d) => parseFloat(d.high));
        const lows   = data.map((d) => parseFloat(d.low));
        const closes = data.map((d) => parseFloat(d.close));
        const vols   = data.map((d) => parseFloat(d.volume ?? 0));

        const candlestick = {
          type: "candlestick",
          x: dates,
          open: opens,
          high: highs,
          low: lows,
          close: closes,
          name: title,
          increasing: { line: { color: "#22c55e", width: 1 }, fillcolor: "#22c55e" },
          decreasing: { line: { color: "#ef4444", width: 1 }, fillcolor: "#ef4444" },
          whiskerwidth: 0.3,
        };

        const volumeBars = {
          type: "bar",
          x: dates,
          y: vols,
          name: "Volume",
          yaxis: "y2",
          marker: {
            color: closes.map((c, i) =>
              i === 0 ? "#3b82f620" : c >= opens[i] ? "#22c55e20" : "#ef444420"
            ),
            line: { width: 0 },
          },
          hovertemplate: "%{y:,.0f}<extra>Volume</extra>",
        };

        const layout = {
          paper_bgcolor: "transparent",
          plot_bgcolor:  "transparent",
          font: { family: "'DM Mono', monospace", color: "#94a3b8", size: 11 },

          margin: { l: 60, r: 20, t: title ? 40 : 20, b: 40 },

          xaxis: {
            type: "date",
            rangeslider: { visible: false },
            gridcolor: "#1e3a5f",
            linecolor: "#1e3a5f",
            tickcolor: "#1e3a5f",
            tickfont: { color: "#64748b", size: 10 },
            showspikes: true,
            spikesnap: "cursor",
            spikecolor: "#3b82f650",
            spikethickness: 1,
            spikedash: "dot",
          },

          yaxis: {
            gridcolor: "#1e3a5f",
            linecolor: "#1e3a5f",
            tickcolor: "#1e3a5f",
            tickfont: { color: "#64748b", size: 10 },
            tickprefix: "$",
            showspikes: true,
            spikesnap: "cursor",
            spikecolor: "#3b82f650",
            spikethickness: 1,
            spikedash: "dot",
            domain: [0.22, 1],
          },

          yaxis2: {
            gridcolor: "transparent",
            linecolor: "transparent",
            tickfont: { color: "#475569", size: 9 },
            domain: [0, 0.18],
            showgrid: false,
          },

          title: title
            ? { text: title, font: { size: 13, color: "#94a3b8" }, x: 0.01 }
            : undefined,

          hovermode: "x unified",
          hoverlabel: {
            bgcolor: "#1e293b",
            bordercolor: "#1e3a5f",
            font: { family: "'DM Mono', monospace", color: "#e2e8f0", size: 11 },
          },

          legend: { visible: false },

          dragmode: "zoom",
          selectdirection: "h",
        };

        const config = {
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: [
            "toImage", "sendDataToCloud", "editInChartStudio",
            "lasso2d", "select2d", "toggleSpikelines",
          ],
          modeBarButtonsToAdd: [],
          displaylogo: false,
          scrollZoom: true,
        };

        Plotly.react(containerRef.current, [candlestick, volumeBars], layout, config);
      })
      .catch(console.error);

    // Resize observer for responsiveness
    const ro = new ResizeObserver(() => {
      if (Plotly && containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (Plotly && containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [data, title]);

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center bg-surface/40 border border-border rounded-xl text-slate-600 font-display text-sm"
        style={{ height }}
      >
        No chart data available
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%" }}
      className="rounded-xl overflow-hidden"
    />
  );
}
