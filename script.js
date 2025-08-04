let taskCount = 0;
let tasks = [];
window.calculateSchedule = calculateSchedule;
function topologicalSort(tasks) {
  const visited = new Set();
  const sorted = [];

  function visit(task) {
    if (visited.has(task.id)) return;
    visited.add(task.id);

    for (const depId of task.dependencies) {
      const depTask = tasks.find(t => t.id === depId);
      if (depTask) visit(depTask);
    }

    sorted.push(task);
  }

  tasks.forEach(t => visit(t));
  return sorted;
}

const taskInputs = document.getElementById("taskInputs");
function calculateSchedule(tasks) {
  // Initialize fields
  tasks.forEach(task => {
    task.ES = 0;
    task.EF = 0;
    task.LS = 0;
    task.LF = 0;
    task.TF = 0;
    task.FF = 0;
  });

  // Earliest Start / Finish
  for (let task of tasks) {
    if (task.dependencies.length === 0) {
      task.ES = 0;
    } else {
      let maxEF = 0;
      for (let depId of task.dependencies) {
        const dep = tasks.find(t => t.id === depId);
        if (dep && dep.EF > maxEF) maxEF = dep.EF;
      }
      task.ES = maxEF;
    }
    task.EF = task.ES + task.ET;
  }

  // Latest Start / Finish
  let maxEF = Math.max(...tasks.map(t => t.EF));
  for (let task of tasks) {
    const isFinal = !tasks.some(t => t.dependencies.includes(task.id));
    if (isFinal) {
      task.LF = maxEF;
      task.LS = task.LF - task.ET;
    }
  }

  for (let i = tasks.length - 1; i >= 0; i--) {
    const task = tasks[i];
    const dependents = tasks.filter(t => t.dependencies.includes(task.id));
    if (dependents.length > 0) {
      task.LF = Math.min(...dependents.map(d => d.LS));
      task.LS = task.LF - task.ET;
    }
  }

  // Total Float
  for (let task of tasks) {
    task.TF = task.LS - task.ES;
  }

  // Free Float
  for (let task of tasks) {
    const dependents = tasks.filter(t => t.dependencies.includes(task.id));
    if (dependents.length > 0) {
      const minES = Math.min(...dependents.map(d => d.ES));
      task.FF = minES - task.EF;
    } else {
      task.FF = task.TF;
    }
  }
}

function addTaskInput() {
  const div = document.createElement("div");
  div.className = "task";
  div.innerHTML = `
    <strong>Task ${taskCount + 1}</strong><br>
    ID: <input type="text" class="id"><br>
    Description: <input type="text" class="desc"><br>
    Time: <input type="number" class="et"><br>
    Dependencies (comma separated IDs): <input type="text" class="deps"><br>
  `;
  taskInputs.appendChild(div);
  taskCount++;
}
function downloadJSON() {
  const dataStr = JSON.stringify(tasks, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = "task_network.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadPDF() {
  const output = document.getElementById("output");
  const opt = {
    margin:       0.5,
    filename:     'task_schedule.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().from(output).set(opt).save();
}

function generateTasks() {
  tasks = []; // reset global tasks array
  const taskDivs = document.querySelectorAll(".task");

  taskDivs.forEach(div => {
    const id = div.querySelector(".id").value;
    const desc = div.querySelector(".desc").value;
    const et = parseInt(div.querySelector(".et").value);
    const deps = div.querySelector(".deps").value
      .split(",")
      .map(s => s.trim())
      .filter(s => s !== "");

    tasks.push({ id, description: desc, ET: et, dependencies: deps });
  });
tasks = topologicalSort(tasks);

  // Calculate schedule logic in JS
  calculateSchedule(tasks);

  // Show result
  document.getElementById("output").textContent = JSON.stringify(tasks, null, 2);
}
