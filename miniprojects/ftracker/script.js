function financeReport() {
  return {
    storageKey: "vintage_finance_alpine_v1",

    income: [],
    expenses: [],
    sections: [{ id: "default", name: "Default Section" }],
    currentSection: "default",
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
    newSectionName: "",

    filterType: "none",
    filterYear: new Date().getFullYear(),
    filterMonth: new Date().getMonth() + 1,
    filterStartDate: "",
    filterEndDate: "",

    init() {
      var now = new Date();
      var cy = now.getFullYear();
      this.years = [];
      for (var y = cy - 4; y <= cy + 1; y++) this.years.push(y);

      this.newSectionName = this.getDefaultSectionName();

      this.load();

      if (!this.income.length && !this.expenses.length) this.addSample();

      this.$nextTick(() => {
        this.drawChart();
      });

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

    save() {
      try {
        var payload = {
          income: this.income,
          expenses: this.expenses,
          sections: this.sections,
          currentSection: this.currentSection,
        };
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
          this.sections = p.sections || [
            { id: "default", name: "Default Section" },
          ];
          this.currentSection = p.currentSection || "default";
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
      this.sections = [{ id: "default", name: "Default Section" }];
      this.currentSection = "default";
      this.addSample();
      this.drawChart();
    },
    persistIfAuto() {
      if (this.autoSaveEnabled) {
        try {
          localStorage.setItem(
            this.storageKey,
            JSON.stringify({
              income: this.income,
              expenses: this.expenses,
              sections: this.sections,
              currentSection: this.currentSection,
            })
          );
        } catch (e) {
          console.warn("Auto-save failed", e);
        }
      }
    },

    addIncome() {
      this.income.push({
        id: "i" + Date.now() + Math.random().toString(36).slice(2, 6),
        date: this.todayISO(),
        name: "",
        amount: 0,
        section: this.currentSection,
      });
    },
    addExpense() {
      this.expenses.push({
        id: "e" + Date.now() + Math.random().toString(36).slice(2, 6),
        date: this.todayISO(),
        name: "",
        amount: 0,
        section: this.currentSection,
      });
    },
    removeIncome(i) {
      this.income.splice(i, 1);
      this.persistIfAuto();
    },
    removeIncomeById(id) {
      const index = this.income.findIndex((item) => item.id === id);
      if (index !== -1) {
        this.income.splice(index, 1);
        this.persistIfAuto();
      }
    },
    removeExpense(i) {
      this.expenses.splice(i, 1);
      this.persistIfAuto();
    },
    removeExpenseById(id) {
      const index = this.expenses.findIndex((item) => item.id === id);
      if (index !== -1) {
        this.expenses.splice(index, 1);
        this.persistIfAuto();
      }
    },

    addSection() {
      if (!this.newSectionName.trim()) {
        alert("Please enter a section name");
        return;
      }
      const id = "sec" + Date.now();
      this.sections.push({
        id: id,
        name: this.newSectionName.trim(),
      });
      this.newSectionName = this.getDefaultSectionName();
      this.currentSection = id;
      this.persistIfAuto();
    },
    deleteSection(sectionId) {
      if (sectionId === "default") {
        alert("Cannot delete the default section");
        return;
      }
      if (
        !confirm(
          "Delete this section? Items in this section will remain but won't be visible unless you switch sections."
        )
      ) {
        return;
      }
      const index = this.sections.findIndex((s) => s.id === sectionId);
      if (index !== -1) {
        this.sections.splice(index, 1);
        if (this.currentSection === sectionId) {
          this.currentSection = "default";
        }
        this.persistIfAuto();
      }
    },
    switchSection(sectionId) {
      this.currentSection = sectionId;
      this.persistIfAuto();
    },

    addSample() {
      this.income.push({
        id: "s1",
        date: this.todayISO(),
        name: "Salary",
        amount: 35000,
        section: this.currentSection,
      });
      this.expenses.push({
        id: "s2",
        date: this.todayISO(),
        name: "Rent",
        amount: 12000,
        section: this.currentSection,
      });
      this.expenses.push({
        id: "s3",
        date: this.todayISO(),
        name: "Groceries",
        amount: 3500,
        section: this.currentSection,
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

    getDefaultSectionName() {
      var d = new Date();
      return (
        "Section " +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0") +
        "-" +
        String(d.getFullYear()).slice(-2)
      );
    },

    get filteredIncome() {
      return this.income.filter((it) => {
        const sectionMatch =
          it.section === this.currentSection ||
          (!it.section && this.currentSection === "default");
        if (!sectionMatch) return false;

        return this.applyDateFilter(it);
      });
    },
    get filteredExpenses() {
      return this.expenses.filter((it) => {
        const sectionMatch =
          it.section === this.currentSection ||
          (!it.section && this.currentSection === "default");
        if (!sectionMatch) return false;

        return this.applyDateFilter(it);
      });
    },

    applyDateFilter(item) {
      if (this.filterType === "none") return true;
      if (!item.date) return false;

      const itemDate = new Date(item.date);

      switch (this.filterType) {
        case "year":
          return itemDate.getFullYear() === Number(this.filterYear);

        case "month":
          return (
            itemDate.getFullYear() === Number(this.filterYear) &&
            itemDate.getMonth() + 1 === Number(this.filterMonth)
          );

        case "daterange":
          if (!this.filterStartDate && !this.filterEndDate) return true;
          const start = this.filterStartDate
            ? new Date(this.filterStartDate)
            : null;
          const end = this.filterEndDate ? new Date(this.filterEndDate) : null;

          if (start && end) {
            return itemDate >= start && itemDate <= end;
          } else if (start) {
            return itemDate >= start;
          } else if (end) {
            return itemDate <= end;
          }
          return true;

        default:
          return true;
      }
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

    drawChart() {
      var canvas = document.getElementById("barChart");
      if (!canvas) return;
      var ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#e9e9e9";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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

      var maxVal = Math.max(...incBuckets, ...expBuckets, 100);
      var pad = 10;
      var chartW = canvas.width - pad * 2;
      var chartH = canvas.height - pad * 2;
      var barWidth = Math.floor((chartW / 12) * 0.35);
      var gap = Math.floor((chartW - barWidth * 12 * 2) / (12 + 1));

      ctx.fillStyle = "#ddd";
      ctx.fillRect(pad, pad, chartW, chartH);
      ctx.strokeStyle = "#666";
      ctx.strokeRect(pad, pad, chartW, chartH);

      for (var m = 0; m < 12; m++) {
        var baseX = pad + gap + m * (2 * barWidth + gap);

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

        ctx.fillStyle = "#222";
        ctx.font = "10px Tahoma";
        ctx.textAlign = "center";
        ctx.fillText(
          this.months[m].slice(0, 3),
          baseX + barWidth,
          pad + chartH + 10
        );
      }

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

    _drawBeveledBar(ctx, x, y, w, h, fillColor, shadowColor) {
      ctx.fillStyle = shadowColor;
      ctx.fillRect(x + 1, y + 1, w, h);

      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, w - 1, h - 1);

      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.moveTo(x, y + 1);
      ctx.lineTo(x + w - 2, y + 1);
      ctx.stroke();

      ctx.strokeStyle = "#6d6d6d";
      ctx.strokeRect(x, y, w - 1, h - 1);
    },

    _makeReportFragment(year, monthIndex) {
      var monthLabel =
        monthIndex === "all"
          ? "All months"
          : this.months[monthIndex - 1] + " " + year;

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

      var incTotal = incRows.reduce((s, r) => s + Number(r.amount || 0), 0);
      var expTotal = expRows.reduce((s, r) => s + Number(r.amount || 0), 0);
      var net = incTotal - expTotal;

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

    printReport() {
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

    async generatePDF() {
      try {
        var frag = this._makeReportFragment(
          Number(this.selectedYear),
          this.selectedMonth === "all" ? "all" : Number(this.selectedMonth)
        );
        document.body.appendChild(frag);

        await new Promise((r) => setTimeout(r, 100));
        const canvas = await html2canvas(frag, { scale: 2 });
        document.body.removeChild(frag);
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "pt", "a4");
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgW = pageW - 40;
        const imgH = canvas.height * (imgW / canvas.width);
        pdf.addImage(imgData, "JPEG", 20, 20, imgW, imgH);
        pdf.save(`finance_${this.selectedYear}_${this.selectedMonth}.pdf`);
      } catch (e) {
        alert("PDF generation failed: " + e.message);
        console.error(e);
      }
    },

    async generatePDFAllMonths() {
      try {
        var year = Number(this.selectedYear);

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

    downloadCSV() {
      var lines = ["type,date,category_or_source,description,amount,section"];
      this.income.forEach((r) =>
        lines.push(
          [
            "income",
            r.date || "",
            r.name || "",
            r.desc || "",
            Number(r.amount || 0).toFixed(2),
            r.section || "default",
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
            r.name || r.category || "",
            r.desc || "",
            Number(r.amount || 0).toFixed(2),
            r.section || "default",
          ]
            .map(escapeCsv)
            .join(",")
        )
      );
      var blob = new Blob([lines.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "finance_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    },

    importCSV() {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const csv = event.target.result;
            const lines = csv.split("\n");

            let importedIncome = 0;
            let importedExpenses = 0;

            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;

              const values = this.parseCSVLine(line);
              if (values.length < 5) continue;

              const [type, date, nameOrCategory, description, amount, section] =
                values;

              if (type === "income") {
                this.income.push({
                  id: "i" + Date.now() + Math.random().toString(36).slice(2, 6),
                  date: date || this.todayISO(),
                  name: nameOrCategory,
                  desc: description,
                  amount: parseFloat(amount) || 0,
                  section: section || "default",
                });
                importedIncome++;
              } else if (type === "expense") {
                this.expenses.push({
                  id: "e" + Date.now() + Math.random().toString(36).slice(2, 6),
                  date: date || this.todayISO(),
                  name: nameOrCategory,
                  category: nameOrCategory,
                  desc: description,
                  amount: parseFloat(amount) || 0,
                  section: section || "default",
                });
                importedExpenses++;
              }
            }

            this.persistIfAuto();
            this.drawChart();
            alert(
              `Imported ${importedIncome} income and ${importedExpenses} expense entries.`
            );
          } catch (err) {
            alert("Failed to import CSV: " + err.message);
            console.error(err);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    },

    parseCSVLine(line) {
      const result = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          result.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current);

      return result;
    },

    recomputeMonths() {},

    formatNumber(n) {
      return Number(n || 0).toFixed(2);
    },
  };
}

function escapeCsv(s) {
  return '"' + String(s || "").replace(/"/g, '""') + '"';
}
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    var appInterval = setInterval(function () {
      var comp = document.querySelector("[x-data]");
      if (!comp) return;
      var alpineComponent = comp.__x;

      var draw =
        window.financeReport && comp && comp.__x
          ? comp.__x.$data.drawChart
          : null;
      if (typeof draw === "function") {
        draw.call(comp.__x.$data);
      } else {
        var fn = comp && comp.__x && comp.__x.$data && comp.__x.$data.drawChart;
        if (typeof fn === "function") fn.call(comp.__x.$data);
      }
    }, 800);

    setTimeout(() => clearInterval(appInterval), 8000);
  }, 400);
});
