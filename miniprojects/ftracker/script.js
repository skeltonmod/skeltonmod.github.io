/* Alpine component */
function financeReport() {
  return {
    // storage key
    storageKey: "vintage_finance_alpine_v1",

    // app state
    income: [],
    expenses: [],
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() + 1,
    summaryYear: new Date().getFullYear(),
    summaryMonth: new Date().getMonth() + 1,
    years: [],
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    autoSaveEnabled: true,
    statusText: "Ready",

    init() {
      // build years range (current year +/-4)
      var now = new Date();
      var cy = now.getFullYear();
      this.years = [];
      for (var y = cy - 4; y <= cy + 1; y++) this.years.push(y);
      // load or init sample
      this.load();
      // if nothing, add a sample row
      if (!this.income.length && !this.expenses.length) this.addSample();

      // draw chart initially
      this.$nextTick(() => {
        this.drawChart();
      });

      // watch changes for autosave
      this.$watch(
        "income",
        () => {
          this.persistIfAuto();
          this.drawChart();
        },
        { deep: true }
      );
      this.$watch(
        "expenses",
        () => {
          this.persistIfAuto();
          this.drawChart();
        },
        { deep: true }
      );
      this.$watch("selectedMonth", () => {
        this.drawChart();
      });
      this.$watch("selectedYear", () => {
        this.drawChart();
      });
      this.$watch("summaryMonth", () => {
        this.drawChart();
      });
      this.$watch("summaryYear", () => {
        this.drawChart();
      });
    },

    // persist helpers
    save() {
      try {
        var payload = { income: this.income, expenses: this.expenses };
        localStorage.setItem(this.storageKey, JSON.stringify(payload));
        alert("Saved locally.");
      } catch (e) {
        alert("Save failed: " + e.message);
      }
    },
    load() {
      try {
        var s = localStorage.getItem(this.storageKey);
        if (s) {
          var p = JSON.parse(s);
          this.income = p.income || [];
          this.expenses = p.expenses || [];
        }
      } catch (e) {
        console.error("Load failed", e);
      }
    },
    resetStorage() {
      if (!confirm("Reset all saved data?")) return;
      localStorage.removeItem(this.storageKey);
      this.income = [];
      this.expenses = [];
      this.addSample();
      this.drawChart();
    },
    persistIfAuto() {
      if (this.autoSaveEnabled) {
        try {
          localStorage.setItem(
            this.storageKey,
            JSON.stringify({ income: this.income, expenses: this.expenses })
          );
        } catch (e) {
          console.warn("Auto-save failed", e);
        }
      }
    },

    // data mutators
    addIncome() {
      this.income.push({
        id: "i" + Date.now() + Math.random().toString(36).slice(2, 6),
        date: this.todayISO(),
        name: "",
        amount: 0,
      });
    },
    addExpense() {
      this.expenses.push({
        id: "e" + Date.now() + Math.random().toString(36).slice(2, 6),
        date: this.todayISO(),
        name: "",
        amount: 0,
      });
    },
    removeIncome(i) {
      this.income.splice(i, 1);
      this.persistIfAuto();
    },
    removeExpense(i) {
      this.expenses.splice(i, 1);
      this.persistIfAuto();
    },

    addSample() {
      // Add sample data demonstrating different months
      this.income.push({
        id: "s1",
        date: this.todayISO(),
        name: "Salary",
        amount: 35000,
      });
      this.expenses.push({
        id: "s2",
        date: this.todayISO(),
        name: "Rent",
        amount: 12000,
      });
      this.expenses.push({
        id: "s3",
        date: this.todayISO(),
        name: "Groceries",
        amount: 3500,
      });
      this.persistIfAuto();
      this.drawChart();
    },

    todayISO() {
      var d = new Date();
      return (
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0")
      );
    },

    // computed totals (filtered by selected month/year when appropriate)
    get filteredIncome() {
      if (this.selectedMonth === "all") return this.income;
      return this.income.filter((it) => {
        if (!it.date) return false;
        var d = new Date(it.date);
        return (
          d.getFullYear() == this.selectedYear &&
          d.getMonth() + 1 == Number(this.selectedMonth)
        );
      });
    },
    get filteredExpenses() {
      if (this.selectedMonth === "all") return this.expenses;
      return this.expenses.filter((it) => {
        if (!it.date) return false;
        var d = new Date(it.date);
        return (
          d.getFullYear() == this.selectedYear &&
          d.getMonth() + 1 == Number(this.selectedMonth)
        );
      });
    },

    get totalIncome() {
      return this.filteredIncome.reduce(
        (s, i) => s + (Number(i.amount) || 0),
        0
      );
    },
    get totalExpenses() {
      return this.filteredExpenses.reduce(
        (s, i) => s + (Number(i.amount) || 0),
        0
      );
    },
    get net() {
      return this.totalIncome - this.totalExpenses;
    },

    // Summary section computed properties (uses summaryMonth and summaryYear)
    get summaryIncome() {
      var filtered = this.income.filter((it) => {
        if (!it.date) return false;
        var d = new Date(it.date);
        if (d.getFullYear() != this.summaryYear) return false;
        if (this.summaryMonth === "all") return true;
        return d.getMonth() + 1 == Number(this.summaryMonth);
      });
      return filtered.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    },

    get summaryExpenses() {
      var filtered = this.expenses.filter((it) => {
        if (!it.date) return false;
        var d = new Date(it.date);
        if (d.getFullYear() != this.summaryYear) return false;
        if (this.summaryMonth === "all") return true;
        return d.getMonth() + 1 == Number(this.summaryMonth);
      });
      return filtered.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    },

    get summaryNet() {
      return this.summaryIncome - this.summaryExpenses;
    },

    format(v) {
      return Number(v || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },

    // Chart drawing — very simple Java Swing style bars
    drawChart() {
      var canvas = document.getElementById("barChart");
      if (!canvas) return;
      var ctx = canvas.getContext("2d");
      // clear background with beveled look
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#e9e9e9";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // compute 12 months buckets for selected year
      var year = Number(this.selectedYear);
      var incBuckets = new Array(12).fill(0);
      var expBuckets = new Array(12).fill(0);
      this.income.forEach((it) => {
        if (it.date) {
          var d = new Date(it.date);
          if (d.getFullYear() == year)
            incBuckets[d.getMonth()] += Number(it.amount || 0);
        }
      });
      this.expenses.forEach((it) => {
        if (it.date) {
          var d = new Date(it.date);
          if (d.getFullYear() == year)
            expBuckets[d.getMonth()] += Number(it.amount || 0);
        }
      });

      // find max for scale
      var maxVal = Math.max(...incBuckets, ...expBuckets, 100);
      var pad = 10;
      var chartW = canvas.width - pad * 2;
      var chartH = canvas.height - pad * 2;
      var barWidth = Math.floor((chartW / 12) * 0.35);
      var gap = Math.floor((chartW - barWidth * 12 * 2) / (12 + 1)); // two bars per month

      // draw axes
      ctx.fillStyle = "#ddd";
      ctx.fillRect(pad, pad, chartW, chartH);
      ctx.strokeStyle = "#666";
      ctx.strokeRect(pad, pad, chartW, chartH);

      // draw bars
      for (var m = 0; m < 12; m++) {
        var baseX = pad + gap + m * (2 * barWidth + gap);
        // income bar (left)
        var hInc = Math.round((incBuckets[m] / maxVal) * (chartH - 8));
        var xInc = baseX;
        var yInc = pad + chartH - hInc;
        this._drawBeveledBar(
          ctx,
          xInc,
          yInc,
          barWidth,
          hInc,
          "#8fcf8f",
          "#5ea75e"
        );

        // expenses bar (right)
        var hExp = Math.round((expBuckets[m] / maxVal) * (chartH - 8));
        var xExp = baseX + barWidth;
        var yExp = pad + chartH - hExp;
        this._drawBeveledBar(
          ctx,
          xExp,
          yExp,
          barWidth,
          hExp,
          "#f2a0a0",
          "#d65a5a"
        );

        // month label
        ctx.fillStyle = "#222";
        ctx.font = "10px Tahoma";
        ctx.textAlign = "center";
        ctx.fillText(
          this.months[m].slice(0, 3),
          baseX + barWidth,
          pad + chartH + 10
        );
      }

      // legend
      ctx.fillStyle = "#222";
      ctx.font = "11px Tahoma";
      ctx.fillText("Income", pad + 40, 14);
      ctx.fillStyle = "#8fcf8f";
      ctx.fillRect(pad + 10, 6, 12, 8);
      ctx.fillStyle = "#222";
      ctx.fillText("Expenses", pad + 120, 14);
      ctx.fillStyle = "#f2a0a0";
      ctx.fillRect(pad + 90, 6, 12, 8);
    },

    // helper for beveled bar look
    _drawBeveledBar(ctx, x, y, w, h, fillColor, shadowColor) {
      // background shadow
      ctx.fillStyle = shadowColor;
      ctx.fillRect(x + 1, y + 1, w, h);
      // main
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, w - 1, h - 1);
      // top highlight
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.moveTo(x, y + 1);
      ctx.lineTo(x + w - 2, y + 1);
      ctx.stroke();
      // inner border
      ctx.strokeStyle = "#6d6d6d";
      ctx.strokeRect(x, y, w - 1, h - 1);
    },

    // generate printable HTML fragment for a given year+month (month may be 'all')
    _makeReportFragment(year, monthIndex) {
      // monthIndex: 1..12 or 'all'
      var monthLabel =
        monthIndex === "all"
          ? "All months"
          : this.months[monthIndex - 1] + " " + year;
      // filter rows
      var incRows = this.income.filter((it) => {
        if (!it.date) return false;
        var d = new Date(it.date);
        if (d.getFullYear() != year) return false;
        if (monthIndex === "all") return true;
        return d.getMonth() + 1 == Number(monthIndex);
      });
      var expRows = this.expenses.filter((it) => {
        if (!it.date) return false;
        var d = new Date(it.date);
        if (d.getFullYear() != year) return false;
        if (monthIndex === "all") return true;
        return d.getMonth() + 1 == Number(monthIndex);
      });

      // totals
      var incTotal = incRows.reduce((s, r) => s + Number(r.amount || 0), 0);
      var expTotal = expRows.reduce((s, r) => s + Number(r.amount || 0), 0);
      var net = incTotal - expTotal;

      // build HTML (simple, printable)
      var frag = document.createElement("div");
      frag.style.width = "720px";
      frag.style.padding = "12px";
      frag.style.background = "#fff";
      frag.style.color = "#000";
      frag.style.fontFamily = "Tahoma, Arial, sans-serif";
      frag.innerHTML = `
          <div style="border-bottom:2px solid #222; margin-bottom:8px; padding-bottom:6px;">
            <div style="font-weight:bold; font-size:18px;">Dogshit Finance Tracker</div>
            <div style="font-size:13px; color:#333;">${monthLabel}</div>
          </div>
  
          <div style="margin-top:6px;">
            <div style="font-weight:bold; margin-bottom:6px;">Income</div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <thead>
                <tr><th style="border:1px solid #999; padding:6px;">Date</th><th style="border:1px solid #999; padding:6px;">Source</th><th style="border:1px solid #999; padding:6px;">Amount</th></tr>
              </thead>
              <tbody>
                ${incRows
                  .map(
                    (r) =>
                      `<tr><td style="border:1px solid #999; padding:6px;">${
                        r.date
                      }</td><td style="border:1px solid #999; padding:6px;">${escapeHtml(
                        r.name
                      )}</td><td style="border:1px solid #999; padding:6px; text-align:right;">${Number(
                        r.amount || 0
                      ).toFixed(2)}</td></tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
  
          <div style="margin-top:10px;">
            <div style="font-weight:bold; margin-bottom:6px;">Expenses</div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <thead>
                <tr><th style="border:1px solid #999; padding:6px;">Date</th><th style="border:1px solid #999; padding:6px;">Category</th><th style="border:1px solid #999; padding:6px;">Amount</th></tr>
              </thead>
              <tbody>
                ${expRows
                  .map(
                    (r) =>
                      `<tr><td style="border:1px solid #999; padding:6px;">${
                        r.date
                      }</td><td style="border:1px solid #999; padding:6px;">${escapeHtml(
                        r.name
                      )}</td><td style="border:1px solid #999; padding:6px; text-align:right;">${Number(
                        r.amount || 0
                      ).toFixed(2)}</td></tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
  
          <div style="margin-top:12px; padding:8px; border:2px ridge #888; background:#f6f6f6;">
            <div><strong>Total Income:</strong> ₱${incTotal.toFixed(2)}</div>
            <div><strong>Total Expenses:</strong> ₱${expTotal.toFixed(2)}</div>
            <div style="margin-top:6px;"><strong>Net:</strong> ₱${net.toFixed(
              2
            )}</div>
          </div>
        `;
      return frag;
    },

    // Print current view (native print)
    printReport() {
      // create a print window with current selected month
      var w = window.open("", "_blank", "width=900,height=700");
      var frag = this._makeReportFragment(
        Number(this.selectedYear),
        this.selectedMonth === "all" ? "all" : Number(this.selectedMonth)
      );
      w.document.write(
        '<!doctype html><html><head><meta charset="utf-8"></head><body>'
      );
      w.document.body.appendChild(frag);
      w.document.write("</body></html>");
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 500);
    },

    // Generate PDF for current view
    async generatePDF() {
      try {
        var frag = this._makeReportFragment(
          Number(this.selectedYear),
          this.selectedMonth === "all" ? "all" : Number(this.selectedMonth)
        );
        document.body.appendChild(frag); // attach so html2canvas can render styles
        // wait a tick
        await new Promise((r) => setTimeout(r, 100));
        const canvas = await html2canvas(frag, { scale: 2 });
        document.body.removeChild(frag);
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "pt", "a4");
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgW = pageW - 40; // margin
        const imgH = canvas.height * (imgW / canvas.width);
        pdf.addImage(imgData, "JPEG", 20, 20, imgW, imgH);
        pdf.save(`finance_${this.selectedYear}_${this.selectedMonth}.pdf`);
      } catch (e) {
        alert("PDF generation failed: " + e.message);
        console.error(e);
      }
    },

    // Generate multi-page PDF: one page per month that has data for the selected year
    async generatePDFAllMonths() {
      try {
        var year = Number(this.selectedYear);
        // determine months that have data
        var monthsWithData = new Set();
        this.income.forEach((i) => {
          if (i.date) {
            var d = new Date(i.date);
            if (d.getFullYear() == year) monthsWithData.add(d.getMonth() + 1);
          }
        });
        this.expenses.forEach((i) => {
          if (i.date) {
            var d = new Date(i.date);
            if (d.getFullYear() == year) monthsWithData.add(d.getMonth() + 1);
          }
        });
        if (!monthsWithData.size) {
          if (
            !confirm(
              'No monthly data found for this year. Export a single "all months" page instead?'
            )
          )
            return;
          monthsWithData = new Set(["all"]);
        }
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "pt", "a4");
        let first = true;
        // iterate sorted months
        let monthList = Array.from(monthsWithData).sort(
          (a, b) => (a === "all" ? 13 : a) - (b === "all" ? 13 : b)
        );
        for (const m of monthList) {
          var frag = this._makeReportFragment(
            year,
            m === "all" ? "all" : Number(m)
          );
          document.body.appendChild(frag);
          await new Promise((r) => setTimeout(r, 100));
          const canvas = await html2canvas(frag, { scale: 2 });
          document.body.removeChild(frag);
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          const pageW = pdf.internal.pageSize.getWidth();
          const imgW = pageW - 40;
          const imgH = canvas.height * (imgW / canvas.width);
          if (!first) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 20, 20, imgW, imgH);
          first = false;
        }
        pdf.save(`finance_${year}_months.pdf`);
      } catch (e) {
        alert("Export failed: " + e.message);
        console.error(e);
      }
    },

    // Export CSV
    downloadCSV() {
      var lines = ["type,date,category_or_source,description,amount"];
      this.income.forEach((r) =>
        lines.push(
          [
            "income",
            r.date || "",
            r.name || "",
            "",
            Number(r.amount || 0).toFixed(2),
          ]
            .map(escapeCsv)
            .join(",")
        )
      );
      this.expenses.forEach((r) =>
        lines.push(
          [
            "expense",
            r.date || "",
            r.name || "",
            "",
            Number(r.amount || 0).toFixed(2),
          ]
            .map(escapeCsv)
            .join(",")
        )
      );
      var blob = new Blob([lines.join("\\n")], {
        type: "text/csv;charset=utf-8;",
      });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "finance_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    },

    // utility: recompute months if needed
    recomputeMonths() {
      /* placeholder if future logic needed */
    },

    // small helpers
    formatNumber(n) {
      return Number(n || 0).toFixed(2);
    },
  }; // end return
}

/* Helpers outside component scope */
function escapeCsv(s) {
  return '"' + String(s || "").replace(/"/g, '""') + '"';
}
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// wait for libs to load, then start chart updates periodically
document.addEventListener("DOMContentLoaded", function () {
  // When Alpine has initialized, call drawChart repeatedly to keep canvas in sync (safe)
  setTimeout(function () {
    var appInterval = setInterval(function () {
      var comp = document.querySelector("[x-data]");
      if (!comp) return;
      var alpineComponent = comp.__x; // internal, may not always be present
      // call drawChart via DOM method (safe fallback)
      var draw =
        window.financeReport && comp && comp.__x
          ? comp.__x.$data.drawChart
          : null;
      if (typeof draw === "function") {
        draw.call(comp.__x.$data);
      } else {
        // try older approach: query and call function on window object
        var fn = comp && comp.__x && comp.__x.$data && comp.__x.$data.drawChart;
        if (typeof fn === "function") fn.call(comp.__x.$data);
      }
    }, 800);
    // stop after a while for performance
    setTimeout(() => clearInterval(appInterval), 8000);
  }, 400);
});
